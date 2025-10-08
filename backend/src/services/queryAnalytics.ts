import { repository } from './repository.js';

export type QueryPerformance = {
  query: string;
  totalAppearances: number;
  brandAppearances: number;
  appearanceRate: number;
  avgPosition: number;
  bestPosition: number;
  worstPosition: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  competitorData: Record<string, {
    appearances: number;
    avgPosition: number;
  }>;
  isTracked: boolean;
};

export const calculateQueryPerformance = async (
  projectId: string,
  brandName: string,
  competitors: string[],
  trackedQueries: string[]
): Promise<QueryPerformance[]> => {
  // Get all query results for this project
  const runs = await repository.getProjectRuns(projectId);
  const allQueryResults: Record<string, any[]> = {};

  // Aggregate all results by query text
  for (const run of runs) {
    const results = await repository.getRunResults(run.id);
    for (const result of results) {
      if (!allQueryResults[result.queryText]) {
        allQueryResults[result.queryText] = [];
      }
      allQueryResults[result.queryText].push(result);
    }
  }

  // Calculate performance metrics for each query
  const performances: QueryPerformance[] = [];

  for (const [queryText, results] of Object.entries(allQueryResults)) {
    const brandResults = results.filter(r => r.brand === brandName);
    const totalRuns = new Set(results.map(r => r.runId)).size;

    // Calculate brand metrics
    const brandAppearances = new Set(brandResults.map(r => r.runId)).size;
    const appearanceRate = totalRuns > 0 ? (brandAppearances / totalRuns) * 100 : 0;

    const positions = brandResults
      .filter(r => r.position !== null)
      .map(r => r.position as number);

    const avgPosition = positions.length > 0
      ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length
      : 0;

    const bestPosition = positions.length > 0 ? Math.min(...positions) : 0;
    const worstPosition = positions.length > 0 ? Math.max(...positions) : 0;

    // Calculate sentiment
    const sentiment = {
      positive: brandResults.filter(r => r.sentiment === 'positive').length,
      neutral: brandResults.filter(r => r.sentiment === 'neutral').length,
      negative: brandResults.filter(r => r.sentiment === 'negative').length
    };

    // Calculate competitor data
    const competitorData: Record<string, { appearances: number; avgPosition: number }> = {};
    for (const competitor of competitors) {
      const compResults = results.filter(r => r.brand === competitor);
      const compAppearances = new Set(compResults.map(r => r.runId)).size;
      const compPositions = compResults
        .filter(r => r.position !== null)
        .map(r => r.position as number);
      const compAvgPosition = compPositions.length > 0
        ? compPositions.reduce((sum, pos) => sum + pos, 0) / compPositions.length
        : 0;

      competitorData[competitor] = {
        appearances: compAppearances,
        avgPosition: compAvgPosition
      };
    }

    performances.push({
      query: queryText,
      totalAppearances: brandAppearances,
      brandAppearances,
      appearanceRate: Math.round(appearanceRate),
      avgPosition: Math.round(avgPosition * 10) / 10,
      bestPosition,
      worstPosition,
      sentiment,
      competitorData,
      isTracked: trackedQueries.includes(queryText)
    });
  }

  // Sort by brand appearances (descending), then by appearance rate
  return performances.sort((a, b) => {
    if (b.brandAppearances !== a.brandAppearances) {
      return b.brandAppearances - a.brandAppearances;
    }
    return b.appearanceRate - a.appearanceRate;
  });
};
