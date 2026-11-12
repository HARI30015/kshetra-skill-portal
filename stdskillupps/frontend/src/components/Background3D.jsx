import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import DashboardBackground from './DashboardBackground';
// The reference galaxy photo, converted to a monochrome square centred on the
// galaxy core. It is embedded as a data URI in src/assets/galaxy.js (same image
// bytes) because the GitHub connector only pushes text files, not binary images.
import { galaxyUrl } from '../assets/galaxy';

// BACKGROUND SYSTEM — mounted once in App.jsx behind every page.
//
//  • LANDING ("/"): the Vesper-style mint + violet living orb.
//  • STUDENT + LECTURER DASHBOARDS: an orange/blue particle galaxy with gentle
//    pointer and scroll parallax, honoring reduced-motion preferences.
//  • OTHER PAGES: the original black-and-white galaxy (MonoBackground below).
//
// All scenes are fixed at z-0 and pointer-events: none, behind page content.
//
// ── MonoBackground: CHOOSE YOUR BACKGROUND ─────────────────────────────
// Set DEFAULT_BG_THEME below to one of: 'nebula' | 'starfield' | 'spiral' | 'milkyway'
// To PREVIEW without editing code, open any page of the site with ?bg=<name>
// (e.g. https://stdskillupps.vercel.app/login?bg=spiral). The preview lasts for
// that browser tab only (sessionStorage); the saved default is DEFAULT_BG_THEME.
export const BG_THEMES = ['nebula', 'starfield', 'spiral', 'milkyway'];
export const DEFAULT_BG_THEME = 'nebula';

const W = (a) => `rgba(255,255,255,${a})`;

// orbs: [size px, left, top, alpha, drift seconds]
// wisps: [width, height, left, top, rotate deg, alpha]
const THEMES = {
  // Big soft glowing clouds + dense stars + swirl wisps
  nebula: {
    orbs: [[560, '-8%', '-10%', 0.2, 26], [440, '70%', '-6%', 0.16, 30], [620, '58%', '52%', 0.18, 34], [380, '4%', '58%', 0.15, 28], [300, '38%', '30%', 0.1, 24], [240, '86%', '38%', 0.12, 22]],
    wisps: [[900, 360, '-10%', '8%', -18, 0.13], [820, 300, '30%', '44%', 24, 0.11], [760, 280, '10%', '70%', -8, 0.09]],
    stars: 170, clusters: 4, streaks: 3, spirals: [], band: false,
  },
  // Mostly stars: very dense twinkling field with blurred star clusters
  starfield: {
    orbs: [[420, '12%', '10%', 0.1, 28], [480, '66%', '60%', 0.1, 32]],
    wisps: [],
    stars: 300, clusters: 7, streaks: 3, spirals: [], band: false,
  },
  // A tilted, slowly turning spiral galaxy with a glowing core
  spiral: {
    orbs: [[460, '-6%', '62%', 0.12, 30], [380, '78%', '-4%', 0.12, 26]],
    wisps: [[800, 280, '20%', '70%', -14, 0.08]],
    stars: 150, clusters: 3, streaks: 2,
    spirals: [{ size: 1100, l: '18%', t: '-10%', tilt: -18, d: 220 }, { size: 520, l: '-8%', t: '58%', tilt: 22, d: 160 }],
    band: false,
  },
  // A diagonal Milky Way band of dense glow and stars
  milkyway: {
    orbs: [[420, '4%', '4%', 0.1, 28], [420, '74%', '62%', 0.11, 30]],
    wisps: [[760, 260, '34%', '8%', -22, 0.07]],
    stars: 120, clusters: 3, streaks: 2, spirals: [], band: true,
  },
};

function pickTheme() {
  try {
    const q = new URLSearchParams(window.location.search).get('bg');
    if (q && BG_THEMES.includes(q)) {
      sessionStorage.setItem('std-bg-preview', q);
      return q;
    }
    const s = sessionStorage.getItem('std-bg-preview');
    if (s && BG_THEMES.includes(s)) return s;
  } catch {
    /* storage unavailable — use the default */
  }
  return DEFAULT_BG_THEME;
}

