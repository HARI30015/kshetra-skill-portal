import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const linkBase =
  'rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200';

export default function Navbar() {
  const { isAuthenticated, role, logout } = useAuth();
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
    await new Promise((r) => setTimeout(r, 700));
    await logout();
    setConfirmOpen(false);
    setLeaving(false);
    navigate('/', { replace: true });
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
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-lg font-black text-white shadow-glow"
              >
                S
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
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
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
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    Sign in
                  </NavLink>
                  <Link to="/signup">
                    <motion.span
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-shimmer ml-1 inline-block rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-glow"
                    >
                      Get started
                    </motion.span>
                  </Link>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmOpen(true)}
                  className="ml-1 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                >
                  Logout
                </motion.button>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="rounded-lg p-2 text-slate-200 hover:bg-white/10 md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
              </svg>
            </button>
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
                        isActive ? 'bg-white/15 text-white' : 'text-slate-300'
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
                      className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300"
                    >
                      Sign in
                    </NavLink>
                    <NavLink
                      to="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white"
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
                    className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-rose-200"
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
                    className="h-12 w-12 rounded-full border-[3px] border-transparent border-t-violet-400 border-r-cyan-400"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  />
                  <p className="text-sm text-slate-300">Signing you out…</p>
                </motion.div>
              ) : (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/20 text-2xl"
                  >
                    👋
                  </motion.div>
                  <h3 className="text-xl font-bold text-white">Log out?</h3>
                  <p className="mt-2 text-sm text-slate-300">
                    You'll need to sign in again to track your progress.
                  </p>
                  <div className="mt-6 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setConfirmOpen(false)}
                      className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Stay
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleLogout}
                      className="btn-shimmer flex-1 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-sm font-semibold text-white"
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
