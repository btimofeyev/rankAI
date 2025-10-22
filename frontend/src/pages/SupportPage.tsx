import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell.tsx';
import Button from '../components/Button.tsx';
import { useSession } from '../hooks/useSession.tsx';
import { PRIMARY_NAV, SUPPORT_NAV } from '../lib/navigation.tsx';
import { IconSparkle } from '../components/icons.tsx';

const SupportPage = () => {
  const { session, plan, signOut } = useSession();
  const navigate = useNavigate();

  const userEmail = session?.user?.email ?? undefined;
  const userFullName = session?.user?.user_metadata?.full_name as string | undefined;
  const displayName = useMemo(() => {
    if (userFullName && userFullName.trim().length > 0) return userFullName.trim();
    if (userEmail) return userEmail.split('@')[0];
    return 'RankAI Operator';
  }, [userEmail, userFullName]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <AppShell
      planTier={plan}
      navItems={PRIMARY_NAV}
      secondaryNavItems={SUPPORT_NAV}
      user={{ name: displayName, email: userEmail }}
      onSignOut={handleSignOut}
      footerNote="Need a hand? Our team replies within one business day."
    >
      <div className="support-screen dashboard-screen">
        <header className="dashboard-head">
          <div className="dashboard-head__meta">
            <div className="dashboard-head__breadcrumbs">
              <span>Home</span>
              <span aria-hidden>·</span>
              <span>Help center</span>
            </div>
            <h1 className="dashboard-head__title">How can we help?</h1>
            <p className="dashboard-head__subtitle">
              Reach our team for onboarding, product questions, or enterprise telemetry. We keep things lightweight and
              respond quickly.
            </p>
            <div className="dashboard-head__details">
              <span>Support hours · 9am–6pm PT</span>
              <span aria-hidden>•</span>
              <span>Average reply · &lt; 6 hours</span>
            </div>
          </div>
        </header>

        <main className="support-grid">
          <section className="dashboard-card">
            <header className="dashboard-card__header">
              <div>
                <span className="dashboard-card__eyebrow">Contact</span>
                <h2 className="dashboard-card__title">Direct lines</h2>
              </div>
            </header>
            <div className="support-contact">
              <div className="support-contact__item">
                <strong>Email</strong>
                <p>support@rankai.app</p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => window.open('mailto:support@rankai.app')}
                >
                  Send an email
                </Button>
              </div>
              <div className="support-contact__item">
                <strong>Slack</strong>
                <p>#rankai-ops (Pro customers)</p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => window.open('https://slack.com', '_blank')}
                >
                  Join Slack
                </Button>
              </div>
              <div className="support-contact__item">
                <strong>Docs</strong>
                <p>Guides for setup, tracking, and automation.</p>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => window.open('https://docs.rankai.app', '_blank')}
                >
                  Browse docs
                </Button>
              </div>
            </div>
          </section>

          <section className="dashboard-card">
            <header className="dashboard-card__header">
              <div>
                <span className="dashboard-card__eyebrow">Quick answers</span>
                <h2 className="dashboard-card__title">Popular questions</h2>
              </div>
            </header>
            <ul className="support-faq">
              {[
                'How do I add a new competitor or keyword set?',
                'What is the best cadence for scheduled runs?',
                'How should I interpret momentum vs share of voice?',
                'Ways to share dashboards with the rest of my team'
              ].map((question) => (
                <li key={question}>
                  <IconSparkle size={16} />
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </AppShell>
  );
};

export default SupportPage;
