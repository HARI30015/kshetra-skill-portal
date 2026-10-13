import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

// High-end animated button with 3D hover, press, shine sweep, and glow.
export default function AnimatedButton({ children, type = 'button', onClick, loading = false, disabled = false, variant = 'primary', className = '', size = 'md' }) {
  const [ripples, setRipples] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

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

  const handleMouseMove = (e) => {
    if (!ref.current || disabled || loading) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(1000px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(8px) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0) scale(1)';
    setIsHovered(false);
  };

  const handleMouseEnter = () => setIsHovered(true);

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { y: -4, scale: 1.02 }}
      whileTap={disabled || loading ? undefined : { scale: 0.95, y: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden ${variants[variant]} ${sizes[size]} ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Top highlight for 3D depth */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-t-xl" />

      {/* Shine sweep on hover */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
        }}
        animate={{ x: isHovered ? ['-100%', '100%'] : '-100%' }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      />

      {/* Glow pulse on hover */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span key={ripple.id} className="absolute rounded-full bg-white/30 pointer-events-none" style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size, animation: 'std-ripple 0.6s ease-out forwards' }} />
      ))}

      {/* Loading spinner */}
      {loading && (
        <motion.span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} />
      )}

      <span className={`relative z-10 ${loading ? 'opacity-80' : ''}`} style={{ transform: 'translateZ(12px)' }}>
        {children}
      </span>
    </motion.button>
  );
}
