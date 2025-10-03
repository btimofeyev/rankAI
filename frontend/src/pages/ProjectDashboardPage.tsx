import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../hooks/useSession.tsx';
import { fetchProject, runProjectAnalysis, updateProject, deleteProject } from '../api/index.ts';
import Layout from '../components/Layout.tsx';
import PlanBadge from '../components/PlanBadge.tsx';
import MetricCard from '../components/MetricCard.tsx';
import TrendChart from '../components/TrendChart.tsx';
import ShareOfVoiceList from '../components/ShareOfVoiceList.tsx';
import GapList from '../components/GapList.tsx';
import ActionList from '../components/ActionList.tsx';

const ProjectDashboardPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { session, plan, signOut } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = session?.access_token ?? null;

  const [editMode, setEditMode] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [error, setError] = useState('');

  const projectQuery = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(token ?? '', projectId ?? ''),
    enabled: Boolean(token && projectId)
  });

  const runAnalysisMutation = useMutation({
    mutationFn: () => runProjectAnalysis(token ?? '', projectId ?? ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to run analysis');
    }
  });

  const updateMutation = useMutation({
    mutationFn: () => updateProject(token ?? '', projectId ?? '', {
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      competitors: competitors.split(',').map(c => c.trim()).filter(Boolean)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setEditMode(false);
      setError('');
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to update project');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(token ?? '', projectId ?? ''),
    onSuccess: () => {
      navigate('/projects');
    }
  });

  const handleEdit = () => {
    if (projectQuery.data?.project) {
      setKeywords(projectQuery.data.project.keywords.join(', '));
      setCompetitors(projectQuery.data.project.competitors.join(', '));
      setEditMode(true);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  const project = projectQuery.data?.project;
  const dashboard = projectQuery.data?.dashboard;
  const runs = projectQuery.data?.runs ?? [];
  const totalQueries = projectQuery.data?.totalQueries ?? 0;

  if (projectQuery.isLoading) {
    return (
      <Layout>
        <div style={{ padding: '48px', textAlign: 'center', opacity: 0.6 }}>
          Loading project...
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ opacity: 0.7 }}>Project not found</p>
          <button
            onClick={() => navigate('/projects')}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--accent)',
              color: '#0b0d11',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Back to Projects
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/projects')}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Projects
          </button>
          <span style={{ fontWeight: 600, fontSize: '18px' }}>{project.brandName}</span>
          <PlanBadge tier={plan} />
        </div>
        <button
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
          style={{ padding: '10px 16px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
        >
          Log out
        </button>
      </header>

      <div style={{ padding: '32px 48px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '32px' }}>
        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={sideCardStyle}>
            <h3 style={{ margin: '0 0 12px 0' }}>Configuration</h3>
            {editMode ? (
              <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  Keywords
                  <input value={keywords} onChange={(e) => setKeywords(e.target.value)} style={inputStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  Competitors
                  <input value={competitors} onChange={(e) => setCompetitors(e.target.value)} style={inputStyle} />
                </label>
                {error && <div style={{ color: 'var(--danger)', fontSize: '12px' }}>{error}</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#0b0d11',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setError(''); }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                  <div style={{ opacity: 0.6, marginBottom: '4px' }}>Keywords:</div>
                  <div>{project.keywords.length > 0 ? project.keywords.join(', ') : 'None'}</div>
                </div>
                <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                  <div style={{ opacity: 0.6, marginBottom: '4px' }}>Competitors:</div>
                  <div>{project.competitors.length > 0 ? project.competitors.join(', ') : 'None'}</div>
                </div>
                <button
                  onClick={handleEdit}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Edit Configuration
                </button>
              </>
            )}
          </div>

          <div style={sideCardStyle}>
            <h3 style={{ margin: '0 0 12px 0' }}>Run Analysis</h3>
            <p style={{ fontSize: '13px', opacity: 0.7, margin: '0 0 12px 0' }}>
              Run a new analysis to gather more data. Results will be added to existing data.
            </p>
            <button
              onClick={() => runAnalysisMutation.mutate()}
              disabled={runAnalysisMutation.isPending}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent)',
                color: '#0b0d11',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: runAnalysisMutation.isPending ? 0.6 : 1
              }}
            >
              {runAnalysisMutation.isPending ? 'Running Analysis...' : 'Run New Analysis'}
            </button>
            {error && <div style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '8px' }}>{error}</div>}
          </div>

          <div style={sideCardStyle}>
            <h3 style={{ margin: '0 0 12px 0' }}>Analysis History</h3>
            <div style={{ fontSize: '13px', opacity: 0.7 }}>
              <div>Total Runs: {runs.length}</div>
              <div>Total Queries: {totalQueries}</div>
              {runs.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  Last run: {new Date(runs[0].runAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div style={sideCardStyle}>
            <h3 style={{ margin: '0 0 12px 0' }}>Danger Zone</h3>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--danger)',
                background: 'transparent',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Delete Project
            </button>
          </div>
        </aside>

        {/* Main Dashboard */}
        <section>
          {dashboard ? (
            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <MetricCard title="Summary">
                <div style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px' }}>
                  {dashboard.summaryCard.brandMentions} mentions
                  <span style={{ fontSize: '16px', opacity: 0.6, fontWeight: 400 }}> (cumulative)</span>
                </div>
                <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '12px' }}>
                  {dashboard.summaryCard.queriesWithMentions}/{dashboard.summaryCard.totalQueries} queries with mentions ({Math.round((dashboard.summaryCard.queriesWithMentions / dashboard.summaryCard.totalQueries) * 100)}%)
                  <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>
                    Across all {runs.length} analysis run{runs.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <ShareOfVoiceList share={dashboard.summaryCard.shareOfVoice} />
                {runs.length > 0 && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '13px',
                    opacity: 0.7
                  }}>
                    Latest run: {new Date(runs[0].runAt).toLocaleDateString()}
                    <br />
                    {runs[0].queriesGenerated} queries analyzed
                  </div>
                )}
              </MetricCard>

              <MetricCard title="Trend">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '32px' }}>{dashboard.trendCard.series.at(-1)?.value ?? 0}</strong>
                    <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>Latest run mentions</div>
                  </div>
                  <span style={{
                    color: dashboard.trendCard.delta >= 0 ? 'var(--success)' : 'var(--danger)',
                    fontSize: '18px',
                    fontWeight: 600
                  }}>
                    {dashboard.trendCard.delta >= 0 ? '+' : ''}{dashboard.trendCard.delta}
                    <div style={{ fontSize: '11px', opacity: 0.8, fontWeight: 400 }}>vs prev run</div>
                  </span>
                </div>
                <TrendChart points={dashboard.trendCard.series} />
              </MetricCard>

              <MetricCard title="Gaps">
                <GapList gaps={dashboard.gapCard} />
              </MetricCard>

              <MetricCard title="Actions">
                <ActionList actions={dashboard.actionCard} />
              </MetricCard>
            </div>
          ) : (
            <div style={{
              background: 'var(--surface)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '48px',
              textAlign: 'center'
            }}>
              <p style={{ opacity: 0.7, margin: '0 0 16px 0' }}>No analysis data yet</p>
              <button
                onClick={() => runAnalysisMutation.mutate()}
                disabled={runAnalysisMutation.isPending}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#0b0d11',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: runAnalysisMutation.isPending ? 0.6 : 1
                }}
              >
                {runAnalysisMutation.isPending ? 'Running...' : 'Run First Analysis'}
              </button>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

const sideCardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '20px'
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(10,12,16,0.8)',
  color: 'inherit',
  fontSize: '13px'
};

export default ProjectDashboardPage;
