import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { VerificationNotice } from '../components/common/VerificationNotice';
import { useVenue } from '../context/VenueContext';

export function GamesLibraryPage() {
  const { data, loading } = useVenue();
  const games = data?.games || [];

  const [query, setQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [modeFilter, setModeFilter] = useState('All');

  const platforms = useMemo(
    () => ['All', ...Array.from(new Set(games.map((g) => g.platform)))],
    [games]
  );

  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.genre.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q);
      const matchesPlatform = platformFilter === 'All' || g.platform === platformFilter;
      const matchesMode =
        modeFilter === 'All' || g.mode.toLowerCase().includes(modeFilter.toLowerCase());
      return matchesQ && matchesPlatform && matchesMode;
    });
  }, [games, query, platformFilter, modeFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
      <SeoHead
        title="Games Library – PC & Console Titles | Infinity Gaming Zone Bhagalpur"
        description="Search and filter PC, PlayStation, multiplayer, and single-player game categories at Infinity Gaming Zone & Cafe in Bhagalpur."
      />

      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-cyan-300">Games Catalogue</p>
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
          Play solo campaigns or local multiplayer rivalries.
        </h1>
      </div>

      <VerificationNotice message="Game availability notice: Entries currently marked [Demo Entry — Owner Confirmation Pending] represent sample categories until the venue owner confirms the exact installed game titles in the Admin Dashboard." />

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#11151E] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, genres..."
            aria-label="Search games library"
            className="w-full rounded-lg border border-white/10 bg-[#090B10] pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-[#090B10] p-1 border border-white/10">
            {platforms.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatformFilter(p)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  platformFilter === p
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-[#090B10] p-1 border border-white/10">
            {['All', 'Multiplayer', 'Single-Player'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModeFilter(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  modeFilter === m
                    ? 'bg-cyan-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#11151E] p-12 text-center text-slate-400">
          No games matched your current filter. Try clearing your search query.
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredGames.map((g) => (
              <motion.div
                layout
                key={g.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#11151E] hover:border-cyan-400/35 flex flex-col"
              >
                <div className="h-48 overflow-hidden">
                  <ImageWithFallback
                    src={g.image_url}
                    alt={g.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs text-slate-400">
                      {g.platform} · {g.genre} · {g.mode}
                    </div>
                    <h2 className="mt-1.5 font-display text-lg font-semibold text-white">
                      {g.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed">{g.description}</p>
                  </div>
                  <div className="text-xs text-cyan-300 font-medium pt-2 border-t border-white/10">
                    {g.is_verified
                      ? 'Confirmed at Venue'
                      : 'Availability [OWNER VERIFICATION REQUIRED]'}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