function Orb({ o }) {
  const [size, left, top, a, d] = o;
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size, height: size, left, top, willChange: 'transform',
        background: `radial-gradient(circle, ${W(a)} 0%, ${W(a * 0.45)} 30%, ${W(a * 0.12)} 52%, ${W(0)} 70%)`,
      }}
      animate={{ x: [0, size * 0.1, -size * 0.07, 0], y: [0, -size * 0.08, size * 0.06, 0] }}
      transition={{ duration: d, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// A faint galaxy swirl wisp: two overlapping elliptical gradients.
function Wisp({ w }) {
  const [width, height, left, top, rot, a] = w;
  return (
    <motion.div
      className="absolute"
      style={{
        width, height, left, top, willChange: 'transform',
        background: `radial-gradient(ellipse at 30% 50%, ${W(a)} 0%, ${W(a * 0.4)} 32%, ${W(0)} 68%), radial-gradient(ellipse at 72% 46%, ${W(a * 0.75)} 0%, ${W(a * 0.25)} 30%, ${W(0)} 62%)`,
      }}
      initial={{ rotate: rot }}
      animate={{ rotate: [rot, rot + 9, rot], scale: [1, 1.07, 1] }}
      transition={{ duration: 40, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// Tilted spiral galaxy: concentric masked conic "arms", each twisted a little
// more than the last (reads as a swirl), turning very slowly, plus a core glow.
function Spiral({ s, lite, reduced }) {
  const arms = `conic-gradient(from 0deg, ${W(0)} 0deg, ${W(0.3)} 38deg, ${W(0)} 100deg, ${W(0)} 180deg, ${W(0.3)} 218deg, ${W(0)} 280deg, ${W(0)} 360deg)`;
  const mask = 'radial-gradient(circle, #000 4%, rgba(0,0,0,0.6) 36%, transparent 68%)';
  const rings = lite ? [0, 1, 2] : [0, 1, 2, 3, 4];
  return (
    <div
      className="absolute"
      style={{ width: s.size, height: s.size, left: s.l, top: s.t, transform: `rotate(${s.tilt}deg) scaleY(0.52)` }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ willChange: 'transform' }}
        animate={reduced ? undefined : { rotate: 360 }}
        transition={{ duration: s.d, repeat: Infinity, ease: 'linear' }}
      >
        {rings.map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              inset: `${i * 7}%`,
              transform: `rotate(${i * 26}deg)`,
              opacity: 0.85 - i * 0.1,
              background: arms,
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
          />
        ))}
      </motion.div>
      <div
        className="absolute rounded-full"
        style={{
          inset: '36%',
          background: `radial-gradient(circle, ${W(0.55)} 0%, ${W(0.22)} 30%, ${W(0.06)} 55%, ${W(0)} 72%)`,
        }}
      />
    </div>
  );
}

// The big, clearly visible spiral galaxy (the user's reference photo, made
// grayscale so it stays black/white). The soft circular mask sits on the
// ROTATING element itself, so no square corners ever show while it turns.
// One full turn takes about 180 s (CSS keyframes, transform only); the
// rotation is paused for prefers-reduced-motion in premium.css.
const GALAXY_MASK =
  'radial-gradient(circle closest-side, #000 42%, rgba(0,0,0,0.5) 66%, transparent 92%)';

function PhotoGalaxy({ lite, onFail }) {
  const size = lite ? 'max(130vw, 130vh)' : 'max(105vw, 105vh)';
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ transform: lite ? undefined : 'translate(14vw, -3vh)' }}
    >
      <div
        className="std-galaxy-rot"
        style={{
          width: size,
          height: size,
          flexShrink: 0,
          WebkitMaskImage: GALAXY_MASK,
          maskImage: GALAXY_MASK,
        }}
      >
        <img
          src={galaxyUrl}
          alt=""
          draggable={false}
          decoding="async"
          onError={onFail}
          className="block h-full w-full select-none"
          style={{ opacity: 0.74 }}
        />
      </div>
    </div>
  );
}

