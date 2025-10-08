import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import ProjectsPage from './pages/ProjectsPage.tsx';
import ProjectDashboardPage from './pages/ProjectDashboardPage.tsx';
import QueryDetailPage from './pages/QueryDetailPage.tsx';
import { useSession } from './hooks/useSession.tsx';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { session, loading } = useSession();
  if (loading) return null;
  if (!session) return <Navigate to='/' replace />;
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/dashboard"
        element={(
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/projects"
        element={(
          <RequireAuth>
            <ProjectsPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/projects/:projectId"
        element={(
          <RequireAuth>
            <ProjectDashboardPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/projects/:projectId/queries"
        element={(
          <RequireAuth>
            <QueryDetailPage />
          </RequireAuth>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
