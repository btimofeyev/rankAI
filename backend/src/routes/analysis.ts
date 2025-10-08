import { Router } from 'express';
import createHttpError from 'http-errors';
import { authenticate } from '../middleware/auth.js';
import { runBrandVisibilityAnalysis } from '../services/gptQuery.js';
import { sanitizeMentions } from '../services/parser.js';
import { repository } from '../services/repository.js';
import { buildDashboardSummary } from '../services/insights.js';
import { randomUUID } from 'node:crypto';

export const analysisRouter = Router();

analysisRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');
    const { brand, keywords = [], competitors = [] } = req.body ?? {};
    if (!brand) throw new createHttpError.BadRequest('brand required');
    if (!Array.isArray(keywords) || !Array.isArray(competitors)) throw new createHttpError.BadRequest('keywords and competitors must be arrays');
    if (competitors.length > 5) throw new createHttpError.BadRequest('maximum five competitors supported');

    const plan = await repository.getPlan(userId);
    if (plan.tier === 'free') {
      if (competitors.length > 1) throw new createHttpError.PaymentRequired('Upgrade to compare more than one competitor');
      const { analysis: lastAnalysis } = await repository.latestAnalysis(userId);
      if (lastAnalysis) {
        const daysSince = (Date.now() - new Date(lastAnalysis.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) throw new createHttpError.PaymentRequired('Free tier limited to one analysis per month');
      }
    }

    const analysisResults = await runBrandVisibilityAnalysis(brand, keywords, competitors);
    const mentions = analysisResults.flatMap((result) => result.mentions);
    const cleanedMentions = sanitizeMentions(mentions, [brand, ...competitors]);
    const uniqueQueries = Array.from(new Set(analysisResults.map((result) => result.query)));

    const brandQueryAppearances = new Set(
      cleanedMentions.filter((item) => item.brand === brand).map((item) => item.query)
    ).size;
    const competitorQueryCounts = competitors.reduce<Record<string, number>>((acc, competitor) => {
      acc[competitor] = new Set(
        cleanedMentions.filter((item) => item.brand === competitor).map((item) => item.query)
      ).size;
      return acc;
    }, {});

    const totalQueries = analysisResults.length;
    const queriesWithMentions = new Set(cleanedMentions.map((item) => item.query)).size;
    const brandSharePct = totalQueries === 0 ? 0 : Math.round((brandQueryAppearances / totalQueries) * 100);
    const competitorShares = competitors.reduce<Record<string, number>>((acc, competitor) => {
      const count = competitorQueryCounts[competitor] ?? 0;
      acc[competitor] = totalQueries === 0 ? 0 : Math.round((count / totalQueries) * 100);
      return acc;
    }, {});
    const snapshotDate = new Date().toISOString();

    const analysis = await repository.createAnalysis({ brand, keywords, competitors, userId }, cleanedMentions);

    await repository.saveTrendSnapshot({
      id: randomUUID(),
      analysisId: analysis.id,
      snapshotDate,
      totalQueries,
      queriesWithMentions,
      brandMentions: brandQueryAppearances,
      brandSharePct,
      competitorShares,
      analyzedQueries: uniqueQueries
    });

    const trends = await repository.getTrendSnapshots(analysis.id);
    const dashboard = buildDashboardSummary(brand, competitors, cleanedMentions, trends, uniqueQueries);
    res.json({ analysis, dashboard });
  } catch (error) {
    next(error);
  }
});
