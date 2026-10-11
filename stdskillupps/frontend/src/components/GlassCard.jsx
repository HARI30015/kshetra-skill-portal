import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', delay = 0, hover = false, tilt = false, glow = false, onClick, depth = 1 }) {
  const ref = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    if (tilt) {
      // Dramatic 3D tilt with depth-based intensity
      const intensity = 14 * depth;
      setTiltStyle({
        transform: `perspective(1200px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(1.03) translateZ(20px)`,
      });
    }
    // Glare effect follows cursor
    setGlare({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
    if (tilt) {
      setTiltStyle({
        transform: 'perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1) translateZ(0)',
      });
    }
    setGlare((g) => ({ ...g, opacity: 0 }));
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, rotateX: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover && !tilt ? { y: -10, scale: 1.02, rotateX: 2 } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className={`glass-3d preserve-3d relative overflow-hidden p-6 ${glow ? 'gradient-border' : ''} ${
        hover || tilt ? 'card-hover' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${tilt ? 'transition-transform duration-300 ease-out' : ''} ${className}`}
    >
      {/* Glare overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.15), transparent 60%)`,
        }}
      />
      {/* 3D depth content */}
      <div className="preserve-3d" style={{ transform: 'translateZ(30px)' }}>
        {children}
      </div>
    </motion.div>
  );
}
