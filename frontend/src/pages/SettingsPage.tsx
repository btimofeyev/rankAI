import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.tsx';
import Button from '../components/Button.tsx';
import { useSession } from '../hooks/useSession.tsx';
import { PRIMARY_NAV, SUPPORT_NAV } from '../lib/navigation.tsx';

const SettingsPage = () => {
  const { session, plan, signOut } = useSession();
  const navigate = useNavigate();

  const userEmail = session?.user?.email ?? undefined;
  const userFullName = session?.user?.user_metadata?.full_name as string | undefined;
  const displayName = useMemo(() => {
    if (userFullName && userFullName.trim().length > 0) return userFullName.trim();
    if (userEmail) return userEmail.split('@')[0];
    return 'RankAI Operator';
  }, [userEmail, userFullName]);

  const [digestEmail, setDigestEmail] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(plan === 'pro');
  const [notifySlack, setNotifySlack] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
    }, 1200);
  };

  return (
    <AppShell
      planTier={plan}
      navItems={PRIMARY_NAV}
      secondaryNavItems={SUPPORT_NAV}
      user={{ name: displayName, email: userEmail }}
      onSignOut={handleSignOut}
      footerNote="Fine-tune notifications, automations, and workspace access."
    >
      <div className="settings-screen dashboard-screen">
        <header className="dashboard-head">
          <div className="dashboard-head__meta">
            <div className="dashboard-head__breadcrumbs">
              <span>Home</span>
              <span aria-hidden>·</span>
              <span>Account settings</span>
            </div>
            <h1 className="dashboard-head__title">Workspace preferences</h1>
            <p className="dashboard-head__subtitle">
              Control how RankAI keeps you in the loop. Automate scheduled runs, choose notification channels, and
              manage access for teammates.
            </p>
            <div className="dashboard-head__details">
              <span>Signed in as · {userEmail ?? '—'}</span>
              <span aria-hidden>•</span>
              <span>Plan · {plan === 'pro' ? 'Pro' : 'Free'}</span>
            </div>
          </div>
        </header>

        <main className="settings-grid">
          <form className="dashboard-card settings-card" onSubmit={handleSubmit}>
            <header className="dashboard-card__header">
              <div>
                <span className="dashboard-card__eyebrow">Automations</span>
                <h2 className="dashboard-card__title">Telemetry cadence</h2>
              </div>
            </header>
            <div className="settings-list">
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(event) => setAutoRefresh(event.target.checked)}
                />
                <div>
                  <strong>Weekly auto-runs</strong>
                  <p>Keep dashboards freshly updated every Monday morning.</p>
                </div>
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={digestEmail}
                  onChange={(event) => setDigestEmail(event.target.checked)}
                />
                <div>
                  <strong>Email digest</strong>
                  <p>Receive a summary of coverage, sentiment, and competitive deltas.</p>
                </div>
              </label>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={notifySlack}
                  onChange={(event) => setNotifySlack(event.target.checked)}
                />
                <div>
                  <strong>Slack alerts</strong>
                  <p>Post telemetry shifts into your shared #rankai-ops channel.</p>
                </div>
              </label>
            </div>
            <div className="settings-actions">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save preferences'}
              </Button>
            </div>
          </form>

          <section className="dashboard-card">
            <header className="dashboard-card__header">
              <div>
                <span className="dashboard-card__eyebrow">Access</span>
                <h2 className="dashboard-card__title">Workspace members</h2>
              </div>
            </header>
            <div className="settings-members">
              <p>No teammates yet. Invite collaborators to share dashboards and projects.</p>
              <Button type="button" variant="ghost" onClick={() => window.alert('Invites coming soon.')}>
                Invite teammate
              </Button>
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
};

export default SettingsPage;
