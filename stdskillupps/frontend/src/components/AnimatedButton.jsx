import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Shared liquid-glass button with reflective hover, spring press, and clear focus.
// Merged 2026-11-21 from the "pure liquid-glass" system: framer-motion lift /
// press / fade-in, flowing liquid background, light sweep, inner glow, and a
// real click ripple. Variant colours still come from premium.css via
// data-variant (the live mechanism) — the pasted liquid-* classes are not
// used, so the live global button rule cannot outrank them. Framer-motion
// owns the lift/press; the global CSS translate/scale on hover/press is
// neutralised for .liquid-button in premium.css so the two do not double up.
export default function AnimatedButton({ children, type = 'button', onClick, loading = false, disabled = false, variant = 'primary', className = '', size = 'md', fullWidth = false }) {
  const variants = {
    primary: 'text-white',
    secondary: 'text-white',
    ghost: 'text-zinc-200',
    danger: 'text-rose-100',
    success: 'text-emerald-100',
    gold: 'text-amber-100',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };

  const reduceMotion = useReducedMotion();
  const rippleRef = useRef(null);

  function spawnRipple(e) {
    const box = rippleRef.current;
    if (!box) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = d + 'px';
    ripple.style.left = (e.clientX - rect.left - d / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - d / 2) + 'px';
    box.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 650);
  }

  function handleClick(e) {
    spawnRipple(e);
    if (onClick) onClick(e);
  }

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled || loading}
      data-variant={variant}
      whileHover={reduceMotion ? undefined : { scale: 1.03, y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 25,
        mass: 0.5
      }}
      className={`liquid-button relative inline-flex touch-manipulation select-none items-center justify-center gap-2 overflow-hidden rounded-full font-semibold transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {/* Animated liquid background (revealed on hover, see premium.css) */}
      <div className="liquid-bg absolute inset-0 opacity-0 transition-opacity duration-300" />

      {/* Primary light sweep effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="light-sweep absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-700" />
      </div>

      {/* Glass rim highlight with animation */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/25 to-transparent transition-opacity duration-300" />

      {/* Inner glow pulse */}
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-0 inner-glow transition-opacity duration-300" />

      {/* Loading spinner with liquid effect */}
      {loading && (
        <motion.div
          className="relative z-10 h-5 w-5"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-white/30" />
          <div className="absolute inset-0 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent" />
        </motion.div>
      )}

      <span className={`relative z-10 flex items-center gap-2 ${loading ? 'opacity-70' : ''}`}>
        {children}
      </span>

      {/* Ripple effect container (filled on click, see spawnRipple) */}
      <div ref={rippleRef} className="ripple-container pointer-events-none absolute inset-0 overflow-hidden rounded-full" />
    </motion.button>
  );
}
