import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const features = [
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="url(#g1)" strokeWidth="1.5">
        <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#22d3ee"/></linearGradient></defs>
        <rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M2 20h20M9 16v2M15 16v2"/>
      </svg>
    ),
    title: 'LeetCode tracking',
    text: 'Track daily problems \u2022 Streaks \u2022 Difficulty analytics',
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="url(#g2)" strokeWidth="1.5">
        <defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f0abfc"/><stop offset="100%" stopColor="#818cf8"/></linearGradient></defs>
        <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 7.5l2.5 2.5L12 12.5l-1.5-1.5z" fill="url(#g2)" stroke="none"/>
      </svg>
    ),
    title: 'Year-wise guidance',
    text: 'Curated roadmap \u2022 1st to 4th year \u2022 Milestones',
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="url(#g3)" strokeWidth="1.5">
        <defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f9a8d4"/><stop offset="100%" stopColor="#22d3ee"/></linearGradient></defs>
        <path d="M3 21h18M5 21V8l4-2v15M9 21V4l6 2v15M15 21v-9l4 1v8M7 11h2M7 14h2M12 8h2M12 11h2M12 14h2"/>
      </svg>
    ),
    title: 'Placements database',
    text: '200+ companies \u2022 Roles \u2022 Package insights',
  },
];

const stats = [
  { value: '12K+', label: 'Students Placed', color: 'from-cyan-400 to-violet-500' },
  { value: '200+', label: 'Companies', color: 'from-violet-400 to-purple-600' },
  { value: '95%', label: 'Interview Rate', color: 'from-pink-400 to-cyan-400' },
  { value: '50+', label: 'Colleges', color: 'from-blue-400 to-violet-500' },
];

export default function Landing() {
  return (
    <PageWrapper>
      <div className="relative mx-auto max-w-7xl px-4 pb-16">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-4 flex max-w-5xl items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-6 py-3 backdrop-blur-xl"
        >
          <Link to="/" className="flex items-center gap-2.5">
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
              <defs>
                <linearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#c084fc"/><stop offset="50%" stopColor="#818cf8"/><stop offset="100%" stopColor="#22d3ee"/>
                </linearGradient>
              </defs>
              <path d="M16 2l12 7v14l-12 7-12-7V9l12-7z" stroke="url(#logo)" strokeWidth="2" fill="url(#logo)" fillOpacity="0.15"/>
              <path d="M16 8l7 4v8l-7 4-7-4v-8l7-4z" stroke="url(#logo)" strokeWidth="1.5" fill="none"/>
              <circle cx="16" cy="16" r="2.5" fill="url(#logo)"/>
            </svg>
            <span className="text-2xl font-extrabold tracking-tight text-white">stdskillupps</span>
          </Link>
          <nav className="hidden items-center gap-8 text-[15px] font-medium text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#practice" className="transition hover:text-white">Practice</a>
            <a href="#companies" className="transition hover:text-white">Companies</a>
            <a href="#resources" className="transition hover:text-white">Resources</a>
            <a href="#about" className="transition hover:text-white">About</a>
          </nav>
          <Link
            to="/login"
            className="rounded-xl border border-white/30 bg-white/5 px-6 py-2 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/15"
          >
            Sign In
          </Link>
        </motion.header>

        {/* Hero */}
        <motion.main
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto mt-14 max-w-5xl text-center sm:mt-20"
        >
          <motion.h1
            variants={fadeUp}
            className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-7xl"
          >
            Turn your{' '}
            <span className="bg-gradient-to-r from-pink-500 via-amber-400 via-lime-300 to-cyan-400 to-violet-500 bg-clip-text text-transparent">
              coding grind
            </span>{' '}
            into a<br className="hidden sm:block" /> a placement{' '}
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

          <motion.div variants={fadeUp} className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="relative w-64 rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 px-8 py-4 text-lg font-bold text-white shadow-[0_0_40px_rgba(139,92,246,0.5)] transition hover:shadow-[0_0_60px_rgba(139,92,246,0.7)] sm:w-72"
            >
              <span className="relative z-10">Get Started</span>
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                <span className="absolute -top-1 left-1/4 h-2 w-2 rounded-full bg-white/80 blur-[1px]" />
                <span className="absolute top-2 right-1/3 h-1.5 w-1.5 rounded-full bg-white/60 blur-[1px]" />
                <span className="absolute bottom-2 left-1/2 h-1 w-1 rounded-full bg-white/70" />
              </span>
            </Link>
            <Link
              to="/login"
              className="w-64 rounded-2xl border border-white/25 bg-white/5 px-8 py-4 text-lg font-bold text-white backdrop-blur transition hover:bg-white/10 sm:w-72"
            >
              Sign In
            </Link>
          </motion.div>
        </motion.main>

        {/* Feature cards */}
        <motion.section
          id="features"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mt-16 grid max-w-6xl gap-6 sm:mt-20 md:grid-cols-3"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -8 }}
              className="relative rounded-3xl border border-white/15 bg-gradient-to-br from-white/10 via-white/[0.06] to-white/[0.02] p-8 text-center backdrop-blur-xl"
              style={{ transform: 'perspective(1000px) rotateX(6deg)' }}
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="mx-auto mb-5 flex justify-center">{f.icon}</div>
              <h3 className="text-2xl font-bold text-white">{f.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-300">{f.text}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* Stats bar */}
        <motion.section
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-6 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-8 backdrop-blur-xl sm:grid-cols-4"
        >
          {stats.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="text-center">
              <div className={`bg-gradient-to-r ${s.color} bg-clip-text text-5xl font-extrabold text-transparent sm:text-6xl`}>
                {s.value}
              </div>
              <div className="mt-1 text-[15px] font-medium text-slate-300">{s.label}</div>
            </motion.div>
          ))}
        </motion.section>
      </div>
    </PageWrapper>
  );
}
