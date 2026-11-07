import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';

// OWNER: put your real contact email between the quotes. While this is
// empty, the footer shows a clearly marked placeholder instead.
const CONTACT_EMAIL = '';

// Warm the Login/Signup chunks while the visitor is still looking at the hero,
// so tapping through does not wait for a download. Same module paths App.jsx
// lazy-loads, so the browser reuses the exact same chunks. Fire-and-forget:
// never blocks the tap, never shows anything, errors are ignored.
const prefetchAuthPages = () => {
  import('./Login').catch(() => {});
  import('./Signup').catch(() => {});
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

// Stylised, CSS-only mock of the dashboard. Generic labels only: no real
// user data, no numbers, no demo accounts.
// Landing-only accents: mint #7CFFC4 / #5EEAD4, violet #8B5CF6 / #A78BFA, blue #60A5FA.
function Bar({ w }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-[#7CFFC4] to-[#8B5CF6]" style={{ width: w }} />
    </div>
  );
}

function Line({ w }) {
  return <div className="h-2 rounded-full bg-white/10" style={{ width: w }} />;
}

function DashboardPreview() {
  return (
    <div
      role="img"
      aria-label="Preview of the stdskillupps dashboard layout"
      className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-[#8B5CF6]/30 bg-white/[0.04] text-left shadow-[0_0_60px_rgba(139,92,246,0.18)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 border-b border-[#A78BFA]/15 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#7CFFC4]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#A78BFA]/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#60A5FA]/70" />
        <span className="ml-3 h-2 w-32 rounded-full bg-white/15" />
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-3" aria-hidden="true">
        <div className="rounded-2xl border border-[#A78BFA]/15 bg-white/5 p-4">
          <p className="text-xs font-semibold text-zinc-300">Your progress</p>
          <div className="mt-4 space-y-3">
            <Bar w="72%" />
            <Bar w="48%" />
            <Bar w="30%" />
          </div>
        </div>
        <div className="rounded-2xl border border-[#A78BFA]/15 bg-white/5 p-4">
          <p className="text-xs font-semibold text-zinc-300">Recommended next step</p>
          <div className="mt-4 space-y-2.5">
            <Line w="100%" />
            <Line w="80%" />
            <span className="mt-2 inline-block rounded-full bg-gradient-to-r from-[#7CFFC4] to-[#8B5CF6] px-3 py-1 text-[11px] font-bold text-black">Start</span>
          </div>
        </div>
        <div className="rounded-2xl border border-[#A78BFA]/15 bg-white/5 p-4">
          <p className="text-xs font-semibold text-zinc-300">Year roadmap</p>
          <div className="mt-4 space-y-2.5">
            {['Year 2', 'Year 3', 'Year 4'].map((y, i) => (
              <div key={y} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-[#7CFFC4]' : 'border border-[#A78BFA]/50'}`} />
                <span className="text-[11px] text-zinc-400">{y}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[#A78BFA]/15 bg-white/5 p-4 sm:col-span-3">
          <p className="text-xs font-semibold text-zinc-300">Placements</p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            <Line w="90%" />
            <Line w="70%" />
            <Line w="80%" />
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex flex-col items-center px-4">
        {/* Hero — centered: headline + subtitle + Get Started.
            data-vesper-hero lets the background orb brighten while the
            pointer rests here (Background3D reads it; it takes no clicks). */}
        <div data-vesper-hero className="flex min-h-[90vh] w-full flex-col items-center justify-center">
        <motion.main
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-5xl text-center"
          style={{ perspective: 1000 }}
        >
          <motion.p
            variants={fadeUp}
            className="mb-5 text-xs font-semibold tracking-[0.3em] text-[#7CFFC4] sm:text-sm"
          >
            [ LIVING INTERFACE ]
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-7xl"
          >
            Turn your{' '}
            <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
              coding grind
            </span>{' '}
            into a<br className="hidden sm:block" /> placement{' '}
            <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
              offer
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-base text-zinc-300 sm:text-lg"
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
                    onMouseEnter={prefetchAuthPages}
                    onFocus={prefetchAuthPages}
                    onTouchStart={prefetchAuthPages}
                    className="relative w-64 rounded-full bg-gradient-to-r from-[#7CFFC4] via-[#5EEAD4] to-[#8B5CF6] px-8 py-4 text-lg font-bold text-black shadow-[0_0_36px_rgba(124,255,196,0.45),0_0_64px_rgba(139,92,246,0.35)] transition hover:shadow-[0_0_48px_rgba(124,255,196,0.6),0_0_84px_rgba(139,92,246,0.5)] sm:w-72"
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
                  className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-[#7CFFC4]/25 bg-gradient-to-br from-white/10 via-white/[0.06] to-white/[0.02] p-8 shadow-[0_0_70px_rgba(139,92,246,0.28)] backdrop-blur-xl"
                >
                  {/* Project title + Welcome — shown at the top of the auth view */}
                  <h1 className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-center text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl">
                    stdskillupps
                  </h1>
                  <h2 className="text-2xl font-bold text-white">Welcome</h2>
                  <p className="text-sm text-zinc-300">Choose an option to continue</p>
                  <motion.button
                    initial={{ scale: 0.5, rotateX: -30, opacity: 0 }}
                    animate={{ scale: 1, rotateX: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
                    onClick={handleLogin}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-full rounded-2xl border border-[#A78BFA]/45 bg-white/5 px-6 py-3.5 text-base font-bold text-white backdrop-blur transition hover:bg-white/10"
                  >
                    Login
                  </motion.button>
                  <motion.button
                    initial={{ scale: 0.5, rotateX: -30, opacity: 0 }}
                    animate={{ scale: 1, rotateX: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.2 }}
                    onClick={handleSignUp}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-full rounded-2xl bg-white px-6 py-3.5 text-base font-bold text-black shadow-[0_0_30px_rgba(124,255,196,0.4)] transition hover:shadow-[0_0_45px_rgba(139,92,246,0.55)]"
                  >
                    Sign Up
                  </motion.button>
                  <motion.button
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.3 }}
                    onClick={() => setShowAuth(false)}
                    className="mt-1 text-sm font-medium text-zinc-400 transition hover:text-white"
                  >
                    ← Back
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.main>
        </div>

        {/* Preview of what is inside the app (below the hero) */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-3xl pb-12 text-center"
          // Below the fold: skip layout/paint until it scrolls into view.
          style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 600px' }}
        >
          <p className="mb-4 text-sm font-medium text-zinc-400">A look inside</p>
          <DashboardPreview />
        </motion.section>

        {/* Footer: About + Contact */}
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
