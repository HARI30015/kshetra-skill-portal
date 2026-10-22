import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, needsOnboarding, loading, profileLoading, profile, fetchProfile } = useAuth();
  const location = useLocation();
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const retryTimer = useRef(null);

  // The backend sleeps when idle and can take 30-60s to wake. While it
  // wakes it fails FAST (502s), so a single fetchProfile() call can
  // exhaust its own retries before the server is even up. Stay patient
  // here: keep auto-retrying every 10s and only declare the load stuck
  // after a 90s deadline — the manual "Try Again" screen is a last
  // resort, not the first response to a cold server.
  useEffect(() => {
    setDeadlinePassed(false);
    setSlowLoad(false);
    const t = setTimeout(() => setDeadlinePassed(true), 90000);
    const t2 = setTimeout(() => setSlowLoad(true), 10000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [location.pathname]);

  // Auto-retry the profile fetch while we wait for the server to wake.
  useEffect(() => {
    if (!isAuthenticated || profile || profileLoading || deadlinePassed) return undefined;
    retryTimer.current = setTimeout(() => {
      fetchProfile();
    }, 10000);
    return () => clearTimeout(retryTimer.current);
  }, [isAuthenticated, profile, profileLoading, deadlinePassed, fetchProfile]);

  const handleRetry = async () => {
    setRetrying(true);
    setDeadlinePassed(false);
    try {
      await fetchProfile();
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Loader label="Checking your session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Profile still missing after the full patience window: last-resort
  // retry screen.
  if (!profile && deadlinePassed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-white mb-2">Couldn't load your profile</h2>
          <p className="text-white/60 text-sm mb-6">
            The server didn't respond in time. Check your connection and try again.
          </p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 text-white font-semibold disabled:opacity-50"
          >
            {retrying ? 'Retrying…' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Wait for the profile to resolve before deciding about roles or
  // onboarding — including on /onboarding itself, where a brand-new
  // user's profile may still be creating. Never bounce a user whose
  // role simply isn't known yet.
  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader label="Loading your profile…" />
        {slowLoad && (
          <p className="mt-3 max-w-sm px-6 text-center text-sm text-white/50">
            The server is waking up — this can take up to a minute. Hang tight…
          </p>
        )}
      </div>
    );
  }

  if (roles && role && !roles.includes(role)) {
    return <Navigate to={role === 'lecturer' ? '/lecturer' : '/dashboard'} replace />;
  }

  // Students who haven't finished onboarding get routed there (except when already there).
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
