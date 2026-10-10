import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', delay = 0, hover = false, tilt = false, glow = false, onClick }) {
  const ref = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});
  const handleMouseMove = (e) => {
    if (!tilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTiltStyle({ transform: `perspective(1000px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)` });
  };
  const handleMouseLeave = () => {
    if (!tilt) return;
    setTiltStyle({ transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)' });
  };
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }} whileHover={hover && !tilt ? { y: -6, scale: 1.015 } : undefined} whileTap={onClick ? { scale: 0.985 } : undefined} onClick={onClick} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={tiltStyle} className={`glass p-6 ${glow ? 'gradient-border' : ''} ${hover || tilt ? 'card-hover' : ''} ${onClick ? 'cursor-pointer' : ''} ${tilt ? 'transition-transform duration-200 ease-out' : ''} ${className}`}>
      {children}
    </motion.div>
  );
}
