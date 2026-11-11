import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import GlassCard from '../components/GlassCard';
import AnimatedInput from '../components/AnimatedInput';
import Avatar from '../components/Avatar';
import DashboardTabs from '../components/DashboardTabs';
import { supabase } from '../supabaseClient';
import {
  MilestoneRing,
  MilestoneBar,
  AchievementsCard,
  YearRoadmap,
  computeStreak,
} from '../components/DashboardExtras';
import { useAuth } from '../context/AuthContext';
import { LEETCODE_URL, CAMPUSTRACK_URL } from '../constants';
import {
  syncStats,
  getStats,
  generateRecommendation,
  getRecommendation,
  updateProfile,
  getCtSyncKey,
  getMyLoginHistory,
} from '../api';

/* ------------------------------------------------------------------ */
/* Static data                                                         */
/* ------------------------------------------------------------------ */

const FIELD_RESOURCES = {
  SWE: ['C++', 'Java', 'Python'],
  'Data Science': ['Python', 'SQL', 'R'],
  Frontend: ['JavaScript', 'TypeScript', 'CSS'],
  Backend: ['Java', 'Python', 'Go'],
  DevOps: ['Bash', 'Python', 'Go'],
  Mobile: ['Kotlin', 'Swift', 'Dart'],
};

const RESOURCE_LINKS = {
  'C++': 'https://en.cppreference.com/',
  Java: 'https://docs.oracle.com/en/java/',
  Python: 'https://docs.python.org/3/',
  SQL: 'https://www.w3schools.com/sql/',
  R: 'https://www.r-project.org/',
  JavaScript: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
  TypeScript: 'https://www.typescriptlang.org/docs/',
  CSS: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
  Go: 'https://go.dev/doc/',
  Bash: 'https://www.gnu.org/software/bash/manual/',
  Kotlin: 'https://kotlinlang.org/docs/home.html',
  Swift: 'https://www.swift.org/documentation/',
  Dart: 'https://dart.dev/guides',
};

const YEAR_GUIDE = {
  1: {
    title: 'Year 1 · Explore and build habits',
    text: 'Learn programming basics, try one language, and start solving easy problems a few times a week.',
  },
  2: {
    title: 'Year 2 · Foundations and language choice',
    text: 'Lock in data-structure basics and choose the main language you will interview in.',
  },
  3: {
    title: 'Year 3 · Faster training',
    text: 'Raise your pace: daily practice, medium problems, projects and core CS subjects.',
  },
  4: {
    title: 'Year 4 · Intensive placement sprint',
    text: 'Sprint mode: timed mocks, hard patterns, resume polish and company-wise preparation.',
  },
};

const CT_LOGIN_URL = 'https://vardhaman.campustrack.in/login';

// INTERIM (for now): the LeetCode Add action directs to LeetCode's login
// page first; the username panel still opens so the profile can be saved.
const LEETCODE_LOGIN_URL = 'https://leetcode.com/accounts/login/';

// Progress milestones (display only). LeetCode: solved-count targets.
const LC_STEPS = [1, 10, 25, 50, 100, 150, 200, 300, 500, 750, 1000];
// CampusTrack: the real maximum score is not known to the app. If you know it
// (e.g. 1000), set CT_MAX to that number and the bar will show score / CT_MAX.
// While it is null, the bar shows progress toward the next round milestone.
const CT_MAX = null;
const CT_STEPS = [50, 100, 250, 500, 1000, 2500, 5000, 10000];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isNotFound = (e) => e?.response?.status === 404;
const isTransient = (e) =>
  !e?.response || [408, 429, 500, 502, 503, 504].includes(e.response.status);

const errMsg = (e, fallback) => {
  const d = e?.response?.data?.detail;
  if (typeof d === 'string' && d) return d;
  if (!e?.response) return 'Couldn’t reach the server. It may still be waking up.';
  return fallback;
};

// Turns the backend's raw LeetCode warning into something readable.
const friendlyLeetCodeWarning = (w) => {
  const t = String(w || '');
  if (/not found/i.test(t)) return 'LeetCode user not found. Check the username and try again.';
  return 'Couldn’t reach LeetCode right now. Tap Sync to try again.';
};

// Retries transient failures (server waking up) for up to ~100s in total.
async function withRetry(fn, alive, onRetry) {
  const started = Date.now();
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (!alive() || isNotFound(e) || !isTransient(e) || Date.now() - started > 100000) throw e;
      onRetry();
      await sleep(Math.min(3000 * (i + 1), 12000));
      if (!alive()) throw e;
    }
  }
}

