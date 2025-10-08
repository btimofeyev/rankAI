export type VisibilityMention = {
  query: string;
  brand: string;
  position: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  context: string;
};

export type QueryRun = {
  id: string;
  analysisId: string;
  runAt: string;
  mentions: VisibilityMention[];
};

export type AnalysisRequest = {
  brand: string;
  keywords: string[];
  competitors: string[];
  userId: string;
};

export type AnalysisRecord = AnalysisRequest & {
  id: string;
  createdAt: string;
};

export type TrendSnapshot = {
  id: string;
  analysisId: string;
  snapshotDate: string;
  totalQueries: number;
  queriesWithMentions: number;
  brandMentions: number;
  brandSharePct: number;
  competitorShares: Record<string, number>;
  analyzedQueries: string[];
};

export type GapOpportunity = {
  query: string;
  dominatingCompetitor: string;
  recommendation: string;
  gapType?: 'missing' | 'outranked';
};

export type DashboardSummary = {
  summaryCard: {
    brandMentions: number;
    totalQueries: number;
    queriesWithMentions: number;
    shareOfVoice: Record<string, number>;
  };
  trendCard: {
    series: Array<{ week: string; value: number }>;
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

export type PlanTier = 'free' | 'pro';

export type PlanState = {
  tier: PlanTier;
  renewsAt?: string;
};

// New types for brand projects
export type BrandProject = {
  id: string;
  userId: string;
  brandName: string;
  keywords: string[];
  competitors: string[];
  trackedQueries: string[];
  createdAt: string;
  updatedAt: string;
};

export type AnalysisRun = {
  id: string;
  projectId: string;
  runAt: string;
  queriesGenerated: number;
};

export type QueryResult = {
  id: string;
  runId: string;
  queryText: string;
  brand: string | null;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  context: string | null;
  responseText?: string;
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
