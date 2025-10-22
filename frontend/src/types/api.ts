export type ShareOfVoice = Record<string, number>;

export type GapOpportunity = {
  query: string;
  dominatingCompetitor: string;
  recommendation: string;
};

export type TrendPoint = {
  week: string;
  value: number;
  [brand: string]: string | number;
};

export type DashboardCards = {
  summaryCard: {
    brandMentions: number;
    totalQueries: number;
    queriesWithMentions: number;
    shareOfVoice: ShareOfVoice;
  };
  trendCard: {
    series: TrendPoint[];
    delta: number;
  };
  gapCard: GapOpportunity[];
  actionCard: string[];
  sentimentCard: {
    positive: number;
    neutral: number;
    negative: number;
  };
};

export type AnalysisRecord = {
  id: string;
  brand: string;
  keywords: string[];
  competitors: string[];
  createdAt: string;
};

export type DashboardResponse = {
  analysis: AnalysisRecord | null;
  dashboard: DashboardCards | null;
};

export type PlanResponse = {
  tier: 'free' | 'pro';
  renewsAt?: string;
};

export type AnalysisPayload = {
  brand: string;
  keywords: string[];
  competitors: string[];
};

export type CheckoutSessionResponse = {
  url: string;
};

// Project types
export type Project = {
  id: string;
  userId: string;
  brandName: string;
  keywords: string[];
  competitors: string[];
  trackedQueries: string[];
  createdAt: string;
  updatedAt: string;
};

export type Citation = {
  url: string;
  title: string;
  domain: string;
  snippet?: string;
};

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
    trendData?: number[]; // Last 5-10 appearance rates
  }>;
  isTracked: boolean;
  citations?: Citation[];
  usedWebSearch?: boolean;
  trendData?: number[]; // Brand's last 5-10 appearance rates
};

export type AnalysisRun = {
  id: string;
  projectId: string;
  runAt: string;
  queriesGenerated: number;
};

export type ProjectSnapshot = {
  id: string;
  projectId: string;
  runId: string;
  snapshotDate: string;
  totalQueries: number;
  queriesWithMentions: number;
  brandMentions: number;
  brandSharePct: number;
  competitorShares: Record<string, number>;
};

export type ProjectsListResponse = {
  projects: Project[];
};

export type ProjectResponse = {
  project: Project;
  runs: AnalysisRun[];
  snapshots: ProjectSnapshot[];
  dashboard: DashboardCards | null;
  totalQueries: number;
};

export type CreateProjectPayload = {
  brandName: string;
  keywords: string[];
  competitors: string[];
  queries: string[];
};

export type UpdateProjectPayload = {
  keywords: string[];
  competitors: string[];
};

export type RunAnalysisResponse = {
  run: AnalysisRun;
  dashboard: DashboardCards;
  totalQueries: number;
};

export type QuerySuggestion = {
  query: string;
  score: number;
  reason: string;
  category: 'zero_visibility' | 'competitor_gap' | 'high_performer' | 'related';
  metadata: {
    competitorMentions?: number;
    competitorName?: string;
    brandMissing: boolean;
    avgPosition?: number;
    appearanceRate?: number;
  };
};

export type QuerySuggestionsResponse = {
  suggestions: QuerySuggestion[];
};

export type BulkTrackResponse = {
  project: Project;
  added: number;
};

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

export type QueryTrendsResponse = {
  trends: QueryTrendAnalysis;
};
