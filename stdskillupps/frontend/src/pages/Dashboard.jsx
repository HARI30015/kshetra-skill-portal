import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import GlassCard from '../components/GlassCard';
import AnimatedInput from '../components/AnimatedInput';
import { useAuth } from '../context/AuthContext';
import { LEETCODE_URL, CAMPUSTRACK_URL } from '../constants';
import {
  syncStats,
  getStats,
  generateRecommendation,
  getRecommendation,
  updateProfile,
  getCtSyncKey,
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
      className="inline-block animate-spin rounded-full border-2 border-white/20 border-t-cyan-300"
      style={{ width: size, height: size }}
    />
  );
}

function TapButton({ children, onClick, loading, disabled, variant = 'primary', type = 'button', className = '' }) {
  const styles = {
    primary: 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-glow',
    secondary: 'border border-white/20 bg-white/10 text-white hover:bg-white/15',
    ghost: 'text-cyan-300 hover:text-cyan-200',
  };
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex touch-manipulation select-none items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
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
      <p className="text-sm text-slate-300">{label}</p>
      {(slow || waking) && (
        <p className="max-w-xs text-xs text-slate-400">
          Our free server naps when idle and can take up to a minute to wake. You can keep using the rest of the page.
        </p>
      )}
    </div>
  );
}

function CardError({ message, onRetry, busy, compact }) {
  return (
    <div className={`rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-center ${compact ? 'mt-3' : 'mt-6'}`}>
      <p className="text-sm text-rose-200">{message}</p>
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
      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-400 px-4 py-2 text-sm font-bold text-white shadow-glow"
    >
      🔖 Sync to stdskillupps
    </a>
  );
}

