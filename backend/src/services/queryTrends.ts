import { repository } from './repository.js';

export type QueryTrendDataPoint = {
  date: string;
  runId: string;
  appeared: boolean;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  context: string | null;
  competitorPositions: Record<string, number | null>;
};

export type QueryTrendAnalysis = {
  query: string;
  dataPoints: QueryTrendDataPoint[];
  overallStats: {
    totalRuns: number;
    appearanceCount: number;
    appearanceRate: number;
    avgPosition: number;
    bestPosition: number;
    worstPosition: number;
    trendDirection: 'up' | 'down' | 'stable';
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  competitorComparison: Record<string, {
    appearanceCount: number;
    avgPosition: number;
  }>;
};

/**
 * Get detailed trend analysis for a specific query across all runs
 */
export const getQueryTrendsOverTime = async (
  projectId: string,
  queryText: string,
  brandName: string,
  competitors: string[]
): Promise<QueryTrendAnalysis> => {
  const runs = await repository.getProjectRuns(projectId);

  // Sort runs chronologically (oldest first)
  const sortedRuns = runs.sort((a, b) =>
    new Date(a.runAt).getTime() - new Date(b.runAt).getTime()
  );

  const dataPoints: QueryTrendDataPoint[] = [];
  let totalAppearances = 0;
  let totalPosition = 0;
  let positionCount = 0;
  let bestPos = Infinity;
  let worstPos = 0;
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  const competitorStats: Record<string, { count: number; totalPos: number; posCount: number }> = {};

  // Initialize competitor stats
  for (const comp of competitors) {
    competitorStats[comp] = { count: 0, totalPos: 0, posCount: 0 };
  }

  // Process each run
  for (const run of sortedRuns) {
    const results = await repository.getRunResults(run.id);
    const queryResults = results.filter(r => r.queryText === queryText);

    // Check if brand appeared
    const brandResult = queryResults.find(r => r.brand === brandName);
    const appeared = !!brandResult;

    if (appeared && brandResult) {
      totalAppearances++;

      if (brandResult.position !== null) {
        totalPosition += brandResult.position;
        positionCount++;
        bestPos = Math.min(bestPos, brandResult.position);
        worstPos = Math.max(worstPos, brandResult.position);
      }

      if (brandResult.sentiment) {
        sentimentCounts[brandResult.sentiment]++;
      }
    }

    // Track competitor positions
    const competitorPositions: Record<string, number | null> = {};
    for (const comp of competitors) {
      const compResult = queryResults.find(r => r.brand === comp);
      if (compResult) {
        competitorStats[comp].count++;
        competitorPositions[comp] = compResult.position;
        if (compResult.position !== null) {
          competitorStats[comp].totalPos += compResult.position;
          competitorStats[comp].posCount++;
        }
      } else {
        competitorPositions[comp] = null;
      }
    }

    dataPoints.push({
      date: run.runAt,
      runId: run.id,
      appeared,
      position: brandResult?.position ?? null,
      sentiment: brandResult?.sentiment ?? null,
      context: brandResult?.context ?? null,
      competitorPositions
    });
  }

  // Calculate trend direction (comparing first half vs second half of data)
  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  if (dataPoints.length >= 4) {
    const midpoint = Math.floor(dataPoints.length / 2);
    const firstHalf = dataPoints.slice(0, midpoint);
    const secondHalf = dataPoints.slice(midpoint);

    const firstHalfRate = firstHalf.filter(d => d.appeared).length / firstHalf.length;
    const secondHalfRate = secondHalf.filter(d => d.appeared).length / secondHalf.length;

    const diff = secondHalfRate - firstHalfRate;
    if (diff > 0.1) trendDirection = 'up';
    else if (diff < -0.1) trendDirection = 'down';
  }

  // Build competitor comparison
  const competitorComparison: Record<string, { appearanceCount: number; avgPosition: number }> = {};
  for (const [comp, stats] of Object.entries(competitorStats)) {
    competitorComparison[comp] = {
      appearanceCount: stats.count,
      avgPosition: stats.posCount > 0 ? Math.round((stats.totalPos / stats.posCount) * 10) / 10 : 0
    };
  }

  return {
    query: queryText,
    dataPoints,
    overallStats: {
      totalRuns: sortedRuns.length,
      appearanceCount: totalAppearances,
      appearanceRate: sortedRuns.length > 0 ? Math.round((totalAppearances / sortedRuns.length) * 100) : 0,
      avgPosition: positionCount > 0 ? Math.round((totalPosition / positionCount) * 10) / 10 : 0,
      bestPosition: bestPos === Infinity ? 0 : bestPos,
      worstPosition: worstPos,
      trendDirection,
      sentimentBreakdown: sentimentCounts
    },
    competitorComparison
  };
};
