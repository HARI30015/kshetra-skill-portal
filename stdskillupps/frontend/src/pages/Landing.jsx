import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const item3d = {
  hidden: { opacity: 0, y: 80, rotateX: -30, scale: 0.9 },
  show: { opacity: 1, y: 0, rotateX: 0, scale: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

const features = [
  { icon: '💻', title: 'LeetCode tracking', text: 'Link your LeetCode handle and watch your solved counts sync live.', gradient: 'from-violet-600/50 to-purple-500/30' },
  { icon: '🧭', title: 'Year-wise guidance', text: 'From 2nd-year picks to 4th-year intensive prep, get a plan for your year.', gradient: 'from-cyan-500/50 to-blue-500/30' },
  { icon: '🏢', title: 'Placements database', text: 'Browse real placement drives with the skills companies ask for.', gradient: 'from-fuchsia-500/50 to-pink-500/30' },
];

const stats = [
  { value: '2nd–4th yr', label: 'Guided paths' },
  { value: '6+', label: 'Job fields' },
  { value: 'Live', label: 'LeetCode sync' },
  { value: '1:1', label: 'Mentoring view' },
];

// Floating 3D orbs background
function Orbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      <div className="orb animate-orb-drift h-96 w-96 bg-violet-600/30 left-[-5%] top-[10%]" />
      <div className="orb animate-orb-drift h-80 w-80 bg-cyan-500/25 right-[5%] top-[30%]" style={{ animationDelay: '-4s' }} />
      <div className="orb animate-orb-drift h-72 w-72 bg-fuchsia-500/20 left-[30%] bottom-[10%]" style={{ animationDelay: '-8s' }} />
      <div className="orb animate-float h-40 w-40 bg-blue-500/20 right-[20%] bottom-[30%]" />
    </div>
  );
}

export default function Landing() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92]);
  const cardsY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <PageWrapper>
      <Orbs />
      <main ref={ref} className="relative mx-auto max-w-6xl px-4 pb-16 pt-32 sm:pt-36 perspective-2000">
        {/* Hero with 3D parallax */}
        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
          className="text-center preserve-3d"
        >
          <motion.div variants={item3d} style={{ transform: 'translateZ(60px)' }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-200 backdrop-blur-xl animate-float">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-glow-pulse" />
              Placement prep, levelled up
            </span>
          </motion.div>

          <motion.h1
            variants={item3d}
            className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-6xl preserve-3d"
            style={{ transform: 'translateZ(100px)', textShadow: '0 20px 60px rgba(139,92,246,0.4)' }}
          >
            Turn your <span className="text-shine">coding grind</span> into a placement{' '}
            <span className="text-shine">offer</span>
          </motion.h1>

          <motion.p
            variants={item3d}
            className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg"
            style={{ transform: 'translateZ(40px)' }}
          >
            stdskillupps syncs your LeetCode progress, builds a year-wise plan, and shows which companies hire for
            your skills.
          </motion.p>

          <motion.div
            variants={item3d}
            className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style={{ transform: 'translateZ(80px)' }}
          >
            <Link to="/signup" className="perspective-1000">
              <motion.div whileHover={{ scale: 1.05, rotateX: 5 }} whileTap={{ scale: 0.95 }} className="preserve-3d">
                <AnimatedButton className="px-8 py-4 text-base !rounded-2xl shadow-[0_20px_60px_rgba(139,92,246,0.4)]">
                  Get Started →
                </AnimatedButton>
              </motion.div>
            </Link>
            <Link to="/login" className="perspective-1000">
              <motion.div whileHover={{ scale: 1.05, rotateX: -5 }} whileTap={{ scale: 0.95 }} className="preserve-3d">
                <AnimatedButton variant="secondary" className="px-8 py-4 text-base !rounded-2xl">
                  Sign In
                </AnimatedButton>
              </motion.div>
            </Link>
          </motion.div>
        </motion.section>

        {/* 3D feature cards with parallax */}
        <motion.section style={{ y: cardsY }} className="mt-24 grid gap-6 md:grid-cols-3 perspective-2000">
          {features.map((f, i) => (
            <GlassCard key={f.title} delay={0.15 + i * 0.15} tilt glow depth={1 + i * 0.3} className="text-center sm:text-left">
              <motion.div
                animate={{ y: [0, -10, 0], rotateY: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
                className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} text-3xl shadow-lg`}
                style={{ transform: 'translateZ(50px)' }}
              >
                {f.icon}
              </motion.div>
              <h3 className="text-lg font-bold text-white" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{f.text}</p>
            </GlassCard>
          ))}
        </motion.section>

        {/* Stats with 3D hover */}
        <motion.section
          initial={{ opacity: 0, y: 60, rotateX: -20 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="glass-3d mt-16 grid grid-cols-2 gap-6 p-8 text-center sm:grid-cols-4 gradient-border perspective-1000"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.8, z: -100 }}
              whileInView={{ opacity: 1, scale: 1, z: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              whileHover={{ scale: 1.1, z: 30, rotateY: 8 }}
              className="preserve-3d cursor-default"
            >
              <div className="text-gradient text-3xl font-extrabold sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">{s.label}</div>
            </motion.div>
          ))}
        </motion.section>

        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 border-t border-white/10 pt-8 text-center"
        >
          <p className="text-lg font-extrabold text-white">
            std<span className="text-gradient">skillupps</span>
          </p>
          <p className="mt-2 text-sm text-slate-400">Built for students who ship offers. 🚀</p>
        </motion.footer>
      </main>
    </PageWrapper>
  );
}
