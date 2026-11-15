import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';

const DESKTOP_LINKS = [
  { to: '/experiences', label: 'Experiences' },
  { to: '/games', label: 'Games' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/cafe', label: 'Cafe' },
  { to: '/contact', label: 'Contact' },
];

const MOBILE_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/experiences', label: 'Gaming Experiences' },
  { to: '/games', label: 'Games Library' },
  { to: '/pricing', label: 'Pricing & Packages' },
  { to: '/cafe', label: 'Cafe & Menu' },
  { to: '/events', label: 'Events & Tournaments' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Location & Contact' },
  { to: '/admin', label: 'Admin Portal' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090B10]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="group flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          <motion.svg
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.18 }}
            width="24"
            height="14"
            viewBox="0 0 36 20"
            fill="none"
            aria-hidden="true"
            className="text-cyan-400 shrink-0"
          >
            <path
              d="M9.5 17C5.35786 17 2 13.866 2 10C2 6.13401 5.35786 3 9.5 3C14.1 3 16.9 7.8 18 10C19.1 12.2 21.9 17 26.5 17C30.6421 17 34 13.866 34 10C34 6.13401 30.6421 3 26.5 3C21.9 3 19.1 7.8 18 10C16.9 12.2 14.1 17 9.5 17Z"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
          <span className="font-display tracking-wide">INFINITY</span>
        </Link>

        {/* Zone 2: 5 single-line nav links with gliding layoutId active underline */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
          {DESKTOP_LINKS.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative py-1 transition-colors whitespace-nowrap shrink-0 hover:text-white ${
                  active ? 'text-cyan-300' : 'text-slate-300'
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-active-underline"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-x-0 -bottom-0.5 h-px bg-cyan-400"
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA + mobile drawer toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/book"
              onClick={() => setMobileOpen(false)}
              className="inline-flex items-center justify-center rounded-lg bg-cyan-400 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 whitespace-nowrap shrink-0"
            >
              Book Session
            </Link>
          </motion.div>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex md:hidden items-center justify-center rounded-lg border border-white/10 p-2 text-slate-200 hover:bg-white/5 min-w-[40px] min-h-[40px]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Animated Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Mobile navigation"
            className="md:hidden border-t border-white/10 bg-[#0B0E15] px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto"
          >
            {MOBILE_LINKS.map((item, idx) => {
              const active = location.pathname === item.to;
              return (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.18, delay: idx * 0.02 }}
                >
                  <Link
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-cyan-400/10 text-cyan-300'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
