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
import { Mail, RefreshCw, LogOut, CheckCircle2, Zap } from 'lucide-react';
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

function EmailVerificationGate({ children }) {
  const { user, isEmailVerified, resendVerification, logout } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  // If verified or Google user, pass through
  if (isEmailVerified) {
    return children;
  }

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      alert('Failed to resend: ' + err.message);
    } finally {
      setResending(false);
    }
  };

  const handleRefresh = () => {
    // Force reload to re-check emailVerified from Firebase
    window.location.reload();
  };

  return (
    <div className="verify-email-screen">
      <div className="login-bg">
        <div className="bg-shape shape-1" />
        <div className="bg-shape shape-2" />
        <div className="bg-shape shape-3" />
      </div>
      <div className="verify-email-container">
        <div className="login-brand">
          <div className="brand-icon">
            <Zap size={28} />
          </div>
          <h1>SmartServe</h1>
        </div>
        <div className="verify-email-card glass-card">
          <div className="verify-icon">
            <Mail size={32} />
          </div>
          <h2>Verify Your Email</h2>
          <p className="verify-desc">
            We've sent a verification link to <strong>{user?.email}</strong>.
            Please check your inbox and click the link to activate your account.
          </p>

          {resent && (
            <div className="verify-success-msg animate-fade-in">
              <CheckCircle2 size={16} />
              <span>Verification email resent successfully!</span>
            </div>
          )}

          <div className="verify-actions">
            <button className="btn-primary" onClick={handleRefresh} id="verify-refresh-btn">
              <RefreshCw size={16} />
              <span>I've Verified — Refresh</span>
            </button>
            <button
              className="btn-secondary"
              onClick={handleResend}
              disabled={resending}
              id="verify-resend-btn"
            >
              <Mail size={16} />
              <span>{resending ? 'Sending...' : 'Resend Verification Email'}</span>
            </button>
            <button
              className="btn-secondary"
              onClick={logout}
              id="verify-logout-btn"
              style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>

          <p className="verify-hint">
            Check your spam folder if you don't see the email.
          </p>
        </div>
      </div>
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
            <EmailVerificationGate>
              <AutoSeeder>
                <div className="app-layout">
                  <Sidebar />
                  <div className="app-main">
                    <Header />
                    <main className="app-content">
                      {isVolunteer ? <VolunteerRoutes /> : <CoordinatorRoutes />}
                    </main>
                  </div>
                </div>
              </AutoSeeder>
            </EmailVerificationGate>
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
