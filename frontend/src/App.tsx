import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import LandingPage from './pages/LandingPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import ProjectDashboardPage from './pages/ProjectDashboardPage.tsx';
import QueryDetailPage from './pages/QueryDetailPage.tsx';
import SupportPage from './pages/SupportPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import { useSession } from './hooks/useSession.tsx';

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { session, loading } = useSession();
  if (loading) return null;
  if (!session) return <Navigate to='/' replace />;
  return children;
};

const LegacyProjectRedirect = () => {
  const { projectId } = useParams();
  if (!projectId) return <Navigate to="/projects" replace />;
  return <Navigate to={`/projects/${projectId}`} replace />;
};

const LegacyQueriesRedirect = () => {
  const { projectId } = useParams();
  if (!projectId) return <Navigate to="/projects" replace />;
  return <Navigate to={`/projects/${projectId}/queries`} replace />;
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
            <ProjectDashboardPage />
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
      <Route
        path="/dashboard/:projectId"
        element={(
          <RequireAuth>
            <LegacyProjectRedirect />
          </RequireAuth>
        )}
      />
      <Route
        path="/dashboard/:projectId/queries"
        element={(
          <RequireAuth>
            <LegacyQueriesRedirect />
          </RequireAuth>
        )}
      />
      <Route
        path="/help"
        element={(
          <RequireAuth>
            <SupportPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/settings"
        element={(
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
