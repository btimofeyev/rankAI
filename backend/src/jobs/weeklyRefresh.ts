import cron from 'node-cron';
import { repository } from '../services/repository.js';
import { runBrandVisibilityAnalysis } from '../services/gptQuery.js';
import { sanitizeMentions } from '../services/parser.js';
import { randomUUID } from 'node:crypto';
import { buildDashboardSummary } from '../services/insights.js';
import { composeWeeklyDigest, sendDigest } from '../services/alerts.js';

const runRefresh = async () => {
  const analyses = await repository.listAnalyses();
  for (const analysis of analyses) {
    const mentions = await runBrandVisibilityAnalysis(analysis.brand, analysis.keywords, analysis.competitors);
    const cleaned = sanitizeMentions(mentions, [analysis.brand, ...analysis.competitors]);
    await repository.appendQueryRun(analysis, cleaned);
    await repository.saveTrendSnapshot({
      id: randomUUID(),
      analysisId: analysis.id,
      week: new Date().toISOString().slice(0, 10),
      brandMentions: cleaned.filter((item) => item.brand === analysis.brand).length,
      competitorMentions: analysis.competitors.reduce<Record<string, number>>((acc, competitor) => {
        acc[competitor] = cleaned.filter((item) => item.brand === competitor).length;
        return acc;
      }, {})
    });
    const trends = await repository.getTrendSnapshots(analysis.id);
    const dashboard = buildDashboardSummary(analysis.brand, analysis.competitors, cleaned, trends);
    const digest = composeWeeklyDigest(analysis, dashboard);
    await sendDigest(analysis, digest);
  }
};

export const scheduleWeeklyRefresh = () => {
  cron.schedule('0 8 * * 1', runRefresh, { timezone: 'UTC' });
};
