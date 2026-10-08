import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Orbs from './components/Orbs';
import Loader from './components/Loader';

// Code-split: each page becomes its own lazy chunk so the initial
// bundle stays small and the site loads fast.
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LecturerDashboard = lazy(() => import('./pages/LecturerDashboard'));
const Placements = lazy(() => import('./pages/Placements'));

export default function App() {
  const location = useLocation();

  return (
    <div className="noise-overlay relative min-h-screen">
      <Orbs />
      <Navbar />
      <Suspense fallback={<Loader label="Loading…" />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute roles={['student']}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['student']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lecturer"
              element={
                <ProtectedRoute roles={['lecturer']}>
                  <LecturerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/placements"
              element={
                <ProtectedRoute roles={['student', 'lecturer']}>
                  <Placements />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
