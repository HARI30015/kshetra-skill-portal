import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, needsOnboarding, loading, profileLoading, profile, fetchProfile } = useAuth();
  const location = useLocation();
  const [waitedLong, setWaitedLong] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // If profile takes more than 12s, assume it's stuck and offer a retry
  // instead of hanging on the loader forever.
  useEffect(() => {
    if (!profileLoading) {
      setWaitedLong(false);
      return;
    }
    const t = setTimeout(() => setWaitedLong(true), 12000);
    return () => clearTimeout(t);
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
      <div className="min-h-screen">
        <Loader label="Loading your profile…" />
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
