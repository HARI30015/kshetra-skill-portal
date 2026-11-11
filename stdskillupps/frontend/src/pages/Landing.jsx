import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';

// OWNER: put your real contact email between the quotes. While this is
// empty, the footer shows a clearly marked placeholder instead.
const CONTACT_EMAIL = '';

// Warm the Login/Signup chunks while the visitor is still looking at the hero,
// so tapping through does not wait for a download. Same module paths App.jsx
// lazy-loads, so the browser reuses the exact same chunks.
const prefetchAuthPages = () => {
  import('./Login').catch(() => {});
  import('./Signup').catch(() => {});
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

function RocketMark() {
  return (
    <div
      className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-white/45 bg-white/[0.08] shadow-[0_0_48px_rgba(255,255,255,0.24),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-2xl sm:h-28 sm:w-28"
      aria-label="stdskillupps rocket logo"
      role="img"
    >
      <svg viewBox="0 0 48 48" width="68" height="68" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M 9 37 C 10 22 20 10 30 11 C 37 12 40 22 38 37" strokeWidth="1.5" />
        <g transform="rotate(45 24 24)">
          <path d="M 24 5 C 27 11 28.5 17 28.5 23 C 28.5 27 26.5 30 24 31.5 C 21.5 30 19.5 27 19.5 23 C 19.5 17 21 11 24 5 Z" />
          <path d="M 24 10 L 24 27" strokeWidth="1.1" />
          <path d="M 20.5 25 L 13.5 30.5 Q 17.5 29.5 20.5 27.5 Z" />
          <path d="M 27.5 25 L 34.5 30.5 Q 30.5 29.5 27.5 27.5 Z" />
        </g>
        <path d="M 10 7.5 L 10.9 10.1 L 13.5 11 L 10.9 11.9 L 10 14.5 L 9.1 11.9 L 6.5 11 L 9.1 10.1 Z" fill="#fff" stroke="none" />
        <path d="M 38 34.5 L 38.9 37.1 L 41.5 38 L 38.9 38.9 L 38 41.5 L 37.1 38.9 L 34.5 38 L 37.1 37.1 Z" fill="#fff" stroke="none" />
      </svg>
    </div>
  );
}

export default function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  return (
    <PageWrapper>
      <div className="flex flex-col items-center px-4">
        <div data-vesper-hero className="flex min-h-[90vh] w-full flex-col items-center justify-center">
          <motion.main
            variants={container}
            initial="hidden"
            animate="show"
            className="mx-auto max-w-5xl text-center"
          >
            <motion.div variants={fadeUp}>
              <RocketMark />
            </motion.div>

            <motion.p variants={fadeUp} className="mb-5 text-xs font-semibold tracking-[0.3em] text-[#7CFFC4] sm:text-sm">
              [ LIVING INTERFACE ]
            </motion.p>

            <motion.h1 variants={fadeUp} className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-7xl">
              Turn your{' '}
              <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                coding grind
              </span>{' '}
              into a<br className="hidden sm:block" /> placement{' '}
              <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                offer
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-2xl text-base text-zinc-300 sm:text-lg">
              Master DSA, track progress, and land your dream placement with guided prep, real-time analytics, and 2000+ company questions.
            </motion.p>
            <motion.p variants={fadeUp} className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              stdskillupps keeps your coding progress, year-wise preparation plan, and real placement drives together in one place.
            </motion.p>

            <div
              className="relative mt-9 flex min-h-[120px] flex-col items-center justify-center"
              style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
            >
              <AnimatePresence mode="wait">
                {!showAuth ? (
                  <motion.div
                    key="get-started"
                    initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    exit={{ opacity: 0, scale: 1.35, rotateX: 0, z: 120 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <button
                      type="button"
                      data-variant="primary"
                      onClick={() => setShowAuth(true)}
                      onMouseEnter={prefetchAuthPages}
                      onFocus={prefetchAuthPages}
                      onTouchStart={prefetchAuthPages}
                      className="liquid-button w-64 rounded-full px-8 py-4 text-lg font-bold sm:w-72"
                    >
                      Get Started
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, scale: 0.62, rotateX: -18, z: -120 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0, z: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotateX: 12, z: -80 }}
                    transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-white/25 bg-slate-950/55 p-8 shadow-[0_0_70px_rgba(148,163,184,0.16)] backdrop-blur-2xl"
                  >
                    <h2 className="text-2xl font-bold text-white">Choose how to continue</h2>
                    <button
                      type="button"
                      data-variant="secondary"
                      onClick={() => navigate('/login')}
                      className="liquid-button w-full rounded-2xl px-6 py-3.5 text-base font-bold text-white"
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      data-variant="primary"
                      onClick={() => navigate('/signup')}
                      className="liquid-button w-full rounded-2xl px-6 py-3.5 text-base font-bold"
                    >
                      Sign Up
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAuth(false)}
                      className="mt-1 rounded-full px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                    >
                      ← Back
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.main>
        </div>

        <footer
          className="mt-12 w-full max-w-5xl border-t border-white/10 py-10 text-left"
          style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 300px' }}
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-base font-bold text-white">About stdskillupps</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                stdskillupps is placement preparation for students. Link your LeetCode and CampusTrack profiles to track
                progress in one place, follow year-wise guidance, and explore placement opportunities.
              </p>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Contact</h2>
              {CONTACT_EMAIL ? (
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-2 inline-block text-sm text-zinc-300 underline underline-offset-2 hover:text-white"
                >
                  {CONTACT_EMAIL}
                </a>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">[Contact email: to be added by the site owner]</p>
              )}
            </div>
          </div>
          <p className="mt-8 text-xs text-zinc-500">© {new Date().getFullYear()} stdskillupps</p>
        </footer>
      </div>
    </PageWrapper>
  );
}
