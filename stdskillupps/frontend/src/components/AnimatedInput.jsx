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
  min,
  max,
  maxLength,
  disabled = false,
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const useToggle = showPasswordToggle && type === 'password';
  const inputType = useToggle && showPassword ? 'text' : type;

  return (
    <label className="block">
      {label && (
        <motion.span
          animate={{ color: focused ? '#f8fafc' : '#d4d4d8' }}
          transition={{ duration: 0.14 }}
          className="mb-1.5 block text-sm font-medium"
        >
          {label}
        </motion.span>
      )}
      <motion.div
        animate={{
          borderColor: focused ? 'rgba(186, 230, 253, 0.72)' : 'rgba(255, 255, 255, 0.20)',
          boxShadow: focused
            ? '0 0 0 2px rgba(56,189,248,0.18), inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 24px rgba(2,132,199,0.12)'
            : 'inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 16px rgba(0,0,0,0.18)',
        }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-xl border bg-white/[0.08] backdrop-blur-xl"
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
          min={min}
          max={max}
          maxLength={maxLength}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-transparent px-4 py-3 text-white placeholder-zinc-400 outline-none ${useToggle ? 'pr-12' : ''}`}
        />
        {useToggle && (
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-300 transition-colors hover:text-white"
          >
            <EyeIcon off={showPassword} />
          </button>
        )}
      </motion.div>
    </label>
  );
}
