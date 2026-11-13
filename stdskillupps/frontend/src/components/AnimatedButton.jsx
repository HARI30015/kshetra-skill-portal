import { motion } from 'framer-motion';

// Shared liquid-glass button with reflective hover, spring press, and clear focus.
export default function AnimatedButton({ children, type = 'button', onClick, loading = false, disabled = false, variant = 'primary', className = '', size = 'md' }) {
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

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={disabled || loading ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30, mass: 0.42 }}
      data-variant={variant}
      className={`liquid-button relative inline-flex touch-manipulation select-none items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {/* Glass rim highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/20 to-transparent" />

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
