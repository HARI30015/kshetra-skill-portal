import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Generate random floating 3D shapes
function useShapes(count) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 60 + Math.random() * 180,
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 15 + Math.random() * 20,
      delay: -Math.random() * 20,
      hue: [265, 190, 320, 220, 280][i % 5],
      shape: ['circle', 'square', 'diamond'][i % 3],
      blur: 40 + Math.random() * 60,
      opacity: 0.08 + Math.random() * 0.12,
    }));
  }, [count]);
}

function FloatingShape({ shape }) {
  const style = {
    width: shape.size,
    height: shape.size,
    left: `${shape.left}%`,
    top: `${shape.top}%`,
    filter: `blur(${shape.blur}px)`,
    opacity: shape.opacity,
    background: `radial-gradient(circle, hsla(${shape.hue}, 80%, 65%, 0.8), hsla(${shape.hue}, 80%, 50%, 0.2))`,
    borderRadius: shape.shape === 'circle' ? '50%' : shape.shape === 'diamond' ? '20%' : '30%',
    transform: shape.shape === 'diamond' ? 'rotate(45deg)' : undefined,
    animationDuration: `${shape.duration}s`,
    animationDelay: `${shape.delay}s`,
  };

  return (
    <motion.div
      className="orb animate-orb-drift absolute"
      style={style}
      animate={{
        rotate: shape.shape === 'circle' ? 0 : 360,
      }}
      transition={{ duration: shape.duration * 2, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// Shining light streaks
function ShineStreaks() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute h-px w-[60vw]"
          style={{
            top: `${20 + i * 30}%`,
            left: '-60vw',
            background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.4), rgba(34,211,238,0.4), transparent)',
            filter: 'blur(2px)',
          }}
          animate={{ x: ['0vw', '160vw'] }}
          transition={{ duration: 12 + i * 4, repeat: Infinity, ease: 'linear', delay: i * 3 }}
        />
      ))}
    </div>
  );
}

function Scene3D() {
  const shapes = useShapes(12);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden style={{ zIndex: 0 }}>
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,#0f0d1f_50%,#08070f_100%)]" />

      {/* Layer 1: Large blurry 3D orbs (far) */}
      <div className="orb animate-orb-drift h-[600px] w-[600px] bg-violet-700/15 left-[-15%] top-[-10%]" />
      <div className="orb animate-orb-drift h-[500px] w-[500px] bg-cyan-600/12 right-[-10%] top-[20%]" style={{ animationDelay: '-6s' }} />
      <div className="orb animate-orb-drift h-[450px] w-[450px] bg-fuchsia-600/10 left-[20%] bottom-[-15%]" style={{ animationDelay: '-12s' }} />

      {/* Layer 2: Floating 3D shapes (mid) - blurry */}
      {shapes.map((s) => (
        <FloatingShape key={s.id} shape={s} />
      ))}

      {/* Layer 3: Shine streaks */}
      <ShineStreaks />

      {/* Layer 4: Perspective grid for depth */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(167,139,250,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.6) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          transform: 'perspective(1200px) rotateX(15deg) scale(1.3)',
          transformOrigin: 'center top',
          maskImage: 'linear-gradient(to bottom, black 30%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 80%)',
        }}
      />

      {/* Vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
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
