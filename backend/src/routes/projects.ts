import { Router } from 'express';
import createHttpError from 'http-errors';
import { authenticate } from '../middleware/auth.js';
import { repository } from '../services/repository.js';
import { runBrandVisibilityAnalysis } from '../services/gptQuery.js';
import { buildDashboardSummary } from '../services/insights.js';
import { logger } from '../utils/logger.js';

export const projectsRouter = Router();

// Create new project
projectsRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');

    const { brandName, keywords = [], competitors = [] } = req.body ?? {};
    if (!brandName) throw new createHttpError.BadRequest('brandName required');
    if (!Array.isArray(keywords) || !Array.isArray(competitors)) {
      throw new createHttpError.BadRequest('keywords and competitors must be arrays');
    }

    const project = await repository.createProject(userId, brandName, keywords, competitors);
    logger.info({ projectId: project.id, brandName }, 'Project created');
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

// List user's projects
projectsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');

    const projects = await repository.listProjects(userId);
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

// Get project with cumulative data
projectsRouter.get('/:projectId', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');

    const { projectId } = req.params;
    const project = await repository.getProject(projectId);

    if (!project) {
      throw new createHttpError.NotFound('Project not found');
    }

    if (project.userId !== userId) {
      throw new createHttpError.Forbidden('Access denied');
    }

    // Get all runs, cumulative results, and snapshots
    const runs = await repository.getProjectRuns(projectId);
    const allResults = await repository.getAllProjectResults(projectId);
    const snapshots = await repository.getProjectSnapshots(projectId);

    // Debug logging for snapshot data
    logger.info({
      projectId,
      snapshotCount: snapshots.length,
      totalQueriesSum: snapshots.reduce((sum, s) => sum + s.totalQueries, 0),
      snapshotDetails: snapshots.map(s => ({
        date: s.snapshotDate,
        queries: s.totalQueries,
        brandMentions: s.brandMentions
      }))
    }, 'Snapshots retrieved for dashboard');

    // Build dashboard summary from cumulative data
    const dashboard = allResults.length > 0
      ? buildDashboardSummary(project.brandName, project.competitors, allResults, snapshots)
      : null;

    // Calculate actual total queries from all runs
    const totalQueriesFromDB = snapshots.reduce((sum, s) => sum + s.totalQueries, 0);

    res.json({
      project,
      runs,
      dashboard,
      totalQueries: totalQueriesFromDB || allResults.length
    });
  } catch (error) {
    next(error);
  }
});

// Update project keywords/competitors
projectsRouter.patch('/:projectId', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');

    const { projectId } = req.params;
    const { keywords, competitors } = req.body ?? {};

    if (!Array.isArray(keywords) || !Array.isArray(competitors)) {
      throw new createHttpError.BadRequest('keywords and competitors must be arrays');
    }

    // Verify ownership
    const project = await repository.getProject(projectId);
    if (!project) throw new createHttpError.NotFound('Project not found');
    if (project.userId !== userId) throw new createHttpError.Forbidden('Access denied');

    const updatedProject = await repository.updateProject(projectId, keywords, competitors);
    logger.info({ projectId, keywords, competitors }, 'Project updated');
    res.json({ project: updatedProject });
  } catch (error) {
    next(error);
  }
});

// Delete project
projectsRouter.delete('/:projectId', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');

    const { projectId } = req.params;

    // Verify ownership
    const project = await repository.getProject(projectId);
    if (!project) throw new createHttpError.NotFound('Project not found');
    if (project.userId !== userId) throw new createHttpError.Forbidden('Access denied');

    await repository.deleteProject(projectId);
    logger.info({ projectId }, 'Project deleted');
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Run analysis for project (appends data)
projectsRouter.post('/:projectId/analyze', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');

    const { projectId } = req.params;

    // Verify ownership and get project
    const project = await repository.getProject(projectId);
    if (!project) throw new createHttpError.NotFound('Project not found');
    if (project.userId !== userId) throw new createHttpError.Forbidden('Access denied');

    // Check plan limits
    const plan = await repository.getPlan(userId);
    if (plan.tier === 'free') {
      const runs = await repository.getProjectRuns(projectId);
      if (runs.length > 0) {
        const lastRun = runs[0];
        const daysSince = (Date.now() - new Date(lastRun.runAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) {
          throw new createHttpError.PaymentRequired('Free tier limited to one analysis per month');
        }
      }
    }

    logger.info({ projectId, brand: project.brandName }, 'Starting analysis run');

    // Run analysis - now returns QueryAnalysisResult[] with all queries
    const analysisResults = await runBrandVisibilityAnalysis(
      project.brandName,
      project.keywords,
      project.competitors
    );

    // Calculate metrics for this run
    const totalQueries = analysisResults.length;
    const queriesWithMentions = analysisResults.filter(r => r.mentions.length > 0).length;
    const allMentions = analysisResults.flatMap(r => r.mentions);
    const brandMentions = allMentions.filter(m => m.brand === project.brandName).length;

    // Calculate share of voice for this run
    const mentionCounts = allMentions.reduce<Record<string, number>>((acc, m) => {
      acc[m.brand] = (acc[m.brand] ?? 0) + 1;
      return acc;
    }, {});
    const totalMentionCount = Object.values(mentionCounts).reduce((sum, c) => sum + c, 0);
    const brandSharePct = totalMentionCount === 0 ? 0 : Math.round((brandMentions / totalMentionCount) * 100);
    const competitorShares = project.competitors.reduce<Record<string, number>>((acc, comp) => {
      const count = mentionCounts[comp] ?? 0;
      acc[comp] = totalMentionCount === 0 ? 0 : Math.round((count / totalMentionCount) * 100);
      return acc;
    }, {});

    // Create analysis run record
    const run = await repository.createAnalysisRun(projectId, totalQueries);

    // Save query results (including queries without mentions)
    await repository.saveQueryResults(run.id, analysisResults);

    // Create snapshot for trend tracking
    await repository.createSnapshot(
      projectId,
      run.id,
      totalQueries,
      queriesWithMentions,
      brandMentions,
      brandSharePct,
      competitorShares
    );

    logger.info({
      projectId,
      runId: run.id,
      totalQueries,
      queriesWithMentions,
      mentionsCount: allMentions.length,
      brandMentions
    }, 'Analysis run complete');

    // Get updated cumulative data
    const allResults = await repository.getAllProjectResults(projectId);
    const snapshots = await repository.getProjectSnapshots(projectId);
    const dashboard = buildDashboardSummary(project.brandName, project.competitors, allResults, snapshots);

    // Calculate total queries across all runs
    const totalQueriesAllRuns = snapshots.reduce((sum, s) => sum + s.totalQueries, 0);

    res.json({
      run,
      dashboard,
      totalQueries: totalQueriesAllRuns
    });
  } catch (error) {
    next(error);
  }
});

// Get analysis runs for project
projectsRouter.get('/:projectId/runs', authenticate, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new createHttpError.Unauthorized('user missing');

    const { projectId } = req.params;

    // Verify ownership
    const project = await repository.getProject(projectId);
    if (!project) throw new createHttpError.NotFound('Project not found');
    if (project.userId !== userId) throw new createHttpError.Forbidden('Access denied');

    const runs = await repository.getProjectRuns(projectId);
    res.json({ runs });
  } catch (error) {
    next(error);
  }
});
