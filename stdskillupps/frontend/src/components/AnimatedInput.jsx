import React, { useState } from 'react';
import { motion } from 'framer-motion';

function EyeIcon({ off }) {
  if (off) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.94 17.94A10.6 10.6 0 0 1 12 19c-6.5 0-10-7-10-7a17.6 17.6 0 0 1 4.06-5.94" />
        <path d="M9.9 4.24A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-2.16 3.19" />
        <path d="m1 1 22 22" />
        <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

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
  showPasswordToggle = false,
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const useToggle = showPasswordToggle && type === 'password';
  const inputType = useToggle && showPassword ? 'text' : type;

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
        className="relative rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl overflow-hidden preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-transparent px-4 py-3 text-white placeholder-slate-400 outline-none ${useToggle ? 'pr-12' : ''}`}
          style={{ transform: 'translateZ(5px)' }}
        />
        {useToggle && (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            tabIndex={0}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 touch-manipulation items-center justify-center rounded-full text-slate-300 hover:text-white active:text-white"
          >
            <EyeIcon off={showPassword} />
          </button>
        )}
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
