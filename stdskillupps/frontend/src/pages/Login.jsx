import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import AnimatedInput from '../components/AnimatedInput';
import AnimatedButton from '../components/AnimatedButton';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) throw otpError;
      setStep('code');
    } catch (err) {
      setError(err?.message || 'Could not send code. Check the email and try again.');
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

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
      await refreshProfile();
      const from = location.state?.from;
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid code. Please try again.');
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <main className="flex min-h-screen items-center justify-center px-4 pt-24">
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
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h1 className="text-2xl font-extrabold text-white">Welcome back 👋</h1>
              <p className="mt-1 text-sm text-slate-300">
                {step === 'email'
                  ? 'Enter your email — we\'ll send you a login code.'
                  : `We sent a 6-digit code to ${email}.`}
              </p>
            </motion.div>

            {step === 'email' ? (
              <form onSubmit={handleSendCode} className="mt-6 space-y-5">
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

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <AnimatedButton type="submit" loading={loading} className="w-full">
                    {loading ? 'Sending code…' : 'Send Login Code'}
                  </AnimatedButton>
                </motion.div>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="mt-6 space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
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

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="space-y-3"
                >
                  <AnimatedButton type="submit" loading={loading} className="w-full">
                    {loading ? 'Verifying…' : 'Verify & Sign In'}
                  </AnimatedButton>
                  <button
                    type="button"
                    onClick={() => { setStep('email'); setCode(''); setError(''); }}
                    className="w-full text-center text-sm text-slate-400 hover:text-slate-300"
                  >
                    Use a different email
                  </button>
                </motion.div>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-slate-400">
              New here?{' '}
              <Link to="/signup" className="font-semibold text-cyan-300 hover:text-cyan-200">
                Create an account
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </PageWrapper>
  );
}
