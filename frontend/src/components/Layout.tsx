import { ReactNode } from 'react';
import { useSession } from '../hooks/useSession.tsx';
import { useNavigate } from 'react-router-dom';

const navButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  background: 'var(--surface)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '999px',
  color: 'inherit',
  cursor: 'pointer'
};

const Layout = ({ children }: { children: ReactNode }) => {
  const { session, signOut } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const scrollToAuth = () => {
    if (typeof window === 'undefined') return;
    document.getElementById('auth-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = document.querySelector('#auth-form input[type="email"]') as HTMLInputElement | null;
    input?.focus();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px' }}>
        <div style={{ fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>RankAI</div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <a href="#vision" style={{ opacity: 0.7 }}>Vision</a>
          <a href="#features" style={{ opacity: 0.7 }}>Features</a>
          <a href="#pricing" style={{ opacity: 0.7 }}>Pricing</a>
          {session ? (
            <button style={navButtonStyle} onClick={handleLogout}>Log out</button>
          ) : (
            <button style={navButtonStyle} onClick={scrollToAuth}>Open App</button>
          )}
        </div>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{ padding: '32px 48px', opacity: 0.6, fontSize: '14px' }}>
        Crafted for marketing teams tracking AI search visibility.
      </footer>
    </div>
  );
};

export default Layout;
