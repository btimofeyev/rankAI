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
  competitors: string[],
  allQueriesFromSnapshots: string[]
): GapOpportunity[] => {
  const grouped = mentions.reduce<Record<string, VisibilityMention[]>>((acc, mention) => {
    acc[mention.query] = acc[mention.query] ?? [];
    acc[mention.query].push(mention);
    return acc;
  }, {});

  const gaps: GapOpportunity[] = [];
  const allBrands = [brand, ...competitors];

  // Check all queries that were analyzed (not just ones with mentions)
  const uniqueQueries = new Set([...allQueriesFromSnapshots, ...Object.keys(grouped)]);

  for (const query of uniqueQueries) {
    const group = grouped[query] ?? [];
    const brandMention = group.find((item) => item.brand === brand);
    const competitorMentions = group.filter((item) => competitors.includes(item.brand));
    const anyBrandMentioned = group.some((item) => allBrands.includes(item.brand));

    // Type 1: No brands mentioned at all (biggest opportunity)
    if (!anyBrandMentioned && group.length === 0) {
      gaps.push({
        query,
        dominatingCompetitor: 'None',
        recommendation: `Major content gap - zero brand visibility`,
        gapType: 'missing'
      });
    }
    // Type 2: Brand missing but competitor present
    else if (!brandMention && competitorMentions.length > 0) {
      const topCompetitor = competitorMentions.sort((a, b) => a.position - b.position)[0];
      gaps.push({
        query,
        dominatingCompetitor: topCompetitor.brand,
        recommendation: `${topCompetitor.brand} ranks #${topCompetitor.position}, you're absent`,
        gapType: 'missing'
      });
    }
    // Type 3: Brand appears but competitor ranks higher
    else if (brandMention && competitorMentions.length > 0) {
      const betterCompetitors = competitorMentions.filter(c => c.position < brandMention.position);
      if (betterCompetitors.length > 0) {
        const topCompetitor = betterCompetitors.sort((a, b) => a.position - b.position)[0];
        gaps.push({
          query,
          dominatingCompetitor: topCompetitor.brand,
          recommendation: `You're #${brandMention.position}, ${topCompetitor.brand} is #${topCompetitor.position}`,
          gapType: 'outranked'
        });
      }
    }
  }

  // Prioritize: no visibility > missing > outranked, return top 5
  const sortedGaps = [
    ...gaps.filter(g => g.gapType === 'missing' && g.dominatingCompetitor === 'None'),
    ...gaps.filter(g => g.gapType === 'missing' && g.dominatingCompetitor !== 'None'),
    ...gaps.filter(g => g.gapType === 'outranked')
  ];
  return sortedGaps.slice(0, 5);
};

const buildActionItems = (
  gaps: GapOpportunity[],
  delta: number,
  totalMentions: number,
  brandMentions: number
): string[] => {
  const actions: string[] = [];

  // Priority 1: Address critical gaps (no visibility)
  const criticalGaps = gaps.filter(g => g.dominatingCompetitor === 'None');
  if (criticalGaps.length > 0) {
    actions.push(`🎯 Critical: ${criticalGaps.length} queries have zero brand visibility. Start with: "${criticalGaps[0].query}"`);
  }

  // Priority 2: Competitive gaps
  const competitiveGaps = gaps.filter(g => g.dominatingCompetitor !== 'None' && g.gapType === 'missing');
  if (competitiveGaps.length > 0 && actions.length < 3) {
    const topCompetitor = competitiveGaps[0].dominatingCompetitor;
    const competitorCount = competitiveGaps.filter(g => g.dominatingCompetitor === topCompetitor).length;
    actions.push(`⚔️ ${topCompetitor} dominates ${competitorCount} queries where you're absent. Counter with: "${competitiveGaps[0].query}"`);
  }

  // Priority 3: Trend-based actions
  if (delta < -2 && actions.length < 3) {
    actions.push(`📉 Visibility dropped ${Math.abs(delta)} mentions. Audit recent content and boost distribution.`);
  } else if (delta > 2 && actions.length < 3) {
    actions.push(`📈 Strong momentum (+${delta} mentions). Double down on winning content themes and amplify reach.`);
  }

  // Priority 4: Share of voice improvement
  const shareOfVoicePct = totalMentions === 0 ? 0 : Math.round((brandMentions / totalMentions) * 100);
  if (shareOfVoicePct < 40 && actions.length < 3) {
    actions.push(`🎤 Your share of voice is ${shareOfVoicePct}%. Target 50%+ by creating definitive guides for top gaps.`);
  }

  // Priority 5: Positioning improvements
  const positioningGaps = gaps.filter(g => g.gapType === 'outranked');
  if (positioningGaps.length > 0 && actions.length < 3) {
    actions.push(`🏆 Improve positioning: ${positioningGaps[0].recommendation}`);
  }

  // Default action if nothing else applies
  if (actions.length === 0) {
    actions.push('✅ Strong coverage. Maintain momentum and monitor for emerging competitors.');
  }

  return actions.slice(0, 4); // Return top 4 actions
};

