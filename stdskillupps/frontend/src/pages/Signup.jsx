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
  const [role, setRole] = useState('student');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('details'); // 'details' | 'code' | 'password'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const goToDashboard = async () => {
    const p = await ensureProfile(fullName, role);
    if (p?.role === 'student') navigate('/onboarding', { replace: true });
    else if (p?.role === 'lecturer') navigate('/lecturer', { replace: true });
    else {
      await refreshProfile();
      navigate('/dashboard', { replace: true });
    }
  };

  // Step 1: send OTP to the new email
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, data: { full_name: fullName, role } },
      });
      if (otpError) throw otpError;
      setStep('code');
    } catch (err) {
      setError(err?.message || 'Could not send code. Check the email and try again.');
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: verify OTP
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: 'email',
      });
      if (verifyError) throw verifyError;
      setStep('password');
    } catch (err) {
      setError(err?.message || 'Invalid code. Please try again.');
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: set password for the verified account
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setShakeKey((k) => k + 1);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setShakeKey((k) => k + 1);
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await goToDashboard();
    } catch (err) {
      setError(err?.message || 'Could not set password. Please try again.');
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  const renderError = () => (
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
  );

  const stepTitle = {
    details: 'Join stdskillupps 🚀',
    code: 'Check your inbox 📩',
    password: 'Set your password 🔐',
  };
  const stepSubtitle = {
    details: 'Your placement prep starts here.',
    code: `We sent a 6-digit code to ${email}.`,
    password: 'You’ll use this password to sign in from now on.',
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
              <h1 className="text-2xl font-extrabold text-white">{stepTitle[step]}</h1>
              <p className="mt-1 text-sm text-slate-300">{stepSubtitle[step]}</p>
            </motion.div>

            {/* Step indicator */}
            <div className="mt-4 flex items-center gap-2">
              {['details', 'code', 'password'].map((s, i) => {
                const idx = ['details', 'code', 'password'].indexOf(step);
                return (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= idx ? 'bg-gradient-to-r from-violet-500 to-cyan-400' : 'bg-white/10'
                    }`}
                  />
                );
              })}
            </div>

            {step === 'details' && (
              <form onSubmit={handleSendCode} className="mt-6 space-y-5">
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
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
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
                {renderError()}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>
                  <AnimatedButton type="submit" loading={loading} className="w-full">
                    {loading ? 'Sending code…' : 'Send Verification Code'}
                  </AnimatedButton>
                </motion.div>
              </form>
            )}

            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="mt-6 space-y-5">
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                  <AnimatedInput
                    label="6-digit code"
                    type="text"
                    name="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    required
                  />
                </motion.div>
                {renderError()}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-3">
                  <AnimatedButton type="submit" loading={loading} className="w-full">
                    {loading ? 'Verifying…' : 'Verify Code'}
                  </AnimatedButton>
                  <button
                    type="button"
                    onClick={() => { setStep('details'); setCode(''); setError(''); }}
                    className="w-full text-center text-sm text-slate-400 hover:text-slate-300"
                  >
                    Use a different email
                  </button>
                </motion.div>
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={handleSetPassword} className="mt-6 space-y-5">
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                  <AnimatedInput
                    label="Create password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    required
                  />
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.33 }}>
                  <AnimatedInput
                    label="Confirm password"
                    type="password"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    required
                  />
                </motion.div>
                {renderError()}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <AnimatedButton type="submit" loading={loading} className="w-full">
                    {loading ? 'Creating account…' : 'Create Account'}
                  </AnimatedButton>
                </motion.div>
              </form>
            )}

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
