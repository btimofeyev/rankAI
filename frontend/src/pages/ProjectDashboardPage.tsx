import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../hooks/useSession.tsx';
import {
  fetchProjects,
  createProject,
  fetchProject,
  runProjectAnalysis,
  updateProject,
  deleteProject,
  fetchQueryPerformance,
  untrackQuery,
  fetchQuerySuggestions,
  bulkTrackQueries,
  fetchPlan
} from '../api/index.ts';
import AppShell from '../components/AppShell.tsx';
import Button from '../components/Button.tsx';
import BulkTrackModal from '../components/BulkTrackModal.tsx';
import ShareOfVoiceDonut, { ShareDatum } from '../components/ShareOfVoiceDonut.tsx';
import { TrendLineChart } from '../components/TrendLineChart.tsx';
import MiniSparkline from '../components/MiniSparkline.tsx';
import OpportunityHighlights, { OpportunityHighlight } from '../components/OpportunityHighlights.tsx';
import { IconPlay, IconSearch } from '../components/icons.tsx';
import QueryBuilder from '../components/QueryBuilder.tsx';
import '../styles/workspace-dashboard.css';
import { PRIMARY_NAV, SUPPORT_NAV } from '../lib/navigation.tsx';

const MAX_TRACKED_QUERIES = 10;

const ProjectDashboardPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const { session, plan, setPlan, signOut } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = session?.access_token ?? null;

  const [editMode, setEditMode] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [configError, setConfigError] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '180d'>('30d');
  const [insightSearch, setInsightSearch] = useState('');

  const [newBrandName, setNewBrandName] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [newCompetitors, setNewCompetitors] = useState('');
  const [newQueries, setNewQueries] = useState<string[]>([]);
  const [createError, setCreateError] = useState('');

  const planQuery = useQuery({
    queryKey: ['plan', token ?? 'guest'],
    queryFn: () => fetchPlan(token ?? ''),
    enabled: Boolean(token)
  });

  const projectsListQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(token ?? ''),
    enabled: Boolean(token)
  });

  const projects = projectsListQuery.data?.projects ?? [];

  const createMutation = useMutation({
    mutationFn: () => createProject(token ?? '', {
      brandName: newBrandName.trim(),
      keywords: newKeywords.split(',').map((value) => value.trim()).filter(Boolean),
      competitors: newCompetitors.split(',').map((value) => value.trim()).filter(Boolean),
      queries: newQueries
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setNewBrandName('');
      setNewKeywords('');
      setNewCompetitors('');
      setNewQueries([]);
      setCreateError('');
      navigate(`/projects/${data.project.id}`);
    },
    onError: (err: Error) => {
      setCreateError(err.message || 'Failed to create project');
    }
  });

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(token ?? '', projectId ?? ''),
    enabled: Boolean(token && projectId)
  });

  const performanceQuery = useQuery({
    queryKey: ['query-performance', projectId],
    queryFn: () => fetchQueryPerformance(token ?? '', projectId ?? ''),
    enabled: Boolean(token && projectId)
  });

  const suggestionsQuery = useQuery({
    queryKey: ['query-suggestions', projectId],
    queryFn: () => fetchQuerySuggestions(token ?? '', projectId ?? ''),
    enabled: Boolean(token && projectId && editMode),
    staleTime: 5 * 60 * 1000
  });

  const runAnalysisMutation = useMutation({
    mutationFn: () => runProjectAnalysis(token ?? '', projectId ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['query-performance', projectId] });
      setAnalysisError('');
    },
    onError: (err: Error) => {
      setAnalysisError(err.message || 'Failed to run analysis');
    }
  });

  const untrackMutation = useMutation({
    mutationFn: (query: string) => untrackQuery(token ?? '', projectId ?? '', query),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['query-performance', projectId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: () => updateProject(token ?? '', projectId ?? '', {
      keywords: keywords.split(',').map((value) => value.trim()).filter(Boolean),
      competitors: competitors.split(',').map((value) => value.trim()).filter(Boolean)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setEditMode(false);
      setConfigError('');
    },
    onError: (err: Error) => {
      setConfigError(err.message || 'Failed to update project');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(token ?? '', projectId ?? ''),
    onSuccess: () => {
      navigate('/dashboard');
    }
  });

  const bulkTrackMutation = useMutation({
    mutationFn: (queries: string[]) => bulkTrackQueries(token ?? '', projectId ?? '', queries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['query-performance', projectId] });
      setShowSuggestionsModal(false);
    }
  });

  const project = projectQuery.data?.project ?? null;
  const runs = projectQuery.data?.runs ?? [];
  const snapshots = projectQuery.data?.snapshots ?? [];
  const totalQueries = projectQuery.data?.totalQueries ?? 0;

  useEffect(() => {
    if (planQuery.data?.tier && planQuery.data.tier !== plan) {
      setPlan(planQuery.data.tier);
    }
  }, [planQuery.data?.tier, plan, setPlan]);

  useEffect(() => {
    if (projectsListQuery.isLoading) return;
    if (!projectId && projects.length > 0) {
      navigate(`/projects/${projects[0].id}`, { replace: true });
    }
  }, [projectsListQuery.isLoading, projects, projectId, navigate]);

  const trackedCount = project?.trackedQueries.length ?? 0;
  const lastRunAt = runs[0]?.runAt ?? null;

  const handleCreateSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!newBrandName.trim()) {
      setCreateError('Brand name is required');
      return;
    }
    if (newQueries.length === 0) {
      setCreateError('Add at least one query to track');
      return;
    }
    if (newQueries.length > 20) {
      setCreateError('Maximum 20 queries allowed');
      return;
    }
    setCreateError('');
    createMutation.mutate();
  };

  const dashboardData = useMemo(() => {
    if (!performanceQuery.data?.performance || performanceQuery.data.performance.length === 0 || !project) {
      return null;
    }

    const performance = performanceQuery.data.performance;
    const brandName = project.brandName;
    const allCompetitors = project.competitors;

    const brandMentions = performance.reduce((sum, p) => sum + p.totalAppearances, 0);
    const competitorMentions: Record<string, number> = {};

    performance.forEach((p) => {
      Object.entries(p.competitorData ?? {}).forEach(([comp, data]) => {
        competitorMentions[comp] = (competitorMentions[comp] ?? 0) + (data?.appearances ?? 0);
      });
    });

    const totalMentions = brandMentions + Object.values(competitorMentions).reduce((sum, val) => sum + val, 0);

    const shareOfVoice = [
      {
        brand: brandName,
        percentage: totalMentions > 0 ? (brandMentions / totalMentions) * 100 : 0,
        mentions: brandMentions,
        isYourBrand: true
      },
      ...Object.entries(competitorMentions).map(([comp, mentions]) => ({
        brand: comp,
        percentage: totalMentions > 0 ? (mentions / totalMentions) * 100 : 0,
        mentions,
        isYourBrand: false
      }))
    ];

    const queriesWithBrandMentions = performance.filter((p) => p.brandAppearances > 0).length;
    const totalTrackedQueries = performance.length;
    const appearanceRate = totalTrackedQueries > 0 ? (queriesWithBrandMentions / totalTrackedQueries) * 100 : 0;

    const positions = performance.filter((p) => p.avgPosition > 0);
    const avgPosition = positions.length > 0
      ? positions.reduce((sum, p) => sum + p.avgPosition, 0) / positions.length
      : null;

    const sentiment = {
      positive: performance.reduce((sum, p) => sum + p.sentiment.positive, 0),
      neutral: performance.reduce((sum, p) => sum + p.sentiment.neutral, 0),
      negative: performance.reduce((sum, p) => sum + p.sentiment.negative, 0)
    };

    const topCompetitor = shareOfVoice
      .filter((s) => !s.isYourBrand)
      .sort((a, b) => b.percentage - a.percentage)[0];

    const currentRun = {
      queriesMentioned: queriesWithBrandMentions,
      totalQueries: totalTrackedQueries,
      appearanceRate,
      avgPosition,
      sentiment
    };

    const competitorMetrics = [
      {
        name: brandName,
        isYourBrand: true,
        appearanceRate,
        avgPosition,
        trendData: [],
        dominatedQueries: performance.filter((p) => p.avgPosition === 1).length
      },
      ...allCompetitors.map((comp) => {
        const compData = performance.map((p) => p.competitorData?.[comp]).filter(Boolean);
        const compAppearances = compData.filter((d) => d && d.appearances > 0).length;
        const compAppearanceRate = totalTrackedQueries > 0 ? (compAppearances / totalTrackedQueries) * 100 : 0;
        const compPositions = compData.filter((d) => d && d.avgPosition > 0);
        const compAvgPosition = compPositions.length > 0
          ? compPositions.reduce((sum, d) => sum + ((d?.avgPosition) ?? 0), 0) / compPositions.length
          : null;
        const dominatedQueries = performance.filter((p) => {
          const compPos = p.competitorData?.[comp]?.avgPosition ?? null;
          if (!compPos) return false;
          const yourPos = p.avgPosition ?? null;
          if (!yourPos) return compPos === 1;
          return compPos < yourPos;
        }).length;

        return {
          name: comp,
          isYourBrand: false,
          appearanceRate: compAppearanceRate,
          avgPosition: compAvgPosition,
          trendData: [],
          dominatedQueries
        };
      })
    ];

    const compactQueryData = performance.map((p) => {
      let topComp: string | null = null;
      let topCompPos = Infinity;
      Object.entries(p.competitorData ?? {}).forEach(([comp, data]) => {
        if (data?.avgPosition && data.avgPosition < topCompPos) {
          topComp = comp;
          topCompPos = data.avgPosition;
        }
      });

      return {
        query: p.query,
        yourStatus: {
          appeared: p.brandAppearances > 0,
          position: p.avgPosition,
          sentiment: p.sentiment.positive > 0
            ? 'positive'
            : p.sentiment.negative > 0
              ? 'negative'
              : 'neutral',
          appearanceRate: p.appearanceRate
        },
        topCompetitor: {
          name: topComp,
          position: topComp ? topCompPos : null
        },
        trend: p.trendData ?? [],
        isTracked: p.isTracked
      };
    });

    return {
      shareOfVoice,
      currentRun,
      topCompetitor,
      competitorMetrics,
      compactQueryData
    };
  }, [performanceQuery.data, project]);

  const shareSparkline = useMemo(() => {
    if (!snapshots || snapshots.length === 0) return [];
    return snapshots
      .slice(0, 10)
      .reverse()
      .map((snapshot) => snapshot.brandSharePct ?? 0);
  }, [snapshots]);

  const shareOfVoiceDonutData: ShareDatum[] = useMemo(() => {
    if (!dashboardData) return [];
    return dashboardData.shareOfVoice.map((entry) => ({
      name: entry.brand,
      value: Number(entry.percentage.toFixed(1))
    }));
  }, [dashboardData]);

  const summaryCards = useMemo(() => {
    if (!dashboardData) return [];

    const yourShare = dashboardData.shareOfVoice.find((entry) => entry.isYourBrand);
    const competitor = dashboardData.topCompetitor;
    const totalMentioned = `${dashboardData.currentRun.queriesMentioned}/${dashboardData.currentRun.totalQueries}`;
    const avgPosition = dashboardData.currentRun.avgPosition !== null
      ? `#${dashboardData.currentRun.avgPosition.toFixed(1)}`
      : '—';

    return [
      {
        label: 'Share of voice',
        value: yourShare ? `${yourShare.percentage.toFixed(0)}%` : '—',
        helper: competitor
          ? `Leader: ${competitor.brand} ${competitor.percentage.toFixed(0)}%`
          : 'You hold the lead',
        trend: shareSparkline
      },
      {
        label: 'Appearance rate',
        value: `${Math.round(dashboardData.currentRun.appearanceRate)}%`,
        helper: `${totalMentioned} prompts mention you`
      },
      {
        label: 'Average position',
        value: avgPosition,
        helper: 'Across answered prompts'
      },
      {
        label: 'Tracked prompts',
        value: `${trackedCount}/${MAX_TRACKED_QUERIES}`,
        helper: `${totalQueries} generated overall`
      }
    ];
  }, [dashboardData, shareSparkline, trackedCount, totalQueries]);

  const rawOpportunities = useMemo((): OpportunityHighlight[] => {
    if (!dashboardData) return [];

    const ranked = dashboardData.compactQueryData
      .map((entry) => {
        const isMissing = !entry.yourStatus.appeared;
        const lowPresence = entry.yourStatus.appearanceRate < 35;
        if (!isMissing && !lowPresence) {
          return null;
        }

        const competitor = entry.topCompetitor.name ?? 'Unknown';
        const competitorPosition = entry.topCompetitor.position ?? null;
        const severity: OpportunityHighlight['severity'] = isMissing ? 'critical' : 'warning';
        const recommendation = isMissing
          ? 'No visibility yet. Publish an answer and seed placement.'
          : 'Low visibility. Refresh positioning to regain mention.';

        const score =
          (isMissing ? 200 : 100) +
          (100 - entry.yourStatus.appearanceRate) +
          (competitorPosition ? (10 - Math.min(competitorPosition, 10)) * 4 : 0);

        return {
          query: entry.query,
          competitor,
          competitorPosition,
          appearanceRate: entry.yourStatus.appearanceRate,
          severity,
          recommendation,
          score
        };
      })
      .filter((item): item is OpportunityHighlight & { score: number } => item !== null)
      .sort((a, b) => (b.score - a.score))
      .slice(0, 4)
      .map(({ score: _score, ...rest }) => rest);

    return ranked;
  }, [dashboardData]);

  const filteredOpportunities = useMemo(() => {
    if (!insightSearch) return rawOpportunities;
    const needle = insightSearch.toLowerCase();
    return rawOpportunities.filter((item) => (
      item.query.toLowerCase().includes(needle) ||
      item.competitor.toLowerCase().includes(needle)
    ));
  }, [rawOpportunities, insightSearch]);

  const compactQueries = useMemo(() => {
    if (!dashboardData) return [];
    if (!insightSearch) return dashboardData.compactQueryData;
    const needle = insightSearch.toLowerCase();
    return dashboardData.compactQueryData.filter((entry) => entry.query.toLowerCase().includes(needle));
  }, [dashboardData, insightSearch]);

  const openConfigPanel = useCallback(() => {
    if (!project) return;
    setKeywords(project.keywords.join(', '));
    setCompetitors(project.competitors.join(', '));
    setConfigError('');
    setEditMode(true);
  }, [project]);

  useEffect(() => {
    const state = location.state as { openConfig?: boolean } | null;
    if (!state?.openConfig || !project) return;
    openConfigPanel();
    navigate(location.pathname, { replace: true });
  }, [location.state, project, openConfigPanel, navigate, location.pathname]);

  const handleEdit = () => {
    openConfigPanel();
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setConfigError('');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const userFullName = session?.user?.user_metadata?.full_name as string | undefined;
  const userDisplayName = userFullName && userFullName.trim().length > 0
    ? userFullName.trim()
    : session?.user?.email?.split('@')[0] ?? 'Your workspace';
  const userEmail = session?.user?.email ?? undefined;
  const isLoading = projectQuery.isLoading || performanceQuery.isLoading;
  const lastRunLabel = lastRunAt ? new Date(lastRunAt).toLocaleString() : 'Not yet run';
  const rangeLabel = dateRange === '30d' ? 'Last 30 days' : dateRange === '90d' ? 'Last 90 days' : 'Last 180 days';
  const planTier = planQuery.data?.tier ?? plan;

  const shareDelta = shareSparkline.length > 1
    ? shareSparkline[shareSparkline.length - 1] - shareSparkline[shareSparkline.length - 2]
    : null;
  const shareDeltaLabel = shareDelta !== null
    ? `${shareDelta >= 0 ? '+' : ''}${shareDelta.toFixed(1)} pts vs prior run`
    : 'Need another run to compare';
  const recentRuns = runs.slice(0, 3);

  const activeProjectId = projectId ?? (projects.length > 0 ? projects[0].id : '');
  const hasProjects = projects.length > 0;

  const planErrorMessage = planQuery.isError
    ? (planQuery.error instanceof Error ? planQuery.error.message : 'Unable to load plan details')
    : null;
  const projectErrorMessage = projectQuery.isError
    ? (projectQuery.error instanceof Error ? projectQuery.error.message : 'Unable to load workspace')
    : null;
  const performanceErrorMessage = performanceQuery.isError
    ? (performanceQuery.error instanceof Error ? performanceQuery.error.message : 'Unable to load performance insights')
    : null;

  const workspaceAlerts = [planErrorMessage, projectErrorMessage, performanceErrorMessage]
    .filter(Boolean) as string[];

  const competitorPreview = dashboardData
    ? dashboardData.competitorMetrics.slice(0, 4)
    : [];

  const heroMeta = [
    { label: 'Runs', value: String(runs.length) },
    { label: 'Last sync', value: lastRunLabel },
    { label: 'Tracked prompts', value: `${trackedCount}/${MAX_TRACKED_QUERIES}` },
    { label: 'Total queries', value: String(totalQueries) }
  ];

  const shareCoverage = dashboardData
    ? `${dashboardData.currentRun.queriesMentioned}/${dashboardData.currentRun.totalQueries}`
    : '—';

  const competitorRivals = competitorPreview
    .filter((entry) => !entry.isYourBrand)
    .map((entry) => ({
      ...entry,
      percentage: entry.appearanceRate ?? 0,
      avgPosition: entry.avgPosition ?? null
    }))
    .slice(0, 2);

  const shareHighlights = dashboardData ? [
    {
      label: 'Coverage',
      value: shareCoverage,
      helper: 'Prompts mentioning you'
    },
    {
      label: 'Lead competitor',
      value: dashboardData.topCompetitor
        ? dashboardData.topCompetitor.brand
        : 'You lead',
      helper: dashboardData.topCompetitor
        ? `${Math.round(dashboardData.topCompetitor.percentage ?? 0)}% share`
        : 'Maintain momentum'
    },
    {
      label: 'Positive sentiment',
      value: String(dashboardData.currentRun.sentiment.positive),
      helper: 'High-quality mentions'
    }
  ] : [];

  const primaryMetrics = summaryCards.slice(0, 3);
  const displayedOpportunities = filteredOpportunities.slice(0, 2);
  const queryHighlights = dashboardData ? compactQueries.slice(0, 3) : [];

  if (!projectsListQuery.isLoading && projects.length === 0) {
    return (
      <AppShell
        planTier={planTier}
        navItems={PRIMARY_NAV}
        secondaryNavItems={SUPPORT_NAV}
        user={{ name: userDisplayName, email: userEmail }}
        onSignOut={handleSignOut}
        footerNote="Project visibility inside AI search."
      >
        <div className="workspace-dashboard workspace-dashboard--empty">
          <section className="workspace-empty">
            <div className="workspace-empty__card">
              <header className="workspace-empty__header">
                <span className="workspace-empty__eyebrow">Workspace setup</span>
                <h1>Launch your first project</h1>
                <p>
                  Create a workspace for each brand you monitor. Add prompts to track, define competitors,
                  and unlock AI search telemetry.
                </p>
              </header>
              <form className="workspace-create" onSubmit={handleCreateSubmit}>
                <div className="workspace-create__grid">
                  <label className="field">
                    Brand name
                    <input
                      value={newBrandName}
                      onChange={(event) => setNewBrandName(event.target.value)}
                      placeholder="e.g., Linear"
                      className="field__input"
                      required
                    />
                  </label>
                  <label className="field">
                    Keywords (comma separated)
                    <input
                      value={newKeywords}
                      onChange={(event) => setNewKeywords(event.target.value)}
                      placeholder="task management, developer tool"
                      className="field__input"
                    />
                  </label>
                  <label className="field">
                    Competitors (comma separated)
                    <input
                      value={newCompetitors}
                      onChange={(event) => setNewCompetitors(event.target.value)}
                      placeholder="Jira, Asana"
                      className="field__input"
                    />
                  </label>
                </div>
                <div className="workspace-create__queries">
                  <div className="workspace-create__queries-head">
                    <span className="workspace-pill">Tracked prompts</span>
                    <span className="workspace-create__hint">Up to 20 queries</span>
                  </div>
                  <p className="workspace-create__description">
                    Add the exact prompts you want RankAI to monitor across AI-generated answers.
                  </p>
                  <QueryBuilder queries={newQueries} onQueriesChange={setNewQueries} maxQueries={20} />
                </div>
                {createError && <span className="form-error">{createError}</span>}
                <div className="workspace-create__actions">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating…' : 'Create workspace'}
                  </Button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  if (projectQuery.isLoading) {
    return (
      <AppShell
        planTier={planTier}
        navItems={PRIMARY_NAV}
        secondaryNavItems={SUPPORT_NAV}
        user={{ name: userDisplayName, email: userEmail }}
        onSignOut={handleSignOut}
        footerNote="Project visibility inside AI search."
      >
        <div className="workspace-dashboard workspace-dashboard--loading">
          <div className="workspace-empty workspace-empty--muted">
            Loading workspace…
          </div>
        </div>
      </AppShell>
    );
  }

  if (!project) {
    return (
      <AppShell
        planTier={planTier}
        navItems={PRIMARY_NAV}
        secondaryNavItems={SUPPORT_NAV}
        user={{ name: userDisplayName, email: userEmail }}
        onSignOut={handleSignOut}
        footerNote="Project visibility inside AI search."
      >
        <div className="workspace-dashboard workspace-dashboard--empty">
          <div className="workspace-empty workspace-empty--error">
            <p>We couldn’t find that workspace.</p>
            <Button type="button" onClick={() => navigate('/dashboard')}>
              Back to workspaces
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const keywordDisplay = project.keywords.slice(0, 5);
  const keywordOverflow = Math.max(project.keywords.length - keywordDisplay.length, 0);

  return (
    <AppShell
      planTier={planTier}
      navItems={PRIMARY_NAV}
      secondaryNavItems={SUPPORT_NAV}
      user={{ name: userDisplayName, email: userEmail }}
      onSignOut={handleSignOut}
      footerNote="Project visibility inside AI search."
    >
      <div className="workspace-frame" data-loading={isLoading}>
        <header className="workspace-hero">
          <div className="workspace-hero__column workspace-hero__column--primary">
            <div className="workspace-hero__tags">
              <span className="workspace-pill workspace-pill--accent">Workspace</span>
              <span className="workspace-pill">{planTier === 'pro' ? 'Pro plan' : 'Free plan'}</span>
            </div>
            <h1 className="workspace-hero__title">{project.brandName}</h1>
            <p className="workspace-hero__subtitle">
              Monitor how {project.brandName} appears inside AI-generated answers, keep tabs on rivals, and direct your next content push.
            </p>
            <dl className="workspace-hero__meta">
              {heroMeta.map((meta) => (
                <div key={`${meta.label}-${meta.value}`}>
                  <dt>{meta.label}</dt>
                  <dd>{meta.value}</dd>
                </div>
              ))}
            </dl>
            <div className="workspace-hero__keywords" aria-label="Tracked keywords">
              {keywordDisplay.length > 0 ? (
                <>
                  {keywordDisplay.map((keyword) => (
                    <span key={keyword} className="workspace-keyword">{keyword}</span>
                  ))}
                  {keywordOverflow > 0 && (
                    <span className="workspace-keyword workspace-keyword--muted">+{keywordOverflow}</span>
                  )}
                </>
              ) : (
                <span className="workspace-hero__keywords-empty">No keywords configured yet — add some to refine monitoring.</span>
              )}
            </div>
          </div>
          <div className="workspace-hero__column workspace-hero__column--supporting">
            <div className="workspace-hero__control">
              <label htmlFor="workspace-switcher">Workspace</label>
              <select
                id="workspace-switcher"
                value={activeProjectId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  if (nextId && nextId !== activeProjectId) {
                    navigate(`/projects/${nextId}`);
                  }
                }}
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.brandName}</option>
                ))}
              </select>
            </div>
            <div className="workspace-hero__control">
              <label htmlFor="workspace-filter">Filter insights</label>
              <div className="workspace-search">
                <IconSearch size={16} />
                <input
                  id="workspace-filter"
                  type="search"
                  value={insightSearch}
                  onChange={(event) => setInsightSearch(event.target.value)}
                  placeholder="Search queries or competitors"
                />
              </div>
            </div>
            <div className="workspace-hero__actions">
              <div className="workspace-hero__range">
                <label htmlFor="workspace-range-select">Range</label>
                <select
                  id="workspace-range-select"
                  value={dateRange}
                  onChange={(event) => setDateRange(event.target.value as typeof dateRange)}
                >
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                  <option value="180d">180 days</option>
                </select>
              </div>
              <Button
                type="button"
                onClick={() => {
                  if (!project || trackedCount === 0) return;
                  runAnalysisMutation.mutate();
                }}
                disabled={runAnalysisMutation.isPending || trackedCount === 0}
              >
                <IconPlay size={16} />
                {runAnalysisMutation.isPending ? 'Running…' : 'Run analysis'}
              </Button>
              <Button type="button" variant="ghost" onClick={handleEdit}>
                Manage inputs
              </Button>
              <Button
                type="button"
                variant="quiet"
                onClick={() => navigate(`/projects/${projectId ?? ''}/queries`)}
                disabled={runs.length === 0}
              >
                Query explorer
              </Button>
            </div>
            <div className="workspace-hero__pulse">
              <span className="workspace-hero__pulse-label">Momentum delta</span>
              <strong className="workspace-hero__pulse-value">{shareDeltaLabel}</strong>
              {shareSparkline.length > 1 ? (
                <MiniSparkline data={shareSparkline} width={160} height={46} color="var(--iris-500)" strokeWidth={2.5} />
              ) : (
                <span className="workspace-hero__pulse-hint">Need another run</span>
              )}
            </div>
          </div>
        </header>

        {(analysisError || workspaceAlerts.length > 0) && (
          <div className="workspace-alerts workspace-alerts--inline">
            {analysisError && (
              <div className="workspace-alert workspace-alert--error">{analysisError}</div>
            )}
            {workspaceAlerts.map((alert) => (
              <div key={alert} className="workspace-alert workspace-alert--info">{alert}</div>
            ))}
          </div>
        )}

        <section className="workspace-metrics">
          {primaryMetrics.length > 0 ? (
            primaryMetrics.map((card) => (
              <article key={card.label} className="workspace-metric">
                <span className="workspace-metric__label">{card.label}</span>
                <span className="workspace-metric__value">
                  {card.value}
                  {card.trend && card.trend.length > 1 && (
                    <span className="workspace-metric__spark">
                      <MiniSparkline data={card.trend} width={70} height={22} color="var(--iris-500)" />
                    </span>
                  )}
                </span>
                <span className="workspace-metric__meta">{card.helper}</span>
              </article>
            ))
          ) : (
            <article className="workspace-metric workspace-metric--empty">
              <span className="workspace-metric__label">No data yet</span>
              <span className="workspace-metric__meta">Run an analysis to populate metrics.</span>
            </article>
          )}
        </section>

        <div className="workspace-board">
          <article className="workspace-panel workspace-panel--trend">
            <header className="workspace-panel__header">
              <div>
                <span className="workspace-panel__eyebrow">Visibility arc</span>
                <h2>Momentum</h2>
              </div>
              <span className="workspace-panel__caption">{rangeLabel}</span>
            </header>
            <div className="workspace-panel__body workspace-panel__body--chart">
              {snapshots.length > 0 ? (
                <TrendLineChart
                  snapshots={snapshots}
                  brandName={project.brandName}
                  competitors={project.competitors}
                />
              ) : (
                <div className="workspace-panel__empty">Run an analysis to populate the trend.</div>
              )}
            </div>
          </article>

          <article className="workspace-panel workspace-panel--share">
            <header className="workspace-panel__header">
              <div>
                <span className="workspace-panel__eyebrow">Conversation share</span>
                <h2>Voice distribution</h2>
              </div>
              <span className="workspace-panel__caption">{shareDeltaLabel}</span>
            </header>
            <div className="workspace-panel__body workspace-panel__body--split">
              {dashboardData ? (
                <>
                  <ShareOfVoiceDonut data={shareOfVoiceDonutData} focusBrand={project.brandName} />
                  <div className="workspace-panel__insights">
                    {shareHighlights.map((item) => (
                      <div key={item.label} className="workspace-panel__insight">
                        <span className="workspace-panel__insight-label">{item.label}</span>
                        <span className="workspace-panel__insight-value">{item.value}</span>
                        <span className="workspace-panel__insight-meta">{item.helper}</span>
                      </div>
                    ))}
                    {competitorRivals.length > 0 && (
                      <div className="workspace-rivals">
                        <span className="workspace-rivals__label">Top rivals</span>
                        <ul className="workspace-rivals__list">
                          {competitorRivals.map((rival) => (
                            <li key={rival.name}>
                              <span className="workspace-rivals__name">{rival.name}</span>
                              <span className="workspace-rivals__share">{Math.round(rival.percentage ?? 0)}% share</span>
                              <span className="workspace-rivals__detail">#{rival.avgPosition ?? '—'} avg position</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="workspace-panel__empty">Run an analysis to compare share of voice.</div>
              )}
            </div>
          </article>

          <article className="workspace-panel workspace-panel--focus">
            <header className="workspace-panel__header">
              <div>
                <span className="workspace-panel__eyebrow">Execution radar</span>
                <h2>Next moves</h2>
              </div>
            </header>
            <div className="workspace-panel__body workspace-panel__body--column">
              <div className="workspace-focus__block">
                <h3 className="workspace-focus__title">Opportunities</h3>
                <OpportunityHighlights items={displayedOpportunities} />
              </div>
              <div className="workspace-focus__block">
                <h3 className="workspace-focus__title">Priority prompts</h3>
                {queryHighlights.length > 0 ? (
                  <ul className="workspace-focus__list">
                    {queryHighlights.map((item) => (
                      <li key={item.query}>
                        <div className="workspace-focus__query">{item.query}</div>
                        <div className="workspace-focus__meta">
                          {item.yourStatus.appeared ? `#${item.yourStatus.position ?? '—'}` : 'Absent'} · {Math.round(item.yourStatus.appearanceRate)}% appearance
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="workspace-panel__empty workspace-panel__empty--inline">Run an analysis to see prompt insights.</div>
                )}
              </div>
              <div className="workspace-focus__footer">
                <div className="workspace-focus__runs">
                  <span className="workspace-focus__title">Recent runs</span>
                  {recentRuns.length > 0 ? (
                    <ul className="workspace-focus__runs-list">
                      {recentRuns.map((run) => (
                        <li key={run.id}>
                          <span>{new Date(run.runAt).toLocaleString()}</span>
                          <span>{run.queriesGenerated} prompts</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="workspace-panel__empty workspace-panel__empty--inline">No runs yet.</div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete workspace'}
                </Button>
              </div>
            </div>
          </article>
        </div>
      </div>

      {editMode && (
        <div className="workspace-config-layer" role="dialog" aria-modal="true">
          <div className="workspace-config">
            <header className="workspace-config__header">
              <div>
                <h2>Workspace settings</h2>
                <p>Tune tracked prompts, keywords, and competitors for {project.brandName}.</p>
              </div>
              <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                Close
              </Button>
            </header>
            <form
              className="workspace-config__body"
              onSubmit={(event) => {
                event.preventDefault();
                updateMutation.mutate();
              }}
            >
              <div className="workspace-config__fields">
                <label className="field workspace-config__field">
                  Keywords
                  <input
                    value={keywords}
                    onChange={(event) => setKeywords(event.target.value)}
                    className="field__input"
                  />
                </label>
                <label className="field workspace-config__field">
                  Competitors
                  <input
                    value={competitors}
                    onChange={(event) => setCompetitors(event.target.value)}
                    className="field__input"
                  />
                </label>
              </div>

              <div className="workspace-config__tracked">
                <div className="workspace-config__tracked-head">
                  <h3>Tracked prompts <span>{project.trackedQueries.length}/{MAX_TRACKED_QUERIES}</span></h3>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowSuggestionsModal(true)}
                    disabled={project.trackedQueries.length >= MAX_TRACKED_QUERIES}
                  >
                    Suggest prompts
                  </Button>
                </div>
                {project.trackedQueries.length > 0 ? (
                  <ul className="workspace-config__tracked-list">
                    {project.trackedQueries.map((query) => (
                      <li key={query}>
                        <span>{query}</span>
                        <button type="button" onClick={() => untrackMutation.mutate(query)}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="workspace-config__tracked-empty">
                    No prompts tracked yet. Add a query above to start monitoring.
                  </div>
                )}
              </div>

              {configError && <div className="form-error">{configError}</div>}

              <div className="workspace-config__actions">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuggestionsModal && suggestionsQuery.data && (
        <BulkTrackModal
          suggestions={suggestionsQuery.data.suggestions}
          trackedCount={project.trackedQueries.length}
          onTrack={(queries) => bulkTrackMutation.mutate(queries)}
          onClose={() => setShowSuggestionsModal(false)}
        />
      )}
    </AppShell>
  );
};

export default ProjectDashboardPage;