export const buildDashboardSummary = (
  brand: string,
  competitors: string[],
  mentions: VisibilityMention[],
  snapshots: Array<{ snapshotDate: string; brandMentions: number; totalQueries: number; competitorShares?: Record<string, number>; analyzedQueries?: string[] }>,
  allQueries: string[] = []
): DashboardSummary => {
  const queryUniverse = allQueries.length > 0
    ? allQueries
    : Array.from(new Set(snapshots.flatMap((snapshot) => snapshot.analyzedQueries ?? [])));

  // Count unique queries each brand appears in (not total mentions)
  const queriesWithBrand = new Set(
    mentions.filter(m => m.brand === brand).map(m => m.query)
  ).size;

  const competitorQueryCounts = competitors.reduce<Record<string, number>>((acc, comp) => {
    acc[comp] = new Set(mentions.filter(m => m.brand === comp).map(m => m.query)).size;
    return acc;
  }, {});

  // Count unique queries with any mentions
  const queriesWithMentions = new Set(mentions.map((item) => item.query)).size;

  // Total queries = sum of ALL queries from ALL snapshots
  const totalQueries = snapshots.reduce((sum, s) => sum + s.totalQueries, 0) || 0;

  // Share of voice based on query appearances (not mentions)
  const shareOfVoice = Object.fromEntries(
    [brand, ...competitors].map((name) => {
      const count = name === brand ? queriesWithBrand : (competitorQueryCounts[name] ?? 0);
      const sharePct = totalQueries === 0 ? 0 : Math.round((count / totalQueries) * 100);
      return [name, sharePct];
    })
  );

  // Build trend series from snapshots (brand + competitors)
  // Note: snapshot.brandMentions now stores "queries appeared in" count
  const series: { week: string; value: number; [brand: string]: string | number }[] = snapshots
    .slice(0, 10) // Last 10 runs
    .reverse() // Oldest to newest
    .map((snapshot) => {
      const point: { week: string; value: number; [brand: string]: string | number } = {
        week: new Date(snapshot.snapshotDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        value: snapshot.brandMentions  // This is now query appearances, not mention count
      };
      // Add brand (query appearances)
      point[brand] = snapshot.brandMentions;
      // Add competitors (extract from competitorShares, calculate back to count)
      competitors.forEach(comp => {
        const competitorSharePct = (snapshot.competitorShares as Record<string, number>)?.[comp] ?? 0;
        const competitorCount = Math.round((competitorSharePct / 100) * snapshot.totalQueries);
        point[comp] = competitorCount;
      });
      return point;
    });

  const delta = series.length >= 2 ? (series[series.length - 1]?.value ?? 0) - (series[series.length - 2]?.value ?? 0) : 0;
  const gaps = findGapOpportunities(mentions, brand, competitors, queryUniverse);
  const actionCard = buildActionItems(gaps, delta, totalQueries, queriesWithBrand);

  // Calculate sentiment breakdown for the brand
  const brandMentions = mentions.filter(m => m.brand === brand);
  const sentimentCard = {
    positive: brandMentions.filter(m => m.sentiment === 'positive').length,
    neutral: brandMentions.filter(m => m.sentiment === 'neutral').length,
    negative: brandMentions.filter(m => m.sentiment === 'negative').length
  };

  return {
    summaryCard: {
      brandMentions: queriesWithBrand,  // Now represents queries appeared in, not mention count
      totalQueries,
      queriesWithMentions,
      shareOfVoice
    },
    trendCard: {
      series,
      delta
    },
    gapCard: gaps,
    actionCard,
    sentimentCard
  };
};
