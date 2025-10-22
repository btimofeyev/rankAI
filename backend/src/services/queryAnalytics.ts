import { repository } from './repository.js';
import { Citation } from '../types.js';

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
    trendData?: number[];
  }>;
  isTracked: boolean;
  citations?: Citation[];
  usedWebSearch?: boolean;
  trendData?: number[];
};

export const calculateQueryPerformance = async (
  projectId: string,
  brandName: string,
  competitors: string[],
  trackedQueries: string[]
): Promise<QueryPerformance[]> => {
  // Get all query results for this project
  const runs = await repository.getProjectRuns(projectId);

  // Sort runs chronologically for trend calculation
  const sortedRuns = runs.sort((a, b) =>
    new Date(a.runAt).getTime() - new Date(b.runAt).getTime()
  );

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

  // Process queries that have been analyzed
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

    // Calculate trend data for brand (last 10 runs)
    const brandTrendData: number[] = [];
    const last10Runs = sortedRuns.slice(-10); // Last 10 runs
    for (const run of last10Runs) {
      const runResults = results.filter(r => r.runId === run.id);
      const brandInRun = runResults.some(r => r.brand === brandName);
      brandTrendData.push(brandInRun ? 1 : 0);
    }

    // Calculate competitor data with trend
    const competitorData: Record<string, { appearances: number; avgPosition: number; trendData?: number[] }> = {};
    for (const competitor of competitors) {
      const compResults = results.filter(r => r.brand === competitor);
      const compAppearances = new Set(compResults.map(r => r.runId)).size;
      const compPositions = compResults
        .filter(r => r.position !== null)
        .map(r => r.position as number);
      const compAvgPosition = compPositions.length > 0
        ? compPositions.reduce((sum, pos) => sum + pos, 0) / compPositions.length
        : 0;

      // Calculate trend data for competitor
      const compTrendData: number[] = [];
      for (const run of last10Runs) {
        const runResults = results.filter(r => r.runId === run.id);
        const compInRun = runResults.some(r => r.brand === competitor);
        compTrendData.push(compInRun ? 1 : 0);
      }

      competitorData[competitor] = {
        appearances: compAppearances,
        avgPosition: compAvgPosition,
        trendData: compTrendData
      };
    }

    // Get citations (from first result that has them)
    const citations = results.find(r => r.citations && r.citations.length > 0)?.citations || [];
    const usedWebSearch = results.some(r => r.usedWebSearch);

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
      isTracked: trackedQueries.includes(queryText),
      citations,
      usedWebSearch,
      trendData: brandTrendData
    });
  }

  // Add tracked queries that haven't been analyzed yet
  const analyzedQueries = new Set(Object.keys(allQueryResults));
  const unanalyzedQueries = trackedQueries.filter(q => !analyzedQueries.has(q));

  for (const queryText of unanalyzedQueries) {
    performances.push({
      query: queryText,
      totalAppearances: 0,
      brandAppearances: 0,
      appearanceRate: 0,
      avgPosition: 0,
      bestPosition: 0,
      worstPosition: 0,
      sentiment: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      competitorData: {},
      isTracked: true,
      citations: [],
      usedWebSearch: false
    });
  }

  // Sort: analyzed queries first (by performance), then unanalyzed
  return performances.sort((a, b) => {
    // Unanalyzed queries go to the end
    if (a.brandAppearances === 0 && b.brandAppearances === 0) {
      return 0; // Keep original order for unanalyzed
    }
    if (a.brandAppearances === 0) return 1;
    if (b.brandAppearances === 0) return -1;

    // Sort analyzed queries by performance
    if (b.brandAppearances !== a.brandAppearances) {
      return b.brandAppearances - a.brandAppearances;
    }
    return b.appearanceRate - a.appearanceRate;
  });
};
