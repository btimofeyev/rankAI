import { Router } from 'express';
import createHttpError from 'http-errors';
import { authenticate } from '../middleware/auth.js';
import { repository } from '../services/repository.js';
import { buildDashboardSummary } from '../services/insights.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');
    const { analysis, run } = await repository.latestAnalysis(userId);
    if (!analysis || !run) return res.json({ analysis: null, dashboard: null });
    const trends = await repository.getTrendSnapshots(analysis.id);
    const queryUniverse = Array.from(new Set(trends.flatMap((snapshot) => snapshot.analyzedQueries ?? [])));
    const dashboard = buildDashboardSummary(analysis.brand, analysis.competitors, run.mentions, trends, queryUniverse);
    res.json({ analysis, dashboard });
  } catch (error) {
    next(error);
  }
});
