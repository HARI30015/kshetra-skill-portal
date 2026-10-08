import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedButton({
  children,
  type = 'button',
  onClick,
  loading = false,
  disabled = false,
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  className = '',
}) {
  const variants = {
    primary:
      'bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-glow btn-shimmer',
    secondary: 'bg-white/10 border border-white/20 text-white backdrop-blur-xl hover:bg-white/15',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/10',
    danger:
      'bg-gradient-to-r from-rose-600 to-red-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.45)] btn-shimmer',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { scale: 1.04 }}
      whileTap={disabled || loading ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {loading && (
        <motion.span
          className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
        />
      )}
      <span className={loading ? 'opacity-80' : ''}>{children}</span>
    </motion.button>
  );
}
