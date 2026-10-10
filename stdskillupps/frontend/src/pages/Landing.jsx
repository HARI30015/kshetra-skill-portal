import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import GlassCard from '../components/GlassCard';
import AnimatedButton from '../components/AnimatedButton';
const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const item = { hidden: { opacity: 0, y: 34 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };
const features = [
{ icon: '💻', title: 'LeetCode tracking', text: 'Link your LeetCode handle and watch your solved counts sync live.', gradient: 'from-violet-600/50 to-purple-500/30' },
{ icon: '🧭', title: 'Year-wise guidance', text: 'From 2nd-year picks to 4th-year intensive prep, get a plan for your year.', gradient: 'from-cyan-500/50 to-blue-500/30' },
{ icon: '🏢', title: 'Placements database', text: 'Browse real placement drives with the skills companies ask for.', gradient: 'from-fuchsia-500/50 to-pink-500/30' },
];
const stats = [{ value: '2nd–4th yr', label: 'Guided paths' },{ value: '6+', label: 'Job fields' },{ value: 'Live', label: 'LeetCode sync' },{ value: '1:1', label: 'Mentoring view' }];
export default function Landing() {
return (
<PageWrapper>
<main className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:pt-36">
<motion.section variants={container} initial="hidden" animate="show" className="text-center">
<motion.div variants={item}>
<span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-200 backdrop-blur-xl animate-float">
<span className="h-2 w-2 rounded-full bg-cyan-400 animate-glow-pulse" />Placement prep, levelled up</span>
</motion.div>
<motion.h1 variants={item} className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">Turn your <span className="text-shine">coding grind</span> into a placement <span className="text-shine">offer</span></motion.h1>
<motion.p variants={item} className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">stdskillupps syncs your LeetCode progress, builds a year-wise plan, and shows which companies hire for your skills.</motion.p>
<motion.div variants={item} className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
<Link to="/signup"><AnimatedButton className="px-8 py-4 text-base !rounded-2xl">Get Started →</AnimatedButton></Link>
<Link to="/login"><AnimatedButton variant="secondary" className="px-8 py-4 text-base !rounded-2xl">Sign In</AnimatedButton></Link>
</motion.div>
</motion.section>
<section className="mt-24 grid gap-6 md:grid-cols-3">
{features.map((f, i) => (
<GlassCard key={f.title} delay={0.15 + i * 0.12} tilt glow className="text-center sm:text-left">
<motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }} className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} text-3xl`}>{f.icon}</motion.div>
<h3 className="text-lg font-bold text-white">{f.title}</h3>
<p className="mt-2 text-sm leading-relaxed text-slate-300">{f.text}</p>
</GlassCard>
))}
</section>
<motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="glass mt-16 grid grid-cols-2 gap-6 p-8 text-center sm:grid-cols-4 gradient-border">
{stats.map((s, i) => (
<motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.08 }}>
<div className="text-gradient text-3xl font-extrabold sm:text-4xl">{s.value}</div>
<div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">{s.label}</div>
</motion.div>
))}
</motion.section>
<motion.footer initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-20 border-t border-white/10 pt-8 text-center">
<p className="text-lg font-extrabold text-white">std<span className="text-gradient">skillupps</span></p>
<p className="mt-2 text-sm text-slate-400">Built for students who ship offers. 🚀</p>
</motion.footer>
</main>
</PageWrapper>
);
}
