import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Global 3D background: twinkling stars, glassy floating spheres/circles,
// glassy cubes, and soft gradient orbs — fixed behind all content.
export default function Background3D() {
  // Deterministic pseudo-random stars (avoid hydration flicker)
  const stars = useMemo(() => {
    const arr = [];
    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = 0; i < 90; i++) {
      arr.push({
        id: i,
        left: `${rand() * 100}%`,
        top: `${rand() * 100}%`,
        size: 1 + rand() * 2.5,
        delay: rand() * 3,
        duration: 1.5 + rand() * 2.5,
        opacity: 0.3 + rand() * 0.7,
        color: rand() > 0.8 ? '#fde68a' : '#ffffff',
      });
    }
    return arr;
  }, []);

  const spheres = [
    { size: 180, left: '6%', top: '15%', c1: 'rgba(139,92,246,0.25)', c2: 'rgba(99,102,241,0.10)', dur: 16, delay: 0, blur: 20 },
    { size: 140, left: '85%', top: '10%', c1: 'rgba(34,211,238,0.22)', c2: 'rgba(14,165,233,0.08)', dur: 19, delay: 1, blur: 18 },
    { size: 220, left: '78%', top: '65%', c1: 'rgba(217,70,239,0.20)', c2: 'rgba(162,28,175,0.08)', dur: 22, delay: 0.5, blur: 24 },
    { size: 160, left: '10%', top: '75%', c1: 'rgba(99,102,241,0.22)', c2: 'rgba(79,70,229,0.08)', dur: 18, delay: 1.5, blur: 20 },
    { size: 110, left: '45%', top: '5%', c1: 'rgba(236,72,153,0.18)', c2: 'rgba(219,39,119,0.06)', dur: 15, delay: 0.8, blur: 16 },
    { size: 90, left: '60%', top: '85%', c1: 'rgba(251,191,36,0.15)', c2: 'rgba(245,158,11,0.05)', dur: 20, delay: 2, blur: 14 },
  ];

  const cubes = [
    { size: 56, left: '22%', top: '28%', dur: 14, delay: 0, rot: 25 },
    { size: 42, left: '72%', top: '38%', dur: 17, delay: 1.2, rot: -18 },
    { size: 68, left: '38%', top: '68%', dur: 20, delay: 0.6, rot: 40 },
    { size: 34, left: '88%', top: '55%', dur: 13, delay: 0.3, rot: -30 },
  ];

  const rings = [
    { size: 120, left: '15%', top: '45%', dur: 24, delay: 0 },
    { size: 90, left: '65%', top: '22%', dur: 28, delay: 1 },
    { size: 150, left: '50%', top: '78%', dur: 26, delay: 0.5 },
  ];

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
      style={{ perspective: '1200px' }}
    >
      {/* Twinkling stars */}
      {stars.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            background: s.color,
            boxShadow: `0 0 ${s.size * 3}px ${s.color}`,
          }}
          animate={{ opacity: [s.opacity * 0.3, s.opacity, s.opacity * 0.3], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Glassy floating spheres / circles */}
      {spheres.map((sp, i) => (
        <motion.div
          key={`sphere-${i}`}
          className="absolute rounded-full"
          style={{
            width: sp.size,
            height: sp.size,
            left: sp.left,
            top: sp.top,
            background: `radial-gradient(circle at 30% 30%, ${sp.c1}, ${sp.c2} 60%, transparent 75%)`,
            backdropFilter: `blur(${sp.blur}px)`,
            WebkitBackdropFilter: `blur(${sp.blur}px)`,
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: 'inset 0 0 30px rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.25)',
            transformStyle: 'preserve-3d',
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -35, 25, 0],
            rotateX: [0, 12, -8, 0],
            rotateY: [0, -10, 8, 0],
          }}
          transition={{ duration: sp.dur, delay: sp.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Glass highlight */}
          <div
            className="absolute rounded-full"
            style={{
              width: '35%',
              height: '25%',
              left: '18%',
              top: '12%',
              background: 'radial-gradient(ellipse, rgba(255,255,255,0.35), transparent 70%)',
            }}
          />
        </motion.div>
      ))}

      {/* Glassy rotating cubes (3D) */}
      {cubes.map((c, i) => (
        <motion.div
          key={`cube-${i}`}
          className="absolute"
          style={{
            width: c.size,
            height: c.size,
            left: c.left,
            top: c.top,
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateX: [c.rot, c.rot + 360],
            rotateY: [c.rot, c.rot + 360],
            y: [0, -18, 0],
          }}
          transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: 'linear' }}
        >
          {/* Cube faces */}
          {[
            { transform: `translateZ(${c.size / 2}px)`, bg: 'rgba(139,92,246,0.18)' },
            { transform: `rotateY(90deg) translateZ(${c.size / 2}px)`, bg: 'rgba(34,211,238,0.15)' },
            { transform: `rotateY(180deg) translateZ(${c.size / 2}px)`, bg: 'rgba(217,70,239,0.15)' },
            { transform: `rotateY(-90deg) translateZ(${c.size / 2}px)`, bg: 'rgba(99,102,241,0.15)' },
            { transform: `rotateX(90deg) translateZ(${c.size / 2}px)`, bg: 'rgba(236,72,153,0.12)' },
            { transform: `rotateX(-90deg) translateZ(${c.size / 2}px)`, bg: 'rgba(251,191,36,0.10)' },
          ].map((face, fi) => (
            <div
              key={fi}
              className="absolute inset-0"
              style={{
                transform: face.transform,
                background: face.bg,
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />
          ))}
        </motion.div>
      ))}

      {/* Glassy rings / torus-like circles */}
      {rings.map((r, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute rounded-full"
          style={{
            width: r.size,
            height: r.size,
            left: r.left,
            top: r.top,
            border: '2px solid rgba(255,255,255,0.10)',
            boxShadow: '0 0 40px rgba(139,92,246,0.12), inset 0 0 30px rgba(255,255,255,0.06)',
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateX: [60, 75, 60],
            rotateY: [0, 30, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: r.dur, delay: r.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Soft gradient glow orbs (base layer) */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{ width: 420, height: 420, left: '8%', top: '12%', background: 'radial-gradient(circle, rgba(139,92,246,0.22), rgba(99,102,241,0.08), transparent 70%)' }}
          animate={{ x: [0, 60, -40, 0], y: [0, -50, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{ width: 340, height: 340, left: '82%', top: '8%', background: 'radial-gradient(circle, rgba(34,211,238,0.18), rgba(14,165,233,0.08), transparent 70%)' }}
          animate={{ x: [0, -50, 40, 0], y: [0, 40, -30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{ width: 380, height: 380, left: '70%', top: '70%', background: 'radial-gradient(circle, rgba(217,70,239,0.18), rgba(162,28,175,0.08), transparent 70%)' }}
          animate={{ x: [0, 40, -30, 0], y: [0, -40, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
