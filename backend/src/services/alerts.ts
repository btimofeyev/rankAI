import { AnalysisRecord, DashboardSummary } from '../types.js';
import { logger } from '../utils/logger.js';

export const composeWeeklyDigest = (analysis: AnalysisRecord, dashboard: DashboardSummary) => {
  const headline = `${analysis.brand} captured ${dashboard.summaryCard.shareOfVoice[analysis.brand] ?? 0}% of AI voice this week.`;
  const gap = dashboard.gapCard[0];
  const action = dashboard.actionCard[0] ?? 'Stay the course and re-run next week.';
  const body = [
    headline,
    `Mentions vs last week: ${dashboard.trendCard.delta >= 0 ? '+' : ''}${dashboard.trendCard.delta}.`,
    gap ? `Biggest gap: ${gap.query} (dominated by ${gap.dominatingCompetitor}).` : 'No query gaps detected.',
    `Action: ${action}`
  ].join('\n');
  return body;
};

export const sendDigest = async (analysis: AnalysisRecord, digest: string) => {
  logger.info({ analysisId: analysis.id, digest }, 'Weekly digest composed');
};
