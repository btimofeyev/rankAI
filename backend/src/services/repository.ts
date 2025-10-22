import { randomUUID } from 'node:crypto';
import { getSupabase } from './supabaseClient.js';
import {
  AnalysisRecord,
  AnalysisRequest,
  AnalysisRun,
  BrandProject,
  PlanState,
  ProjectSnapshot,
  QueryResult,
  QueryRun,
  TrendSnapshot,
  VisibilityMention
} from '../types.js';

type InMemoryStore = {
  analyses: AnalysisRecord[];
  queryRuns: QueryRun[];
  trends: TrendSnapshot[];
  plans: Record<string, PlanState>;
  projects: BrandProject[];
  analysisRuns: AnalysisRun[];
  queryResults: QueryResult[];
  projectSnapshots: ProjectSnapshot[];
};

const memStore: InMemoryStore = {
  analyses: [],
  queryRuns: [],
  trends: [],
  plans: {},
  projects: [],
  analysisRuns: [],
  queryResults: [],
  projectSnapshots: []
};

export const repository = {
  async createAnalysis(input: AnalysisRequest, mentions: QueryRun['mentions']): Promise<AnalysisRecord> {
    const supabase = getSupabase();
    const record: AnalysisRecord = {
      id: randomUUID(),
      brand: input.brand,
      competitors: input.competitors,
      keywords: input.keywords,
      userId: input.userId,
      createdAt: new Date().toISOString()
    };
    const run: QueryRun = {
      id: randomUUID(),
      analysisId: record.id,
      runAt: record.createdAt,
      mentions
    };

    if (supabase.client) {
      const { error: analysisError } = await supabase.client.from('analyses').insert({
        id: record.id,
        user_id: record.userId,
        brand: record.brand,
        keywords: record.keywords,
        competitors: record.competitors,
        created_at: record.createdAt
      });
      if (analysisError) throw analysisError;

      const { error: queryError } = await supabase.client.from('queries').insert(
        run.mentions.map((mention) => ({
          id: randomUUID(),
          analysis_id: record.id,
          query_text: mention.query,
          brand: mention.brand,
          position: mention.position,
          sentiment: mention.sentiment,
          context: mention.context,
          run_at: run.runAt
        }))
      );
      if (queryError) throw queryError;
    } else {
      memStore.analyses.push(record);
      memStore.queryRuns.push(run);
    }
    return record;
  },

  async appendQueryRun(analysis: AnalysisRecord, mentions: VisibilityMention[]): Promise<void> {
    const supabase = getSupabase();
    const runAt = new Date().toISOString();
    if (supabase.client) {
      const rows = mentions.map((mention) => ({
        id: randomUUID(),
        analysis_id: analysis.id,
        query_text: mention.query,
        brand: mention.brand,
        position: mention.position,
        sentiment: mention.sentiment,
        context: mention.context,
        run_at: runAt
      }));
      const { error } = await supabase.client.from('queries').insert(rows);
      if (error) throw error;
      return;
    }
    const run: QueryRun = {
      id: randomUUID(),
      analysisId: analysis.id,
      runAt,
      mentions
    };
    memStore.queryRuns.push(run);
  },

  async latestAnalysis(userId: string): Promise<{ analysis: AnalysisRecord | null; run: QueryRun | null }> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { analysis: null, run: null };
      const { data: mentions, error: queryError } = await supabase.client
        .from('queries')
        .select('*')
        .eq('analysis_id', data.id);
      if (queryError) throw queryError;
      return {
        analysis: {
          id: data.id,
          brand: data.brand,
          keywords: data.keywords ?? [],
          competitors: data.competitors ?? [],
          userId: data.user_id,
          createdAt: data.created_at
        },
        run: {
          id: randomUUID(),
          analysisId: data.id,
          runAt: data.created_at,
          mentions: (mentions ?? []).map((item) => ({
            query: item.query_text,
            brand: item.brand,
            position: item.position,
            sentiment: item.sentiment,
            context: item.context
          }))
        }
      };
    }

    const analysis = [...memStore.analyses]
      .filter((item) => item.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] ?? null;
    if (!analysis) return { analysis: null, run: null };
    const run = memStore.queryRuns.find((item) => item.analysisId === analysis.id) ?? null;
    return { analysis, run };
  },

  async saveTrendSnapshot(snapshot: TrendSnapshot): Promise<void> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { error } = await supabase.client.from('history').insert({
        id: snapshot.id,
        analysis_id: snapshot.analysisId,
        week: snapshot.snapshotDate.slice(0, 10),
        snapshot_date: snapshot.snapshotDate,
        total_queries: snapshot.totalQueries,
        queries_with_mentions: snapshot.queriesWithMentions,
        brand_mentions: snapshot.brandMentions,
        brand_share_pct: snapshot.brandSharePct,
        competitor_shares: snapshot.competitorShares,
        analyzed_queries: snapshot.analyzedQueries
      });
      if (error) throw error;
      return;
    }
    memStore.trends.push(snapshot);
  },

  async getTrendSnapshots(analysisId: string): Promise<TrendSnapshot[]> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('history')
        .select('id, analysis_id, week, snapshot_date, total_queries, queries_with_mentions, brand_mentions, brand_share_pct, competitor_shares, competitor_mentions, analyzed_queries')
        .eq('analysis_id', analysisId)
        .order('snapshot_date', { ascending: true, nullsFirst: true })
        .order('week', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((item) => ({
        id: item.id,
        analysisId: item.analysis_id,
        snapshotDate: item.snapshot_date ?? (item.week ? new Date(item.week).toISOString() : new Date().toISOString()),
        totalQueries: item.total_queries ?? 0,
        queriesWithMentions: item.queries_with_mentions ?? item.brand_mentions ?? 0,
        brandMentions: item.brand_mentions ?? 0,
        brandSharePct: item.brand_share_pct ?? 0,
        competitorShares: item.competitor_shares ?? {},
        analyzedQueries: item.analyzed_queries ?? []
      }));
    }
    return memStore.trends
      .filter((item) => item.analysisId === analysisId)
      .sort((a, b) => (a.snapshotDate > b.snapshotDate ? 1 : -1));
  },

  async getPlan(userId: string): Promise<PlanState> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('user_plans')
        .select('plan_tier, plan_renews_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return { tier: 'free' };
      return { tier: data.plan_tier ?? 'free', renewsAt: data.plan_renews_at ?? undefined };
    }
    return memStore.plans[userId] ?? { tier: 'free' };
  },

  async setPlan(userId: string, plan: PlanState): Promise<void> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { error } = await supabase.client.from('user_plans').upsert({
        user_id: userId,
        plan_tier: plan.tier,
        plan_renews_at: plan.renewsAt
      });
      if (error) throw error;
      return;
    }
    memStore.plans[userId] = plan;
  },

  async listAnalyses(): Promise<AnalysisRecord[]> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { data, error } = await supabase.client.from('analyses').select('*');
      if (error) throw error;
      return (data ?? []).map((item) => ({
        id: item.id,
        brand: item.brand,
        competitors: item.competitors ?? [],
        keywords: item.keywords ?? [],
        userId: item.user_id,
        createdAt: item.created_at
      }));
    }
    return [...memStore.analyses];
  },

  // Brand Project Methods
  async createProject(userId: string, brandName: string, keywords: string[], competitors: string[], trackedQueries: string[] = []): Promise<BrandProject> {
    const supabase = getSupabase();
    const project: BrandProject = {
      id: randomUUID(),
      userId,
      brandName,
      keywords,
      competitors,
      trackedQueries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (supabase.client) {
      const { error } = await supabase.client.from('brand_projects').insert({
        id: project.id,
        user_id: project.userId,
        brand_name: project.brandName,
        keywords: project.keywords,
        competitors: project.competitors,
        tracked_queries: project.trackedQueries,
        created_at: project.createdAt,
        updated_at: project.updatedAt
      });
      if (error) throw error;
      return project;
    }

    memStore.projects.push(project);
    return project;
  },

  async getProject(projectId: string): Promise<BrandProject | null> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('brand_projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const project: BrandProject = {
        id: data.id,
        userId: data.user_id,
        brandName: data.brand_name,
        keywords: data.keywords ?? [],
        competitors: data.competitors ?? [],
        trackedQueries: data.tracked_queries ?? [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
      return project;
    }
    return memStore.projects.find(p => p.id === projectId) ?? null;
  },

  async listProjects(userId: string): Promise<BrandProject[]> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('brand_projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;

    return (data ?? []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      brandName: item.brand_name,
      keywords: item.keywords ?? [],
      competitors: item.competitors ?? [],
      trackedQueries: item.tracked_queries ?? [],
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
    }
    return memStore.projects.filter(p => p.userId === userId);
  },

  async updateProject(projectId: string, keywords: string[], competitors: string[]): Promise<BrandProject> {
    const supabase = getSupabase();
    const updatedAt = new Date().toISOString();

    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('brand_projects')
        .update({ keywords, competitors, updated_at: updatedAt })
        .eq('id', projectId)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        userId: data.user_id,
        brandName: data.brand_name,
        keywords: data.keywords ?? [],
        competitors: data.competitors ?? [],
        trackedQueries: data.tracked_queries ?? [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }

    const project = memStore.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');
    project.keywords = keywords;
    project.competitors = competitors;
    project.updatedAt = updatedAt;
    return project;
  },

  async deleteProject(projectId: string): Promise<void> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { error } = await supabase.client.from('brand_projects').delete().eq('id', projectId);
      if (error) throw error;
    } else {
      const index = memStore.projects.findIndex(p => p.id === projectId);
      if (index !== -1) memStore.projects.splice(index, 1);
    }
  },

  // Analysis Run Methods
  async createAnalysisRun(projectId: string, queriesGenerated: number): Promise<AnalysisRun> {
    const supabase = getSupabase();
    const run: AnalysisRun = {
      id: randomUUID(),
      projectId,
      runAt: new Date().toISOString(),
      queriesGenerated
    };

    if (supabase.client) {
      const { error } = await supabase.client.from('analysis_runs').insert({
        id: run.id,
        project_id: run.projectId,
        run_at: run.runAt,
        queries_generated: run.queriesGenerated
      });
      if (error) throw error;
    } else {
      memStore.analysisRuns.push(run);
    }

    return run;
  },

  async saveQueryResults(runId: string, results: Array<{ query: string; responseText: string; mentions: VisibilityMention[]; citations?: any[]; usedWebSearch?: boolean }>): Promise<void> {
    const supabase = getSupabase();
    const queryResults: QueryResult[] = [];

    // For each query, store the query itself AND all brand mentions found in it
    for (const result of results) {
      if (result.mentions.length === 0) {
        // Query with no mentions - store as single row with null brand
        queryResults.push({
          id: randomUUID(),
          runId,
          queryText: result.query,
          brand: null,
          position: null,
          sentiment: null,
          context: null,
          responseText: result.responseText,
          citations: result.citations,
          usedWebSearch: result.usedWebSearch
        });
      } else {
        // Query with mentions - store one row per mention
        for (const mention of result.mentions) {
          queryResults.push({
            id: randomUUID(),
            runId,
            queryText: result.query,
            brand: mention.brand,
            position: mention.position,
            sentiment: mention.sentiment,
            context: mention.context,
            responseText: result.responseText,
            citations: result.citations,
            usedWebSearch: result.usedWebSearch
          });
        }
      }
    }

    if (supabase.client) {
      const { error } = await supabase.client.from('query_results').insert(
        queryResults.map(qr => ({
          id: qr.id,
          run_id: qr.runId,
          query_text: qr.queryText,
          brand: qr.brand,
          position: qr.position,
          sentiment: qr.sentiment,
          context: qr.context,
          response_text: qr.responseText,
          citations: qr.citations || [],
          used_web_search: qr.usedWebSearch || false
        }))
      );
      if (error) throw error;
    } else {
      memStore.queryResults.push(...queryResults);
    }
  },

  async getProjectRuns(projectId: string): Promise<AnalysisRun[]> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('analysis_runs')
        .select('*')
        .eq('project_id', projectId)
        .order('run_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((item) => ({
        id: item.id,
        projectId: item.project_id,
        runAt: item.run_at,
        queriesGenerated: item.queries_generated
      }));
    }
    return memStore.analysisRuns.filter(r => r.projectId === projectId);
  },

  async getRunResults(runId: string): Promise<QueryResult[]> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('query_results')
        .select('*')
        .eq('run_id', runId);
      if (error) throw error;
      return (data ?? []).map((item) => ({
        id: item.id,
        runId: item.run_id,
        queryText: item.query_text,
        brand: item.brand,
        position: item.position,
        sentiment: item.sentiment,
        context: item.context,
        citations: item.citations || [],
        usedWebSearch: item.used_web_search || false
      }));
    }
    return memStore.queryResults.filter(qr => qr.runId === runId);
  },

  async getAllProjectResults(projectId: string): Promise<VisibilityMention[]> {
    const runs = await this.getProjectRuns(projectId);
    const allResults: VisibilityMention[] = [];

    for (const run of runs) {
      const results = await this.getRunResults(run.id);
      allResults.push(...results.map(qr => ({
        query: qr.queryText,
        brand: qr.brand ?? '',
        position: qr.position ?? 0,
        sentiment: qr.sentiment ?? 'neutral',
        context: qr.context ?? ''
      })).filter(m => m.brand !== ''));
    }

    return allResults;
  },

  async getAllProjectQueries(projectId: string): Promise<string[]> {
    const runs = await this.getProjectRuns(projectId);
    const allQueries = new Set<string>();

    for (const run of runs) {
      const results = await this.getRunResults(run.id);
      results.forEach(qr => allQueries.add(qr.queryText));
    }

    return Array.from(allQueries);
  },

  // Project Snapshot Methods
  async createSnapshot(
    projectId: string,
    runId: string,
    totalQueries: number,
    queriesWithMentions: number,
    brandMentions: number,
    brandSharePct: number,
    competitorShares: Record<string, number>
  ): Promise<ProjectSnapshot> {
    const supabase = getSupabase();
    const snapshot: ProjectSnapshot = {
      id: randomUUID(),
      projectId,
      runId,
      snapshotDate: new Date().toISOString(),
      totalQueries,
      queriesWithMentions,
      brandMentions,
      brandSharePct,
      competitorShares
    };

    if (supabase.client) {
      const { error } = await supabase.client.from('project_snapshots').insert({
        id: snapshot.id,
        project_id: snapshot.projectId,
        run_id: snapshot.runId,
        snapshot_date: snapshot.snapshotDate,
        total_queries: snapshot.totalQueries,
        queries_with_mentions: snapshot.queriesWithMentions,
        brand_mentions: snapshot.brandMentions,
        brand_share_pct: snapshot.brandSharePct,
        competitor_shares: snapshot.competitorShares
      });
      if (error) throw error;
    } else {
      memStore.projectSnapshots.push(snapshot);
    }

    return snapshot;
  },

  async getProjectSnapshots(projectId: string): Promise<ProjectSnapshot[]> {
    const supabase = getSupabase();
    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('project_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .order('snapshot_date', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((item) => ({
        id: item.id,
        projectId: item.project_id,
        runId: item.run_id,
        snapshotDate: item.snapshot_date,
        totalQueries: item.total_queries,
        queriesWithMentions: item.queries_with_mentions,
        brandMentions: item.brand_mentions,
        brandSharePct: item.brand_share_pct,
        competitorShares: item.competitor_shares ?? {}
      }));
    }
    return memStore.projectSnapshots.filter(s => s.projectId === projectId);
  },

  // Tracked Queries Methods
  async addTrackedQuery(projectId: string, query: string): Promise<BrandProject> {
    const supabase = getSupabase();
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    if (project.trackedQueries.length >= 10) {
      throw new Error('Maximum 10 queries allowed');
    }

    const trackedQueries = [...new Set([...project.trackedQueries, query])].slice(0, 10); // Max 10 tracked queries
    const updatedAt = new Date().toISOString();

    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('brand_projects')
        .update({ tracked_queries: trackedQueries, updated_at: updatedAt })
        .eq('id', projectId)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        userId: data.user_id,
        brandName: data.brand_name,
        keywords: data.keywords ?? [],
        competitors: data.competitors ?? [],
        trackedQueries: data.tracked_queries ?? [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }

    const memProject = memStore.projects.find(p => p.id === projectId);
    if (!memProject) throw new Error('Project not found');
    memProject.trackedQueries = trackedQueries;
    memProject.updatedAt = updatedAt;
    return memProject;
  },

  async removeTrackedQuery(projectId: string, query: string): Promise<BrandProject> {
    const supabase = getSupabase();
    const project = await this.getProject(projectId);
    if (!project) throw new Error('Project not found');

    if (project.trackedQueries.length <= 1) {
      throw new Error('Cannot remove last query. Projects must have at least 1 query.');
    }

    const trackedQueries = project.trackedQueries.filter(q => q !== query);
    const updatedAt = new Date().toISOString();

    if (supabase.client) {
      const { data, error } = await supabase.client
        .from('brand_projects')
        .update({ tracked_queries: trackedQueries, updated_at: updatedAt })
        .eq('id', projectId)
        .select()
        .single();
      if (error) throw error;
      return {
        id: data.id,
        userId: data.user_id,
        brandName: data.brand_name,
        keywords: data.keywords ?? [],
        competitors: data.competitors ?? [],
        trackedQueries: data.tracked_queries ?? [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }

    const memProject = memStore.projects.find(p => p.id === projectId);
    if (!memProject) throw new Error('Project not found');
    memProject.trackedQueries = trackedQueries;
    memProject.updatedAt = updatedAt;
    return memProject;
  }
};

export type Repository = typeof repository;
