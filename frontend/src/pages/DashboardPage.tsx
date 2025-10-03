import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from 'react-router-dom';
import MetricCard from '../components/MetricCard.tsx';
import TrendChart from '../components/TrendChart.tsx';
import ShareOfVoiceList from '../components/ShareOfVoiceList.tsx';
import GapList from '../components/GapList.tsx';
import ActionList from '../components/ActionList.tsx';
import PlanBadge from '../components/PlanBadge.tsx';
import { useDashboard } from '../hooks/useDashboard.ts';
import { useSession } from '../hooks/useSession.tsx';
import { createCheckout } from '../api/index.ts';

const containerStyle: React.CSSProperties = {
  padding: '32px 48px 80px',
  display: 'grid',
  gridTemplateColumns: '320px 1fr',
  gap: '32px'
};

const sideCardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.08)',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const DashboardPage = () => {
  const { session, plan, setPlan, signOut } = useSession();
  const navigate = useNavigate();
  const token = session?.access_token ?? null;
  const { dashboardQuery, planQuery, analysisMutation } = useDashboard(token);
  const [brand, setBrand] = useState('Klio AI');
  const [error, setError] = useState('');
  const [keywords, setKeywords] = useState('AI tutor, education');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [competitors, setCompetitors] = useState('TutorPlus, MindCoach');

  useEffect(() => {
    if (planQuery.data?.tier && planQuery.data.tier !== plan) {
      setPlan(planQuery.data.tier);
    }
  }, [planQuery.data?.tier, plan, setPlan]);

  const planTier = planQuery.data?.tier ?? plan;
  const dashboard = dashboardQuery.data?.dashboard ?? null;
  const analysis = dashboardQuery.data?.analysis ?? null;
  const loading = dashboardQuery.isLoading || planQuery.isLoading;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const payload = {
      brand: brand.trim(),
      keywords: keywords.split(',').map((value) => value.trim()).filter(Boolean),
      competitors: competitors.split(',').map((value) => value.trim()).filter(Boolean)
    };
    setError('');
    analysisMutation.mutate(payload, {
      onError: (mutError) => {
        setError(mutError.message || 'Unable to run analysis');
      }
    });
  };

  const readableDate = useMemo(() => {
    if (!analysis) return 'No runs yet';
    return new Date(analysis.createdAt).toLocaleString();
  }, [analysis]);

  const handleUpgrade = async () => {
    if (!token) return;
    setUpgradeError('');
    setUpgradeLoading(true);
    try {
      const session = await createCheckout(token);
      window.location.href = session.url;
    } catch (err) {
      console.error(err);
      setUpgradeError((err as Error).message || 'Unable to start checkout');
    } finally {
      setUpgradeLoading(false);
    }
  };


  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>RankAI</span>
          <PlanBadge tier={planTier} />
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

      <div style={containerStyle}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={sideCardStyle}>
            <h2 style={{ margin: 0 }}>Run fresh analysis</h2>
            <p style={{ opacity: 0.7, fontSize: '14px' }}>Choose your brand, keywords, and up to five competitors.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                Brand
                <input value={brand} onChange={(event) => setBrand(event.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                Keywords (comma separated)
                <input value={keywords} onChange={(event) => setKeywords(event.target.value)} style={inputStyle} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                Competitors (comma separated)
                <input value={competitors} onChange={(event) => setCompetitors(event.target.value)} style={inputStyle} />
              </label>
              <button
                type="submit"
                disabled={analysisMutation.isLoading}
                style={{ padding: '12px 18px', borderRadius: '12px', border: 'none', background: 'var(--accent)', color: '#0b0d11', fontWeight: 600, cursor: 'pointer', opacity: analysisMutation.isLoading ? 0.6 : 1 }}
              >
                {analysisMutation.isLoading ? 'Running…' : 'Run analysis'}
              </button>
              {error && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{error}</span>}
              <span style={{ fontSize: '12px', opacity: 0.5 }}>Last run: {readableDate}</span>
            </form>
          </div>
          <div style={sideCardStyle}>
            <h3 style={{ margin: 0 }}>Plan</h3>
            <p style={{ opacity: 0.7, fontSize: '14px' }}>
              {planTier === 'pro' ? 'Weekly auto-refresh active. Alerts will drop every Monday.' : 'Upgrade to unlock weekly tracking, full competitor comparisons, and alerts.'}
            </p>
            {planTier === 'free' && <p style={{ fontSize: '13px', opacity: 0.55 }}>Free plan: one analysis/month and a single competitor.</p>}
            {planTier === 'free' && (
              <>
                <button
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                  style={{ padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'inherit', fontWeight: 600, cursor: 'pointer', opacity: upgradeLoading ? 0.6 : 1 }}
                >
                  {upgradeLoading ? 'Connecting…' : 'Upgrade to Pro'}
                </button>
                {upgradeError && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>{upgradeError}</span>}
              </>
            )}
          </div>
        </aside>
        <section style={{ display: 'grid', gap: '24px' }}>
          {loading ? (
            <div style={{ opacity: 0.6 }}>Loading dashboard…</div>
          ) : dashboard ? (
            <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <MetricCard title="Summary">
                <div style={{ fontSize: '32px', fontWeight: 600 }}>
                  {dashboard.summaryCard.brandMentions}/{dashboard.summaryCard.totalQueries} queries mention you
                </div>
                <ShareOfVoiceList share={dashboard.summaryCard.shareOfVoice} />
              </MetricCard>
              <MetricCard title="Trend">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '32px' }}>{dashboard.trendCard.series.at(-1)?.value ?? 0}</strong>
                  <span style={{ color: dashboard.trendCard.delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {dashboard.trendCard.delta >= 0 ? '+' : ''}{dashboard.trendCard.delta} WoW
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
            <div style={{ opacity: 0.6 }}>Run an analysis to populate the dashboard.</div>
          )}
        </section>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(10,12,16,0.8)',
  color: 'inherit'
};

export default DashboardPage;
