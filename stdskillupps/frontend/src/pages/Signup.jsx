import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const RESEND_SECONDS = 30;

export default function Signup() {
  const navigate = useNavigate();
  const { ensureProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [year, setYear] = useState(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('details');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const sendVerificationCode = async () => {
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: { full_name: fullName.trim(), role: 'student', year_of_study: year },
      },
    });
    if (otpError) throw otpError;
  };

  const handleSendCode = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');
    if (!year) {
      setError('Please select your year of study.');
      return;
    }
    setLoading(true);
    try {
      await sendVerificationCode();
      setCode('');
      setCooldown(RESEND_SECONDS);
      setStep('code');
    } catch (err) {
      setError(err?.message || 'Could not send code. Check the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0 || loading || resending) return;
    setError('');
    setInfo('');
    setResending(true);
    try {
      await sendVerificationCode();
      setCooldown(RESEND_SECONDS);
      setInfo('A new verification code was sent.');
    } catch (err) {
      setError(err?.message || 'Could not resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setError('');
    setInfo('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'email',
      });
      if (verifyError) throw verifyError;

      // Existing accounts go to password login; verification remains mandatory
      // for a new account and never resets an existing account's password.
      const { data: { user } } = await supabase.auth.getUser();
      const createdAt = user?.created_at ? new Date(user.created_at).getTime() : Date.now();
      if (Date.now() - createdAt > 60 * 60 * 1000) {
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
    } finally {
      setLoading(false);
    }
  };

  const createOnboardedProfile = async () => {
    let created = null;
    for (let attempt = 0; attempt < 2 && !created; attempt += 1) {
      created = await ensureProfile(fullName.trim());
      if (!created && attempt < 1) await sleep(8000);
    }
    if (!created?.id) {
      throw new Error('The profile could not be saved yet. Please try Create Account again in a moment.');
    }

    let saved = false;
    for (let attempt = 0; attempt < 5 && !saved; attempt += 1) {
      try {
        await updateProfile(created.id, { year_of_study: year, onboarded: true });
        saved = true;
      } catch (err) {
        if (attempt === 4) throw err;
        await sleep(8000);
      }
    }

    // Refresh the auth context before navigating so the route guard sees the
    // persisted onboarded state and does not send a new student to onboarding.
    let fresh = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        fresh = await refreshProfile();
        if (fresh?.onboarded) break;
      } catch {
        // Keep verifying the saved profile before moving on.
      }
      if (attempt < 3) await sleep(1500);
    }
    if (!fresh?.onboarded) {
      throw new Error('Your account was created, but the profile is still syncing. Please try again in a moment.');
    }
  };

  const handleSetPassword = async (event) => {
    event.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await createOnboardedProfile();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not finish account setup. Please try again.');
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
          <div className="rounded-xl border border-sky-100/25 bg-sky-100/[0.08] px-4 py-3 text-sm text-slate-100">
            {error}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderInfo = () => (
    <AnimatePresence>
      {info && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-sky-100">
          {info}
        </motion.p>
      )}
    </AnimatePresence>
  );

  const titles = {
    details: ['Create your student account', 'Prepare with a plan that fits your year.'],
    code: ['Verify your email', `Enter the 6-digit code sent to ${email.trim()}.`],
    password: ['Set your password', 'This is the password you will use to sign in.'],
  };
  const [title, subtitle] = titles[step];
  const stepIndex = ['details', 'code', 'password'].indexOf(step);

  return (
    <PageWrapper>
      <main className="flex min-h-screen items-center justify-center px-4 pb-10 pt-24">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="glass-3d w-full max-w-md rounded-[2rem] p-6 sm:p-8"
        >
          <h1 className="text-2xl font-extrabold text-white">{title}</h1>
          <p className="mt-1 text-sm text-zinc-300">{subtitle}</p>

          <div className="mt-5 flex items-center gap-2" aria-label={`Step ${stepIndex + 1} of 3`}>
            {['details', 'code', 'password'].map((name, index) => (
              <div
                key={name}
                className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? 'bg-sky-100' : 'bg-white/10'}`}
              />
            ))}
          </div>

          {step === 'details' && (
            <form onSubmit={handleSendCode} className="mt-6 space-y-5">
              <AnimatedInput
                label="Full name"
                name="full_name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
              />
              <AnimatedInput
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@college.edu"
                autoComplete="email"
                required
              />
              <fieldset>
                <legend className="mb-2 block text-sm font-medium text-zinc-200">Year of study</legend>
                <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/20 bg-white/[0.06] p-1.5 backdrop-blur-xl">
                  {[1, 2, 3, 4].map((yearOption) => (
                    <button
                      key={yearOption}
                      type="button"
                      aria-pressed={year === yearOption}
                      onClick={() => setYear(yearOption)}
                      data-variant={year === yearOption ? 'primary' : 'secondary'}
                      className={`liquid-button rounded-xl px-2 py-2.5 text-sm font-semibold ${
                        year === yearOption ? 'text-slate-950' : 'text-zinc-300'
                      }`}
                    >
                      Year {yearOption}
                    </button>
                  ))}
                </div>
              </fieldset>
              {renderError()}
              <AnimatedButton type="submit" loading={loading} className="w-full">
                {loading ? 'Sending code…' : 'Send verification code'}
              </AnimatedButton>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="mt-6 space-y-5">
              <AnimatedInput
                label="6-digit code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                disabled={loading || resending}
              />
              {renderError()}
              {renderInfo()}
              <AnimatedButton type="submit" loading={loading} className="w-full">
                {loading ? 'Verifying…' : 'Verify code'}
              </AnimatedButton>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
                <button
                  type="button"
                  disabled={cooldown > 0 || loading || resending}
                  onClick={handleResendCode}
                  className="rounded-full px-2 py-1 font-semibold text-sky-100 underline underline-offset-4 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('details'); setCode(''); setError(''); setInfo(''); }}
                  className="rounded-full px-2 py-1 text-zinc-300 underline underline-offset-4 transition-colors hover:text-white"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleSetPassword} className="mt-6 space-y-5">
              <AnimatedInput
                label="Create password"
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                showPasswordToggle
                required
              />
              <AnimatedInput
                label="Confirm password"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter it again"
                autoComplete="new-password"
                showPasswordToggle
                required
              />
              {renderError()}
              <AnimatedButton type="submit" loading={loading} className="w-full">
                {loading ? 'Creating your profile…' : 'Create account'}
              </AnimatedButton>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-zinc-200 underline underline-offset-4 hover:text-white">
              Sign in
            </Link>
          </p>
        </motion.div>
      </main>
    </PageWrapper>
  );
}