// Loads one remote resource with its own status, so no card blocks another.
function useResource(key, fetcher, enabled) {
  const [state, setState] = useState({ status: 'loading', data: null, error: '', waking: false });
  const run = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async () => {
    const id = ++run.current;
    const alive = () => id === run.current;
    setState((s) => ({ ...s, status: 'loading', error: '', waking: false }));
    try {
      const data = await withRetry(
        () => fetcherRef.current(),
        alive,
        () => alive() && setState((s) => ({ ...s, waking: true }))
      );
      if (alive()) setState({ status: 'ready', data, error: '', waking: false });
    } catch (e) {
      if (!alive()) return;
      if (isNotFound(e)) setState({ status: 'empty', data: null, error: '', waking: false });
      else
        setState({
          status: 'error',
          data: null,
          error: errMsg(e, 'Something went wrong while loading this.'),
          waking: false,
        });
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
    return () => {
      run.current++;
    };
  }, [enabled, key, load]);

  const setData = useCallback((data) => {
    run.current++;
    setState({ status: data ? 'ready' : 'empty', data: data || null, error: '', waking: false });
  }, []);

  return { ...state, reload: load, setData };
}

/* ------------------------------------------------------------------ */
/* Small UI pieces                                                     */
/* ------------------------------------------------------------------ */

function Spinner({ size = 20 }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block animate-spin rounded-full border-2 border-white/20 border-t-white"
      style={{ width: size, height: size }}
    />
  );
}

