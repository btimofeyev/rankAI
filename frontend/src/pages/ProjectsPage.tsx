import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '../hooks/useSession.tsx';
import { fetchProjects, createProject } from '../api/index.ts';
import Layout from '../components/Layout.tsx';
import PlanBadge from '../components/PlanBadge.tsx';

const ProjectsPage = () => {
  const { session, plan, signOut } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = session?.access_token ?? null;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [competitors, setCompetitors] = useState('');
  const [error, setError] = useState('');

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchProjects(token ?? ''),
    enabled: Boolean(token)
  });

  const createMutation = useMutation({
    mutationFn: () => createProject(token ?? '', {
      brandName: brandName.trim(),
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      competitors: competitors.split(',').map(c => c.trim()).filter(Boolean)
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/projects/${data.project.id}`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create project');
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      setError('Brand name is required');
      return;
    }
    setError('');
    createMutation.mutate();
  };

  const projects = projectsQuery.data?.projects ?? [];

  return (
    <Layout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>RankAI</span>
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

      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px' }}>Brand Projects</h1>
            <p style={{ margin: 0, opacity: 0.7 }}>Track AI visibility for your brands over time</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--accent)',
              color: '#0b0d11',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            + New Project
          </button>
        </div>

        {showCreateForm && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Create New Project</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '14px', opacity: 0.8 }}>Brand Name</span>
                <input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., Stripe"
                  style={inputStyle}
                  required
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '14px', opacity: 0.8 }}>Keywords (comma separated)</span>
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., payments, fintech, SaaS"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '14px', opacity: 0.8 }}>Competitors (comma separated)</span>
                <input
                  value={competitors}
                  onChange={(e) => setCompetitors(e.target.value)}
                  placeholder="e.g., PayPal, Square"
                  style={inputStyle}
                />
              </label>
              {error && <div style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#0b0d11',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: createMutation.isPending ? 0.6 : 1
                  }}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setError('');
                    setBrandName('');
                    setKeywords('');
                    setCompetitors('');
                  }}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {projectsQuery.isLoading ? (
          <div style={{ opacity: 0.6, padding: '48px', textAlign: 'center' }}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '48px',
            textAlign: 'center'
          }}>
            <p style={{ opacity: 0.7, margin: 0 }}>No projects yet. Create your first brand project to get started!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{
                  background: 'var(--surface)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                <h3 style={{ margin: '0 0 12px 0', fontSize: '24px' }}>{project.brandName}</h3>
                <div style={{ display: 'flex', gap: '24px', fontSize: '14px', opacity: 0.7 }}>
                  <div>
                    <strong>Keywords:</strong> {project.keywords.length > 0 ? project.keywords.join(', ') : 'None'}
                  </div>
                  <div>
                    <strong>Competitors:</strong> {project.competitors.length > 0 ? project.competitors.join(', ') : 'None'}
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', opacity: 0.5 }}>
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(10,12,16,0.8)',
  color: 'inherit',
  fontSize: '14px'
};

export default ProjectsPage;
