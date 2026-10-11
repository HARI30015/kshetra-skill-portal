import React from 'react';
import { motion } from 'framer-motion';

function Scene3D() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden style={{ zIndex: 0 }}>
      {/* Deep background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,#0f0d1f_50%,#08070f_100%)]" />
      {/* Floating 3D orbs with parallax layers */}
      <div className="orb animate-orb-drift h-[500px] w-[500px] bg-violet-600/20 left-[-10%] top-[5%]" />
      <div className="orb animate-orb-drift h-[400px] w-[400px] bg-cyan-500/15 right-[-5%] top-[25%]" style={{ animationDelay: '-4s' }} />
      <div className="orb animate-orb-drift h-[350px] w-[350px] bg-fuchsia-500/12 left-[25%] bottom-[5%]" style={{ animationDelay: '-8s' }} />
      <div className="orb animate-float h-[200px] w-[200px] bg-blue-500/15 right-[25%] bottom-[20%]" />
      {/* Grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          transform: 'perspective(1000px) rotateX(10deg) scale(1.2)',
          transformOrigin: 'center top',
        }}
      />
    </div>
  );
}

export default function PageWrapper({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative min-h-screen ${className}`}
      style={{ perspective: '2000px' }}
    >
      <Scene3D />
      <div className="relative" style={{ zIndex: 1, transformStyle: 'preserve-3d' }}>
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, rotateX: 8, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
}
