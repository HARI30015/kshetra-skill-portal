import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AVATAR_BUCKET = 'profile-pictures';

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

export default function Avatar({ name, email, avatarPath, size = 36, solid = false, className = '' }) {
  const [photoUrl, setPhotoUrl] = useState('');
  const initials = getInitials(name, email);

  useEffect(() => {
    let active = true;
    let timer;
    if (!avatarPath) {
      setPhotoUrl('');
      return undefined;
    }

    const refreshUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from(AVATAR_BUCKET)
          .createSignedUrl(avatarPath, 3600);
        if (active && !error) setPhotoUrl(data?.signedUrl || '');
        if (active && error) setPhotoUrl('');
      } catch {
        if (active) setPhotoUrl('');
      }
    };

    refreshUrl();
    timer = window.setInterval(refreshUrl, 50 * 60 * 1000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [avatarPath]);

  if (!initials) return null;
  const frameClass = `inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border font-bold ${
    solid ? 'border-white bg-white text-black shadow-glow' : 'border-white/40 bg-white/10 text-white'
  } ${className}`;
  const style = { width: size, height: size, fontSize: Math.max(Math.round(size * 0.38), 11) };

  return photoUrl ? (
    <img
      src={photoUrl}
      alt={`${name || 'User'} profile`}
      title={name || email || ''}
      className={frameClass}
      style={{ ...style, objectFit: 'cover' }}
      onError={() => setPhotoUrl('')}
    />
  ) : (
    <span title={name || email || ''} aria-label={`Profile initials ${initials}`} className={frameClass} style={style}>
      {initials}
    </span>
  );
}
