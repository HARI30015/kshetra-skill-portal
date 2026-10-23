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
  const { ensureProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('details'); // 'details' | 'code' | 'password'
  const [error, setError] = useState('');
  const [accountExists, setAccountExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // After the account is created, go DIRECTLY to the Login option
  // (owner's flow, 2026-10-23 evening): the profile row is created
  // first, while still signed in from verification, then we sign
  // out and land on /login with a notice, so the user signs in with
  // the password they just set. After sign-in the app continues
  // with the usual next steps — setup questions if they are still
  // pending, otherwise the dashboard (lecturers: lecturer home).
  // NOTE: this calls supabase.auth.signOut() directly, NOT the
  // AuthContext logout — that one deletes half-done profiles, and a
  // brand-new profile must be kept.
  const goToLogin = async () => {
    await ensureProfile(fullName, role);
    await supabase.auth.signOut();
    navigate('/login', {
      replace: true,
      state: { notice: 'Account created. Sign in to continue.' },
    });
  };

  // Step 1: send OTP to the new email.
  // Deliberately NO backend call here — the code must go out instantly.
  // (An earlier version checked "account exists" against the backend
  // first; when the server was asleep that made sending the code take
  // up to a minute. Existing accounts are caught after verification
  // instead — see handleVerifyCode.)
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setAccountExists(false);
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
      // Existing account? A brand-new account was created just now,
      // when the code was sent; an existing one was created long
      // before. This check runs entirely on Supabase (always on), so
      // it's instant — no waiting on the backend. Existing users are
      // routed to sign-in instead of overwriting their password here.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const createdAt = user?.created_at ? new Date(user.created_at).getTime() : Date.now();
      if (Date.now() - createdAt > 60 * 60 * 1000) {
        // Mail already has an account (owner's rule, 2026-10-23):
        // never create it again, and never strand the user on an
        // error screen - redirect straight to Login. After sign-in
        // the app continues with the usual next steps (the setup
        // questions if they are pending, otherwise the dashboard).
        await supabase.auth.signOut();
        navigate('/login', {
          replace: true,
          state: { notice: 'This email already has an account. Sign in to continue.' },
        });
        return;
      }
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
      await goToLogin();
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
      <main className="flex min-h-screen items-center justify-center px-4 pt-24 pb-10 perspective-2000">
        <motion.div
          key={shakeKey}
          animate={shakeKey ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md preserve-3d"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 60, rotateX: -20, scale: 0.94, z: -100 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1, z: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ rotateX: 2, rotateY: -2, scale: 1.01 }}
            className="glass-3d p-8 preserve-3d"
            style={{ transformStyle: 'preserve-3d', boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(139,92,246,0.15)' }}
          >
            <div style={{ transform: 'translateZ(40px)' }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h1 className="text-2xl font-extrabold text-white" style={{ textShadow: '0 4px 20px rgba(139,92,246,0.4)' }}>{stepTitle[step]}</h1>
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
                {accountExists && (
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-glow"
                  >
                    Sign In instead →
                  </button>
                )}
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
            </div>
          </motion.div>
        </motion.div>
      </main>
    </PageWrapper>
  );
}
