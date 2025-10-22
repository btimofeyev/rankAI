import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, AnalysisRun, ProjectSnapshot } from '../types/api.ts'
import Button from './Button.tsx'

type ProjectWithTelemetry = Project & {
  runs?: AnalysisRun[]
  snapshots?: ProjectSnapshot[]
}

type DashboardProjectsPreviewProps = {
  projects: ProjectWithTelemetry[]
  loading: boolean
  onCreateProject: () => void
}

const emptyState = (
  <div className="dashboard-projects-empty">
    <p>No projects yet. Create your first workspace to unlock AI telemetry.</p>
  </div>
)

const DashboardProjectsPreview = ({ projects, loading, onCreateProject }: DashboardProjectsPreviewProps) => {
  const navigate = useNavigate()

  const topProjects = useMemo(() => {
    return projects
      .slice(0, 4)
      .map((project) => {
        const lastRun = project.runs?.at(0)
        const latestSnapshot = project.snapshots?.at(-1)
        const trackedCount = project.trackedQueries.length
        const sharePct = latestSnapshot ? Math.round(latestSnapshot.brandSharePct) : null
        const totalRuns = project.runs?.length ?? 0

        return {
          id: project.id,
          brandName: project.brandName,
          trackedCount,
          sharePct,
          lastRunDate: lastRun ? new Date(lastRun.runAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No runs',
          runs: totalRuns
        }
      })
  }, [projects])

  return (
    <section className="dashboard-panel dashboard-panel--projects">
      <header className="dashboard-panel__header">
        <div>
          <span className="visual-card__eyebrow">Projects</span>
          <h2>Your workspaces</h2>
        </div>
        <div className="dashboard-panel__header-actions">
          <Button type="button" variant="ghost" onClick={() => navigate('/projects')}>
            View all projects
          </Button>
          <Button type="button" onClick={onCreateProject}>
            + New project
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="dashboard-projects-loading">Loading projects…</div>
      ) : topProjects.length === 0 ? (
        emptyState
      ) : (
        <div className="dashboard-projects-grid">
          {topProjects.map((project) => (
            <div key={project.id} className="dashboard-project-card">
              <div className="dashboard-project-card__header">
                <h3>{project.brandName}</h3>
                {project.sharePct !== null && (
                  <span className="dashboard-project-card__badge">{project.sharePct}% share</span>
                )}
              </div>
              <dl>
                <div>
                  <dt>Tracked prompts</dt>
                  <dd>{project.trackedCount}</dd>
                </div>
                <div>
                  <dt>Last run</dt>
                  <dd>{project.lastRunDate}</dd>
                </div>
                <div>
                  <dt>Total runs</dt>
                  <dd>{project.runs}</dd>
                </div>
              </dl>
              <div className="dashboard-project-card__actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/projects', { state: { focusProjectId: project.id } })}
                >
                  View insights
                </Button>
                <Button type="button" variant="quiet" onClick={() => navigate(`/projects/${project.id}`)}>
                  Open dashboard →
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default DashboardProjectsPreview
