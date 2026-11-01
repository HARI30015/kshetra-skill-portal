import React from 'react';
import { motion } from 'framer-motion';

// One background system only: <Background3D /> (mounted once in App.jsx)
// draws the shining light + moving 3D shapes behind EVERY page. This
// wrapper used to render a second full scene (Scene3D: 3 huge orbs and
// 12 floating shapes carrying the `.orb` class, which applies
// filter: blur(80px) to each of them every frame, plus streaks, a grid and
// a vignette) on top of Background3D. That duplicate is removed - it was
// the heavy layer stack that made taps register late. The page content
// stays above the background (z-index 1); the background is
// pointer-events: none, so it can never take a click.
export default function PageWrapper({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative min-h-screen ${className}`}
    >
      <div className="relative" style={{ zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}
