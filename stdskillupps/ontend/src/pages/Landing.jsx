import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import GlassCard from '../components/GlassCard';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const features = [
  {
    icon: '💻',
    title: 'LeetCode tracking',
    text: 'Link your LeetCode handle and watch your solved counts, difficulty split, and language stats sync live.',
  },
  {
    icon: '🧭',
    title: 'Year-wise guidance',
    text: 'From 2nd-year core-language picks to 4th-year intensive prep, get a plan that matches your year and target field.',
  },
  {
    icon: '🏢',
    title: 'Placements database',
    text: 'Browse real placement drives with the languages and skills companies actually ask for.',
  },
];

const stats = [
  { value: '2nd–4th yr', label: 'Guided learning paths' },
  { value: '6+', label: 'Target job fields' },
  { value: 'Live', label: 'LeetCode stat syncing' },
  { value: '1:1', label: 'Lecturer mentoring view' },
];

export default function Landing() {
  return (
    <PageWrapper>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:pt-36">
        {/* Hero */}
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center"
        >
          <motion.div variants={item}>
            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-200 backdrop-blur-xl">
              Placement prep, levelled up
            </span>
          </motion.div>

          <motion.h1
            variants={item}
            className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl"
          >
            Turn your <span className="text-gradient">coding grind</span> into a placement{' '}
            <span className="text-gradient">offer</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg"
          >
            stdskillupps syncs your LeetCode progress, builds a year-wise learning plan around
            your target job field, and shows you exactly which companies hire for your skills.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup">
              <motion.span
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="btn-shimmer inline-block rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-8 py-4 text-base font-bold text-white shadow-glow"
              >
                Get Started →
              </motion.span>
            </Link>
            <Link to="/login">
              <motion.span
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-xl hover:bg-white/15"
              >
                Sign In
              </motion.span>
            </Link>
          </motion.div>
        </motion.section>

        {/* Feature cards */}
        <section className="mt-24 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <GlassCard key={f.title} delay={0.15 + i * 0.12} hover className="text-center sm:text-left">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
                className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/40 to-cyan-500/40 text-3xl"
              >
                {f.icon}
              </motion.div>
              <h3 className="text-lg font-bold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{f.text}</p>
            </GlassCard>
          ))}
        </section>

        {/* Stats strip */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="glass mt-16 grid grid-cols-2 gap-6 p-8 text-center sm:grid-cols-4"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="text-gradient text-3xl font-extrabold sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 border-t border-white/10 pt-8 text-center"
        >
          <p className="text-lg font-extrabold text-white">
            std<span className="text-gradient">skillupps</span>
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Built for students who'd rather ship offers than excuses. 🚀
          </p>
          <p className="mt-1 text-xs text-slate-500">
            © 2026 stdskillupps. Placement prep, levelled up.
          </p>
        </motion.footer>
      </main>
    </PageWrapper>
  );
}
