import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, needsOnboarding, loading, profileLoading, profile, fetchProfile } = useAuth();
  const location = useLocation();
  const [waitedLong, setWaitedLong] = useState(false);
  const [slowLoad, setSlowLoad] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // The backend sleeps when idle and can take 30-60s to wake; the profile
  // fetch retries automatically during that window. Only treat the load
  // as stuck (and offer a manual retry) after 90s. After 10s, show a
  // "server is waking up" hint so the wait doesn't look like a hang.
  useEffect(() => {
    if (!profileLoading) {
      setWaitedLong(false);
      setSlowLoad(false);
      return;
    }
    const t = setTimeout(() => setWaitedLong(true), 90000);
    const t2 = setTimeout(() => setSlowLoad(true), 10000);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [profileLoading, location.pathname]);

  const handleRetry = async () => {
    setRetrying(true);
    setWaitedLong(false);
    try {
      await fetchProfile();
    } finally {
      setRetrying(false);
      // If it still fails, the timer will re-arm via the effect above.
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

  // Profile failed to load (not just slow): show a retry screen instead of
  // hanging forever. This covers backend hiccups and network blips.
  const profileStuck = !profileLoading && !profile && location.pathname !== '/onboarding';
  if (waitedLong || profileStuck) {
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

  // Wait for the profile to resolve before deciding about roles/onboarding.
  if (profileLoading || (isAuthenticated && !role && location.pathname !== '/onboarding')) {
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

  if (roles && !roles.includes(role)) {
    return <Navigate to={role === 'lecturer' ? '/lecturer' : '/dashboard'} replace />;
  }

  // Students who haven't finished onboarding get routed there (except when already there).
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