function EditPanel({ onSubmit, onCancel, saving, children }) {
  return (
    <motion.form
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
            <p className="text-sm text-slate-300">Loading your profile…</p>
            {slow && (
              <>
                <p className="max-w-sm text-xs text-slate-400">
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
  const bmRef = useRef(null);
  const autoSyncKey = useRef('');
  const autoPlanKey = useRef('');

  const doSync = useCallback(
    async (opts = {}) => {
      if (!pid) return;
      setSyncBusy(true);
      setSyncError('');
      try {
        const s = await syncStats(pid);
        setStatsData(s);
        if (!opts.silent) toast('LeetCode stats synced 🎉');
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
  const diffBuckets = [
    { label: 'Easy', value: s?.easy_solved || 0, color: 'from-emerald-500 to-green-400' },
    { label: 'Medium', value: s?.medium_solved || 0, color: 'from-amber-500 to-yellow-400' },
    { label: 'Hard', value: s?.hard_solved || 0, color: 'from-rose-500 to-red-400' },
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
      await updateProfile(
        profile.id,
        payloadWith({
          full_name: (form.full_name || '').trim() || profile.full_name || '',
          year_of_study: nextYear,
          target_job_field: nextField,
        })
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
      await updateProfile(profile.id, payloadWith({ leetcode_username: next || null }));
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
          <p className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-400">Total solved</p>
        </div>
        <div className="mt-6 space-y-4">
          {diffBuckets.map((b, i) => (
            <div key={b.label}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium text-slate-300">{b.label}</span>
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
            <p className="mb-3 text-sm font-semibold text-slate-300">Languages used</p>
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
        {syncError && <p className="mt-4 text-center text-xs text-rose-300">{syncError}</p>}
        {s.synced_at && (
          <p className="mt-4 text-right text-xs text-slate-500">
            Last synced: {new Date(s.synced_at).toLocaleString()}
          </p>
        )}
      </div>
    );
  } else if (!username) {
    statsBody = (
      <div className="mt-6 rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
        <p className="text-sm text-slate-300">Add your LeetCode username to see your solved counts here.</p>
        <TapButton onClick={() => openEdit('lc')} className="mt-3">
          ➕ Add username
        </TapButton>
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
        {planError && <p className="mt-4 text-xs text-rose-300">{planError}</p>}
        {r.recommended_languages?.length > 0 && (
          <div className="mt-5">
            <p className="mb-2.5 text-sm font-semibold text-slate-300">Recommended languages</p>
            <div className="flex flex-wrap gap-2">
              {r.recommended_languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-glow"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
        {r.focus_areas?.length > 0 && (
          <div className="mt-5">
            <p className="mb-2.5 text-sm font-semibold text-slate-300">Focus areas</p>
            <ul className="space-y-2">
              {r.focus_areas.map((area, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-slate-200"
                >
                  <span className="mt-0.5 text-cyan-300">▸</span> {area}
                </li>
              ))}
            </ul>
          </div>
        )}
        {scheduleText && (
          <div className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-5">
            <p className="mb-3 text-sm font-semibold text-slate-300">📅 Your exact schedule</p>
            <div className={`relative space-y-3 ${scheduleLong && !scheduleOpen ? 'max-h-60 overflow-hidden' : ''}`}>
              {scheduleParas.map((p, i) => (
                <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
                  {p}
                </p>
              ))}
              {scheduleLong && !scheduleOpen && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/80 to-transparent" />
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

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Profile */}
          <GlassCard delay={0.05} className="lg:col-span-1">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-2xl font-black text-white shadow-glow">
                {(profile.full_name || 'S')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-white">{profile.full_name}</h2>
                <p className="truncate text-sm text-slate-400">{profile.email}</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                <span className="text-slate-300">🎓 Year</span>
                <span className="font-semibold text-white">Year {year}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                <span className="text-slate-300">🎯 Target field</span>
                <span className="font-semibold text-white">{field || '—'}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <TapButton variant="secondary" onClick={() => openEdit('profile')}>
                ✏️ Edit profile
              </TapButton>
              <TapButton variant="secondary" onClick={handleLogout} loading={loggingOut}>
                Log out
              </TapButton>
            </div>

            {editing === 'profile' && (
              <EditPanel onSubmit={saveProfile} onCancel={() => setEditing(null)} saving={saving}>
                <AnimatedInput label="Full name" value={form.full_name} onChange={setField('full_name')} required />
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-300">Year of study</span>
                  <select
                    value={form.year_of_study}
                    onChange={setField('year_of_study')}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white outline-none [&>option]:bg-ink-900"
                  >
                    {[1, 2, 3, 4].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
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
                      onClick={() => setForm((x) => ({ ...x, target_job_field: f }))}
                      className={`touch-manipulation rounded-full border px-3 py-1 text-xs font-semibold ${
                        form.target_job_field === f
                          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                          : 'border-white/20 bg-white/10 text-slate-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </EditPanel>
            )}

            <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-center">
              <p className="text-xl font-extrabold text-white">
                {yearsLeft === 0 ? 'It’s placement season 🔥' : `${yearsLeft} year${yearsLeft > 1 ? 's' : ''} left`}
              </p>
              <p className="mt-1 text-xs text-slate-300">until placements — make every week count.</p>
            </div>
          </GlassCard>

          {/* LeetCode */}
          <GlassCard delay={0.1} className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">📊 LeetCode</h2>
              <TapButton onClick={() => (username ? doSync() : openEdit('lc'))} loading={syncBusy}>
                {syncBusy ? 'Syncing…' : '🔄 Sync'}
              </TapButton>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="text-slate-400">Username</span>
              {username ? (
                <a
                  href={`https://leetcode.com/u/${encodeURIComponent(username)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200"
                >
                  @{username} ↗
                </a>
              ) : (
                <span className="font-semibold text-white">—</span>
              )}
              <TapButton variant="ghost" onClick={() => openEdit('lc')} className="px-1 py-1">
                ✏️ {username ? 'Change' : 'Add'}
              </TapButton>
              {!username && (
                <a
                  href={LEETCODE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-slate-300 underline underline-offset-2"
                >
                  Open leetcode.com ↗
                </a>
              )}
            </div>

            {editing === 'lc' && (
              <EditPanel onSubmit={saveLeetCode} onCancel={() => setEditing(null)} saving={saving}>
                <AnimatedInput
                  label="LeetCode username"
                  value={form.leetcode_username}
                  onChange={setField('leetcode_username')}
                  placeholder="your-leetcode-username"
                />
                <p className="text-xs text-slate-400">Saving fetches your fresh score right away.</p>
              </EditPanel>
            )}

            {statsBody}
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* CampusTrack */}
          <GlassCard delay={0.12} className="lg:col-span-1">
            <h2 className="text-lg font-bold text-white">🏫 CampusTrack</h2>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="text-slate-400">Username</span>
              {ctUsername ? (
                <a
                  href={CT_LOGIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-200"
                >
                  @{ctUsername} ↗
                </a>
              ) : (
                <span className="font-semibold text-white">—</span>
              )}
              <TapButton variant="ghost" onClick={() => openEdit('ct')} className="px-1 py-1">
                ✏️ Edit
              </TapButton>
            </div>
            {!ctUsername && (
              <a
                href={CAMPUSTRACK_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-slate-300 underline underline-offset-2"
              >
                Open CampusTrack ↗
              </a>
            )}

            <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3 text-center">
              <p className="text-3xl font-extrabold text-white">{ctScore ?? '—'}</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">CampusTrack score</p>
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

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-sm font-semibold text-white">🔄 Sync your real CampusTrack score</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                CampusTrack has no public link, so the sync runs in your own browser: drag the button below to your
                bookmarks bar, then open CampusTrack, log in, open your Profile page there, and click the bookmark.
                Your real score lands here by itself.
              </p>
              {bookmarklet ? (
                <>
                  <BookmarkletLink code={bookmarklet} />
                  <textarea
                    ref={bmRef}
                    readOnly
                    value={bookmarklet}
                    onFocus={(e) => e.target.select()}
                    className="mt-3 h-16 w-full rounded-lg border border-white/10 bg-black/30 p-2 text-[10px] text-slate-300"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <TapButton variant="secondary" onClick={copyBookmarklet}>
                      📋 Copy code
                    </TapButton>
                    <TapButton variant="secondary" onClick={refreshCtScore} loading={refreshingCt}>
                      ↻ I’ve synced — refresh score
                    </TapButton>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    If dragging fails: copy the code above, add a new bookmark in your browser, and paste the code as
                    its URL.
                  </p>
                </>
              ) : ct.status === 'loading' ? (
                <CardLoading compact label="Loading your personal sync bookmark…" waking={ct.waking} />
              ) : (
                <CardError
                  compact
                  message={ct.status === 'error' ? ct.error : 'Your sync bookmark isn’t available yet.'}
                  onRetry={ct.reload}
                />
              )}
            </div>
          </GlassCard>

          {/* My plan */}
          <GlassCard delay={0.15} className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">🧠 My plan</h2>
              <TapButton onClick={() => doGenerate()} loading={planBusy}>
                {planBusy ? 'Generating…' : r ? '✨ Regenerate' : '✨ Generate'}
              </TapButton>
            </div>

            <div className="mt-4 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
              <p className="text-sm font-bold text-white">{guide.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{guide.text}</p>
            </div>

            {planBody}

            <div className="mt-6">
              <p className="mb-2.5 text-sm font-semibold text-slate-300">
                📚 Core languages for <span className="text-gradient">{field || 'SWE'}</span>
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {languages.map((lang) => (
                  <a
                    key={lang}
                    href={RESOURCE_LINKS[lang] || 'https://developer.mozilla.org/'}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl border border-white/20 bg-white/10 p-4 transition-colors hover:border-cyan-400/40"
                  >
                    <div className="text-xl">💡</div>
                    <p className="mt-1 font-bold text-white">{lang}</p>
                    <p className="mt-1 text-xs text-slate-400 group-hover:text-cyan-300">Open official docs ↗</p>
                  </a>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
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
              className="max-w-md rounded-2xl border border-cyan-400/30 bg-slate-900/90 px-4 py-3 text-center text-sm font-medium text-cyan-200 shadow-lg"
            >
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