function TapButton({ children, onClick, loading, disabled, variant = 'primary', type = 'button', className = '' }) {
  const styles = {
    primary: 'bg-white text-black shadow-glow',
    secondary: 'border border-white/20 bg-white/10 text-white hover:bg-white/15',
    ghost: 'text-zinc-200 hover:text-zinc-200',
  };
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      data-variant={variant}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.08 }}
      className={`liquid-button inline-flex touch-manipulation select-none items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
    >
      {loading && <Spinner size={14} />}
      {children}
    </motion.button>
  );
}

function CardLoading({ label, waking, compact }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`flex flex-col items-center gap-3 text-center ${compact ? 'mt-3 py-2' : 'mt-8 py-6'}`}>
      <Spinner />
      <p className="text-sm text-zinc-300">{label}</p>
      {(slow || waking) && (
        <p className="max-w-xs text-xs text-zinc-400">
          Our free server naps when idle and can take up to a minute to wake. You can keep using the rest of the page.
        </p>
      )}
    </div>
  );
}

function CardError({ message, onRetry, busy, compact }) {
  return (
    <div className={`rounded-2xl border border-white/30 bg-white/10 p-4 text-center ${compact ? 'mt-3' : 'mt-6'}`}>
      <p className="text-sm text-zinc-200">{message}</p>
      <TapButton variant="secondary" onClick={onRetry} loading={busy} className="mt-3">
        ↻ Retry
      </TapButton>
    </div>
  );
}

function AnimatedCounter({ value, duration = 0.9 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * (value || 0)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
}

// A javascript: href set through the DOM so React never strips or blocks it.
function BookmarkletLink({ code }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.setAttribute('href', code);
  }, [code]);
  return (
    <a
      ref={ref}
      href="#"
      onClick={(e) => e.preventDefault()}
      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black shadow-glow"
    >
      🔖 Sync to stdskillupps
    </a>
  );
}

function EditPanel({ onSubmit, onCancel, saving, children }) {
  return (
    <motion.form
      data-edit-panel
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/5 p-4"
    >
      {children}
      <div className="flex gap-3 pt-1">
        <TapButton variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </TapButton>
        <TapButton type="submit" loading={saving} className="flex-1">
          {saving ? 'Saving…' : 'Save'}
        </TapButton>
      </div>
    </motion.form>
  );
}

function ProfileWait({ onRetry, onLogout, loggingOut }) {
  const [slow, setSlow] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, []);
  const retry = async () => {
    setBusy(true);
    await onRetry();
    setBusy(false);
  };
  return (
    <PageWrapper>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
        <h1 className="text-3xl font-extrabold text-white">
          Welcome back 👋 <span className="text-gradient">getting your dashboard ready…</span>
        </h1>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <GlassCard key={i} delay={0.05 * i}>
              <div className="animate-pulse space-y-3">
                <div className="h-5 w-1/2 rounded bg-white/15" />
                <div className="h-4 w-full rounded bg-white/10" />
                <div className="h-4 w-3/4 rounded bg-white/10" />
              </div>
            </GlassCard>
          ))}
        </div>
        <GlassCard delay={0.1} className="mt-6">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <Spinner />
            <p className="text-sm text-zinc-300">Loading your profile…</p>
            {slow && (
              <>
                <p className="max-w-sm text-xs text-zinc-400">
                  This is taking longer than usual — our free server may be waking up. Try again, or log out and back in.
                </p>
                <div className="flex gap-3">
                  <TapButton onClick={retry} loading={busy}>
                    ↻ Retry
                  </TapButton>
                  <TapButton variant="secondary" onClick={onLogout} loading={loggingOut}>
                    Log out
                  </TapButton>
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </main>
    </PageWrapper>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const auth = useAuth();
  const { profile, refreshProfile } = auth;
  const pid = profile?.id;
  const username = profile?.leetcode_username || '';

  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);
  const toast = useCallback((msg, ms = 3500) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), ms);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const refreshRef = useRef(refreshProfile);
  refreshRef.current = refreshProfile;
  const safeRefresh = useCallback(async () => {
    try {
      await refreshRef.current?.();
    } catch {
      /* keep showing the cached profile */
    }
  }, []);

  // Independent, progressive loads.
  const stats = useResource(pid, () => getStats(pid), !!pid);
  const plan = useResource(pid, () => getRecommendation(pid), !!pid);
  const ct = useResource('ct-sync-key', () => getCtSyncKey(), true);
  // Sign-in history for the streak. If the endpoint is missing or fails, the
  // streak simply stays hidden (never faked).
  const history = useResource('login-history', () => getMyLoginHistory(), !!pid);
  const { setData: setStatsData } = stats;
  const { setData: setPlanData } = plan;

  const [syncBusy, setSyncBusy] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [planBusy, setPlanBusy] = useState(false);
  const [planError, setPlanError] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editing, setEditing] = useState(null); // 'profile' | 'lc' | 'ct' | null
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [refreshingCt, setRefreshingCt] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const avatarInputRef = useRef(null);
  const bmRef = useRef(null);
  const autoSyncKey = useRef('');
  const autoPlanKey = useRef('');
  const statsRef = useRef(null);
  statsRef.current = stats.data;

  const doSync = useCallback(
    async (opts = {}) => {
      if (!pid) return;
      setSyncBusy(true);
      setSyncError('');
      try {
        // Retry transient failures (free server waking up) the same
        // way the page loads do — a single attempt fails fast with
        // 502 while the server wakes, which is why the Sync button
        // looked dead on the first tap after idle. syncStats is an
        // idempotent upsert, so retrying it is safe.
        const s = await withRetry(() => syncStats(pid), () => true, () => {});
        if (s?.warning) {
          // LeetCode could not be read. A warning response is never
          // real data, so its numbers are NOT shown: any stats the
          // card already has stay, and the readable warning appears
          // (inline under the card, or as the error card with Retry
          // when there is nothing to show yet), plus a toast.
          const msg = friendlyLeetCodeWarning(s.warning);
          setSyncError(msg);
          if (!opts.silent) toast(msg, 4500);
        } else {
          setStatsData(s);
          if (!opts.silent) toast('LeetCode stats synced 🎉');
        }
      } catch (e) {
        const msg = errMsg(e, 'Sync failed. Check your LeetCode username.');
        setSyncError(msg);
        if (!opts.silent) toast(msg, 4500);
      } finally {
        setSyncBusy(false);
      }
    },
    [pid, setStatsData, toast]
  );

  const doGenerate = useCallback(
    async (opts = {}) => {
      if (!pid) return;
      setPlanBusy(true);
      setPlanError('');
      try {
        const r = await generateRecommendation(pid);
        setPlanData(r);
        if (!opts.silent) toast('Your plan is ready ✨');
      } catch (e) {
        const msg = errMsg(e, 'Could not generate a plan yet.');
        setPlanError(msg);
        if (!opts.silent) toast(msg, 4500);
      } finally {
        setPlanBusy(false);
      }
    },
    [pid, setPlanData, toast]
  );

  // No stored stats yet + a username on the profile: fetch the score once, automatically.
  useEffect(() => {
    if (stats.status !== 'empty' || !pid || !username) return;
    const k = `${pid}:${username}`;
    if (autoSyncKey.current === k) return;
    autoSyncKey.current = k;
    doSync({ silent: true });
  }, [stats.status, pid, username, doSync]);

  // No stored plan yet: build the first one automatically.
  useEffect(() => {
    if (plan.status !== 'empty' || !pid) return;
    if (autoPlanKey.current === pid) return;
    autoPlanKey.current = pid;
    doGenerate({ silent: true });
  }, [plan.status, pid, doGenerate]);

  // When the student returns from CampusTrack (bookmarklet), pick up the new score.
  useEffect(() => {
    if (!pid) return undefined;
    let last = Date.now();
    const onVis = () => {
      if (document.visibilityState === 'visible' && Date.now() - last > 20000) {
        last = Date.now();
        safeRefresh();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [pid, safeRefresh]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const fn = auth.logout || auth.signOut || auth.signout || auth.logOut;
      if (typeof fn === 'function') await Promise.race([fn(), sleep(4000)]);
    } catch {
      /* fall through to local cleanup */
    }
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.toLowerCase().includes('profile')) localStorage.removeItem(k);
      });
    } catch {
      /* storage unavailable */
    }
    // Owner's flow (2026-10-23): after logout, go to the Login page,
    // not the landing page.
    window.location.assign('/login');
  };

  if (!profile) {
    return <ProfileWait onRetry={safeRefresh} onLogout={handleLogout} loggingOut={loggingOut} />;
  }

  /* ---------- derived values (profile exists from here on) ---------- */

  const year = Number(profile.year_of_study) || 1;
  const yearsLeft = Math.max(4 - year, 0);
  const field = profile.target_job_field;
  const languages = (field && FIELD_RESOURCES[field]) || FIELD_RESOURCES.SWE;
  const guide = YEAR_GUIDE[year] || YEAR_GUIDE[1];
  const firstName = profile.full_name?.split(' ')[0] || 'there';
  const ctUsername = profile.campus_track_username || '';
  const ctScore = profile.campustrack_score ?? profile.campus_track_score;
  const s = stats.data;
  const r = plan.data;
  const bookmarklet = ct.data?.bookmarklet;
  const streakDays = history.status === 'ready' ? computeStreak(history.data) : 0;
  const diffBuckets = [
    { label: 'Easy', value: s?.easy_solved || 0, color: 'from-zinc-300 to-white' },
    { label: 'Medium', value: s?.medium_solved || 0, color: 'from-zinc-400 to-zinc-200' },
    { label: 'Hard', value: s?.hard_solved || 0, color: 'from-zinc-500 to-zinc-300' },
  ];
  const maxSolved = Math.max(s?.total_solved || 0, 1);
  const langStats = s?.language_stats || {};
  const scheduleText = r?.plan_text || '';
  const scheduleParas = scheduleText.split(/\n{2,}/).filter((p) => p.trim());
  const scheduleLong = scheduleText.length > 600;

  /* ---------- actions ---------- */

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openEdit = (kind) => {
    setForm({
      full_name: profile.full_name || '',
      year_of_study: year,
      target_job_field: profile.target_job_field || '',
      leetcode_username: profile.leetcode_username || '',
      campus_track_username: profile.campus_track_username || '',
      campustrack_score: ctScore ?? '',
    });
    setEditing(kind);
    // Make the opened panel unmistakable: once React has rendered
    // it, scroll it into the middle of the viewport and focus its
    // first field, so a tap can never look like "nothing happened".
    setTimeout(() => {
      const field = document.querySelector('[data-edit-panel] input, [data-edit-panel] select');
      if (field) {
        field.scrollIntoView({ block: 'center', behavior: 'smooth' });
        try {
          field.focus();
        } catch {
          // focus is best-effort (e.g. touch keyboards)
        }
      }
    }, 50);
  };

  // LeetCode Add: open the username panel on THIS site first (so the tap
  // always visibly does something), then try the LeetCode login tab with a
  // real user-gesture window.open. If a popup blocker stops the tab, the
  // panel itself carries a real "Log in to LeetCode" link. While the panel
  // is already open, tapping Add only brings it back into focus.
  const openLeetCodeAdd = () => {
    const alreadyOpen = editing === 'lc';
    openEdit('lc');
    if (!alreadyOpen) {
      try {
        window.open(LEETCODE_LOGIN_URL, '_blank', 'noopener,noreferrer');
      } catch {
        /* blocked: the panel shows the login link */
      }
    }
  };

  // Always send the full field set so a partial edit never wipes other fields.
  const payloadWith = (o) => ({
    full_name: profile.full_name || '',
    year_of_study: year,
    target_job_field: profile.target_job_field || null,
    leetcode_username: profile.leetcode_username || null,
    campus_track_username: profile.campus_track_username || null,
    campustrack_score: ctScore == null || ctScore === '' ? null : Number(ctScore),
    ...o,
  });

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const nextYear = Number(form.year_of_study) || 1;
      const nextField = (form.target_job_field || '').trim() || null;
      // Same retry as the LeetCode Save: a sleeping backend must not
      // fail the Edit profile Save on the first tap. withRetry
      // rethrows real 400s at once — only transient failures retry.
      // updateProfile is idempotent, so retrying is safe.
      await withRetry(
        () =>
          updateProfile(
            profile.id,
            payloadWith({
              full_name: (form.full_name || '').trim() || profile.full_name || '',
              year_of_study: nextYear,
              target_job_field: nextField,
            })
          ),
        () => true,
        () => {}
      );
      const changed = nextYear !== year || nextField !== (profile.target_job_field || null);
      setEditing(null);
      toast(changed ? 'Profile updated ✓ — refreshing your plan…' : 'Profile updated ✓');
      safeRefresh();
      if (changed) doGenerate({ silent: true });
    } catch (err) {
      toast(errMsg(err, 'Update failed.'), 4500);
    } finally {
      setSaving(false);
    }
  };

  const saveLeetCode = async (e) => {
    e.preventDefault();
    const next = (form.leetcode_username || '').trim();
    setSaving(true);
    try {
      // Same retry as doSync: a sleeping backend must not fail the
      // Save button on the first tap. withRetry rethrows real 400s
      // (e.g. "LeetCode user not found") at once — only transient
      // failures retry. updateProfile is idempotent, so retrying is safe.
      await withRetry(
        () => updateProfile(profile.id, payloadWith({ leetcode_username: next || null })),
        () => true,
        () => {}
      );
    } catch (err) {
      toast(errMsg(err, 'Couldn’t save your username.'), 4500);
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(null);
    safeRefresh();
    if (next) {
      autoSyncKey.current = `${profile.id}:${next}`;
      toast('Username saved — fetching your score…');
      doSync();
    } else {
      setStatsData(null);
      setSyncError('');
      toast('LeetCode username removed');
    }
  };

  const saveCampus = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const raw = String(form.campustrack_score ?? '').trim();
      const score = raw === '' ? null : Number(raw);
      if (score !== null && Number.isNaN(score)) {
        toast('Score must be a number.');
        return;
      }
      await updateProfile(
        profile.id,
        payloadWith({
          campus_track_username: (form.campus_track_username || '').trim() || null,
          campustrack_score: score,
        })
      );
      setEditing(null);
      safeRefresh();
      toast('CampusTrack details saved ✓');
    } catch (err) {
      toast(errMsg(err, 'Update failed.'), 4500);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !pid) return;
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(file.type)) {
      toast('Choose a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('Profile photos must be 2 MB or smaller.');
      return;
    }

    const objectPath = `${pid}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setAvatarBusy(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(objectPath, file, { contentType: file.type, cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      try {
        await updateProfile(pid, { avatar_path: objectPath });
      } catch (saveError) {
        await supabase.storage.from('profile-pictures').remove([objectPath]);
        throw saveError;
      }

      if (profile.avatar_path) {
        await supabase.storage.from('profile-pictures').remove([profile.avatar_path]);
      }
      await safeRefresh();
      toast('Profile photo updated.');
    } catch (err) {
      toast(err?.response?.data?.detail || err?.message || 'Could not update the profile photo.', 4500);
    } finally {
      setAvatarBusy(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (passwordForm.password.length < 6) {
      toast('Password must be at least 6 characters.');
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      toast('Passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    try {
      const { error: passwordError } = await supabase.auth.updateUser({ password: passwordForm.password });
      if (passwordError) throw passwordError;
      setPasswordForm({ password: '', confirm: '' });
      setPasswordOpen(false);
      toast('Password updated.');
    } catch (err) {
      toast(err?.message || 'Could not update the password.', 4500);
    } finally {
      setPasswordBusy(false);
    }
  };

  const refreshCtScore = async () => {
    setRefreshingCt(true);
    await safeRefresh();
    setRefreshingCt(false);
    toast('Checked for your latest score');
  };

  const copyBookmarklet = async () => {
    if (!bookmarklet) return;
    try {
      await navigator.clipboard.writeText(bookmarklet);
      toast('Bookmark code copied ✓');
    } catch {
      bmRef.current?.select();
      try {
        document.execCommand('copy');
        toast('Bookmark code copied ✓');
      } catch {
        toast('Code selected — press Ctrl/Cmd + C to copy.');
      }
    }
  };

  /* ---------- LeetCode card body ---------- */

  let statsBody;
  if ((stats.status === 'loading' && !s) || (!s && syncBusy)) {
    statsBody = (
      <CardLoading
        label={syncBusy ? 'Syncing your LeetCode score…' : 'Loading your stats…'}
        waking={stats.waking}
      />
    );
  } else if (stats.status === 'error' && !s) {
    statsBody = <CardError message={stats.error} onRetry={stats.reload} />;
  } else if (s) {
    statsBody = (
      <div className="mt-6">
        <div className="text-center">
          <motion.div
            key={s.total_solved}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-gradient text-5xl font-extrabold"
          >
            <AnimatedCounter value={s.total_solved} />
          </motion.div>
          <p className="mt-1 text-xs font-medium uppercase tracking-widest text-zinc-400">Total solved</p>
        </div>
        <MilestoneRing value={s.total_solved} steps={LC_STEPS} />
        <div className="mt-6 space-y-4">
          {diffBuckets.map((b, i) => (
            <div key={b.label}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium text-zinc-300">{b.label}</span>
                <span className="font-bold text-white">
                  <AnimatedCounter value={b.value} />
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((b.value / maxSolved) * 100, 100)}%` }}
                  transition={{ duration: 0.9, delay: 0.1 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`h-full rounded-full bg-gradient-to-r ${b.color}`}
                />
              </div>
            </div>
          ))}
        </div>
        {Object.keys(langStats).length > 0 && (
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-zinc-300">Languages used</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(langStats).map(([lang, count]) => (
                <span
                  key={lang}
                  className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white"
                >
                  {lang} · {count}
                </span>
              ))}
            </div>
          </div>
        )}
        {syncError && <p className="mt-4 text-center text-xs text-zinc-200">{syncError}</p>}
        {s.synced_at && (
          <p className="mt-4 text-right text-xs text-zinc-500">
            Last synced: {new Date(s.synced_at).toLocaleString()}
          </p>
        )}
      </div>
    );
  } else if (!username) {
    statsBody = (
      <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
        <p className="text-sm text-zinc-300">LeetCode is not linked yet. Add your username in the actions panel to see your real solved counts here.</p>
      </div>
    );
  } else if (syncError) {
    statsBody = <CardError message={syncError} onRetry={() => doSync()} busy={syncBusy} />;
  } else {
    statsBody = <CardLoading label="Fetching your LeetCode score…" />;
  }

  /* ---------- Plan card body ---------- */

  let planBody;
  if (plan.status === 'loading' && !r) {
    planBody = <CardLoading label="Loading your plan…" waking={plan.waking} />;
  } else if (plan.status === 'error' && !r) {
    planBody = <CardError message={plan.error} onRetry={plan.reload} />;
  } else if (!r && planBusy) {
    planBody = <CardLoading label="Building your personalised plan…" />;
  } else if (!r) {
    planBody = planError ? (
      <CardError message={planError} onRetry={() => doGenerate()} busy={planBusy} />
    ) : (
      <CardLoading label="Building your personalised plan…" />
    );
  } else {
    planBody = (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {planError && <p className="mt-4 text-xs text-zinc-200">{planError}</p>}
        {r.recommended_languages?.length > 0 && (
          <div className="mt-5">
            <p className="mb-2.5 text-sm font-semibold text-zinc-300">Recommended languages</p>
            <div className="flex flex-wrap gap-2">
              {r.recommended_languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black shadow-glow"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
        {r.focus_areas?.length > 0 && (
          <div className="mt-5">
            <p className="mb-2.5 text-sm font-semibold text-zinc-300">Focus areas</p>
            <ul className="space-y-2">
              {r.focus_areas.map((area, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-zinc-200"
                >
                  <span className="mt-0.5 text-zinc-200">▸</span> {area}
                </li>
              ))}
            </ul>
          </div>
        )}
        {scheduleText && (
          <div className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-5">
            <p className="mb-3 text-sm font-semibold text-zinc-300">📅 Your exact schedule</p>
            <div className={`relative space-y-3 ${scheduleLong && !scheduleOpen ? 'max-h-60 overflow-hidden' : ''}`}>
              {scheduleParas.map((p, i) => (
                <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-zinc-200">
                  {p}
                </p>
              ))}
              {scheduleLong && !scheduleOpen && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-900/80 to-transparent" />
              )}
            </div>
            {scheduleLong && (
              <TapButton variant="ghost" onClick={() => setScheduleOpen((o) => !o)} className="mt-2 px-0">
                {scheduleOpen ? 'Show less ▲' : 'Show full schedule ▼'}
              </TapButton>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  /* ---------- render ---------- */

  return (
    <PageWrapper>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-28">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-white"
        >
          Hey, {firstName} 👋 <span className="text-gradient">let’s get you placed</span>
        </motion.h1>

        <DashboardTabs
          label="Student dashboard sections"
          items={[
            { id: 'student-profile', label: 'Profile & settings' },
            { id: 'student-progress', label: 'Coding progress' },
            { id: 'student-plan', label: 'My plan' },
            { id: 'student-growth', label: 'Achievements' },
          ]}
        />

        <section id="student-profile" className="mt-6 scroll-mt-32">
          <GlassCard delay={0.05}>
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
              <div>
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar name={profile.full_name} email={profile.email} avatarPath={profile.avatar_path} size={68} solid />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xl font-bold text-white">{profile.full_name}</h2>
                    <p className="truncate text-sm text-zinc-400">{profile.email}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-sky-100/75">Student profile</p>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={handleAvatarUpload}
                    aria-label="Choose a profile photo"
                  />
                  <TapButton variant="secondary" onClick={() => avatarInputRef.current?.click()} loading={avatarBusy}>
                    {avatarBusy ? 'Saving photo…' : 'Change photo'}
                  </TapButton>
                </div>
                <p className="mt-2 text-xs text-zinc-400">PNG, JPG, or WebP · up to 2 MB · used only as your profile photo</p>

                <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                    <span className="block text-xs uppercase tracking-wider text-zinc-400">Year of study</span>
                    <span className="mt-1 block font-semibold text-white">Year {year}</span>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3">
                    <span className="block text-xs uppercase tracking-wider text-zinc-400">Target field</span>
                    <span className="mt-1 block font-semibold text-white">{field || 'Not set'}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <TapButton variant="secondary" onClick={() => openEdit('profile')}>Edit details</TapButton>
                  <TapButton variant="secondary" onClick={() => setPasswordOpen((open) => !open)}>
                    {passwordOpen ? 'Close password settings' : 'Change password'}
                  </TapButton>
                  <TapButton variant="ghost" onClick={handleLogout} loading={loggingOut}>Log out</TapButton>
                </div>

                {editing === 'profile' && (
                  <EditPanel onSubmit={saveProfile} onCancel={() => setEditing(null)} saving={saving}>
                    <AnimatedInput label="Full name" value={form.full_name} onChange={setField('full_name')} required />
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-zinc-300">Year of study</span>
                      <select
                        value={form.year_of_study}
                        onChange={setField('year_of_study')}
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none [&>option]:bg-ink-900"
                      >
                        {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </label>
                    <AnimatedInput
                      label="Target job field"
                      value={form.target_job_field}
                      onChange={setField('target_job_field')}
                      placeholder="SWE, Data Science, Frontend…"
                    />
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(FIELD_RESOURCES).map((f) => (
                        <button
                          key={f}
                          type="button"
                          data-variant={form.target_job_field === f ? 'primary' : 'secondary'}
                          onClick={() => setForm((x) => ({ ...x, target_job_field: f }))}
                          className={`liquid-button touch-manipulation rounded-full px-3 py-1 text-xs font-semibold ${form.target_job_field === f ? 'text-slate-950' : 'text-zinc-300'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </EditPanel>
                )}

                {passwordOpen && (
                  <form onSubmit={handlePasswordChange} className="mt-4 space-y-3 rounded-2xl border border-white/15 bg-white/[0.05] p-4">
                    <h3 className="text-sm font-semibold text-white">Account password</h3>
                    <AnimatedInput
                      label="New password"
                      type="password"
                      value={passwordForm.password}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                      autoComplete="new-password"
                      placeholder="At least 6 characters"
                      showPasswordToggle
                      required
                    />
                    <AnimatedInput
                      label="Confirm new password"
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, confirm: event.target.value }))}
                      autoComplete="new-password"
                      placeholder="Enter it again"
                      showPasswordToggle
                      required
                    />
                    <TapButton type="submit" loading={passwordBusy}>
                      {passwordBusy ? 'Updating…' : 'Save new password'}
                    </TapButton>
                  </form>
                )}

                <div className="mt-5 rounded-2xl border border-sky-100/20 bg-sky-100/[0.06] p-4">
                  <p className="text-xl font-extrabold text-white">
                    {yearsLeft === 0 ? 'It’s placement season' : `${yearsLeft} year${yearsLeft > 1 ? 's' : ''} left`}
                  </p>
                  <p className="mt-1 text-xs text-zinc-300">until placements — make every week count.</p>
                </div>
              </div>

              <aside className="rounded-3xl border border-white/15 bg-white/[0.045] p-5">
                <h3 className="text-lg font-bold text-white">Connected coding profiles</h3>
                <p className="mt-1 text-sm text-zinc-400">Edit your handles here; stats and sync tools are below.</p>
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-400">LeetCode</p>
                      <p className="mt-1 font-semibold text-white">{username ? `@${username}` : 'Not linked yet'}</p>
                    </div>
                    <TapButton variant="secondary" onClick={() => openEdit('lc')}>{username ? 'Edit' : 'Add'}</TapButton>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-400">CampusTrack</p>
                      <p className="mt-1 font-semibold text-white">{ctUsername ? `@${ctUsername}` : 'Not linked yet'}</p>
                    </div>
                    <TapButton variant="secondary" onClick={() => openEdit('ct')}>{ctUsername ? 'Edit' : 'Add'}</TapButton>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-zinc-400">
                  Your profile picture is stored privately. Coding usernames remain editable from this profile panel.
                </p>
              </aside>
            </div>
          </GlassCard>
        </section>

        <section id="student-progress" className="mt-6 grid scroll-mt-32 gap-6 lg:grid-cols-2">
          {/* LeetCode */}
          <GlassCard delay={0.1}>
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)]">
              <div>
                <h2 className="text-lg font-bold text-white">LeetCode activity</h2>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm">
                  <span className="text-zinc-400">Username</span>
                  <div className="mt-1">
                    {username ? (
                      <a
                        href={`https://leetcode.com/u/${encodeURIComponent(username)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-white underline decoration-sky-100/40 underline-offset-2"
                      >
                        @{username} ↗
                      </a>
                    ) : <span className="font-semibold text-zinc-300">Not linked yet</span>}
                  </div>
                </div>
                {statsBody}
              </div>

              <aside className="h-fit rounded-2xl border border-white/15 bg-white/[0.045] p-4">
                <h3 className="text-sm font-semibold text-white">Actions</h3>
                <div className="mt-3 flex flex-col gap-2.5">
                  <TapButton variant="secondary" onClick={() => (username ? openEdit('lc') : openLeetCodeAdd())}>
                    {username ? 'Change username' : 'Add username'}
                  </TapButton>
                  <TapButton onClick={() => doSync()} loading={syncBusy} disabled={!username}>
                    {syncBusy ? 'Syncing…' : username ? 'Sync LeetCode stats' : 'Add username to sync'}
                  </TapButton>
                </div>
                {!username && (
                  <a
                    href={LEETCODE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-sky-100 underline underline-offset-2"
                  >
                    Open leetcode.com ↗
                  </a>
                )}
                {editing === 'lc' && (
                  <EditPanel onSubmit={saveLeetCode} onCancel={() => setEditing(null)} saving={saving}>
                    {!username && (
                      <div className="space-y-2">
                        <a
                          href={LEETCODE_LOGIN_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex touch-manipulation items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                        >
                          Log in to LeetCode ↗
                        </a>
                        <p className="text-xs text-zinc-300">Log in to LeetCode, then enter your username below.</p>
                      </div>
                    )}
                    <AnimatedInput
                      label="LeetCode username"
                      value={form.leetcode_username}
                      onChange={setField('leetcode_username')}
                      placeholder="your-leetcode-username"
                    />
                    <p className="text-xs text-zinc-400">Saving fetches your fresh score.</p>
                  </EditPanel>
                )}
              </aside>
            </div>
          </GlassCard>
          {/* CampusTrack */}
          <GlassCard delay={0.12}>
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.05fr)_minmax(250px,0.95fr)]">
              <div>
                <h2 className="text-lg font-bold text-white">CampusTrack progress</h2>
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm">
                  <span className="text-zinc-400">Username</span>
                  <div className="mt-1">
                    {ctUsername ? (
                      <a
                        href={CT_LOGIN_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-white underline decoration-sky-100/40 underline-offset-2"
                      >
                        @{ctUsername} ↗
                      </a>
                    ) : <span className="font-semibold text-zinc-300">Not linked yet</span>}
                  </div>
                </div>
                {!ctUsername && (
                  <a
                    href={CAMPUSTRACK_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-xs font-semibold text-sky-100 underline underline-offset-2"
                  >
                    Open CampusTrack ↗
                  </a>
                )}
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-5 text-center">
                  <p className="text-3xl font-extrabold text-white">{ctScore ?? '—'}</p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-zinc-400">CampusTrack score</p>
                  <MilestoneBar value={ctScore} steps={CT_STEPS} max={CT_MAX} />
                </div>
              </div>

              <aside className="rounded-2xl border border-white/15 bg-white/[0.045] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">Actions</h3>
                  <TapButton variant="secondary" onClick={() => openEdit('ct')}>
                    {ctUsername ? 'Edit profile' : 'Add profile'}
                  </TapButton>
                </div>

                {editing === 'ct' && (
                  <EditPanel onSubmit={saveCampus} onCancel={() => setEditing(null)} saving={saving}>
                    <AnimatedInput
                      label="CampusTrack username"
                      value={form.campus_track_username}
                      onChange={setField('campus_track_username')}
                    />
                    <AnimatedInput
                      label="CampusTrack score"
                      value={form.campustrack_score}
                      onChange={setField('campustrack_score')}
                      type="number"
                      placeholder="e.g. 85"
                    />
                  </EditPanel>
                )}

                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-sm font-semibold text-white">Sync your CampusTrack score</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                    CampusTrack has no public API, so the sync runs in your browser. Add the bookmark below, open CampusTrack, sign in, visit your Profile page, and click the bookmark.
                  </p>
                  {bookmarklet ? (
                    <>
                      <BookmarkletLink code={bookmarklet} />
                      <textarea
                        ref={bmRef}
                        readOnly
                        value={bookmarklet}
                        onFocus={(e) => e.target.select()}
                        className="mt-3 h-16 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[10px] text-zinc-300"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <TapButton variant="secondary" onClick={copyBookmarklet}>Copy bookmark code</TapButton>
                        <TapButton variant="secondary" onClick={refreshCtScore} loading={refreshingCt}>
                          {refreshingCt ? 'Refreshing…' : 'Refresh score'}
                        </TapButton>
                      </div>
                      <p className="mt-2 text-[11px] text-zinc-500">
                        If dragging fails, copy the code and paste it as the URL of a new browser bookmark.
                      </p>
                    </>
                  ) : ct.status === 'loading' ? (
                    <CardLoading compact label="Loading your personal sync bookmark…" waking={ct.waking} />
                  ) : (
                    <CardError
                      compact
                      message={ct.status === 'error' ? ct.error : 'Your sync bookmark is not available yet.'}
                      onRetry={ct.reload}
                    />
                  )}
                </div>
          </aside>
        </div>
      </GlassCard>
          </section>

          <section id="student-plan" className="mt-6 scroll-mt-32">
          {/* My plan */}
          <GlassCard delay={0.15}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">🧠 My plan</h2>
              <TapButton onClick={() => doGenerate()} loading={planBusy}>
                {planBusy ? 'Generating…' : r ? '✨ Regenerate' : '✨ Generate'}
              </TapButton>
            </div>

            <div className="mt-4 rounded-2xl border border-white/30 bg-white/10 p-4">
              <p className="text-sm font-bold text-white">{guide.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300">{guide.text}</p>
            </div>

            {planBody}

            <div className="mt-6">
              <p className="mb-2.5 text-sm font-semibold text-zinc-300">
                📚 Core languages for <span className="text-gradient">{field || 'SWE'}</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {languages.map((lang) => (
                  <a
                    key={lang}
                    href={RESOURCE_LINKS[lang] || 'https://developer.mozilla.org/'}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl border border-white/20 bg-white/10 p-4 transition-colors hover:border-white/40"
                  >
                    <div className="text-xl">💡</div>
                    <p className="mt-1 font-bold text-white">{lang}</p>
                    <p className="mt-1 text-xs text-zinc-400 group-hover:text-zinc-200">Open official docs ↗</p>
                  </a>
                ))}
              </div>
          </div>
        </GlassCard>
          </section>

        <section id="student-growth" className="mt-6 grid scroll-mt-32 gap-6 lg:grid-cols-3">
          {/* Streak + badges (real data only) */}
          <GlassCard delay={0.18} className="lg:col-span-1">
            <h2 className="text-lg font-bold text-white">Achievements</h2>
            <AchievementsCard stats={s} streakDays={streakDays} />
          </GlassCard>

          {/* Year roadmap (read-only) */}
          <GlassCard delay={0.2} className="lg:col-span-2">
            <h2 className="text-lg font-bold text-white">Your year roadmap</h2>
            <YearRoadmap year={year} guides={YEAR_GUIDE} languages={r?.recommended_languages} />
          </GlassCard>
        </section>
      </main>

      {/* Toast: never intercepts taps */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              key={toastMsg}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="max-w-md rounded-2xl border border-white/30 bg-zinc-900/90 px-4 py-3 text-center text-sm font-medium text-zinc-200 shadow-lg"
            >
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
