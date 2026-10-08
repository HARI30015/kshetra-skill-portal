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
}) {
  const [focused, setFocused] = useState(false);

  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      )}
      <motion.div
        animate={{
          scale: focused ? 1.015 : 1,
          boxShadow: focused
            ? '0 0 0 2px rgba(139,92,246,0.55), 0 0 24px rgba(139,92,246,0.35)'
            : '0 0 0 0px rgba(139,92,246,0)',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 24 }}
        className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl overflow-hidden"
      >
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent px-4 py-3 text-white placeholder-slate-400 outline-none"
        />
      </motion.div>
    </label>
  );
}
