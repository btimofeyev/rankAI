import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AppShell from '../components/AppShell.tsx';
import Button from '../components/Button.tsx';
import Card from '../components/Card.tsx';
import DashboardGrid from '../components/DashboardGrid.tsx';
import TopActionBar from '../components/TopActionBar.tsx';
import { fetchPlan, fetchProjects } from '../api/index.ts';
import { useSession } from '../hooks/useSession.tsx';
import { PRIMARY_NAV, SUPPORT_NAV } from '../lib/navigation.tsx';
import type { Project } from '../types/api.ts';

type ProjectCard = {
  id: string;
  brandName: string;
  trackedCount: number;
  trackedLabel: string;
  competitorsLabel: string;
  keywordChips: string[];
  hasMoreKeywords: boolean;
  updatedLabel: string;
};

const formatTimestampLabel = (value: string | undefined) => {
  if (!value) return 'Updated recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Updated recently';
  return `Updated ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
};

const sortProjects = (projects: Project[]): Project[] => {
  return [...projects].sort((a, b) => {
    const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
    const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
    const safeATime = Number.isFinite(aTime) ? aTime : 0;
    const safeBTime = Number.isFinite(bTime) ? bTime : 0;
    return safeBTime - safeATime;
  });
};

const DashboardPage = () => {
  const { session, plan, setPlan, signOut } = useSession();
  const navigate = useNavigate();
  const token = session?.access_token ?? null;

  const planQuery = useQuery({
    queryKey: ['plan', token ?? 'guest'],
    queryFn: () => fetchPlan(token ?? ''),
    enabled: Boolean(token)
  });

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(token ?? ''),
    enabled: Boolean(token)
  });

  useEffect(() => {
    if (planQuery.data?.tier && planQuery.data.tier !== plan) {
      setPlan(planQuery.data.tier);
    }
  }, [planQuery.data?.tier, plan, setPlan]);

  const planTier = planQuery.data?.tier ?? plan;
  const projects = projectsQuery.data?.projects ?? [];
  const sortedProjects = useMemo(() => sortProjects(projects), [projects]);

  const projectCards: ProjectCard[] = useMemo(() => {
    return sortedProjects.map((project) => {
      const trackedCount = project.trackedQueries.length;
      const trackedLabel = `${trackedCount} prompt${trackedCount === 1 ? '' : 's'}`;
      const competitorCount = project.competitors.length;
      const competitorsLabel = competitorCount === 0
        ? 'No competitors yet'
        : `${competitorCount} competitor${competitorCount === 1 ? '' : 's'}`;
      const keywordChips = project.keywords.slice(0, 3);
      return {
        id: project.id,
        brandName: project.brandName,
        trackedCount,
        trackedLabel,
        competitorsLabel,
        keywordChips,
        hasMoreKeywords: project.keywords.length > keywordChips.length,
        updatedLabel: formatTimestampLabel(project.updatedAt ?? project.createdAt)
      };
    });
  }, [sortedProjects]);

  const loading = planQuery.isLoading || projectsQuery.isLoading;

  const planErrorMessage = planQuery.isError
    ? (planQuery.error instanceof Error ? planQuery.error.message : 'Unable to load plan details')
    : null;
  const projectsErrorMessage = projectsQuery.isError
    ? (projectsQuery.error instanceof Error ? projectsQuery.error.message : 'Unable to load projects')
    : null;

  const alerts = [planErrorMessage, projectsErrorMessage].filter(Boolean) as string[];

  const userEmail = session?.user?.email ?? undefined;
  const userFullName = session?.user?.user_metadata?.full_name as string | undefined;
  const displayName = userFullName && userFullName.trim().length > 0
    ? userFullName.trim()
    : userEmail?.split('@')[0] ?? 'RankAI Operator';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleManageProjects = () => {
    navigate('/projects');
  };

  const handleQuickLaunch = () => {
    if (projectCards.length === 0) return;
    handleOpenProject(projectCards[0].id);
  };

  const showQuickLaunch = projectCards.length > 0;

  return (
    <AppShell
      planTier={planTier}
      navItems={PRIMARY_NAV}
      secondaryNavItems={SUPPORT_NAV}
      user={{ name: displayName, email: userEmail }}
      onSignOut={handleSignOut}
      footerNote="Choose a workspace to explore your AI search coverage."
    >
      <div className="project-hub" data-loading={loading}>
        <header className="project-hub__header">
          <div className="project-hub__intro">
            <span className="project-hub__eyebrow">Projects</span>
            <h1 className="project-hub__title">
              {projectCards.length > 0 ? 'Open a workspace' : 'Create your first workspace'}
            </h1>
            <p className="project-hub__subtitle">
              Pick a project to check sentiment, share of voice, and momentum insights for your brand.
            </p>
          </div>
          <div className="project-hub__actions">
            {showQuickLaunch && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleQuickLaunch}
              >
                Quick launch latest
              </Button>
            )}
            <Button type="button" onClick={handleManageProjects}>
              Manage projects
            </Button>
          </div>
        </header>

        {alerts.length > 0 && (
          <div className="project-hub__alerts">
            {alerts.map((alert) => (
              <div key={alert} className="modern-alert">
                {alert}
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <Card variant="ghost" className="project-hub__loading">
            <div className="project-hub__loading-content">
              <div className="project-hub__loading-spinner" />
              <span>Loading your projects…</span>
            </div>
          </Card>
        ) : projectCards.length === 0 ? (
          <Card variant="ghost" className="project-hub__empty">
            <div className="project-hub__empty-content">
              <div className="project-hub__empty-icon">🚀</div>
              <h3 className="project-hub__empty-title">No projects yet</h3>
              <p className="project-hub__empty-description">
                Create your first workspace to start tracking brand visibility in AI search results.
              </p>
              <Button type="button" onClick={handleManageProjects}>
                Create first project
              </Button>
            </div>
          </Card>
        ) : (
          <DashboardGrid columns={2} gap="md" className="project-hub__grid">
            {projectCards.map((project) => (
              <Card
                key={project.id}
                hoverable
                className="project-card"
                header={
                  <div className="project-card__header">
                    <div className="project-card__header-content">
                      <span className="project-card__badge">Workspace</span>
                      <h3 className="project-card__title">{project.brandName}</h3>
                    </div>
                    <span className="project-card__timestamp">{project.updatedLabel}</span>
                  </div>
                }
                content={
                  <div className="project-card__content">
                    <div className="project-card__metrics">
                      <div className="project-card__metric">
                        <span className="project-card__metric-value">{project.trackedLabel}</span>
                        <span className="project-card__metric-label">Tracked prompts</span>
                      </div>
                      <div className="project-card__metric">
                        <span className="project-card__metric-value">{project.competitorsLabel}</span>
                        <span className="project-card__metric-label">Competitors</span>
                      </div>
                    </div>

                    <div className="project-card__keywords" aria-label="Tracked keywords">
                      {project.keywordChips.length > 0 ? (
                        <div className="project-card__keyword-list">
                          {project.keywordChips.map((keyword) => (
                            <span key={keyword} className="project-card__keyword">{keyword}</span>
                          ))}
                          {project.hasMoreKeywords && (
                            <span className="project-card__keyword project-card__keyword--muted">+{project.keywordChips.length > 5 ? project.keywordChips.length - 5 : 0} more</span>
                          )}
                        </div>
                      ) : (
                        <span className="project-card__keywords-empty">No keywords configured</span>
                      )}
                    </div>
                  </div>
                }
                actions={[
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenProject(project.id)}
                  >
                    View dashboard
                  </Button>,
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={handleManageProjects}
                  >
                    Manage
                  </Button>
                ]}
              />
            ))}
          </DashboardGrid>
        )}
      </div>
    </AppShell>
  );
};

export default DashboardPage;
