import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { LEETCODE_URL, CAMPUSTRACK_URL } from '../constants';
import { updateProfile, syncStats, generateRecommendation } from '../api';
import { useAuth } from '../context/AuthContext';

const YEARS = [1, 2, 3, 4];
const FIELDS = ['SWE', 'Data Science', 'Frontend', 'Backend', 'DevOps', 'Mobile'];

const stepVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();

  // Self-exit guard: if this account is already onboarded (e.g. a
  // stale cached profile briefly bounced the user back here right
  // after finishing), go straight to the dashboard instead of
  // showing Step 1 again.
  useEffect(() => {
    if (profile?.onboarded) navigate('/dashboard', { replace: true });
  }, [profile, navigate]);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [year, setYear] = useState(null);
  const [field, setField] = useState('');
  const [leetcode, setLeetcode] = useState('');
  const [campusTrack, setCampusTrack] = useState('');
  const [campusScore, setCampusScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;

  const go = (next) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const canContinue = () => {
    if (step === 0) return year !== null;
    if (step === 1) return field !== '';
    return true; // usernames are optional
  };

  // Owner's rule (2026-10-23): pressing Enter performs the step's
  // action — it saves and jumps to the next step (Finish on the last
  // step). Buttons/links/selects keep their native Enter behaviour,
  // so this only fires from text inputs and the page itself.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Enter' || loading) return;
      if (e.target.closest('button, a, select, textarea')) return;
      e.preventDefault();
      if (step < totalSteps - 1) {
        if (canContinue()) go(step + 1);
      } else {
        finish();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const finish = async () => {
    setLoading(true);
    setError('');
    // The free backend sleeps when idle and fails fast with 502
    // while waking — retry the save instead of failing the Finish
    // button on the first tap after idle (same fix as Signup's
    // Create Account, 2026-10-31). Only transient failures retry;
    // a real 400 (e.g. unknown LeetCode username) surfaces at once.
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const isTransient = (e) =>
      !e?.response || [408, 429, 500, 502, 503, 504].includes(e.response.status);
    const saveWithRetry = async (payload) => {
      const started = Date.now();
      for (let i = 0; ; i++) {
        try {
          return await updateProfile(profile.id, payload);
        } catch (e) {
          if (!isTransient(e) || Date.now() - started > 100000) throw e;
          await sleep(Math.min(3000 * (i + 1), 12000));
        }
      }
    };
    try {
      await saveWithRetry({
        year_of_study: year,
        target_job_field: field,
        leetcode_username: leetcode.trim() || null,
        campus_track_username: campusTrack.trim() || null,
        campustrack_score: campusScore.trim() === '' ? null : Number(campusScore),
        onboarded: true,
      });
      await refreshProfile();
      // Instant score (owner's rule): fetch the LeetCode score the
      // moment the username is saved, so it is already showing on the
      // dashboard when the student lands there. Best-effort - if this
      // misses, the dashboard auto-syncs on load.
      if (leetcode.trim()) {
        try {
          await syncStats(profile.id);
        } catch {
          // dashboard retries automatically
        }
      }
      // Have the exact schedule ready and waiting on the dashboard.
      try {
        await generateRecommendation(profile.id);
      } catch {
        // dashboard auto-generates on load if this misses
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'What year are you in?',
      subtitle: 'We tailor your plan to your runway before placements.',
      body: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {YEARS.map((y) => {
            const active = year === y;
            return (
              <motion.button
                key={y}
                type="button"
                data-variant={active ? 'primary' : 'secondary'}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.08 }}
                onClick={() => setYear(y)}
                className={`liquid-button relative rounded-2xl border px-4 py-6 text-center transition-colors ${
                  active
                    ? 'border-transparent bg-white text-black shadow-glow'
                    : 'border-white/20 bg-white/10 text-zinc-200 hover:bg-white/15'
                }`}
              >
                <div className="text-2xl font-extrabold">Year {y}</div>
                <div className="mt-1 text-xs opacity-80">{y === 4 ? 'Placement time 🔥' : `${4 - y} yr${4 - y > 1 ? 's' : ''} to placements`}</div>
                {active && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white bg-black text-sm text-white shadow"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      ),
    },
    {
      title: 'What are you aiming for?',
      subtitle: 'Pick the job field you want to target.',
      body: (
        <div className="flex flex-wrap gap-3">
          {FIELDS.map((f) => {
            const active = field === f;
            return (
              <motion.button
                key={f}
                type="button"
                data-variant={active ? 'primary' : 'secondary'}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.08 }}
                onClick={() => setField(f)}
                className={`liquid-button rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-transparent bg-white text-black shadow-glow'
                    : 'border-white/20 bg-white/10 text-zinc-200 hover:bg-white/15'
                }`}
              >
                {f}
              </motion.button>
            );
          })}
        </div>
      ),
    },
    {
      title: 'Link your LeetCode',
      subtitle: 'We sync your solved stats so your plan stays honest.',
      body: (
        <div>
          <AnimatedInput
            label="LeetCode username"
            value={leetcode}
            onChange={(e) => setLeetcode(e.target.value)}
            placeholder="e.g. neetcode_fan"
            name="leetcode_username"
          />
          <motion.a
            href={LEETCODE_URL}
            target="_blank"
            rel="noreferrer"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.08 }}
            className="liquid-button mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          >
            🔗 Not signed in? Open leetcode.com to sign in first ↗
          </motion.a>
          <p className="mt-2 text-xs text-zinc-400">
            Sign in there, then come back and enter your username above.
          </p>
        </div>
      ),
    },
    {
      title: 'Link your campus track',
      subtitle: 'Your campus training profile — last step!',
      body: (
        <div className="space-y-4">
          <AnimatedInput
            label="Campus-track username"
            value={campusTrack}
            onChange={(e) => setCampusTrack(e.target.value)}
            placeholder="e.g. your campus portal handle"
            name="campus_track_username"
          />
          <AnimatedInput
            label="Campus-track score (self-reported)"
            value={campusScore}
            onChange={(e) => setCampusScore(e.target.value)}
            placeholder="e.g. 85"
            name="campustrack_score"
            type="number"
          />
          <p className="text-xs text-zinc-400">
            Enter your current score for now. After setup, your dashboard has a private browser bookmark to sync the real score from your CampusTrack profile.
          </p>
          <motion.a
            href={CAMPUSTRACK_URL}
            target="_blank"
            rel="noreferrer"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.08 }}
            className="liquid-button inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
          >
            🔗 Not signed in? Open campustrack.in to sign in first ↗
          </motion.a>
          <p className="text-xs text-zinc-400">
            Sign in there, then come back and enter your username above.
          </p>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <PageWrapper>
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 pb-10 pt-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-strong overflow-hidden p-8"
        >
          {/* Progress bar */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-300">
              <span>Step {step + 1} of {totalSteps}</span>
              <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-white"
                animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="text-2xl font-extrabold text-white">{current.title}</h1>
              <p className="mb-6 mt-1 text-sm text-zinc-300">{current.subtitle}</p>
              {current.body}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-4 rounded-xl border border-white/40 bg-white/15 px-4 py-3 text-sm text-zinc-200">
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <AnimatedButton
              variant="ghost"
              onClick={() => go(step - 1)}
              disabled={step === 0}
              className={step === 0 ? 'invisible' : ''}
            >
              ← Back
            </AnimatedButton>
            {step < totalSteps - 1 ? (
              <AnimatedButton onClick={() => go(step + 1)} disabled={!canContinue()}>
                Continue →
              </AnimatedButton>
            ) : (
              <AnimatedButton onClick={finish} loading={loading}>
                {loading ? 'Saving…' : 'Finish ✨'}
              </AnimatedButton>
            )}
          </div>
        </motion.div>
      </main>
    </PageWrapper>
  );
}
