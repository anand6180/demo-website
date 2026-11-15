import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { VerificationNotice } from '../components/common/VerificationNotice';
import { useVenue } from '../context/VenueContext';

export function GalleryPage() {
  const { data } = useVenue();
  const gallery = data?.gallery || [];

  const [category, setCategory] = useState('All');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(gallery.map((g) => g.category)))],
    [gallery]
  );

  const filtered = useMemo(
    () => (category === 'All' ? gallery : gallery.filter((g) => g.category === category)),
    [gallery, category]
  );

  useEffect(() => {
    if (viewerIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerIndex(null);
      if (e.key === 'ArrowRight')
        setViewerIndex((i) => (i === null ? null : (i + 1) % filtered.length));
      if (e.key === 'ArrowLeft')
        setViewerIndex((i) =>
          i === null ? null : (i - 1 + filtered.length) % filtered.length
        );
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [viewerIndex, filtered.length]);

  const activeItem = viewerIndex !== null ? filtered[viewerIndex] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
      <SeoHead
        title="Photo Gallery – Gaming Lounge & Cafe | Infinity Bhagalpur"
        description="View the Infinity Gaming Zone & Cafe lounge spaces, PC gaming stations, VIP room, and cafe refreshments in Bhagalpur."
      />

      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-cyan-300">Gallery</p>
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
          Inside Infinity Gaming Zone &amp; Cafe.
        </h1>
      </div>

      <VerificationNotice message="Development Visuals Notice: Images currently shown are temporary concept photographs. Actual venue photos uploaded by the owner via the Admin Portal will replace these before launch." />

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#11151E] p-1 w-fit">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setCategory(cat);
              setViewerIndex(null);
            }}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              category === cat ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, idx) => (
            <motion.button
              layout
              key={item.id}
              type="button"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setViewerIndex(idx)}
              className="group text-left overflow-hidden rounded-2xl border border-white/10 bg-[#11151E] transition-colors hover:border-cyan-400/40"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <ImageWithFallback
                  src={item.image_url}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="text-xs text-slate-400">{item.category}</div>
                <div className="mt-1 font-display text-base font-semibold text-white">
                  {item.title}
                </div>
                <p className="mt-1 text-xs text-slate-400">{item.caption}</p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Animated Fullscreen Lightbox */}
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={activeItem.title}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <button
              type="button"
              aria-label="Close image viewer"
              onClick={() => setViewerIndex(null)}
              className="absolute right-5 top-5 rounded-lg border border-white/15 bg-black/60 p-2.5 text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {filtered.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() =>
                    setViewerIndex((i) =>
                      i === null ? 0 : (i - 1 + filtered.length) % filtered.length
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg border border-white/15 bg-black/60 p-2.5 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() =>
                    setViewerIndex((i) => (i === null ? 0 : (i + 1) % filtered.length))
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg border border-white/15 bg-black/60 p-2.5 text-white hover:bg-white/10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl w-full space-y-3"
            >
              <div className="aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-black">
                <ImageWithFallback
                  src={activeItem.image_url}
                  alt={activeItem.title}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300">
                <div>
                  <strong className="text-white">{activeItem.title}</strong> — {activeItem.caption}
                </div>
                <span className="font-mono text-xs text-slate-400 tabular-nums">
                  {(viewerIndex ?? 0) + 1} / {filtered.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
