import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { LEETCODE_URL, CAMPUSTRACK_URL } from '../constants';
import { updateProfile } from '../api';
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

  const finish = async () => {
    setLoading(true);
    setError('');
    try {
      await updateProfile(profile.id, {
        year_of_study: year,
        target_job_field: field,
        leetcode_username: leetcode.trim() || null,
        campus_track_username: campusTrack.trim() || null,
        campustrack_score: campusScore.trim() === '' ? null : Number(campusScore),
        onboarded: true,
      });
      await refreshProfile();
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
                whileHover={{ scale: 1.06, y: -3 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setYear(y)}
                className={`relative rounded-2xl border px-4 py-6 text-center transition-colors ${
                  active
                    ? 'border-transparent bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-glow'
                    : 'border-white/20 bg-white/10 text-slate-200 hover:bg-white/15'
                }`}
              >
                <div className="text-2xl font-extrabold">Year {y}</div>
                <div className="mt-1 text-xs opacity-80">{y === 4 ? 'Placement time 🔥' : `${4 - y} yr${4 - y > 1 ? 's' : ''} to placements`}</div>
                {active && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm text-violet-700 shadow"
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
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setField(f)}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-transparent bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-glow'
                    : 'border-white/20 bg-white/10 text-slate-200 hover:bg-white/15'
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
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            🔗 Not signed in? Open leetcode.com to sign in first ↗
          </motion.a>
          <p className="mt-2 text-xs text-slate-400">
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
          <p className="text-xs text-slate-400">
            Enter your latest campus-track score yourself — we'll verify it later. No auto-sync here.
          </p>
          <motion.a
            href={CAMPUSTRACK_URL}
            target="_blank"
            rel="noreferrer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            🔗 Not signed in? Open campustrack.in to sign in first ↗
          </motion.a>
          <p className="text-xs text-slate-400">
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
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-300">
              <span>Step {step + 1} of {totalSteps}</span>
              <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400"
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
              <p className="mb-6 mt-1 text-sm text-slate-300">{current.subtitle}</p>
              {current.body}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
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
