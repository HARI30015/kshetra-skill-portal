import { motion, useReducedMotion } from 'framer-motion';
import { useRef, useState, useCallback } from 'react';

/**
 * Premium Liquid Glass Button
 * - Mouse-tracking liquid distortion
 * - Chromatic aberration on hover
 * - Liquid ripple on click
 * - GPU-accelerated animations
 */
export default function LiquidButton({
  children,
  type = 'button',
  onClick,
  loading = false,
  disabled = false,
  variant = 'primary',
  className = '',
  size = 'md',
  fullWidth = false,
  icon = null,
}) {
  const reduceMotion = useReducedMotion();
  const buttonRef = useRef(null);
  const [ripples, setRipples] = useState([]);
  const rippleId = useRef(0);

  const sizes = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-7 py-3.5 text-base',
    lg: 'px-9 py-4 text-lg',
  };

  const variantStyles = {
    primary: 'liquid-primary',
    secondary: 'liquid-secondary',
    ghost: 'liquid-ghost',
    danger: 'liquid-danger',
    success: 'liquid-success',
    gold: 'liquid-gold',
  };

  // Track mouse position for liquid distortion. Written straight to the
  // element's CSS vars (no setState) so moving the mouse does not re-render
  // the button on every pixel — that is what keeps it at 60fps.
  const handleMouseMove = useCallback((e) => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mouse-x', `${x}%`);
    el.style.setProperty('--mouse-y', `${y}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = buttonRef.current;
    if (!el) return;
    el.style.setProperty('--mouse-x', '50%');
    el.style.setProperty('--mouse-y', '50%');
  }, []);

  // Create liquid ripple on click
  const handleClick = useCallback(
    (e) => {
      if (!buttonRef.current || disabled || loading) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const ripple = {
        id: ++rippleId.current,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 900);
      onClick?.(e);
    },
    [onClick, disabled, loading]
  );

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      disabled={disabled || loading}
      whileHover={reduceMotion ? undefined : { scale: 1.04, y: -2 }}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22, mass: 0.6 }}
      className={`liquid-btn-premium relative inline-flex touch-manipulation select-none items-center justify-center gap-2.5 overflow-hidden rounded-full font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${variantStyles[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {/* Layer 1: Base liquid body with mouse-tracking gradient */}
      <div className="liquid-base absolute inset-0" />

      {/* Layer 2: Mouse-following liquid highlight */}
      <div className="liquid-highlight absolute inset-0" />

      {/* Layer 3: Turbulent water distortion (SVG filter) */}
      <div className="liquid-turbulence absolute inset-0" />

      {/* Layer 4: Chromatic aberration on hover */}
      <div className="liquid-chromatic absolute inset-0" />

      {/* Layer 5: Top specular glass reflection */}
      <div className="liquid-specular absolute inset-x-0 top-0 h-1/2" />

      {/* Layer 6: Bottom liquid depth */}
      <div className="liquid-depth absolute inset-x-0 bottom-0 h-1/3" />

      {/* Layer 7: Liquid ripples on click */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="liquid-ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
            }}
          />
        ))}
      </div>

      {/* Layer 8: Animated border glow */}
      <div className="liquid-border absolute inset-0 rounded-full" />

      {/* Loading state */}
      {loading && (
        <motion.div
          className="relative z-20 h-5 w-5"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-white/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent" />
        </motion.div>
      )}

      {/* Content */}
      <span className={`relative z-20 flex items-center gap-2.5 text-shadow-liquid ${loading ? 'opacity-60' : ''}`}>
        {icon && <span className="liquid-icon">{icon}</span>}
        {children}
      </span>
    </motion.button>
  );
}