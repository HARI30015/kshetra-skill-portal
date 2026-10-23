import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { getMyProfile, createProfile, deleteMyIncompleteProfile, getHealth } from '../api';

const AuthContext = createContext(null);

// Last-known profile cache (owner's rule, 2026-10-23): the dashboard
// must show the profile instantly instead of waiting on a cold server.
// Keyed by user id, so one user's cache never renders for another.
const PROFILE_CACHE_KEY = 'stdskillupps_profile_cache';

function readCachedProfile(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.userId === userId && parsed.profile ? parsed.profile : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(userId, profile) {
  if (!userId || !profile) return;
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ userId, profile }));
  } catch {
    // storage unavailable/full - caching is best-effort
  }
}

function clearCachedProfile() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const profileRef = useRef(null);
  const userIdRef = useRef(null);
  const applyProfile = useCallback((p) => {
    profileRef.current = p;
    setProfile(p);
  }, []);

  // Remove half-done profile data after a broken sign-in. The backend
  // only deletes a profile that was never onboarded and has no
  // user-entered fields, so completed profiles are always safe.
  // Best-effort: if the backend is unreachable there is nothing to clean.
  const cleanupIncomplete = useCallback(async () => {
    try {
      await deleteMyIncompleteProfile();
    } catch {
      // ignore — cleanup is best-effort
    }
  }, []);

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
      for (let attempt = 0; attempt < 6; attempt++) {
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
          // While the server wakes it fails FAST (502s), so keep
          // retrying for a good while — 6 attempts, 8s apart — instead
          // of giving up before the server is even up.
          if (status === 404 || status === 401 || status === 403) break;
          if (attempt < 5) await sleep(8000);
        }
      }
      if (fetched) {
        applyProfile(fetched);
        writeCachedProfile(userIdRef.current, fetched);
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
          applyProfile(p);
          writeCachedProfile(userIdRef.current, p);
          return p;
        } catch (createErr) {
          // eslint-disable-next-line no-console
          console.error('Failed to create profile:', createErr?.message);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch profile:', err?.message);
      }
      // Load failed (e.g. the server is still waking up): leave the
      // session untouched — ProtectedRoute keeps waiting/retrying.
      // Never sign the user out or delete data from here: a slow or
      // briefly unreachable server must not destroy a valid sign-in.
      // (Signing out here is what surfaced "Auth session missing"
      // during sign-in.) Half-done data cleanup happens on logout.
      // If a profile is already on screen (e.g. the cached one), keep
      // showing it - a slow server must not blank a dashboard that
      // already rendered. Only clear when there is nothing to show.
      if (!profileRef.current) {
        setProfile(null);
      }
      return profileRef.current;
    } finally {
      setProfileLoading(false);
    }
  }, [cleanupIncomplete, applyProfile]);

  // Ensure a profile row exists for a freshly-signed-up user, then load it.
  const ensureProfile = useCallback(
    async (fallbackName, fallbackRole) => {
      const existing = await fetchProfile();
      if (existing) return existing;
      try {
        const p = await createProfile({ full_name: fallbackName, role: fallbackRole });
        applyProfile(p);
        writeCachedProfile(userIdRef.current, p);
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
    // Signing out mid-setup abandons a half-done profile — delete it so
    // the next sign-in starts new. Completed profiles are kept (the
    // backend guard decides), so this is safe for finished accounts.
    await cleanupIncomplete();
    await supabase.auth.signOut();
    clearCachedProfile();
    userIdRef.current = null;
    applyProfile(null);
    setSession(null);
  }, [cleanupIncomplete, applyProfile]);

  useEffect(() => {
    let mounted = true;
    // Wake the backend the moment the app opens. It sleeps when idle
    // and needs 30-60s to start; firing this now means it's awake by
    // the time the user sends a sign-up code, sets a password, and the
    // app creates/loads their profile — instead of every one of those
    // steps waiting on a cold server. Fire-and-forget.
    getHealth().catch(() => {});
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return;
      // Zombie-session guard (owner report, 2026-10-23: "after creating
      // pass the dashboard not working"): getSession() trusts whatever
      // is stored locally, so a session left over from an account that
      // no longer exists (deleted test accounts, old sign-ups) passes
      // as "signed in" while every profile call fails - the app then
      // sits on the loading screen forever. Validate the stored
      // session against the server once; if the server rejects the
      // user itself, clear everything and start clean. Transient
      // network failures do NOT clear the session.
      if (s) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          const rejected =
            !user ||
            (error && (error.status === 401 || error.status === 403 || /not found/i.test(error.message || '')));
          if (rejected) {
            await supabase.auth.signOut();
            clearCachedProfile();
            if (!mounted) return;
            setSession(null);
            setLoading(false);
            return;
          }
        } catch {
          // validation unreachable - keep the session and proceed
        }
      }
      setSession(s);
      if (s) {
        userIdRef.current = s.user?.id || null;
        // Instant profile: show this user's last known profile right
        // away (2026-10-23); the fetch refreshes it in the background.
        const cached = readCachedProfile(userIdRef.current);
        if (cached && !profileRef.current) applyProfile(cached);
        fetchProfile();
      }
      // The session is known - end the session loader now instead of
      // waiting on the profile fetch (which can take a minute on a
      // cold server). The profile resolves separately.
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s) {
        userIdRef.current = s.user?.id || null;
        const cached = readCachedProfile(userIdRef.current);
        if (cached && !profileRef.current) applyProfile(cached);
        await fetchProfile();
      } else {
        userIdRef.current = null;
        clearCachedProfile();
        applyProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, applyProfile]);

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
