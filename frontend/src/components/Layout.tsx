import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button.tsx';
import { useSession } from '../hooks/useSession.tsx';

const Layout = ({ children }: { children: ReactNode }) => {
  const { session, signOut } = useSession();
  const navigate = useNavigate();

  const focusAuthForm = () => {
    if (typeof window === 'undefined') return;
    document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = document.querySelector('#auth-form input[type="email"]') as HTMLInputElement | null;
    input?.focus();
  };

  const handleLaunch = () => {
    if (session) {
      navigate('/dashboard');
      return;
    }
    focusAuthForm();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="page">
      <header className="public-header">
        <div className="public-header__inner">
          <span className="public-brand">RankAI</span>
          <nav className="public-nav">
            <a className="nav-link" href="#vision">Vision</a>
            <a className="nav-link" href="#features">Features</a>
            <a className="nav-link" href="#pricing">Pricing</a>
            <div className="public-nav__cta">
              <Button type="button" onClick={handleLaunch}>
                {session ? 'Open dashboard' : 'Launch console'}
              </Button>
            </div>
            {session && (
              <Button type="button" variant="quiet" onClick={handleLogout}>
                Log out
              </Button>
            )}
          </nav>
        </div>
      </header>
      <main>
        {children}
      </main>
      <footer className="public-footer">
        <div className="page__container">
          Built for teams who obsess over staying visible inside AI-generated answers.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
