import { FormEvent, useEffect, useMemo, useState } from 'react';
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

const DashboardPage = () => {
  const { session, plan, setPlan, signOut } = useSession();
  const navigate = useNavigate();
  const token = session?.access_token ?? null;
  const { dashboardQuery, planQuery, analysisMutation } = useDashboard(token);
  const [brand, setBrand] = useState('Klio AI');
  const [keywords, setKeywords] = useState('AI tutor, education');
  const [competitors, setCompetitors] = useState('TutorPlus, MindCoach');
  const [error, setError] = useState('');
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    if (planQuery.data?.tier && planQuery.data.tier !== plan) {
      setPlan(planQuery.data.tier);
    }
  }, [planQuery.data?.tier, plan, setPlan]);

  const planTier = planQuery.data?.tier ?? plan;
  const dashboard = dashboardQuery.data?.dashboard ?? null;
  const analysis = dashboardQuery.data?.analysis ?? null;
  const loading = dashboardQuery.isLoading || planQuery.isLoading;

  const readableDate = useMemo(() => {
    if (!analysis) return 'No runs yet';
    return new Date(analysis.createdAt).toLocaleString();
  }, [analysis]);

  const sentimentEntries = useMemo(() => {
    if (!dashboard) return [] as Array<{ label: string; value: number; pct: number; tone: 'positive' | 'neutral' | 'negative' }>;
    const { positive, neutral, negative } = dashboard.sentimentCard;
    const total = positive + neutral + negative;
    if (total === 0) return [];
    return [
      { label: 'Positive', value: positive, pct: Math.round((positive / total) * 100), tone: 'positive' as const },
      { label: 'Neutral', value: neutral, pct: Math.round((neutral / total) * 100), tone: 'neutral' as const },
      { label: 'Negative', value: negative, pct: Math.round((negative / total) * 100), tone: 'negative' as const }
    ];
  }, [dashboard]);

  const brandName = analysis?.brand ?? brand;
  const wowDelta = dashboard?.trendCard.delta ?? 0;
  const brandShare = dashboard ? dashboard.summaryCard.shareOfVoice[brandName] ?? 0 : 0;
  const totalQueries = dashboard?.summaryCard.totalQueries ?? 0;
  const brandMentions = dashboard?.summaryCard.brandMentions ?? 0;
  const coverageHeadline = dashboard ? (totalQueries > 0 ? `${brandMentions}/${totalQueries}` : '—') : '—';

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

  const handleUpgrade = async () => {
    if (!token) return;
    setUpgradeError('');
    setUpgradeLoading(true);
    try {
      const checkout = await createCheckout(token);
      window.location.href = checkout.url;
    } catch (err) {
      setUpgradeError((err as Error).message || 'Unable to start checkout');
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard__topbar">
        <div className="dashboard__brand">
          <span className="dashboard__logo">RankAI</span>
          <PlanBadge tier={planTier} />
        </div>
        <div className="dashboard__actions">
          <button
            type="button"
            className="dashboard-button dashboard-button--ghost"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="dashboard__content">
        <div className="dashboard__column dashboard__column--primary">
          <MetricCard
            title="Visibility Console"
            subtitle={`Last updated ${readableDate}`}
            className="panel--hero"
          >
            <div className="dashboard-summary">
              <div className="dashboard-summary__intro">
                <span className="dashboard-summary__tagline">AI Search footprint</span>
                <h1 className="dashboard-summary__title">{brandName}</h1>
              </div>
              <div className="dashboard-summary__headline">{coverageHeadline}</div>
              <div className="dashboard-summary__metrics">
                <div className="dashboard-metric">
                  <span className="dashboard-metric__label">Share of voice</span>
                  <span className="dashboard-metric__value">{brandShare}%</span>
                </div>
                <div className="dashboard-metric">
                  <span className="dashboard-metric__label">WoW delta</span>
                  <span className="dashboard-metric__value">{wowDelta >= 0 ? '+' : ''}{wowDelta}</span>
                </div>
                <div className="dashboard-metric">
                  <span className="dashboard-metric__label">Queries tracked</span>
                  <span className="dashboard-metric__value">{totalQueries}</span>
                </div>
                {sentimentEntries.length > 0 && (
                  <div className="dashboard-metric">
                    <span className="dashboard-metric__label">Positive mentions</span>
                    <span className="dashboard-metric__value">{sentimentEntries[0]?.value ?? 0}</span>
                  </div>
                )}
              </div>
              <form className="dashboard-form dashboard-form--inline" onSubmit={handleSubmit}>
                <label>
                  Brand
                  <input
                    value={brand}
                    onChange={(event) => setBrand(event.target.value)}
                    className="dashboard-form__input"
                    placeholder="e.g., Stripe"
                  />
                </label>
                <label>
                  Keywords
                  <input
                    value={keywords}
                    onChange={(event) => setKeywords(event.target.value)}
                    className="dashboard-form__input"
                    placeholder="Payments, fintech"
                  />
                </label>
                <label>
                  Competitors
                  <input
                    value={competitors}
                    onChange={(event) => setCompetitors(event.target.value)}
                    className="dashboard-form__input"
                    placeholder="PayPal, Square"
                  />
                </label>
                <div className="dashboard-form__actions">
                  <button
                    type="submit"
                    disabled={analysisMutation.isLoading}
                    className="dashboard-button dashboard-button--primary"
                  >
                    {analysisMutation.isLoading ? 'Running…' : 'Run analysis'}
                  </button>
                  <span className="dashboard-note">Last run: {readableDate}</span>
                  {error && <span style={{ color: '#dc2626', fontSize: '0.78rem' }}>{error}</span>}
                </div>
              </form>
            </div>
          </MetricCard>

          <MetricCard title="Share of Voice" subtitle="Presence across monitored queries">
            {dashboard ? <ShareOfVoiceList share={dashboard.summaryCard.shareOfVoice} /> : <div className="empty-state">Share of voice will appear after your first run.</div>}
          </MetricCard>
        </div>

        <div className="dashboard__column dashboard__column--secondary">
          {loading ? (
            <div className="dashboard__loading">Loading dashboard…</div>
          ) : (
            <>
              <MetricCard title="Momentum" subtitle="Last 10 refreshes">
                {dashboard ? <TrendChart points={dashboard.trendCard.series} /> : <div className="empty-state">Trend data will populate after you record runs.</div>}
              </MetricCard>

              <MetricCard title="Opportunity Map" subtitle="Where competitors lead">
                {dashboard ? <GapList gaps={dashboard.gapCard} /> : <div className="empty-state">We surface query gaps once data is collected.</div>}
              </MetricCard>

              <MetricCard title="Next Moves" subtitle="Actions to lift share of voice">
                {dashboard ? <ActionList actions={dashboard.actionCard} /> : <div className="empty-state">Your prioritized actions will appear after your first run.</div>}
                {planTier === 'free' ? (
                  <div className="plan-upgrade__foot">
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={upgradeLoading}
                      className="dashboard-button dashboard-button--subtle"
                    >
                      {upgradeLoading ? 'Connecting…' : 'Upgrade to Pro'}
                    </button>
                    {upgradeError && <span style={{ color: '#dc2626', fontSize: '0.75rem' }}>{upgradeError}</span>}
                  </div>
                ) : (
                  <span className="plan-upgrade__perk">Pro keeps this console synced with weekly auto-refresh.</span>
                )}
              </MetricCard>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
