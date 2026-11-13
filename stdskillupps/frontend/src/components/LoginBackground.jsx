import { useMemo } from 'react';
import { useReducedMotion } from 'framer-motion';

function isLiteDevice() {
  return typeof window !== 'undefined' && (
    window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768
  );
}

function seededRandom(seedValue) {
  let seed = seedValue;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export default function LoginBackground() {
  const lite = useMemo(isLiteDevice, []);
  const reduced = useReducedMotion();
  const stars = useMemo(() => {
    const random = seededRandom(631);
    const modes = ['twinkle', 'drift', 'rise', 'sway'];
    return Array.from({ length: lite ? 48 : 104 }, (_, id) => {
      const dx = Math.round(random() * 70 - 35);
      return {
        id,
        left: random() * 100,
        top: random() * 100,
        size: random() > 0.95 ? 1.9 + random() * 1.2 : 0.7 + random() * 1.1,
        alpha: (0.24 + random() * 0.58).toFixed(2),
        color: ['#f5f8ff', '#b8deff', '#c3bbff', '#a8f2eb'][Math.floor(random() * 4)],
        mode: modes[Math.floor(random() * modes.length)],
        dx: `${dx}px`,
        reverseDx: `${Math.round(dx * -0.55)}px`,
        dy: `${Math.round(16 + random() * 62)}px`,
        duration: `${Math.round(20 + random() * 44)}s`,
        delay: `${Math.round(random() * -58)}s`,
      };
    });
  }, [lite]);
  const streaks = useMemo(() => {
    const random = seededRandom(929);
    return Array.from({ length: lite ? 2 : 3 }, (_, id) => ({
      id,
      top: `${12 + random() * 72}%`,
      width: `${30 + random() * 38}vw`,
      duration: `${16 + random() * 12}s`,
      delay: `${random() * -24}s`,
    }));
  }, [lite]);

  return (
    <div className={`login-motionscape${lite ? ' login-motionscape--lite' : ''}${reduced ? ' login-motionscape--reduced' : ''}`} aria-hidden="true">
      <div className="login-motionscape__wash" />
      <div className="login-motionscape__aurora login-motionscape__aurora--one" />
      <div className="login-motionscape__aurora login-motionscape__aurora--two" />
      <div className="login-motionscape__glow login-motionscape__glow--left" />
      <div className="login-motionscape__glow login-motionscape__glow--right" />
      <div className="login-motionscape__glow login-motionscape__glow--low" />
      <div className="login-motionscape__starfield">
        {stars.map((star) => (
          <span
            key={star.id}
            className={`login-motionscape__star login-motionscape__star--${star.mode}`}
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              color: star.color,
              backgroundColor: star.color,
              '--login-star-alpha': star.alpha,
              '--login-star-dx': star.dx,
              '--login-star-reverse-dx': star.reverseDx,
              '--login-star-dy': `-${star.dy}`,
              animationDuration: star.duration,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>
      <div className="login-motionscape__streaks">
        {streaks.map((streak) => (
          <span
            key={streak.id}
            className="login-motionscape__streak"
            style={{
              top: streak.top,
              width: streak.width,
              animationDuration: streak.duration,
              animationDelay: streak.delay,
            }}
          />
        ))}
      </div>
      <div className="login-motionscape__vignette" />
    </div>
  );
}
