import React, { useEffect, useState } from 'react';

/* All visuals here are display-only, monochrome, and computed from real
   data passed in by Dashboard.jsx. Nothing is invented: when data is
   missing, the piece renders nothing (or a neutral prompt). */

/* ---------------- progress helpers ---------------- */

// Next milestone above `value`, or null when every milestone is reached.
function nextMilestone(value, steps) {
  const v = Math.max(Number(value) || 0, 0);
  const next = steps.find((x) => x > v);
  return next === undefined ? null : next;
}

// Slim ring. `value` / `max` decide the fill; children render in the middle.
export function ProgressRing({ value, max, size = 56, stroke = 5, children }) {
  const target = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#fff"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{children}</div>
    </div>
  );
}

// LeetCode: ring showing progress toward the next solved-count milestone.
export function MilestoneRing({ value, steps }) {
  const v = Math.max(Number(value) || 0, 0);
  const next = nextMilestone(v, steps);
  const max = next ?? Math.max(v, 1);
  const pct = Math.round(Math.min(v / max, 1) * 100);
  return (
    <div className="mt-5 flex items-center justify-center gap-4 rounded-2xl bg-white/5 px-4 py-3">
      <ProgressRing value={v} max={max}>
        {pct}%
      </ProgressRing>
      <div className="text-left">
        <p className="text-sm font-semibold text-white">
          {next ? `Next milestone: ${next} solved` : 'All milestones reached'}
        </p>
        <p className="text-xs text-zinc-400">{next ? `${next - v} to go` : `${v} problems solved`}</p>
      </div>
    </div>
  );
}

// CampusTrack: slim bar. If the real maximum score is known, pass `max`;
// otherwise progress is shown toward the next round milestone.
export function MilestoneBar({ value, steps, max }) {
  const v = Number(value);
  if (value === null || value === undefined || value === '' || Number.isNaN(v)) return null;
  const known = typeof max === 'number' && max > 0;
  const next = known ? max : nextMilestone(v, steps);
  const denom = next ?? Math.max(v, 1);
  const pct = Math.min(Math.max(v / denom, 0), 1) * 100;
  return (
    <div className="mt-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${pct}%`, transition: 'width 0.9s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </div>
      <p className="mt-1.5 text-center text-[11px] text-zinc-400">
        {known ? `${v} of ${max}` : next ? `Next milestone: ${next}` : 'All milestones reached'}
      </p>
    </div>
  );
}

/* ---------------- streak ---------------- */

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Consecutive calendar days (browser local time) with a login record,
// ending today, or yesterday if there is no record yet today.
// Accepts an array of timestamps or { logins: [...] }. Returns 0 if none.
export function computeStreak(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.logins) ? data.logins : [];
  const days = new Set();
  list.forEach((v) => {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) days.add(dayKey(d));
  });
  if (days.size === 0) return 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

/* ---------------- badges ---------------- */

const BADGES = [
  { id: 'first', label: 'First problem', hint: 'Solve 1 problem', test: (s) => (s.total_solved || 0) >= 1 },
  { id: 'p50', label: '50 solved', hint: 'Solve 50 problems', test: (s) => (s.total_solved || 0) >= 50 },
  { id: 'p100', label: '100 solved', hint: 'Solve 100 problems', test: (s) => (s.total_solved || 0) >= 100 },
  { id: 'p250', label: '250 solved', hint: 'Solve 250 problems', test: (s) => (s.total_solved || 0) >= 250 },
  { id: 'hard', label: 'First Hard', hint: 'Solve 1 Hard problem', test: (s) => (s.hard_solved || 0) >= 1 },
];

function BadgeIcon({ earned }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {earned ? (
        <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <rect x="6" y="11" width="12" height="8" rx="2" />
          <path d="M9 11V8a3 3 0 016 0v3" />
        </>
      )}
    </svg>
  );
}

// Streak (only if real history exists) + badges (only if stats exist).
export function AchievementsCard({ stats, streakDays }) {
  return (
    <div className="mt-4">
      {streakDays > 0 && (
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-white/30 bg-white/10 px-4 py-3">
          <span className="text-4xl font-extrabold leading-none text-white">{streakDays}</span>
          <div>
            <p className="text-sm font-bold text-white">day streak</p>
            <p className="text-xs text-zinc-400">Consecutive days you signed in</p>
          </div>
        </div>
      )}

      {stats ? (
        <>
          <p className="mb-2.5 text-sm font-semibold text-zinc-300">
            Badges · {BADGES.filter((b) => b.test(stats)).length} of {BADGES.length} earned
          </p>
          <ul className="grid grid-cols-2 gap-2.5">
            {BADGES.map((b) => {
              const earned = b.test(stats);
              return (
                <li
                  key={b.id}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${
                    earned ? 'border-white/50 bg-white/15 text-white' : 'border-dashed border-white/15 bg-white/[0.03] text-zinc-500'
                  }`}
                >
                  <BadgeIcon earned={earned} />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-bold">{b.label}</span>
                    {!earned && <span className="block truncate text-[10px]">{b.hint}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="text-sm text-zinc-400">Sync your LeetCode stats to start earning badges.</p>
      )}
    </div>
  );
}

/* ---------------- year roadmap ---------------- */

const STAGES = [2, 3, 4];

// Read-only 2nd -> 3rd -> 4th year path. `guides` is the dashboard's existing
// YEAR_GUIDE; `languages` are the plan's recommended languages (shown on the
// 2nd-year stage only when the student is in 2nd year).
export function YearRoadmap({ year, guides, languages }) {
  return (
    <div className="mt-4">
      {year < 2 && (
        <p className="mb-4 rounded-xl bg-white/5 px-4 py-2.5 text-xs leading-relaxed text-zinc-300">
          You are in Year {year}. {guides[year]?.text} The path below starts in Year 2.
        </p>
      )}
      <ol className="grid gap-4 sm:grid-cols-3">
        {STAGES.map((y, i) => {
          const state = year > y ? 'done' : year === y ? 'current' : 'upcoming';
          const g = guides[y];
          const box =
            state === 'current'
              ? 'border-white bg-white/15'
              : state === 'done'
              ? 'border-white/30 bg-white/5'
              : 'border-white/10 bg-white/[0.03] opacity-70';
          return (
            <li key={y} className={`rounded-2xl border p-4 ${box}`} aria-current={state === 'current' ? 'step' : undefined}>
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                    state === 'current' ? 'border-white bg-white text-black' : 'border-white/40 text-white'
                  }`}
                >
                  {state === 'done' ? <BadgeIcon earned /> : y}
                </span>
                {i < STAGES.length - 1 && <span className="hidden h-px flex-1 bg-white/25 sm:block" />}
              </div>
              <p className="mt-3 text-sm font-bold text-white">{g.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-300">{g.text}</p>
              {state === 'current' && (
                <p className="mt-2 text-[11px] font-semibold text-white">You are here</p>
              )}
              {y === 2 && state === 'current' && languages?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {languages.map((l) => (
                    <span key={l} className="rounded-full border border-white/30 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      {l}
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
