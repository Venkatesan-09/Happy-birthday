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

// ─────────────────────────────────────────────────────────────────────────────
// Public path detection — runs synchronously before any React state
// These paths NEVER require authentication and should NEVER trigger any redirect
// ─────────────────────────────────────────────────────────────────────────────
const PUBLIC_PATH_PREFIXES = [
  '/birthday/',
  '/view/',
  '/preview/',
  '/e/',
  '/contribute/',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI components
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Route wrappers
// ─────────────────────────────────────────────────────────────────────────────

// Protected Route — requires authentication
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

// Public Recipient Route — ZERO auth, ZERO redirect risk
function RecipientRoute() {
  const { slug, id } = useParams<{ slug?: string; id?: string }>();
  const targetSlug = slug || id || '';
  if (!targetSlug) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-stone-500 text-sm">Birthday experience not found.</p>
      </div>
    );
  }
  return <PublicRecipientView slug={targetSlug} />;
}

// Public Contributor Route — no auth needed
function ContributorRoute() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  if (!token) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center">
        <p className="text-stone-500 text-sm">Invalid contributor link.</p>
      </div>
    );
  }
  return <ContributorSubmissionView token={token} onExit={() => navigate('/')} />;
}

// Creator Studio route — requires auth (wrapped by ProtectedRoute in AppRoutes)
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

// ─────────────────────────────────────────────────────────────────────────────
// Root App — two-tier routing: public-only OR full authenticated app
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  // IMPORTANT: If this is a public recipient/contributor URL, mount a completely
  // isolated router with ZERO auth logic. The auth state (isAuthenticated) is
  // never created, never checked, and can never redirect to /login.
  if (isPublicPath(currentPath)) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/birthday/:slug" element={<RecipientRoute />} />
          <Route path="/view/:slug" element={<RecipientRoute />} />
          <Route path="/preview/:slug" element={<RecipientRoute />} />
          <Route path="/e/:slug" element={<RecipientRoute />} />
          <Route path="/contribute/:token" element={<ContributorRoute />} />
          {/* Safety fallback — still shows public view, never redirects */}
          <Route path="*" element={<RecipientRoute />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // All other paths use the full authenticated app
  return <AuthenticatedApp />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Authenticated App — handles auth state + protected routes
// ─────────────────────────────────────────────────────────────────────────────

function AuthenticatedApp() {
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
      {/* Public Recipient View & Shared Preview Routes — also available here for
          in-app navigation (e.g. creator clicking "View Live" from the editor) */}
      <Route path="/birthday/:slug" element={<RecipientRoute />} />
      <Route path="/view/:slug" element={<RecipientRoute />} />
      <Route path="/preview/:slug" element={<RecipientRoute />} />
      <Route path="/e/:slug" element={<RecipientRoute />} />
      <Route path="/share/:slug" element={<RecipientRoute />} />

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

      {/* Fallback 404 — intentionally does NOT redirect to / */}
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-6 text-center gap-4">
            <h2 className="font-playfair font-bold text-2xl text-stone-800">Page Not Found</h2>
            <p className="text-stone-500 text-sm">The page you are looking for doesn't exist.</p>
            <a href="/" className="px-5 py-2.5 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition">
              Go Home
            </a>
          </div>
        }
      />
    </Routes>
  );
}
