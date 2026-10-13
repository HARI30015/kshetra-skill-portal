import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <PageWrapper>
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        {/* Hero — centered: headline + subtitle + Get Started */}
        <motion.main
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-5xl text-center"
          style={{ perspective: 1000 }}
        >
          <motion.h1
            variants={fadeUp}
            className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-7xl"
          >
            Turn your{' '}
            <span className="bg-gradient-to-r from-pink-500 via-amber-400 via-lime-300 to-cyan-400 to-violet-500 bg-clip-text text-transparent">
              coding grind
            </span>{' '}
            into a<br className="hidden sm:block" /> placement{' '}
            <span className="bg-gradient-to-r from-pink-500 via-amber-400 via-lime-300 to-cyan-400 to-violet-500 bg-clip-text text-transparent">
              offer
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg"
          >
            Master DSA, track progress, and land your dream placement with guided prep, real-time analytics, and 2000+ company questions.
          </motion.p>

          {/* 3D zoom stage: Get Started <-> Login / Sign Up */}
          <div
            className="relative mt-9 flex flex-col items-center justify-center"
            style={{ perspective: 1000, transformStyle: 'preserve-3d', minHeight: 120 }}
          >
            <AnimatePresence mode="wait">
              {!showAuth ? (
                <motion.div
                  key="get-started"
                  initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                  exit={{ opacity: 0, scale: 1.6, rotateX: 0, z: 200 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <button
                    onClick={() => setShowAuth(true)}
                    className="relative w-64 rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 px-8 py-4 text-lg font-bold text-white shadow-[0_0_40px_rgba(139,92,246,0.5)] transition hover:shadow-[0_0_60px_rgba(139,92,246,0.7)] sm:w-72"
                  >
                    <span className="relative z-10">Get Started</span>
                    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                      <span className="absolute -top-1 left-1/4 h-2 w-2 rounded-full bg-white/80 blur-[1px]" />
                      <span className="absolute top-2 right-1/3 h-1.5 w-1.5 rounded-full bg-white/60 blur-[1px]" />
                      <span className="absolute bottom-2 left-1/2 h-1 w-1 rounded-full bg-white/70" />
                    </span>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, scale: 0.5, rotateX: -30, z: -200 }}
                  animate={{ opacity: 1, scale: 1, rotateX: 0, z: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotateX: 30, z: -200 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 via-white/[0.06] to-white/[0.02] p-8 shadow-2xl backdrop-blur-xl"
                >
                  <h2 className="text-2xl font-bold text-white">Welcome to stdskillupps</h2>
                  <p className="text-sm text-slate-300">Choose an option to continue</p>
                  <motion.button
                    initial={{ scale: 0.5, rotateX: -30, opacity: 0 }}
                    animate={{ scale: 1, rotateX: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
                    onClick={handleLogin}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-full rounded-2xl border border-white/25 bg-white/5 px-6 py-3.5 text-base font-bold text-white backdrop-blur transition hover:bg-white/10"
                  >
                    Login
                  </motion.button>
                  <motion.button
                    initial={{ scale: 0.5, rotateX: -30, opacity: 0 }}
                    animate={{ scale: 1, rotateX: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.2 }}
                    onClick={handleSignUp}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 px-6 py-3.5 text-base font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] transition hover:shadow-[0_0_45px_rgba(139,92,246,0.6)]"
                  >
                    Sign Up
                  </motion.button>
                  <motion.button
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.3 }}
                    onClick={() => setShowAuth(false)}
                    className="mt-1 text-sm font-medium text-slate-400 transition hover:text-white"
                  >
                    ← Back
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.main>
      </div>
    </PageWrapper>
  );
}
