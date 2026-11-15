import { motion } from 'framer-motion';

// Nothing in this card follows the mouse any more (no tilt, no cursor-follow
// glare): it only fades in, and lifts a little on hover when `hover` is set.
// `tilt` and `depth` are still accepted so existing callers keep working, but
// they no longer do anything.
// FLAT card (2026-11-15): the old 3D layering (preserve-3d + an inner
// translateZ(30px) + a rotateX entrance) made the card itself swallow taps
// meant for the buttons inside it — the buttons showed through the glass
// but never received the click. The card is now plain 2D: same glass look,
// same fade-in, and every button inside it works.
// eslint-disable-next-line no-unused-vars
export default function GlassCard({ children, className = '', delay = 0, hover = false, tilt = false, glow = false, onClick, depth = 1 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -10, scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      className={`glass-3d relative overflow-hidden p-6 ${glow ? 'gradient-border' : ''} ${
        hover ? 'card-hover' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div>{children}</div>
    </motion.div>
  );
}
