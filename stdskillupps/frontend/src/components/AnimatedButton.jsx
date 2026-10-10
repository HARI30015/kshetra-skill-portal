import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedButton({ children, type = 'button', onClick, loading = false, disabled = false, variant = 'primary', className = '' }) {
  const [ripples, setRipples] = useState([]);
  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-glow btn-shimmer animate-glow-pulse',
    secondary: 'bg-white/10 border border-white/20 text-white backdrop-blur-xl hover:bg-white/15 glass-interactive',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/10',
    danger: 'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.45)] btn-shimmer',
  };
  const handleClick = (e) => {
    if (disabled || loading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y, size }]);
    setTimeout(() => setRipples((r) => r.filter((ripple) => ripple.id !== id)), 600);
    onClick?.(e);
  };
  return (
    <motion.button type={type} onClick={handleClick} disabled={disabled || loading} whileHover={disabled || loading ? undefined : { scale: 1.04, y: -2 }} whileTap={disabled || loading ? undefined : { scale: 0.96, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }} className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden ${variants[variant]} ${className}`}>
      {ripples.map((ripple) => (
        <span key={ripple.id} className="absolute rounded-full bg-white/30 pointer-events-none" style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size, animation: 'std-ripple 0.6s ease-out forwards' }} />
      ))}
      {loading && (<motion.span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} />)}
      <span className={`relative z-10 ${loading ? 'opacity-80' : ''}`}>{children}</span>
    </motion.button>
  );
}
