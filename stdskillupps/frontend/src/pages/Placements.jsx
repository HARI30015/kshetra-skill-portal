import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../components/PageWrapper';
import GlassCard from '../components/GlassCard';
import Loader from '../components/Loader';
import { getPlacements } from '../api';

const FIELDS = ['All', 'SWE', 'Data Science', 'Frontend', 'Backend', 'DevOps', 'Mobile'];

export default function Placements() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [field, setField] = useState('All');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search input to avoid hammering the API.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      if (field !== 'All') params.field = field;
      const data = await getPlacements(params);
      setPlacements(Array.isArray(data) ? data : data.placements || []);
    } catch {
      setPlacements([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, field]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PageWrapper>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-white"
        >
          Placement <span className="text-gradient">Drives</span> 🏢
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-2 text-sm text-slate-300"
        >
          Find drives hiring for your stack and target field.
        </motion.p>

        {/* Search + filters */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass mt-6 p-5"
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company, role, or skill…"
              className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-11 pr-4 text-white placeholder-slate-400 backdrop-blur-xl outline-none transition focus:border-cyan-400"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {FIELDS.map((f) => {
              const active = field === f;
              return (
                <motion.button
                  key={f}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setField(f)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-transparent bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-glow'
                      : 'border-white/20 bg-white/10 text-slate-300 hover:bg-white/15'
                  }`}
                >
                  {f}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Results */}
        {loading ? (
          <Loader label="Searching drives…" />
        ) : placements.length === 0 ? (
          <GlassCard delay={0.1} className="mt-6 text-center">
            <p className="text-3xl">🔭</p>
            <p className="mt-2 font-semibold text-white">No drives found</p>
            <p className="mt-1 text-sm text-slate-400">Try a different search or field filter.</p>
          </GlassCard>
        ) : (
          <motion.div layout className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {placements.map((p, i) => (
                <motion.div
                  layout
                  key={p.id}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.5) }}
                  whileHover={{ y: -6 }}
                  className="glass flex flex-col p-6"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-white">{p.company}</h3>
                      <p className="text-sm text-slate-300">{p.role}</p>
                    </div>
                    {p.package_lpa && (
                      <span className="shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-3 py-1 text-xs font-bold text-white shadow-glow">
                        {p.package_lpa} LPA
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                    {p.job_field && <span>🎯 {p.job_field}</span>}
                    {p.location && <span>📍 {p.location}</span>}
                    {p.drive_date && <span>📅 {p.drive_date}</span>}
                  </div>

                  {p.languages?.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Languages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.languages.map((l) => (
                          <span key={l} className="rounded-full bg-cyan-500/15 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.skills?.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {p.skills.map((s) => (
                          <span key={s} className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </PageWrapper>
  );
}
