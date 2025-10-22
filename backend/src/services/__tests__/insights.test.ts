import { describe, it, expect } from 'vitest';
import { buildDashboardSummary } from '../insights.js';

const mentions = [
  { query: 'best AI tutor', brand: 'Klio AI', position: 1, sentiment: 'positive' as const, context: 'Top pick' },
  { query: 'best AI tutor', brand: 'TutorPlus', position: 2, sentiment: 'neutral' as const, context: 'Runner up' },
  { query: 'AI tutor for kids', brand: 'MindCoach', position: 1, sentiment: 'positive' as const, context: 'Kids focus' }
];

const trends = [
  { snapshotDate: '2024-06-01', brandMentions: 2, totalQueries: 9, competitorShares: { TutorPlus: 33, MindCoach: 44 } },
  { snapshotDate: '2024-06-08', brandMentions: 3, totalQueries: 10, competitorShares: { TutorPlus: 20, MindCoach: 50 } }
];

describe('buildDashboardSummary', () => {
  it('computes share of voice and delta', () => {
    const dashboard = buildDashboardSummary('Klio AI', ['TutorPlus', 'MindCoach'], mentions, trends);
    expect(dashboard.summaryCard.brandMentions).toBe(1);
    expect(dashboard.summaryCard.shareOfVoice['Klio AI']).toBe(33);
    expect(dashboard.trendCard.delta).toBe(1);
    expect(dashboard.gapCard[0]?.query).toBe('AI tutor for kids');
  });
});
