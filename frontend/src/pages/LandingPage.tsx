import { FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.tsx';
import { useSession } from '../hooks/useSession.tsx';
import { supabase } from '../lib/supabaseClient.ts';

const cardStyle: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '24px',
  padding: '32px',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

type AuthMode = 'sign-up' | 'login';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('sign-up');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { session, setPlan } = useSession();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    if (session) {
      navigate('/projects');
      return;
    }

    setLoading(true);
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (mode === 'sign-up') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: window.location.origin + '/projects' }
        });
        if (signUpError) throw signUpError;
        setPlan('free');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        if (signInError) throw signInError;
      }

      setEmail('');
      setPassword('');
      navigate('/projects');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Unable to authenticate';
      setError(message.includes('Email not confirmed') ? 'Check your inbox to confirm your email before signing in.' : message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((current) => (current === 'sign-up' ? 'login' : 'sign-up'));
    setError('');
  };

  return (
    <Layout>
      <section id="vision" style={{ padding: '72px 48px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '64px', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.6 }}>AI Visibility Tracking</div>
          <h1 style={{ fontSize: '3.5rem', lineHeight: 1.05, margin: '16px 0 24px' }}>
            Your weekly tracking dashboard for AI search visibility.
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.72, maxWidth: '520px' }}>
            RankAI continuously monitors how your brand appears in GPT answers, benchmarks you against competitors, and delivers actionable insights week after week.
          </p>
          <form id="auth-form" ref={formRef} onSubmit={handleSubmit} style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '420px' }}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.16)',
                background: 'rgba(15,17,21,0.6)',
                color: 'inherit'
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password (8+ characters)"
              required
              minLength={8}
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              style={{
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.16)',
                background: 'rgba(15,17,21,0.6)',
                color: 'inherit'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 24px',
                borderRadius: '999px',
                border: 'none',
                background: 'var(--accent)',
                color: '#0b0d11',
                fontWeight: 600,
                letterSpacing: '0.04em',
                cursor: 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {session ? 'Continue to dashboard' : mode === 'sign-up' ? 'Create account' : 'Sign in'}
            </button>
            <div style={{ display: 'flex', gap: '8px', fontSize: '14px', opacity: 0.7 }}>
              <span>{mode === 'sign-up' ? 'Already have an account?' : 'New to RankAI?'}</span>
              <button
                type="button"
                onClick={toggleMode}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0 }}
              >
                {mode === 'sign-up' ? 'Sign in' : 'Create account'}
              </button>
            </div>
            {error && <div style={{ color: 'var(--danger)', fontSize: '14px' }}>{error}</div>}
          </form>
        </div>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={cardStyle}>
            <span style={{ opacity: 0.6, fontSize: '12px', letterSpacing: '0.28em' }}>TRACKING DASHBOARD</span>
            <strong style={{ fontSize: '32px' }}>Monitor AI visibility week after week.</strong>
            <p style={{ opacity: 0.7 }}>Track trends, compare competitors, and discover gaps—all in one dashboard you&apos;ll check every Monday.</p>
          </div>
          <div style={{ ...cardStyle, background: 'var(--surface-strong)' }}>
            <span style={{ opacity: 0.6, fontSize: '12px', letterSpacing: '0.28em' }}>GET STARTED</span>
            <strong style={{ fontSize: '28px' }}>Create an account to unlock your dashboard.</strong>
            <p style={{ opacity: 0.7 }}>Free tier includes one analysis per month with limited competitor view.</p>
          </div>
        </div>
      </section>

      <section id="features" style={{ padding: '48px 48px 96px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {[{
          title: 'Weekly visibility tracking',
          body: 'Automatically monitor how often your brand appears in GPT answers across ~20 industry queries.'
        }, {
          title: 'Competitor benchmarking',
          body: 'Track up to five competitors side-by-side and see who dominates each conversation.'
        }, {
          title: 'Trends & weekly alerts',
          body: 'Week-over-week deltas, trendline graphs, and Monday morning digest emails.'
        }, {
          title: 'Actionable insights, not reports',
          body: 'Every card includes the next move—gap opportunities, content recommendations, and momentum signals.'
        }].map((item) => (
          <div key={item.title} style={cardStyle}>
            <strong style={{ fontSize: '20px' }}>{item.title}</strong>
            <p style={{ opacity: 0.75 }}>{item.body}</p>
          </div>
        ))}
      </section>

      <section id="pricing" style={{ padding: '48px 48px 96px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...cardStyle, maxWidth: '420px', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>Pro</h2>
          <p style={{ fontSize: '48px', margin: '12px 0' }}>$89<span style={{ fontSize: '16px', opacity: 0.6 }}> / mo</span></p>
          <p style={{ opacity: 0.72, marginBottom: '24px' }}>Weekly tracking, full competitor view, digest alerts.</p>
          <button
            type="button"
            onClick={() => formRef.current?.requestSubmit()}
            disabled={loading}
            style={{
              padding: '14px 24px',
              borderRadius: '999px',
              border: 'none',
              background: 'var(--accent)',
              color: '#0b0d11',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {mode === 'sign-up' ? 'Create free account' : 'Sign in to upgrade'}
          </button>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
