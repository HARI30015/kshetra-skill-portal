import React from 'react';
import { motion } from 'framer-motion';

// Floating blurred gradient orbs that drift slowly behind page content.
const orbs = [
  { size: 420, x: '8%', y: '12%', c1: '#8b5cf6', c2: '#6366f1', dur: 18 },
  { size: 340, x: '82%', y: '8%', c1: '#22d3ee', c2: '#0ea5e9', dur: 22 },
  { size: 380, x: '70%', y: '70%', c1: '#d946ef', c2: '#a21caf', dur: 20 },
  { size: 300, x: '12%', y: '78%', c1: '#6366f1', c2: '#4f46e5', dur: 24 },
];

export default function Orbs() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            width: o.size,
            height: o.size,
            left: o.x,
            top: o.y,
            background: `radial-gradient(circle, ${o.c1}55, ${o.c2}22, transparent 70%)`,
          }}
          animate={{ x: [0, 60, -40, 0], y: [0, -50, 40, 0] }}
          transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
