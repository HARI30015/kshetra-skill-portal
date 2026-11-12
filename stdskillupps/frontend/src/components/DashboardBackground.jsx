import React, { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

// Aurora gradient bubbles for the student + lecturer dashboards: the same
// slow-drifting glass bubbles as the moss version, but each bubble is tinted
// one hue from a violet / sky / pink / mint palette (owner's rule,
// 2026-11-12: attractive gradient colours instead of green). The hue is
// chosen deterministically by bubble index so colours never flicker on
// re-render. Respects reduced-motion and lite devices.
const HUES = [258, 199, 330, 156]; // violet, sky, pink, mint

function isLiteDevice() {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768)
  );
}

function makeBubbles(count) {
  let seed = 418;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  return Array.from({ length: count }, (_, index) => {
    const depth = random();
    const size = 48 + Math.round((random() ** 1.55) * 252);
    return {
      id: index,
      left: Math.round(random() * 108 - 4),
      top: Math.round(random() * 112 - 6),
      size,
      depth,
      hue: HUES[index % HUES.length],
      driftX: Math.round(random() * 60 - 30),
      driftY: Math.round(24 + random() * 78),
      rotate: Math.round(random() * 24 - 12),
      delay: Math.round(random() * -34),
      duration: Math.round(25 + random() * 38),
    };
  });
}

export default function DashboardBackground() {
  const lite = useMemo(isLiteDevice, []);
  const reduced = useReducedMotion();
  const bubbles = useMemo(() => makeBubbles(lite ? 12 : 22), [lite]);

  return (
    <div
      className={`auroraglass${lite ? ' auroraglass--lite' : ''}${reduced ? ' auroraglass--reduced' : ''}`}
      aria-hidden="true"
    >
      <div className="auroraglass__atmosphere" />
      <div className="auroraglass__glow auroraglass__glow--left" />
      <div className="auroraglass__glow auroraglass__glow--right" />
      <div className="auroraglass__bubbles">
        {bubbles.map((bubble) => (
          <span
            key={bubble.id}
            className="auroraglass__bubble"
            style={{
              left: `${bubble.left}%`,
              top: `${bubble.top}%`,
              width: bubble.size,
              height: bubble.size,
              '--bubble-hue': bubble.hue,
              '--bubble-depth': bubble.depth.toFixed(2),
              '--bubble-alpha': (0.38 + bubble.depth * 0.42).toFixed(3),
              '--bubble-rim': (0.24 + bubble.depth * 0.26).toFixed(3),
              '--bubble-glow': (0.07 + bubble.depth * 0.1).toFixed(3),
              '--bubble-drift-x': `${bubble.driftX}px`,
              '--bubble-rise-y': `${-bubble.driftY}px`,
              '--bubble-z-start': `${Math.round(bubble.depth * 36)}px`,
              '--bubble-z-end': `${Math.round(bubble.depth * 72)}px`,
              '--bubble-rotate': `${bubble.rotate}deg`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
            }}
          />
        ))}
      </div>
      <div className="auroraglass__vignette" />
    </div>
  );
}
