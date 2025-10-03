import { DashboardSummary, GapOpportunity, TrendSnapshot, VisibilityMention } from '../types.js';

const countMentions = (mentions: VisibilityMention[]): Record<string, number> => {
  return mentions.reduce<Record<string, number>>((acc, mention) => {
    acc[mention.brand] = (acc[mention.brand] ?? 0) + 1;
    return acc;
  }, {});
};

const findGapOpportunities = (
  mentions: VisibilityMention[],
  brand: string,
  competitors: string[]
): GapOpportunity[] => {
  const grouped = mentions.reduce<Record<string, VisibilityMention[]>>((acc, mention) => {
    acc[mention.query] = acc[mention.query] ?? [];
    acc[mention.query].push(mention);
    return acc;
  }, {});

  const gaps: GapOpportunity[] = [];
  for (const [query, group] of Object.entries(grouped)) {
    const brandMention = group.find((item) => item.brand === brand);
    const competitorMentions = group.filter((item) => competitors.includes(item.brand));

    // Type 1: Brand missing entirely
    if (!brandMention && competitorMentions.length > 0) {
      const topCompetitor = competitorMentions.sort((a, b) => a.position - b.position)[0];
      gaps.push({
        query,
        dominatingCompetitor: topCompetitor.brand,
        recommendation: `Missing from this query - ${topCompetitor.brand} appears. Create content targeting "${query}".`,
        gapType: 'missing'
      });
    }

    // Type 2: Brand appears but competitor ranks higher
    if (brandMention && competitorMentions.length > 0) {
      const betterCompetitors = competitorMentions.filter(c => c.position < brandMention.position);
      if (betterCompetitors.length > 0) {
        const topCompetitor = betterCompetitors.sort((a, b) => a.position - b.position)[0];
        gaps.push({
          query,
          dominatingCompetitor: topCompetitor.brand,
          recommendation: `You rank #${brandMention.position}, but ${topCompetitor.brand} ranks #${topCompetitor.position}. Improve content for "${query}".`,
          gapType: 'outranked'
        });
      }
    }
  }

  // Prioritize missing gaps first, then outranked, return top 5
  const sortedGaps = [
    ...gaps.filter(g => g.gapType === 'missing'),
    ...gaps.filter(g => g.gapType === 'outranked')
  ];
  return sortedGaps.slice(0, 5);
};

const buildActionItems = (gaps: GapOpportunity[], delta: number): string[] => {
  const actions: string[] = [];
  if (delta < 0) actions.push('Mentions declined week-over-week. Publish an update highlighting fresh wins.');
  if (gaps.length > 0) actions.push(`Prioritize producing assets for ${gaps[0].query}.`);
  if (delta > 0) actions.push('Momentum is positive; schedule social proof content to amplify gains.');
  return actions.slice(0, 3);
};

export const buildDashboardSummary = (
  brand: string,
  competitors: string[],
  mentions: VisibilityMention[],
  snapshots: Array<{ snapshotDate: string; brandMentions: number; totalQueries: number }>
): DashboardSummary => {
  const share = countMentions(mentions);
  const totalMentions = Object.values(share).reduce((sum, value) => sum + value, 0);

  // Count unique queries with mentions
  const queriesWithMentions = new Set(mentions.map((item) => item.query)).size;

  // For cumulative stats: sum ALL queries from ALL snapshots
  const totalQueriesAcrossAllRuns = snapshots.reduce((sum, s) => sum + s.totalQueries, 0);
  let totalQueries = totalQueriesAcrossAllRuns || queriesWithMentions;

  // Validation: prevent impossible metrics where queriesWithMentions > totalQueries
  if (queriesWithMentions > totalQueries && totalQueries > 0) {
    totalQueries = queriesWithMentions;
  }

  const shareOfVoice = Object.fromEntries(
    [brand, ...competitors].map((name) => {
      const value = share[name] ?? 0;
      const sharePct = totalMentions === 0 ? 0 : Math.round((value / totalMentions) * 100);
      return [name, sharePct];
    })
  );

  // Build trend series from snapshots
  const series = snapshots
    .slice(0, 10) // Last 10 runs
    .reverse() // Oldest to newest
    .map((snapshot) => ({
      week: new Date(snapshot.snapshotDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      value: snapshot.brandMentions
    }));

  const delta = series.length >= 2 ? series[series.length - 1].value - series[series.length - 2].value : 0;
  const gaps = findGapOpportunities(mentions, brand, competitors);
  const actionCard = buildActionItems(gaps, delta);

  return {
    summaryCard: {
      brandMentions: share[brand] ?? 0,
      totalQueries,
      queriesWithMentions,
      shareOfVoice
    },
    trendCard: {
      series,
      delta
    },
    gapCard: gaps,
    actionCard
  };
};
