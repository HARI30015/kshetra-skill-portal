import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { checkEmailExists } from '../api';

const HEADINGS = {
  login: ['Welcome back 👋', 'Sign in with your email and password.'],
  'forgot-email': ['Reset your password', 'Enter your email and we will send a 6-digit code.'],
  'forgot-code': ['Enter your code', 'Type the 6-digit code from your email.'],
  'forgot-new': ['Set a new password', 'Choose a new password for your account.'],
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState('login'); // login | forgot-email | forgot-code | forgot-new
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [noAccount, setNoAccount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  const notice = location.state?.notice;
  const banner = info || (mode === 'login' ? notice : '');
  const [title, subtitle] = HEADINGS[mode];

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const fail = (message) => {
    setError(message);
    setShakeKey((k) => k + 1);
  };

  const goToDashboard = () => {
    const from = location.state?.from;
    navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setNoAccount(false);
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      await refreshProfile();
      goToDashboard();
    } catch (err) {
      let message = err?.message || 'Sign in failed. Check your email and password.';
      // Wrong password vs no account look identical from Supabase — check
      // so a new user gets pointed to sign-up instead of guessing.
      if (/invalid login credentials/i.test(message)) {
        try {
          const exists = await checkEmailExists(email.trim());
          if (!exists) {
            setNoAccount(true);
            message = 'No account found for this email. Create an account first.';
          }
        } catch {
          // check failed (server waking) — keep the generic message
        }
      }
      setError(message);
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- forgot password (6-digit OTP code only) ---------------- */

  const startForgot = () => {
    setError('');
    setInfo('');
    setNoAccount(false);
    setMode('forgot-email');
  };

  const backToLogin = async () => {
    // Verifying the code signs the user in; leaving before setting a
    // password must not leave that session behind.
    if (mode === 'forgot-new') {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        /* best effort */
      }
    }
    setError('');
    setInfo('');
    setCode('');
    setNewPw('');
    setConfirmPw('');
    setMode('login');
  };

  // Same generic result whether or not the email is registered, so the
  // page never reveals which emails have accounts.
  const sendCode = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const addr = email.trim();
    if (!addr) {
      fail('Enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const { error: sendErr } = await supabase.auth.resetPasswordForEmail(addr);
      if (sendErr && (sendErr.status === 429 || /rate limit|too many|after \d+ seconds/i.test(sendErr.message || ''))) {
        fail('Please wait a minute before requesting another code.');
        return;
      }
      setInfo('If an account exists for that email, a 6-digit code is on its way. Enter it below.');
      setCode('');
      setCooldown(60);
      setMode('forgot-code');
    } catch {
      setInfo('If an account exists for that email, a 6-digit code is on its way. Enter it below.');
      setMode('forgot-code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      fail('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      const { error: vErr } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: 'recovery' });
      if (vErr) throw vErr;
      setInfo('');
      setMode('forgot-new');
    } catch {
      fail('That code is invalid or has expired. Check it, or request a new one.');
    } finally {
      setLoading(false);
    }
  };

  const saveNewPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPw.length < 6) {
      fail('Password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      fail('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error: uErr } = await supabase.auth.updateUser({ password: newPw });
      if (uErr) throw uErr;
      // Back to a normal password sign-in with the new password.
      await supabase.auth.signOut({ scope: 'local' });
      setPassword('');
      setCode('');
      setNewPw('');
      setConfirmPw('');
      setMode('login');
      setInfo('Password updated. Sign in with your new password.');
    } catch (err) {
      fail(err?.message || 'Could not update your password. Request a new code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const errorBlock = (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="rounded-xl border border-white/40 bg-white/15 px-4 py-3 text-sm text-zinc-200">{error}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const backLink = (
    <p className="text-center text-sm">
      <button
        type="button"
        onClick={backToLogin}
        className="font-semibold text-zinc-300 underline underline-offset-2 hover:text-white"
      >
        Back to sign in
      </button>
    </p>
  );

  return (
    <PageWrapper>
      <main className="flex min-h-screen items-center justify-center px-4 pt-24 perspective-2000">
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
            className="glass-3d rounded-[2rem] p-8 preserve-3d"
            style={{ transformStyle: 'preserve-3d', boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(255,255,255,0.15)' }}
          >
            <div style={{ transform: 'translateZ(40px)' }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h1 className="text-2xl font-extrabold text-white" style={{ textShadow: '0 4px 20px rgba(255,255,255,0.4)' }}>{title}</h1>
              <p className="mt-1 text-sm text-zinc-300">{subtitle}</p>
            </motion.div>

            <AnimatePresence>
              {banner && !error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 rounded-xl border border-white/40 bg-white/15 px-4 py-3 text-sm text-zinc-200">
                    {banner}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'login' && (
              <form onSubmit={handlePasswordLogin} className="mt-6 space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
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
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <AnimatedInput
                    label="Password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    showPasswordToggle
                    required
                  />
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={startForgot}
                      className="text-xs font-semibold text-zinc-300 underline underline-offset-2 hover:text-white"
                    >
                      Forgot password?
                    </button>
                  </div>
                </motion.div>
                {errorBlock}
                {noAccount && (
                  <AnimatedButton variant="primary" size="sm" onClick={() => navigate('/signup')} className="w-full">
                    Create an account →
                  </AnimatedButton>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <AnimatedButton type="submit" loading={loading} className="w-full">
                    {loading ? 'Signing in…' : 'Sign In'}
                  </AnimatedButton>
                </motion.div>
              </form>
            )}

            {mode === 'forgot-email' && (
              <form onSubmit={sendCode} className="mt-6 space-y-5">
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
                {errorBlock}
                <AnimatedButton type="submit" loading={loading} className="w-full">
                  {loading ? 'Sending…' : 'Send code'}
                </AnimatedButton>
                {backLink}
              </form>
            )}

            {mode === 'forgot-code' && (
              <form onSubmit={verifyCode} className="mt-6 space-y-5">
                <AnimatedInput
                  label="6-digit code"
                  type="text"
                  name="otp"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  required
                />
                {errorBlock}
                <AnimatedButton type="submit" loading={loading} className="w-full">
                  {loading ? 'Checking…' : 'Verify code'}
                </AnimatedButton>
                <p className="text-center text-sm text-zinc-400">
                  Did not get it?{' '}
                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={() => sendCode()}
                    className="font-semibold text-zinc-200 underline underline-offset-2 hover:text-white disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                  </button>
                </p>
                {backLink}
              </form>
            )}

            {mode === 'forgot-new' && (
              <form onSubmit={saveNewPassword} className="mt-6 space-y-5">
                <AnimatedInput
                  label="New password"
                  type="password"
                  name="new-password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  showPasswordToggle
                  required
                />
                <AnimatedInput
                  label="Confirm new password"
                  type="password"
                  name="confirm-password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter the password"
                  autoComplete="new-password"
                  showPasswordToggle
                  required
                />
                {errorBlock}
                <AnimatedButton type="submit" loading={loading} className="w-full">
                  {loading ? 'Saving…' : 'Update password'}
                </AnimatedButton>
                {backLink}
              </form>
            )}

            {mode === 'login' && (
              <p className="mt-6 text-center text-sm text-zinc-400">
                New here?{' '}
                <Link to="/signup" className="font-semibold text-zinc-200 hover:text-zinc-200">
                  Create an account
                </Link>
              </p>
            )}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </PageWrapper>
  );
}
