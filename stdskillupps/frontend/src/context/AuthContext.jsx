import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getMyProfile, createProfile } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      // The backend (free tier) sleeps when idle and can take 30-60s to
      // wake. Retry network / 5xx failures a few times so a cold start
      // doesn't surface as "Couldn't load your profile" — the first
      // attempt wakes the server, a later one succeeds.
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let fetched = null;
      let err = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          fetched = await getMyProfile();
          err = null;
          break;
        } catch (e) {
          err = e;
          const status = e?.response?.status;
          // 404 = no profile row yet (handled below). 401/403 = an auth
          // problem retrying can't fix. Anything else (network error,
          // 502/503/504 while the server wakes) is worth another try.
          if (status === 404 || status === 401 || status === 403) break;
          if (attempt < 3) await sleep(5000);
        }
      }
      if (fetched) {
        setProfile(fetched);
        return fetched;
      }
      if (err?.response?.status === 404) {
        // New user with no profile row yet — create one from their signup
        // metadata so protected routes don't hang on "Loading your profile…".
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          const meta = user?.user_metadata || {};
          const p = await createProfile({
            full_name: meta.full_name || user?.email?.split('@')[0] || 'Student',
            role: meta.role === 'lecturer' ? 'lecturer' : 'student',
          });
          setProfile(p);
          return p;
        } catch (createErr) {
          // eslint-disable-next-line no-console
          console.error('Failed to create profile:', createErr?.message);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch profile:', err?.message);
      }
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Ensure a profile row exists for a freshly-signed-up user, then load it.
  const ensureProfile = useCallback(
    async (fallbackName, fallbackRole) => {
      const existing = await fetchProfile();
      if (existing) return existing;
      try {
        const p = await createProfile({ full_name: fallbackName, role: fallbackRole });
        setProfile(p);
        return p;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to create profile:', err?.message);
        return null;
      }
    },
    [fetchProfile]
  );

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s) {
        fetchProfile().finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s) {
        await fetchProfile();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const value = useMemo(
    () => ({
      session,
      profile,
      role: profile?.role || null,
      loading,
      profileLoading,
      isAuthenticated: !!session,
      needsOnboarding:
        !!session && !!profile && profile.role === 'student' && !profile.onboarded,
      fetchProfile,
      ensureProfile,
      refreshProfile,
      logout,
    }),
    [session, profile, loading, profileLoading, fetchProfile, ensureProfile, refreshProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
