import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'student', label: 'Student', icon: '🎓' },
  { value: 'lecturer', label: 'Lecturer', icon: '👩‍🏫' },
];

export default function Signup() {
  const navigate = useNavigate();
  const { ensureProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (authError) throw authError;

      // Try an immediate session; if email confirmation is required there won't be one yet.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const p = await ensureProfile(fullName, role);
        if (p?.role === 'student') navigate('/onboarding', { replace: true });
        else if (p?.role === 'lecturer') navigate('/lecturer', { replace: true });
        else {
          await refreshProfile();
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/login', {
          replace: true,
          state: { notice: 'Account created! Check your email to confirm, then sign in.' },
        });
      }
    } catch (err) {
      setError(err?.message || 'Sign up failed. Please try again.');
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <main className="flex min-h-screen items-center justify-center px-4 pt-24 pb-10">
        <motion.div
          key={shakeKey}
          animate={shakeKey ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong p-8"
          >
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h1 className="text-2xl font-extrabold text-white">Join stdskillupps 🚀</h1>
              <p className="mt-1 text-sm text-slate-300">Your placement prep starts here.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
                <AnimatedInput
                  label="Full name"
                  name="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  required
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <AnimatedInput
                  label="Email"
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  autoComplete="email"
                  required
                />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38 }}>
                <AnimatedInput
                  label="Password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  required
                />
              </motion.div>

              {/* Animated segmented role selector */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>
                <span className="mb-1.5 block text-sm font-medium text-slate-300">I am a…</span>
                <div className="relative grid grid-cols-2 gap-2 rounded-2xl border border-white/20 bg-white/10 p-1.5 backdrop-blur-xl">
                  {ROLES.map((r) => {
                    const active = role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`relative z-10 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                          active ? 'text-white' : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="role-pill"
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 shadow-glow"
                          />
                        )}
                        <span className="relative z-10">
                          {r.icon} {r.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-200">
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.54 }}>
                <AnimatedButton type="submit" loading={loading} className="w-full">
                  {loading ? 'Creating account…' : 'Create Account'}
                </AnimatedButton>
              </motion.div>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </PageWrapper>
  );
}
