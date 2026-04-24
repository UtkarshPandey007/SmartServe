import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AutoSeeder from './components/AutoSeeder';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import DashboardPage from './pages/DashboardPage';
import NeedsPage from './pages/NeedsPage';
import SubmitNeedPage from './pages/SubmitNeedPage';
import VolunteersPage from './pages/VolunteersPage';
import TasksPage from './pages/TasksPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import MyTasksPage from './pages/volunteer/MyTasksPage';
import BrowseNeedsPage from './pages/volunteer/BrowseNeedsPage';
import MyProfilePage from './pages/volunteer/MyProfilePage';
import { Mail, X, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import './App.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading SmartServe...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Non-blocking email verification banner.
 * Shows a dismissible warning banner at the top of the app if the user's
 * email is not verified. Does NOT block app access — just nudges the user.
 */
function EmailVerificationBanner() {
  const { user, isEmailVerified, resendVerification } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // Don't show if verified, dismissed, or no user
  if (isEmailVerified || dismissed || !user) return null;

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      console.error('Resend failed:', err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-banner">
      <div className="verify-banner-content">
        <Mail size={15} />
        <span>
          {resent ? (
            <><CheckCircle2 size={13} style={{ verticalAlign: '-2px' }} /> Verification email sent! Check your inbox.</>
          ) : (
            <>Please verify your email <strong>{user.email}</strong> to secure your account.</>
          )}
        </span>
        {!resent && (
          <button
            className="verify-banner-resend"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending...' : 'Resend'}
          </button>
        )}
      </div>
      <button className="verify-banner-close" onClick={() => setDismissed(true)} title="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}

function CoordinatorRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/needs" element={<NeedsPage />} />
      <Route path="/submit" element={<SubmitNeedPage />} />
      <Route path="/volunteers" element={<VolunteersPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  );
}

function VolunteerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<VolunteerDashboard />} />
      <Route path="/my-tasks" element={<MyTasksPage />} />
      <Route path="/browse" element={<BrowseNeedsPage />} />
      <Route path="/profile" element={<MyProfilePage />} />
    </Routes>
  );
}

function AppRoutes() {
  const { user, loading, isVolunteer } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading SmartServe...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
              <AutoSeeder>
                <div className="app-layout">
                  <Sidebar />
                  <div className="app-main">
                    <Header />
                    <EmailVerificationBanner />
                    <main className="app-content">
                      {isVolunteer ? <VolunteerRoutes /> : <CoordinatorRoutes />}
                    </main>
                  </div>
                </div>
              </AutoSeeder>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
