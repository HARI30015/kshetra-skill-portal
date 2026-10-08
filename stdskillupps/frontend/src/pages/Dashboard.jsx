import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
import AnimatedInput from '../components/AnimatedInput';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import { LEETCODE_URL, CAMPUSTRACK_URL } from '../constants';
import { syncStats, getStats, generateRecommendation, getRecommendation, updateProfile } from '../api';

// Static core-language mapping per target job field.
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

function AnimatedCounter({ value, duration = 1.2 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * (value || 0)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span>{display.toLocaleString()}</span>;
}

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const loadStats = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const s = await getStats(profile.id);
      setStats(s);
    } catch {
      // No stats yet — user hasn't synced.
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [profile?.id]);

  const loadRecommendation = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const r = await getRecommendation(profile.id);
      setRecommendation(r);
    } catch {
      setRecommendation(null);
    } finally {
      setRecLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadStats();
    loadRecommendation();
  }, [loadStats, loadRecommendation]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const s = await syncStats(profile.id);
      setStats(s);
      setNotice('LeetCode stats synced! 🎉');
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      setNotice(err?.response?.data?.detail || 'Sync failed. Check your LeetCode username.');
      setTimeout(() => setNotice(''), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const r = await generateRecommendation(profile.id);
      setRecommendation(r);
    } catch (err) {
      setNotice(err?.response?.data?.detail || 'Could not generate a plan yet.');
      setTimeout(() => setNotice(''), 4000);
    } finally {
      setGenerating(false);
    }
  };

  const openEdit = () => {
    setEditForm({
      full_name: profile.full_name || '',
      year_of_study: profile.year_of_study || 1,
      target_job_field: profile.target_job_field || '',
      leetcode_username: profile.leetcode_username || '',
      campus_track_username: profile.campus_track_username || '',
      campustrack_score: profile.campustrack_score ?? profile.campus_track_score ?? '',
    });
    setEditOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        full_name: editForm.full_name,
        year_of_study: Number(editForm.year_of_study),
        target_job_field: editForm.target_job_field || null,
        leetcode_username: editForm.leetcode_username.trim() || null,
        campus_track_username: editForm.campus_track_username.trim() || null,
        campustrack_score: editForm.campustrack_score === '' ? null : Number(editForm.campustrack_score),
      });
      await refreshProfile();
      setEditOpen(false);
      setNotice('Profile updated ✓');
      setTimeout(() => setNotice(''), 3000);
    } catch (err) {
      setNotice(err?.response?.data?.detail || 'Update failed.');
      setTimeout(() => setNotice(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <PageWrapper>
        <Loader label="Loading your dashboard…" />
      </PageWrapper>
    );
  }

  const year = profile.year_of_study || 1;
  const yearsLeft = Math.max(4 - year, 0);
  const field = profile.target_job_field;
  const languages = (field && FIELD_RESOURCES[field]) || FIELD_RESOURCES.SWE;

  const diffBuckets = [
    { label: 'Easy', value: stats?.easy_solved || 0, color: 'from-emerald-500 to-green-400' },
    { label: 'Medium', value: stats?.medium_solved || 0, color: 'from-amber-500 to-yellow-400' },
    { label: 'Hard', value: stats?.hard_solved || 0, color: 'from-rose-500 to-red-400' },
  ];
  const maxSolved = Math.max(stats?.total_solved || 0, 1);
  const langStats = stats?.language_stats || {};

  return (
    <PageWrapper>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="glass mb-6 border-cyan-400/30 p-4 text-center text-sm font-medium text-cyan-200"
            >
              {notice}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-white"
        >
          Hey, {profile.full_name?.split(' ')[0] || 'there'} 👋{' '}
          <span className="text-gradient">let's get you placed</span>
        </motion.h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Profile card */}
          <GlassCard delay={0.05} className="lg:col-span-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.08 }}
                  className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-2xl font-black text-white shadow-glow"
                >
                  {(profile.full_name || 'S')[0].toUpperCase()}
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
                  <p className="text-sm text-slate-400">{profile.email}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openEdit}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
              >
                ✏️ Edit
              </motion.button>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                <span className="text-slate-300">🎓 Year</span>
                <span className="font-semibold text-white">Year {year}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5">
                <span className="text-slate-300">🎯 Target field</span>
                <span className="font-semibold text-white">{field || '—'}</span>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">💻 LeetCode</span>
                  <span className="font-semibold text-white">
                    {profile.leetcode_username ? `@${profile.leetcode_username}` : '—'}
                  </span>
                </div>
                {!profile.leetcode_username && (
                  <motion.a
                    href={LEETCODE_URL}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    🔗 Not signed in? Open leetcode.com ↗
                  </motion.a>
                )}
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">🏫 Campus track</span>
                  <span className="font-semibold text-white">
                    {profile.campus_track_username ? `@${profile.campus_track_username}` : '—'}
                  </span>
                </div>
                {(profile.campustrack_score ?? profile.campus_track_score) != null && (
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Self-reported score</span>
                    <span className="font-semibold text-cyan-200">
                      {profile.campustrack_score ?? profile.campus_track_score}
                      <span className="ml-1 font-normal text-slate-500">(verify later)</span>
                    </span>
                  </div>
                )}
                {!profile.campus_track_username && (
                  <motion.a
                    href={CAMPUSTRACK_URL}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    🔗 Not signed in? Open campustrack.in ↗
                  </motion.a>
                )}
              </div>
            </div>
          </GlassCard>

          {/* LeetCode stats */}
          <GlassCard delay={0.12} className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">📊 LeetCode Stats</h2>
              <AnimatedButton onClick={handleSync} loading={syncing} className="px-5 py-2.5 text-sm">
                {syncing ? 'Syncing…' : '🔄 Sync stats'}
              </AnimatedButton>
            </div>

            {statsLoading ? (
              <Loader label="Fetching stats…" />
            ) : !stats ? (
              <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
                <p className="text-slate-300">No stats yet. Hit <strong>Sync stats</strong> to pull your latest LeetCode numbers.</p>
              </div>
            ) : (
              <div className="mt-6">
                <div className="text-center">
                  <motion.div
                    key={stats.total_solved}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-gradient text-5xl font-extrabold"
                  >
                    <AnimatedCounter value={stats.total_solved} />
                  </motion.div>
                  <p className="mt-1 text-xs font-medium uppercase tracking-widest text-slate-400">Total solved</p>
                </div>
                <div className="mt-6 space-y-4">
                  {diffBuckets.map((b, i) => (
                    <div key={b.label}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span className="font-medium text-slate-300">{b.label}</span>
                        <span className="font-bold text-white"><AnimatedCounter value={b.value} /></span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((b.value / maxSolved) * 100, 100)}%` }}
                          transition={{ duration: 1, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
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
                      {Object.entries(langStats).map(([lang, count], i) => (
                        <motion.span
                          key={lang}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white"
                        >
                          {lang} · {count}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
                {stats.synced_at && (
                  <p className="mt-5 text-right text-xs text-slate-500">
                    Last synced: {new Date(stats.synced_at).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Year timeline */}
          <GlassCard delay={0.05}>
            <h2 className="text-lg font-bold text-white">🗓️ Your Timeline</h2>
            <div className="mt-6 flex items-center justify-between">
              {[1, 2, 3, 4].map((y) => {
                const active = y === year;
                const past = y < year;
                return (
                  <React.Fragment key={y}>
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: y * 0.1, type: 'spring', stiffness: 260, damping: 18 }}
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${
                          active
                            ? 'bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-glow'
                            : past
                              ? 'bg-emerald-500/30 text-emerald-200'
                              : 'border border-white/20 bg-white/10 text-slate-300'
                        }`}
                      >
                        {past ? '✓' : `Y${y}`}
                      </motion.div>
                      <span className={`mt-1.5 text-[10px] font-medium ${active ? 'text-cyan-200' : 'text-slate-500'}`}>
                        {y === 4 ? 'Placements' : `Year ${y}`}
                      </span>
                    </div>
                    {y < 4 && <div className={`h-0.5 flex-1 rounded ${y < year ? 'bg-emerald-400/60' : 'bg-white/15'}`} />}
                  </React.Fragment>
                );
              })}
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-center"
            >
              <p className="text-2xl font-extrabold text-white">
                {yearsLeft === 0 ? 'It\'s placement season 🔥' : `${yearsLeft} year${yearsLeft > 1 ? 's' : ''} left`}
              </p>
              <p className="mt-1 text-xs text-slate-300">until placements — make every week count.</p>
            </motion.div>
          </GlassCard>

          {/* Guidance plan */}
          <GlassCard delay={0.12} className="lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-white">🧠 Your Guidance Plan</h2>
              <AnimatedButton onClick={handleGenerate} loading={generating} className="px-5 py-2.5 text-sm">
                {generating ? 'Generating…' : '✨ Generate my plan'}
              </AnimatedButton>
            </div>
            {recLoading ? (
              <Loader label="Loading your plan…" />
            ) : !recommendation ? (
              <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
                <p className="text-slate-300">
                  No plan yet. Generate one to get language picks and focus areas matched to your year & field.
                </p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {(recommendation.recommended_languages?.length > 0) && (
                  <div className="mt-5">
                    <p className="mb-2.5 text-sm font-semibold text-slate-300">Recommended languages</p>
                    <div className="flex flex-wrap gap-2">
                      {recommendation.recommended_languages.map((lang, i) => (
                        <motion.span
                          key={lang}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-glow"
                        >
                          {lang}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}
                {(recommendation.focus_areas?.length > 0) && (
                  <div className="mt-5">
                    <p className="mb-2.5 text-sm font-semibold text-slate-300">Focus areas</p>
                    <ul className="space-y-2">
                      {recommendation.focus_areas.map((area, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.08 }}
                          className="flex items-start gap-2.5 rounded-xl bg-white/5 px-4 py-2.5 text-sm text-slate-200"
                        >
                          <span className="mt-0.5 text-cyan-300">▸</span> {area}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
                {recommendation.plan_text && (
                  <div className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-5">
                    <p className="mb-2 text-sm font-semibold text-slate-300">Your plan</p>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
                      {recommendation.plan_text}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </GlassCard>
        </div>

        {/* Learning resources */}
        <GlassCard delay={0.05} className="mt-6">
          <h2 className="text-lg font-bold text-white">
            📚 Core languages for <span className="text-gradient">{field || 'SWE'}</span>
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {languages.map((lang, i) => (
              <motion.a
                key={lang}
                href={RESOURCE_LINKS[lang] || 'https://developer.mozilla.org/'}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl transition hover:border-cyan-400/40"
              >
                <div className="text-2xl">💡</div>
                <p className="mt-2 font-bold text-white">{lang}</p>
                <p className="mt-1 text-xs text-slate-400 group-hover:text-cyan-300">
                  Open official docs ↗
                </p>
              </motion.a>
            ))}
          </div>
        </GlassCard>

        {/* Edit profile modal */}
        <AnimatePresence>
          {editOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => setEditOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-strong w-full max-w-md p-8"
              >
                <h3 className="text-xl font-bold text-white">Edit profile</h3>
                <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                  <AnimatedInput
                    label="Full name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    required
                  />
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-slate-300">Year of study</span>
                    <select
                      value={editForm.year_of_study}
                      onChange={(e) => setEditForm({ ...editForm, year_of_study: e.target.value })}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white backdrop-blur-xl outline-none [&>option]:bg-ink-900"
                    >
                      {[1, 2, 3, 4].map((y) => (
                        <option key={y} value={y}>Year {y}</option>
                      ))}
                    </select>
                  </label>
                  <AnimatedInput
                    label="Target job field"
                    value={editForm.target_job_field}
                    onChange={(e) => setEditForm({ ...editForm, target_job_field: e.target.value })}
                    placeholder="SWE, Data Science, Frontend…"
                  />
                  <AnimatedInput
                    label="LeetCode username"
                    value={editForm.leetcode_username}
                    onChange={(e) => setEditForm({ ...editForm, leetcode_username: e.target.value })}
                  />
                  <AnimatedInput
                    label="Campus-track username"
                    value={editForm.campus_track_username}
                    onChange={(e) => setEditForm({ ...editForm, campus_track_username: e.target.value })}
                  />
                  <div>
                    <AnimatedInput
                      label="Campus-track score (self-reported)"
                      value={editForm.campustrack_score}
                      onChange={(e) => setEditForm({ ...editForm, campustrack_score: e.target.value })}
                      type="number"
                      placeholder="e.g. 85"
                    />
                    <p className="mt-1 text-xs text-slate-500">No auto-sync — verified later by your lecturer.</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <AnimatedButton type="button" variant="secondary" onClick={() => setEditOpen(false)} className="flex-1">
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton type="submit" loading={saving} className="flex-1">
                      {saving ? 'Saving…' : 'Save'}
                    </AnimatedButton>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageWrapper>
  );
}
