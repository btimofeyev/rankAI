import cron from 'node-cron';
import { repository } from '../services/repository.js';
import { runBrandVisibilityAnalysis } from '../services/gptQuery.js';
import { sanitizeMentions } from '../services/parser.js';
import { randomUUID } from 'node:crypto';
import { buildDashboardSummary } from '../services/insights.js';

const runRefresh = async () => {
  const analyses = await repository.listAnalyses();
  for (const analysis of analyses) {
    const analysisResults = await runBrandVisibilityAnalysis(analysis.brand, analysis.keywords, analysis.competitors);
    const mentions = analysisResults.flatMap((result) => result.mentions);
    const cleanedMentions = sanitizeMentions(mentions, [analysis.brand, ...analysis.competitors]);
    const uniqueQueries = Array.from(new Set(analysisResults.map((result) => result.query)));

    const brandQueryAppearances = new Set(
      cleanedMentions.filter((item) => item.brand === analysis.brand).map((item) => item.query)
    ).size;
    const competitorQueryCounts = analysis.competitors.reduce<Record<string, number>>((acc, competitor) => {
      acc[competitor] = new Set(
        cleanedMentions.filter((item) => item.brand === competitor).map((item) => item.query)
      ).size;
      return acc;
    }, {});

    const totalQueries = analysisResults.length;
    const queriesWithMentions = new Set(cleanedMentions.map((item) => item.query)).size;
    const brandSharePct = totalQueries === 0 ? 0 : Math.round((brandQueryAppearances / totalQueries) * 100);
    const competitorShares = analysis.competitors.reduce<Record<string, number>>((acc, competitor) => {
      const count = competitorQueryCounts[competitor] ?? 0;
      acc[competitor] = totalQueries === 0 ? 0 : Math.round((count / totalQueries) * 100);
      return acc;
    }, {});
    const snapshotDate = new Date().toISOString();

    await repository.appendQueryRun(analysis, cleanedMentions);
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
    buildDashboardSummary(analysis.brand, analysis.competitors, cleanedMentions, trends, uniqueQueries);
  }
};

export const scheduleWeeklyRefresh = () => {
  cron.schedule('0 8 * * 1', runRefresh, { timezone: 'UTC' });
};
