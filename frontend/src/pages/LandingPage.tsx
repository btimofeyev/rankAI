import { FormEvent, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.tsx';
import Button from '../components/Button.tsx';
import { useSession } from '../hooks/useSession.tsx';
import { supabase } from '../lib/supabaseClient.ts';

type AuthMode = 'sign-up' | 'login';

const featureList = [
  {
    title: 'Weekly visibility tracking',
    body: 'See how often your brand appears across curated GPT prompts and how that shifts week over week.'
  },
  {
    title: 'Competitor benchmarking',
    body: 'Stack your share of voice against up to five rivals with side-by-side frequency and placement reads.'
  },
  {
    title: 'Momentum alerts',
    body: 'Automatic highlights when sentiment changes, gaps appear, or competitors surge into answers you own.'
  },
  {
    title: 'Actionable guidance',
    body: 'Playbooks that translate the data into next moves so teams know exactly where to focus content.'
  }
];

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
      navigate('/dashboard');
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
          options: { emailRedirectTo: window.location.origin + '/dashboard' }
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
      navigate('/dashboard');
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
      <section id="vision" className="page__section hero">
        <div className="page__container hero__inner">
          <div className="stack stack--loose">
            <span className="public-badge">AI Visibility Tracking</span>
            <h1 className="headline">Stay visible inside every AI answer.</h1>
            <p className="subhead">
              RankAI keeps score of how your brand shows up in GPT responses, spotlights the competitors overtaking you,
              and nudges the moves that restore your share of voice.
            </p>
            <div className="chip-row">
              <span className="chip">Share of voice snapshots</span>
              <span className="chip">Weekly momentum trends</span>
              <span className="chip">Actionable gap alerts</span>
            </div>
          </div>
          <div className="auth-panel">
            <div className="stack stack--tight">
              <span className="eyebrow">Start tracking</span>
              <h2 className="headline-secondary">Launch your AI visibility console in minutes.</h2>
            </div>
            <form id="auth-form" ref={formRef} className="auth-panel__form" onSubmit={handleSubmit}>
              <label className="field" htmlFor="email">
                Email
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="field__input"
                />
              </label>
              <label className="field" htmlFor="password">
                Password
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="8+ characters"
                  required
                  minLength={8}
                  autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                  className="field__input"
                />
              </label>
              <Button type="submit" disabled={loading}>
                {session ? 'Continue to dashboard' : mode === 'sign-up' ? 'Create free account' : 'Sign in'}
              </Button>
              <div className="auth-panel__switch">
                <span>{mode === 'sign-up' ? 'Already have an account?' : 'New to RankAI?'}</span>
                <button type="button" onClick={toggleMode} className="link-button">
                  {mode === 'sign-up' ? 'Sign in' : 'Create account'}
                </button>
              </div>
              {error && <div className="auth-panel__error">{error}</div>}
            </form>
          </div>
        </div>
      </section>

      <section id="features" className="page__section">
        <div className="page__container stack">
          <div className="stack stack--tight">
            <span className="eyebrow">Designed for clarity</span>
            <h2 className="headline-secondary">A modern dashboard that keeps leadership centered on outcomes.</h2>
          </div>
          <div className="feature-grid">
            {featureList.map((item) => (
              <div key={item.title} className="feature-card">
                <span className="feature-card__title">{item.title}</span>
                <p className="feature-card__body">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="page__section">
        <div className="page__container">
          <div className="pricing-card">
            <span className="eyebrow pricing-card__eyebrow">Pro plan</span>
            <h3 className="pricing-card__title">Everything you need to stay ahead.</h3>
            <p className="pricing-card__price">
              $89<span className="pricing-card__period"> / month</span>
            </p>
            <p className="pricing-card__caption">
              Weekly tracking, full competitor benchmarking, and automated momentum alerts shipped to your team.
            </p>
            <Button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={loading}
            >
              {mode === 'sign-up' ? 'Start free, upgrade anytime' : 'Sign in to upgrade'}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
