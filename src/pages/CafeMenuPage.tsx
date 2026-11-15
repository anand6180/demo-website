import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SeoHead } from '../components/common/SeoHead';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { VerificationNotice } from '../components/common/VerificationNotice';
import { useVenue } from '../context/VenueContext';

export function CafeMenuPage() {
  const { data, loading } = useVenue();
  const items = data?.menuItems || [];
  const [category, setCategory] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(items.map((m) => m.category)))],
    [items]
  );

  const filtered = useMemo(
    () => (category === 'All' ? items : items.filter((m) => m.category === category)),
    [items, category]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
      <SeoHead
        title="Cafe & Refreshments Menu | Infinity Gaming Zone & Cafe Bhagalpur"
        description="Explore cafe snacks, cold beverages, and group platters served inside Infinity Gaming Zone & Cafe at SM College Road, Bhagalpur."
      />

      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-cyan-300">Cafe &amp; Refreshments</p>
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
          Crafted bites and cold drinks for marathon sessions.
        </h1>
      </div>

      <VerificationNotice message="Menu Confirmation Notice: Only items confirmed by the business owner are published as verified. Current sample entries marked [Demo Item] / [OWNER VERIFICATION REQUIRED] await final owner menu confirmation." />

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#11151E] p-1 w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              category === cat ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#11151E] hover:border-cyan-400/35 flex flex-col"
              >
                <div className="h-48 overflow-hidden">
                  <ImageWithFallback
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs text-slate-400">
                      {item.category} · {item.is_available ? 'Available' : 'Unavailable'}
                    </div>
                    <h2 className="mt-1 font-display text-lg font-semibold text-white">
                      {item.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                  </div>
                  <div className="pt-3 border-t border-white/10 font-mono text-xs text-cyan-300">
                    {item.price_label}
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
