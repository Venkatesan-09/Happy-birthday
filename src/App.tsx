import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import { CreatorDashboard } from './features/creator/CreatorDashboard';
import { ExperienceWizard } from './features/creator/ExperienceWizard';
import { ExperienceBuilder } from './features/creator/ExperienceBuilder';
import { PublicRecipientView } from './features/recipient/PublicRecipientView';
import { ContributorSubmissionView } from './features/contributor/ContributorSubmissionView';
import { LoginView } from './features/auth/LoginView';
import { ProfileView } from './features/profile/ProfileView';
import { getAuthToken, api } from './services/api';

// Loading spinner component
function LoadingSplash() {
  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-400">
        <svg className="animate-spin w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <span className="text-xs font-medium">Loading DearYou…</span>
      </div>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({
  isAuthenticated,
  children,
}: {
  isAuthenticated: boolean | null;
  children: React.ReactNode;
}) {
  const location = useLocation();

  if (isAuthenticated === null) {
    return <LoadingSplash />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2c2623] selection:bg-amber-200 selection:text-amber-950 font-jakarta">
      {children}
    </div>
  );
}

// Recipient route wrapper — completely public, zero authentication required
function RecipientRoute() {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const targetSlug = slug || id || '';
  if (!targetSlug) return <Navigate to="/login" replace />;
  return <PublicRecipientView slug={targetSlug} />;
}

// Contributor route wrapper
function ContributorRoute() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  if (!token) return <Navigate to="/login" replace />;
  return <ContributorSubmissionView token={token} onExit={() => navigate('/')} />;
}

// Experience Studio wrapper
function ExperienceStudioRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return <Navigate to="/dashboard" replace />;

  return (
    <ExperienceBuilder
      experienceId={id}
      onBack={() => navigate('/dashboard')}
      onViewPublic={(slug) => navigate(`/birthday/${slug}`)}
    />
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    try {
      await api.auth.getMe();
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    api.auth.logout();
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <AppRoutes
        isAuthenticated={isAuthenticated}
        onAuthenticated={() => setIsAuthenticated(true)}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  );
}

function AppRoutes({
  isAuthenticated,
  onAuthenticated,
  onLogout,
}: {
  isAuthenticated: boolean | null;
  onAuthenticated: () => void;
  onLogout: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Public Recipient View & Shared Preview Routes (No login required) */}
      <Route path="/birthday/:slug" element={<RecipientRoute />} />
      <Route path="/view/:slug" element={<RecipientRoute />} />
      <Route path="/preview/:slug" element={<RecipientRoute />} />
      <Route path="/e/:slug" element={<RecipientRoute />} />
      <Route path="/share/:slug" element={<RecipientRoute />} />
      <Route path="/experience/:slug" element={<RecipientRoute />} />

      {/* Public Contributor Submission View */}
      <Route path="/contribute/:token" element={<ContributorRoute />} />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginView initialMode="login" onAuthenticated={onAuthenticated} />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginView initialMode="register" onAuthenticated={onAuthenticated} />
          )
        }
      />

      {/* Creator Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <CreatorDashboard
              onCreateNew={() => navigate('/create')}
              onOpenExperience={(id) => navigate(`/experience/${id}/edit`)}
              onOpenProfile={() => navigate('/profile')}
              onLogout={onLogout}
            />
          </ProtectedRoute>
        }
      />

      {/* Create New Experience Wizard */}
      <Route
        path="/create"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ExperienceWizard
              onCancel={() => navigate('/dashboard')}
              onCreated={(id) => navigate(`/experience/${id}/edit`)}
            />
          </ProtectedRoute>
        }
      />

      {/* Experience Builder / Studio */}
      <Route
        path="/experience/:id/edit"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ExperienceStudioRoute />
          </ProtectedRoute>
        }
      />

      {/* User Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ProfileView onLogout={onLogout} />
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated === null ? (
            <LoadingSplash />
          ) : isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Fallback 404 redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