function MonoBackground() {
  const lite = useMemo(
    () =>
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768),
    []
  );
  const reduced = useReducedMotion();
  // If the photo ever fails to load, fall back to the CSS-drawn spiral.
  const [photoOk, setPhotoOk] = useState(true);

  const theme = useMemo(() => pickTheme(), []);
  const cfg = THEMES[theme] || THEMES[DEFAULT_BG_THEME];

  // Deterministic stars (no flicker between renders).
  const { stars, clusterGlows } = useMemo(() => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const scale = lite ? 0.45 : 1;
    const out = [];
    const mk = (left, top, big) => {
      const hi = 0.35 + rand() * 0.65;
      out.push({
        left: `${left}%`, top: `${top}%`,
        size: big ? 1.8 + rand() * 1.8 : 0.8 + rand() * 1.4,
        delay: rand() * 4, dur: 2 + rand() * 3.5, hi, lo: hi * 0.2,
      });
    };
    const n = Math.round(cfg.stars * scale);
    for (let i = 0; i < n; i++) mk(rand() * 100, rand() * 100, rand() > 0.9);
    // Blurred star clusters: a soft glow with a knot of stars inside it.
    const glows = [];
    const nc = lite ? Math.ceil(cfg.clusters / 2) : cfg.clusters;
    for (let c = 0; c < nc; c++) {
      const cx = 8 + rand() * 84;
      const cy = 8 + rand() * 84;
      glows.push({ left: `${cx}%`, top: `${cy}%`, size: 140 + rand() * 160, a: 0.1 + rand() * 0.08 });
      for (let k = 0; k < (lite ? 8 : 16); k++) mk(cx + (rand() - 0.5) * 9, cy + (rand() - 0.5) * 12, rand() > 0.85);
    }
    // Milky Way: extra stars packed along the diagonal band.
    if (cfg.band) {
      const ang = (-24 * Math.PI) / 180;
      const nb = Math.round(190 * scale);
      for (let i = 0; i < nb; i++) {
        const t = (rand() - 0.5) * 1.5;
        const o = (rand() + rand() - 1) * 0.12;
        const x = 50 + 100 * (t * Math.cos(ang) - o * Math.sin(ang));
        const y = 50 + 100 * (t * Math.sin(ang) + o * Math.cos(ang));
        if (x > -2 && x < 102 && y > -2 && y < 102) mk(x, y, rand() > 0.92);
      }
    }
    return { stars: out, clusterGlows: glows };
  }, [cfg, lite]);

  const orbs = lite ? cfg.orbs.slice(0, Math.max(2, Math.ceil(cfg.orbs.length / 2))) : cfg.orbs;
  const wisps = lite ? cfg.wisps.slice(0, 1) : cfg.wisps;
  // The photo galaxy replaces the CSS spirals; they only come back as a fallback.
  const fallbackSpirals = cfg.spirals.length
    ? cfg.spirals
    : [{ size: 1100, l: '18%', t: '-10%', tilt: -18, d: 180 }];
  const spirals = photoOk ? [] : lite ? fallbackSpirals.slice(0, 1) : fallbackSpirals;
  const streaks = Array.from({ length: lite ? Math.min(1, cfg.streaks) : cfg.streaks }, (_, i) => i);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
      aria-hidden="true"
    >
      {/* The big rotating spiral galaxy (bottom layer) */}
      {photoOk && <PhotoGalaxy lite={lite} onFail={() => setPhotoOk(false)} />}

      {/* Soft dark scrim behind the page's centre so headings stay readable
          over the bright galaxy (a plain gradient, no blur filter). */}
      {photoOk && (
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 46% at 50% 44%, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 100%)' }}
        />
      )}

      {/* Milky Way band (gradients fade out by themselves) */}
      {cfg.band && (
        <div className="absolute inset-0">
          <motion.div
            className="absolute"
            style={{
              left: '-30%', top: '31%', width: '160%', height: '38%', transform: 'rotate(-24deg)', willChange: 'transform',
              background: `radial-gradient(ellipse at 50% 50%, ${W(0.2)} 0%, ${W(0.1)} 34%, ${W(0.03)} 58%, ${W(0)} 74%)`,
            }}
            animate={{ x: [0, 40, -30, 0], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="absolute"
            style={{
              left: '-20%', top: '38%', width: '140%', height: '16%', transform: 'rotate(-24deg)',
              background: `radial-gradient(ellipse at 50% 50%, ${W(0.16)} 0%, ${W(0.06)} 45%, ${W(0)} 72%)`,
            }}
          />
        </div>
      )}

      {/* Soft glowing white orbs */}
      <div className="absolute inset-0">
        {orbs.map((o, i) => <Orb key={`orb-${i}`} o={o} />)}
        {clusterGlows.map((g, i) => (
          <div
            key={`cg-${i}`}
            className="absolute rounded-full"
            style={{
              width: g.size, height: g.size, left: g.left, top: g.top,
              background: `radial-gradient(circle, ${W(g.a)} 0%, ${W(g.a * 0.35)} 38%, ${W(0)} 70%)`,
            }}
          />
        ))}
      </div>

      {/* Galaxy swirls: wisps (and the CSS spirals if the photo is unavailable) */}
      <div className="absolute inset-0">
        {wisps.map((w, i) => <Wisp key={`wisp-${i}`} w={w} />)}
        {spirals.map((s, i) => <Spiral key={`spiral-${i}`} s={s} lite={lite} reduced={reduced} />)}
      </div>

      {/* Tiny twinkling white stars (CSS keyframes: compositor-only opacity) */}
      <div className="absolute inset-0">
        {stars.map((s, i) => (
          <span
            key={i}
            className="std-star absolute rounded-full bg-white"
            style={{
              left: s.left, top: s.top, width: s.size, height: s.size,
              boxShadow: s.size > 1.8 ? `0 0 ${s.size * 3}px ${W(0.8)}` : undefined,
              '--hi': s.hi, '--lo': s.lo,
              animation: `std-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
              willChange: 'opacity',
            }}
          />
        ))}
      </div>

      {/* Slow white shining light streaks */}
      {streaks.map((i) => (
        <motion.div
          key={`streak-${i}`}
          className="absolute h-px w-[60vw]"
          style={{
            top: `${20 + i * 30}%`,
            left: '-60vw',
            background: `linear-gradient(90deg, transparent, ${W(0.4)}, ${W(0.15)}, transparent)`,
            willChange: 'transform',
          }}
          animate={{ x: ['0vw', '160vw'] }}
          transition={{ duration: 12 + i * 4, repeat: Infinity, ease: 'linear', delay: i * 3 }}
        />
      ))}
    </div>
  );
}

/* ====================================================================== */
/* VESPER-STYLE LIVING ORB — landing page only                             */
/* Original code (no Vesper source used): a mint -> violet particle orb    */
/* built from CSS radial / conic gradients, breathing, and answering       */
/* presence (pointer, scroll, dwell). transform + opacity only, rAF-driven,*/
/* no blur() filter, no new packages.                                      */
/* ====================================================================== */

const VP_COLORS = ['#7CFFC4', '#5EEAD4', '#A78BFA', '#8B5CF6', '#60A5FA'];

const isLiteDevice = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(pointer: coarse)').matches || window.innerWidth < 768);

// Faint spiral-galaxy swirl around the orb: masked conic "arms" in mint/violet/blue.
function VesperSwirl({ lite }) {
  const arms =
    'conic-gradient(from 0deg, rgba(0,0,0,0) 0deg, rgba(124,255,196,0.30) 40deg, rgba(139,92,246,0.24) 85deg, rgba(0,0,0,0) 125deg, rgba(0,0,0,0) 180deg, rgba(96,165,250,0.26) 225deg, rgba(167,139,250,0.22) 270deg, rgba(0,0,0,0) 312deg, rgba(0,0,0,0) 360deg)';
  const mask = 'radial-gradient(circle, #000 20%, rgba(0,0,0,0.55) 50%, transparent 72%)';
  const rings = lite ? [0, 1] : [0, 1, 2, 3];
  return (
    <div className="absolute" style={{ inset: '-20%', transform: 'rotate(-16deg) scaleY(0.72)' }}>
      <div className="std-vsw absolute inset-0">
        {rings.map((i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              inset: `${i * 8}%`,
              transform: `rotate(${i * 28}deg)`,
              opacity: 0.9 - i * 0.14,
              background: arms,
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function VesperBackground() {
  const lite = useMemo(isLiteDevice, []);
  const reduced = useReducedMotion();
  const stageRef = useRef(null);
  const glowRef = useRef(null);

  // Deterministic particle dots scattered around the orb (decorative).
  const particles = useMemo(() => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const n = lite ? 36 : 90;
    const out = [];
    for (let i = 0; i < n; i++) {
      const ang = rand() * Math.PI * 2;
      const r = 0.2 + Math.pow(rand(), 0.7) * 0.5; // fraction of the orb diameter
      const big = rand() > 0.88;
      const hi = 0.45 + rand() * 0.55;
      out.push({
        left: 50 + Math.cos(ang) * r * 100,
        top: 50 + Math.sin(ang) * r * 90,
        size: big ? 2 + rand() * 1.6 : 0.9 + rand() * 1.3,
        color: VP_COLORS[Math.floor(rand() * VP_COLORS.length)],
        big,
        delay: rand() * 4,
        dur: 2.5 + rand() * 3.5,
        hi,
        lo: hi * 0.2,
      });
    }
    return out;
  }, [lite]);

  // Motion that answers presence. Everything is written straight to the DOM
  // from one throttled requestAnimationFrame loop (no React re-renders), and
  // only transform + opacity are touched. The loop sleeps once values settle.
  useEffect(() => {
    if (reduced) return undefined; // static orb only
    const stage = stageRef.current;
    const glow = glowRef.current;
    if (!stage || !glow) return undefined;

    const pointerOK = !lite; // no pointer motion on touch / small screens
    const s = { tx: 0, ty: 0, x: 0, y: 0, ts: 0, sc: 0, tb: 0, b: 0 };
    let raf = 0;
    let vh = window.innerHeight;
    let hovering = false;
    let dwell = 0;

    const apply = () => {
      stage.style.transform =
        `perspective(1200px) translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0) ` +
        `rotateX(${(-s.y * 0.18).toFixed(3)}deg) rotateY(${(s.x * 0.18).toFixed(3)}deg) ` +
        `scale(${(1 - 0.16 * s.sc).toFixed(4)})`;
      stage.style.opacity = (1 - 0.85 * s.sc).toFixed(3);
      glow.style.opacity = (0.25 + 0.55 * s.b).toFixed(3);
    };

    const tick = () => {
      raf = 0;
      s.x += (s.tx - s.x) * 0.08;
      s.y += (s.ty - s.y) * 0.08;
      s.sc += (s.ts - s.sc) * 0.12;
      s.b += (s.tb - s.b) * 0.06;
      apply();
      const settled =
        Math.abs(s.tx - s.x) < 0.05 &&
        Math.abs(s.ty - s.y) < 0.05 &&
        Math.abs(s.ts - s.sc) < 0.002 &&
        Math.abs(s.tb - s.b) < 0.005;
      if (!settled) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const setHover = (on) => {
      if (on === hovering) return;
      hovering = on;
      window.clearTimeout(dwell);
      if (on) {
        // Dwell: brighten a little once the pointer has rested on the hero.
        dwell = window.setTimeout(() => {
          s.tb = 1;
          kick();
        }, 350);
      } else {
        s.tb = 0;
      }
    };

    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      s.tx = (e.clientX / window.innerWidth - 0.5) * 2 * 12; // up to ~12px toward the pointer
      s.ty = (e.clientY / window.innerHeight - 0.5) * 2 * 12;
      const inHero = e.target instanceof Element && !!e.target.closest('[data-vesper-hero]');
      setHover(inHero);
      kick();
    };
    const onLeave = () => {
      s.tx = 0;
      s.ty = 0;
      setHover(false);
      kick();
    };
    const onScroll = () => {
      s.ts = Math.min(Math.max(window.scrollY / (vh * 0.9), 0), 1);
      kick();
    };
    const onResize = () => {
      vh = window.innerHeight;
      onScroll();
    };

    if (pointerOK) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    onScroll(); // sync if the page loads already scrolled
    apply();

    return () => {
      if (pointerOK) {
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('mouseleave', onLeave);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.clearTimeout(dwell);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [lite, reduced]);

  const size = lite ? 'min(125vw, 72vh)' : 'min(98vw, 124vh)';

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" aria-hidden="true">
      <div
        ref={stageRef}
        className="absolute inset-0 flex items-center justify-center"
        style={{ willChange: reduced ? undefined : 'transform, opacity' }}
      >
        <div className="relative" style={{ width: size, height: size }}>
          {/* Outer violet/blue halo */}
          <div
            className="absolute rounded-full"
            style={{
              inset: '-14%',
              background:
                'radial-gradient(circle, rgba(139,92,246,0.20) 0%, rgba(96,165,250,0.10) 42%, rgba(0,0,0,0) 70%)',
            }}
          />

          {/* Spiral-galaxy swirl */}
          <VesperSwirl lite={lite} />

          {/* Particle dots */}
          <div className="std-vpart absolute inset-0">
            {particles.map((p, i) => (
              <span
                key={i}
                className="std-vp absolute rounded-full"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  boxShadow: p.big ? `0 0 ${p.size * 3.5}px ${p.color}` : undefined,
                  '--hi': p.hi,
                  '--lo': p.lo,
                  animationDuration: `${p.dur}s`,
                  animationDelay: `${p.delay}s`,
                }}
              />
            ))}
          </div>

          {/* The orb: breathes 1.00 -> 1.08 -> 1.00 (CSS keyframes, transform only) */}
          <div className="std-orb-breathe absolute inset-0">
            <div
              className="absolute rounded-full"
              style={{
                inset: '6%',
                background:
                  'radial-gradient(circle at 50% 50%, rgba(124,255,196,0.78) 0%, rgba(94,234,212,0.62) 14%, rgba(139,92,246,0.46) 40%, rgba(96,165,250,0.24) 60%, rgba(0,0,0,0) 74%)',
              }}
            />
            <div
              className="absolute rounded-full"
              style={{
                inset: '34%',
                background:
                  'radial-gradient(circle, rgba(124,255,196,0.55) 0%, rgba(94,234,212,0.25) 55%, rgba(0,0,0,0) 100%)',
                boxShadow:
                  '0 0 90px 24px rgba(94,234,212,0.28), 0 0 160px 50px rgba(139,92,246,0.22)',
              }}
            />
            {/* Brightens a little on dwell / hover over the hero */}
            <div
              ref={glowRef}
              className="absolute rounded-full"
              style={{
                inset: '26%',
                opacity: 0.25,
                background:
                  'radial-gradient(circle, rgba(124,255,196,0.9) 0%, rgba(94,234,212,0.35) 40%, rgba(0,0,0,0) 72%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Static dark scrim behind the hero text so the headline keeps contrast
          over the bright mint core (plain gradient, no blur filter). */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 58% 42% at 50% 46%, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0) 100%)',
        }}
      />
    </div>
  );
}

// Landing keeps the mint/violet orb; both dashboards use the new orange/blue
// depth-field; auth and other pages retain the monochrome galaxy.
export default function Background3D() {
  const { pathname } = useLocation();
  if (pathname === '/') return <VesperBackground />;
  if (pathname === '/dashboard' || pathname === '/lecturer') return <DashboardBackground />;
  return <MonoBackground />;
}
