import React from 'react';
import { motion } from 'framer-motion';

// Nothing in this card follows the mouse any more (no tilt, no cursor-follow
// glare): it only fades in, and lifts a little on hover when `hover` is set.
// `tilt` and `depth` are still accepted so existing callers keep working, but
// they no longer do anything.
// eslint-disable-next-line no-unused-vars
export default function GlassCard({ children, className = '', delay = 0, hover = false, tilt = false, glow = false, onClick, depth = 1 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -10, scale: 1.02, rotateX: 2 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      className={`glass-3d preserve-3d relative overflow-hidden p-6 ${glow ? 'gradient-border' : ''} ${
        hover ? 'card-hover' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 3D depth content */}
      <div className="preserve-3d" style={{ transform: 'translateZ(30px)' }}>
        {children}
      </div>
    </motion.div>
  );
}
