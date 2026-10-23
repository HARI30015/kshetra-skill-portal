import React from 'react';
import { motion } from 'framer-motion';

// Light, normal-feel button (owner's rule, 2026-10-23): a single
// ordinary click/tap must act instantly. No tilt-under-the-pointer,
// no ripples, no shine sweeps, no springy hover lift — the button
// stays exactly where it is and only dims a touch while pressed.
// The gradient/glow LOOK is unchanged.
export default function AnimatedButton({ children, type = 'button', onClick, loading = false, disabled = false, variant = 'primary', className = '', size = 'md' }) {
  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-[0_10px_40px_rgba(139,92,246,0.45),0_4px_0_rgba(76,29,149,0.8)] btn-shimmer',
    secondary: 'bg-white/10 border border-white/20 text-white backdrop-blur-xl hover:bg-white/15 glass-interactive shadow-[0_8px_24px_rgba(0,0,0,0.3),0_3px_0_rgba(255,255,255,0.1)]',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/10',
    danger: 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-[0_10px_40px_rgba(244,63,94,0.4),0_4px_0_rgba(127,29,29,0.8)] btn-shimmer',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_10px_40px_rgba(16,185,129,0.4),0_4px_0_rgba(6,95,70,0.8)] btn-shimmer',
    gold: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white shadow-[0_10px_40px_rgba(245,158,11,0.4),0_4px_0_rgba(120,53,15,0.8)] btn-shimmer',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.08 }}
      className={`relative inline-flex touch-manipulation select-none items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {/* Top highlight for 3D depth (static, costs nothing) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/25 to-transparent" />

      {/* Loading spinner */}
      {loading && (
        <motion.span
          className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
        />
      )}

      <span className={`relative z-10 ${loading ? 'opacity-80' : ''}`}>{children}</span>
    </motion.button>
  );
}
