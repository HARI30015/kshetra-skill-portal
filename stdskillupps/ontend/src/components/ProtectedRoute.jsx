import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, needsOnboarding, loading, profileLoading } = useAuth();
  const location = useLocation();

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
