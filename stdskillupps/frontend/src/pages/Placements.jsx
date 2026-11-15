import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import GlassCard from '../components/GlassCard';

const COMPANIES = [
  {
    company: 'Tata Consultancy Services (TCS)',
    short: 'TCS',
    level: 'Moderate',
    package: 'Approx. ₹3.3–9.3 LPA CTC',
    roles: 'Ninja, Digital and Prime software tracks',
    path: 'Clear the official NQT aptitude sections; add timed DSA, OOP, DBMS/SQL, OS, networks, projects and communication. Digital/Prime need stronger coding and advanced problem solving.',
    source: 'https://www.tcs.com/careers/india/tcs-all-india-nqt-hiring',
  },
  {
    company: 'Infosys',
    short: 'Infosys',
    level: 'Moderate',
    package: 'Approx. ₹3–5 LPA common; selective tracks ₹6.25–21 LPA',
    roles: 'Systems Engineer, Digital Specialist Engineer, Specialist Programmer',
    path: 'Prepare aptitude, one strong coding language, DSA, SQL, core CS and two explainable projects. Use HackWithInfy practice for selective specialist tracks.',
    source: 'https://www.infosys.com/careers/graduates.html',
  },
  {
    company: 'Wipro',
    short: 'Wipro',
    level: 'Moderate',
    package: 'Approx. ₹3.5–6.5 LPA CTC',
    roles: 'Elite technical graduate and Turbo technical tracks',
    path: 'Build timed coding and aptitude fundamentals, revise OOP/DBMS/OS/networks, and prepare one deployed project. Turbo needs deeper DSA and stronger technical evidence.',
    source: 'https://careers.wipro.com/content/Early-Careers/',
  },
  {
    company: 'Accenture India',
    short: 'Accenture',
    level: 'Moderate',
    package: 'Approx. ₹3.9–5 LPA CTC for common fresher roles',
    roles: 'Associate Software Engineer, Application Development Associate, AI/ML associate',
    path: 'Prepare one language, OOP, DSA, SQL, REST APIs, Git and SDLC. Practise timed problem solving, logical reasoning, debugging and concise STAR stories.',
    source: 'https://www.accenture.com/in-en/careers/entry-level',
  },
  {
    company: 'Cognizant India',
    short: 'Cognizant',
    level: 'Moderate',
    package: 'Approx. ₹3.8–4.4 LPA CTC',
    roles: 'GenC Analyst Trainee and Programmer Analyst Trainee',
    path: 'Prepare aptitude, communication and technical assessments. Focus on Java/Python/C++, OOP, basic DSA, SQL, DBMS, OS, networks and project explanations.',
    source: 'https://careers.cognizant.com/india-en/pathways-to-cognizant/genc-program/',
  },
  {
    company: 'Amazon India',
    short: 'Amazon',
    level: 'Highly competitive',
    package: 'Approx. ₹25–35 LPA total compensation benchmark',
    roles: 'Software Development Engineer I and university talent roles',
    path: 'Reach strong DSA and coding-test fluency, learn OOD and basic system design, build credible projects, and prepare STAR stories mapped to Leadership Principles.',
    source: 'https://amazon.jobs/content/en/career-programs/university/sde',
  },
  {
    company: 'Microsoft India',
    short: 'Microsoft',
    level: 'Highly competitive',
    package: 'Approx. ₹27–38 LPA annual package benchmark',
    roles: 'Recent-graduate Software Engineer and product engineering roles',
    path: 'Practise clean, compilable DSA solutions with edge-case testing. Cover OOP, OS, SQL, networking and basic distributed systems; explain project trade-offs clearly.',
    source: 'https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing',
  },
  {
    company: 'Google India',
    short: 'Google',
    level: 'Highly competitive',
    package: 'Approx. ₹30–50 LPA total compensation benchmark',
    roles: 'Early-career Software Engineer and team-specific technology roles',
    path: 'Build excellent DSA, CS fundamentals, coding communication and project depth. Track the exact India-eligible posting because not every early-career role accepts BTech freshers.',
    source: 'https://www.google.com/about/careers/applications/early-career',
  },
];

const LEVEL_STYLES = {
  Moderate: 'border-sky-200/30 bg-sky-200/10 text-sky-100',
  'Highly competitive': 'border-fuchsia-200/30 bg-fuchsia-200/10 text-fuchsia-100',
};

export default function Placements() {
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('All');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COMPANIES.filter((item) => {
      const matchesQuery = !q || `${item.company} ${item.roles} ${item.path}`.toLowerCase().includes(q);
      return matchesQuery && (level === 'All' || item.level === level);
    });
  }, [query, level]);

  return (
    <PageWrapper>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold text-white">
          Placement <span className="text-gradient">targets</span>
        </motion.h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
          A practical starting map for a 4th-year BTech CSE student: who hires, what roles to watch, the approximate package signal, and the preparation level needed.
        </p>
        <div className="mt-4 rounded-2xl border border-amber-200/25 bg-amber-100/[0.08] p-4 text-xs leading-relaxed text-amber-50/90">
          Package figures are approximate annual India CTC/total-compensation benchmarks from public company and salary sources, not guaranteed offers or take-home pay. They vary by year, role, location, hiring track, stock/bonus and written offer. Always verify the current official job notice.
        </div>

        <div className="glass mt-6 p-5">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search company, role, skill or preparation…"
            className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-zinc-400 outline-none focus:border-white"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {['All', 'Moderate', 'Highly competitive'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setLevel(item)}
                className={`liquid-button rounded-full border px-4 py-1.5 text-xs font-semibold ${level === item ? 'border-transparent bg-white text-black shadow-glow' : 'border-white/20 bg-white/10 text-zinc-300'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {filtered.map((item, index) => (
            <motion.div key={item.company} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.04, 0.35) }}>
              <GlassCard className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">{item.company}</h2>
                    <p className="mt-1 text-sm text-zinc-300">{item.roles}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${LEVEL_STYLES[item.level]}`}>
                    {item.level}
                  </span>
                </div>
                <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white">{item.package}</p>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">How to reach this placement</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-200">{item.path}</p>
                </div>
                <a href={item.source} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs font-semibold text-sky-100 underline underline-offset-2">
                  Check source / current opening ↗
                </a>
              </GlassCard>
            </motion.div>
          ))}
        </div>
        {filtered.length === 0 && <GlassCard className="mt-6 text-center text-sm text-zinc-300">No company matches this search.</GlassCard>}
      </main>
    </PageWrapper>
  );
}
