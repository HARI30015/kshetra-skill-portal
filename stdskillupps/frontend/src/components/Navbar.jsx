import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

const linkBase =
  'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200';

export default function Navbar() {
  const { isAuthenticated, role, logout, profile } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const links = [];
  if (isAuthenticated) {
    if (role === 'lecturer') {
      links.push({ to: '/lecturer', label: 'Students' });
      links.push({ to: '/placements', label: 'Placements' });
    } else {
      links.push({ to: '/dashboard', label: 'Dashboard' });
      links.push({ to: '/placements', label: 'Placements' });
    }
  }

  const handleLogout = async () => {
    setLeaving(true);
    // No artificial wait (owner's rule, 2026-10-23): a normal single
    // click acts instantly.
    await logout();
    setConfirmOpen(false);
    setLeaving(false);
    // Owner's flow (2026-10-23): after logout, go to the Login page,
    // not the landing page.
    navigate('/login', { replace: true });
  };

  return (
    <>
      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-40"
      >
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <nav className="glass flex items-center justify-between px-4 py-3 sm:px-6">
            <Link to="/" className="flex items-center gap-2">
              {/* Logo: a thin white rocket on a curved orbit with two tiny stars,
                  on a black tile. Inline SVG, white only. */}
              <motion.div
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/70 bg-black shadow-glow"
              >
                <svg viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M 9 37 C 10 22 20 10 30 11 C 37 12 40 22 38 37" strokeWidth="1.5" />
                  <g transform="rotate(45 24 24)">
                    <path d="M 24 5 C 27 11 28.5 17 28.5 23 C 28.5 27 26.5 30 24 31.5 C 21.5 30 19.5 27 19.5 23 C 19.5 17 21 11 24 5 Z" />
                    <path d="M 24 10 L 24 27" strokeWidth="1.1" />
                    <path d="M 20.5 25 L 13.5 30.5 Q 17.5 29.5 20.5 27.5 Z" />
                    <path d="M 27.5 25 L 34.5 30.5 Q 30.5 29.5 27.5 27.5 Z" />
                  </g>
                  <path d="M 10 7.5 L 10.9 10.1 L 13.5 11 L 10.9 11.9 L 10 14.5 L 9.1 11.9 L 6.5 11 L 9.1 10.1 Z" fill="#fff" stroke="none" />
                  <path d="M 38 34.5 L 38.9 37.1 L 41.5 38 L 38.9 38.9 L 38 41.5 L 37.1 38.9 L 34.5 38 L 37.1 37.1 Z" fill="#fff" stroke="none" />
                </svg>
              </motion.div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                std<span className="text-gradient">skillupps</span>
              </span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `${linkBase} ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              {!isAuthenticated ? (
                <>
                  <NavLink
                    to="/login"
                    className={({ isActive }) =>
                      `${linkBase} ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    Sign in
                  </NavLink>
                  <Link to="/signup">
                    <motion.span
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.08 }}
                      className="ml-1 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black shadow-glow"
                    >
                      Get started
                    </motion.span>
                  </Link>
                </>
              ) : (
                <>
                  <Avatar name={profile?.full_name} email={profile?.email} size={34} className="ml-2" />
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.08 }}
                    onClick={() => setConfirmOpen(true)}
                    className="ml-1 rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/20"
                  >
                    Logout
                  </motion.button>
                </>
              )}
            </div>

            {/* Mobile: avatar + menu toggle */}
            <div className="flex items-center gap-2 md:hidden">
              {isAuthenticated && <Avatar name={profile?.full_name} email={profile?.email} size={32} />}
              <button
                className="rounded-lg p-2 text-zinc-200 hover:bg-white/10"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                </svg>
              </button>
            </div>
          </nav>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass mt-2 overflow-hidden p-2 md:hidden"
              >
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-4 py-2.5 text-sm font-medium ${
                        isActive ? 'bg-white/15 text-white' : 'text-zinc-300'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
                {!isAuthenticated ? (
                  <>
                    <NavLink
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-300"
                    >
                      Sign in
                    </NavLink>
                    <NavLink
                      to="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black"
                    >
                      Get started
                    </NavLink>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                    className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-zinc-200"
                  >
                    Logout
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Animated logout confirmation */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => !leaving && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong w-full max-w-sm p-8 text-center"
            >
              {leaving ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4 py-4"
                >
                  <motion.div
                    className="h-12 w-12 rounded-full border-[3px] border-transparent border-t-white border-r-white"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  />
                  <p className="text-sm text-zinc-300">Signing you out…</p>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl"
                  >
                    👋
                  </motion.div>
                  <h3 className="text-xl font-bold text-white">Log out?</h3>
                  <p className="mt-2 text-sm text-zinc-300">
                    You'll need to sign in again to track your progress.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.08 }}
                      onClick={() => setConfirmOpen(false)}
                      className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Stay
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.08 }}
                      onClick={handleLogout}
                      className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black"
                    >
                      Log out
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
