import React from 'react';

// First visible character of a string (safe for non-Latin letters).
const first = (s) => Array.from(String(s || ''))[0] || '';

// Initials from the display name; falls back to the email's local part.
// Returns '' when neither is available.
export function getInitials(name, email) {
  const n = String(name || '').trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    const a = first(parts[0]);
    const b = parts.length > 1 ? first(parts[parts.length - 1]) : '';
    return (a + b).toUpperCase();
  }
  const local = String(email || '').trim().split('@')[0];
  if (local) {
    const parts = local.split(/[._\-+\d]+/).filter(Boolean);
    const a = first(parts[0] || local);
    const b = parts.length > 1 ? first(parts[1]) : '';
    return (a + b).toUpperCase();
  }
  return '';
}

// Small monochrome avatar circle. No photo, no storage, no backend.
export default function Avatar({ name, email, size = 36, solid = false, className = '' }) {
  const initials = getInitials(name, email);
  if (!initials) return null;
  return (
    <span
      title={name || email || ''}
      aria-label={`Profile initials ${initials}`}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full border font-bold ${
        solid ? 'border-white bg-white text-black shadow-glow' : 'border-white/40 bg-white/10 text-white'
      } ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(Math.round(size * 0.38), 11) }}
    >
      {initials}
    </span>
  );
}
