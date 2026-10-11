import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  name,
  required = false,
  autoComplete,
  inputMode,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <label className="block perspective-1000">
      {label && (
        <motion.span
          animate={{ color: focused ? '#a78bfa' : '#cbd5e1', x: focused ? 4 : 0 }}
          className="mb-1.5 block text-sm font-medium"
        >
          {label}
        </motion.span>
      )}
      <motion.div
        animate={{
          scale: focused ? 1.02 : 1,
          rotateX: focused ? -4 : 0,
          z: focused ? 20 : 0,
          boxShadow: focused
            ? '0 12px 40px rgba(139,92,246,0.3), 0 0 0 2px rgba(139,92,246,0.55), inset 0 1px 0 rgba(255,255,255,0.15)'
            : '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 24 }}
        className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl overflow-hidden preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-4 py-3 text-white placeholder-slate-400 outline-none"
          style={{ transform: 'translateZ(5px)' }}
        />
        {/* Bottom glow line */}
        <motion.div
          animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 origin-left"
        />
      </motion.div>
    </label>
  );
}
