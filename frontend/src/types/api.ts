export type ShareOfVoice = Record<string, number>;

export type GapOpportunity = {
  query: string;
  dominatingCompetitor: string;
  recommendation: string;
};

export type TrendPoint = {
  week: string;
  value: number;
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
  createdAt: string;
  updatedAt: string;
};

export type AnalysisRun = {
  id: string;
  projectId: string;
  runAt: string;
  queriesGenerated: number;
};

export type ProjectsListResponse = {
  projects: Project[];
};

export type ProjectResponse = {
  project: Project;
  runs: AnalysisRun[];
  dashboard: DashboardCards | null;
  totalQueries: number;
};

export type CreateProjectPayload = {
  brandName: string;
  keywords: string[];
  competitors: string[];
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
