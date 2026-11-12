import { motion } from 'framer-motion';

// Light, normal-feel button (owner's rule, 2026-10-23, re-affirmed
// 2026-10-31): a single ordinary click/tap must act instantly.
// No tilt-under-the-pointer, no ripples, no shine sweeps, no springy
// hover lift — the button stays exactly where it is and only dims a
// touch while pressed. The gradient/glow LOOK is unchanged.
// 2026-10-31 change: the infinite `btn-shimmer` shine sweep is
// REMOVED from every variant — it contradicted the no-shine rule.
export default function AnimatedButton({ children, type = 'button', onClick, loading = false, disabled = false, variant = 'primary', className = '', size = 'md' }) {
  const variants = {
    primary: 'bg-white text-black shadow-[0_8px_36px_rgba(255,255,255,0.28)] hover:bg-zinc-200',
    secondary: 'bg-black/60 border border-white/70 text-white backdrop-blur-xl hover:bg-white/10 glass-interactive',
    ghost: 'text-zinc-300 hover:text-white hover:bg-white/10',
    danger: 'bg-black/70 border border-white/40 text-white hover:bg-white/10',
    success: 'bg-white/90 text-black hover:bg-white',
    gold: 'bg-zinc-200 text-black hover:bg-white',
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
      data-variant={variant}
      className={`liquid-button relative inline-flex touch-manipulation select-none items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {/* Top highlight for 3D depth (static, costs nothing) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/10 to-transparent" />

      {/* Loading spinner */}
      {loading && (
        <motion.span
          className="h-5 w-5 rounded-full border-2 border-zinc-500/50 border-t-current"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
        />
      )}

      <span className={`relative z-10 ${loading ? 'opacity-80' : ''}`}>{children}</span>
    </motion.button>
  );
}
