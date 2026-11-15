import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Phone, Calendar, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SeoHead } from '../components/common/SeoHead';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { InteractiveCard, MagneticWrapper, Reveal } from '../components/common/MotionPrimitives';
import { MEDIA_ASSETS } from '../lib/mediaAssets';
import { VENUE_INFO, buildWhatsAppUrl } from '../config/businessConfig';
import { useVenue } from '../context/VenueContext';

gsap.registerPlugin(ScrollTrigger);

export function HomePage() {
  const { data } = useVenue();
  const heroBgRef = useRef<HTMLDivElement | null>(null);
  const vipImgRef = useRef<HTMLDivElement | null>(null);

  const settings = data?.settings;
  const experiences = data?.experiences || [];
  const packages = data?.packages || [];
  const games = (data?.games || []).slice(0, 4);
  const menuItems = (data?.menuItems || []).slice(0, 3);
  const events = (data?.events || []).slice(0, 2);
  const gallery = (data?.gallery || []).slice(0, 4);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      if (heroBgRef.current) {
        gsap.to(heroBgRef.current, {
          yPercent: 14,
          ease: 'none',
          scrollTrigger: {
            trigger: heroBgRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }

      if (vipImgRef.current) {
        gsap.fromTo(
          vipImgRef.current,
          { scale: 1.07 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: vipImgRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const whatsappNumber = settings?.whatsapp_number || VENUE_INFO.whatsappNumber;
  const phoneDisplay = settings?.phone_display || VENUE_INFO.phoneDisplay;

  return (
    <div>
      <SeoHead
        title="Infinity Gaming Zone & Cafe – Gaming Lounge in Bhagalpur"
        description="Book PC gaming, PlayStation console stations, VIP lounge hangouts, and cafe refreshments at Infinity Gaming Zone & Cafe, SM College Road, Bhagalpur."
      />

      {/* HERO SECTION */}
      <section className="relative min-h-[84vh] flex items-end overflow-hidden border-b border-white/10">
        <div ref={heroBgRef} className="absolute inset-0 -top-10">
          <ImageWithFallback
            src={MEDIA_ASSETS.heroLounge}
            alt="Infinity Gaming Zone & Cafe interior with dark gaming stations and cafe bar"
            loading="eager"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#090B10] via-[#090B10]/75 to-[#090B10]/35"
            aria-hidden="true"
          />
          <motion.div
            animate={{
              opacity: [0.35, 0.58, 0.35],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <motion.div
            animate={{
              opacity: [0.25, 0.45, 0.25],
              scale: [1.04, 1, 1.04],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-0 bottom-1/4 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl pointer-events-none"
            aria-hidden="true"
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24">
          <div className="max-w-3xl space-y-6">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm font-medium tracking-wider uppercase text-cyan-300"
            >
              Infinity Gaming Zone &amp; Cafe · SM College Road, Bhagalpur
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl [text-wrap:balance]"
            >
              LEVEL UP YOUR HANGOUT.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed"
            >
              A dedicated destination in Choti Khanjarpur Chowk for competitive PC gaming,
              big-screen console lounges, private VIP group sessions, and freshly served cafe
              refreshments.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <MagneticWrapper>
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-6 py-3.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-cyan-300 whitespace-nowrap"
                >
                  <span>BOOK YOUR SESSION</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </MagneticWrapper>
              <MagneticWrapper>
                <Link
                  to="/experiences"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 whitespace-nowrap"
                >
                  <span>EXPLORE THE ZONE</span>
                </Link>
              </MagneticWrapper>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PROMOTIONAL ANNOUNCEMENT BAR */}
      {settings?.promo_banner && (
        <div className="border-b border-white/10 bg-[#0E121B]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs sm:px-6 lg:px-8 text-slate-300">
            <span className="font-medium">{settings.promo_banner}</span>
            <Link
              to="/book"
              className="text-cyan-300 hover:text-cyan-200 font-semibold whitespace-nowrap"
            >
              Request a Slot &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* 01. INTRODUCTION & GAMING EXPERIENCE SHOWCASE */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/10 pb-8">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-cyan-300">01. The Experience</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl [text-wrap:balance]">
              Built for solo rank grinds, squad nights, and unhurried cafe hangouts
            </h2>
          </div>
          <Link
            to="/about"
            className="text-sm font-medium text-slate-300 hover:text-cyan-300 whitespace-nowrap"
          >
            Read our story &rarr;
          </Link>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {experiences.map((exp, idx) => (
            <InteractiveCard
              key={exp.id}
              delay={idx * 0.06}
              className={`group overflow-hidden rounded-2xl border border-white/10 bg-[#11151E] transition-colors hover:border-cyan-400/35 flex flex-col ${
                idx === 0 ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="relative h-60 sm:h-72 overflow-hidden bg-[#0B0E15]">
                <ImageWithFallback
                  src={exp.image_url}
                  alt={exp.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-[#11151E] via-transparent to-transparent"
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <div className="text-xs text-slate-400">
                    {exp.category} · {exp.capacity_label}
                  </div>
                  <h3 className="mt-1.5 font-display text-xl font-semibold text-white">
                    {exp.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{exp.description}</p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                  <span className="font-mono text-cyan-300">{exp.price_label}</span>
                  <Link
                    to={`/book?exp=${exp.slug}`}
                    className="font-semibold text-white hover:text-cyan-300 whitespace-nowrap"
                  >
                    Reserve Zone &rarr;
                  </Link>
                </div>
              </div>
            </InteractiveCard>
          ))}
        </div>
      </section>

      {/* 02. VIP LOUNGE PROMOTION */}
      <section className="border-y border-white/10 bg-[#0D1119]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-stretch">
            <div className="overflow-hidden rounded-2xl border border-white/10 min-h-[300px]">
              <div ref={vipImgRef} className="h-full w-full">
                <ImageWithFallback
                  src={MEDIA_ASSETS.vipConsole}
                  alt="Private VIP console gaming suite"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <Reveal className="flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium text-cyan-300">02. Private Lounge</p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl [text-wrap:balance]">
                Reserve the VIP Suite for birthdays, squad rivalries, and private nights
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Step into a private seating environment tailored for uninterrupted console play,
                direct cafe table service, and group celebrations in Bhagalpur. Exact room
                capacity, screen specs, and hourly VIP packages are confirmed directly with the
                venue desk.
              </p>
              <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Booking Mode</span>
                  <p className="mt-0.5 font-semibold text-white">Private Group Slot</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Package Pricing</span>
                  <p className="mt-0.5 font-mono text-cyan-300">[OWNER VERIFICATION REQUIRED]</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <MagneticWrapper>
                  <Link
                    to="/book?exp=vip-private-lounge"
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    <span>Enquire for VIP Suite</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </MagneticWrapper>
                <a
                  href={buildWhatsAppUrl(
                    'Hello Infinity Gaming Zone! I would like to enquire about booking the VIP Private Lounge.',
                    whatsappNumber
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  <span>WhatsApp VIP Desk</span>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 03. POPULAR GAMES & CAFE REFRESHMENTS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 space-y-20">
        {/* Games */}
        <div>
          <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-cyan-300">03. Games Catalogue</p>
              <h2 className="mt-1 font-display text-3xl font-bold text-white">
                Console &amp; PC Genres
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Sample catalogue entries shown below — installed game titles await owner
                confirmation.
              </p>
            </div>
            <Link to="/games" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
              Browse full catalogue &rarr;
            </Link>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {games.map((g, idx) => (
              <InteractiveCard
                key={g.id}
                delay={idx * 0.05}
                className="group overflow-hidden rounded-xl border border-white/10 bg-[#11151E] hover:border-cyan-400/35 flex flex-col"
              >
                <div className="h-40 overflow-hidden">
                  <ImageWithFallback
                    src={g.image_url}
                    alt={g.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-slate-400">
                      {g.platform} · {g.mode}
                    </div>
                    <h3 className="mt-1 font-display text-base font-semibold text-white">
                      {g.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 line-clamp-2">{g.description}</p>
                </div>
              </InteractiveCard>
            ))}
          </div>
        </div>

        {/* Cafe */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-stretch">
          <Reveal className="flex flex-col justify-center space-y-6">
            <p className="text-xs font-medium text-cyan-300">04. Cafe &amp; Refreshments</p>
            <h2 className="font-display text-3xl font-bold text-white [text-wrap:balance]">
              Fuel between rounds without leaving the lounge
            </h2>
            <p className="text-slate-300 leading-relaxed">
              Cold beverages, quick bites, and shareable platters designed for uninterrupted gaming
              sessions. Confirmed menu items and pricing are updated directly by the venue team.
            </p>
            <div className="space-y-3 border-t border-white/10 pt-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.category}</p>
                  </div>
                  <span className="font-mono text-xs text-cyan-300">{item.price_label}</span>
                </div>
              ))}
            </div>
            <div>
              <Link
                to="/cafe"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/5"
              >
                <span>View Full Cafe Menu</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="overflow-hidden rounded-2xl border border-white/10 min-h-[300px]">
            <ImageWithFallback
              src={MEDIA_ASSETS.cafeRefreshments}
              alt="Infinity Cafe cold coffee, sliders, and fries"
              className="h-full w-full object-cover"
            />
          </Reveal>
        </div>
      </section>

      {/* 05. PACKAGES & UPCOMING EVENTS */}
      <section className="border-y border-white/10 bg-[#0D1119]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 space-y-16">
          {/* Pricing Packages */}
          <div>
            <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium text-cyan-300">05. Packages &amp; Offers</p>
                <h2 className="mt-1 font-display text-3xl font-bold text-white">
                  Flexible Session Tiers
                </h2>
              </div>
              <Link to="/pricing" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
                Full pricing details &rarr;
              </Link>
            </Reveal>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg, idx) => (
                <InteractiveCard
                  key={pkg.id}
                  delay={idx * 0.05}
                  className="rounded-xl border border-white/10 bg-[#11151E] hover:border-cyan-400/35 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-xs text-slate-400">
                      {pkg.tier_type} · {pkg.duration_label}
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-semibold text-white">
                      {pkg.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">{pkg.target_audience}</p>
                    <p className="mt-4 font-mono text-sm text-cyan-300">{pkg.price_label}</p>
                    <p className="mt-3 text-xs text-slate-400 leading-relaxed">{pkg.inclusions}</p>
                  </div>
                  <Link
                    to="/book"
                    className="mt-5 inline-flex items-center justify-center rounded-lg border border-white/15 py-2 text-xs font-semibold text-white hover:border-cyan-400/50 hover:text-cyan-300"
                  >
                    Enquire / Book
                  </Link>
                </InteractiveCard>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium text-cyan-300">06. Tournaments &amp; Events</p>
                <h2 className="mt-1 font-display text-3xl font-bold text-white">
                  Community Competitions
                </h2>
              </div>
              <Link to="/events" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
                View events &amp; register &rarr;
              </Link>
            </Reveal>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {events.map((ev, idx) => (
                <InteractiveCard
                  key={ev.id}
                  delay={idx * 0.07}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-[#11151E] hover:border-cyan-400/35 grid grid-cols-1 sm:grid-cols-5"
                >
                  <div className="sm:col-span-2 h-44 sm:h-auto overflow-hidden">
                    <ImageWithFallback
                      src={ev.image_url}
                      alt={ev.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="sm:col-span-3 p-5 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-xs text-slate-400 font-mono tabular-nums">
                        {ev.event_date} · {ev.event_type}
                      </div>
                      <h3 className="mt-1 font-display text-lg font-semibold text-white">
                        {ev.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-400">{ev.rules_summary}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                      <span className="font-mono text-slate-300 tabular-nums">
                        {ev.current_participants}/{ev.max_participants} registered
                      </span>
                      <Link
                        to="/events"
                        className="font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        Register &rarr;
                      </Link>
                    </div>
                  </div>
                </InteractiveCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 07. GALLERY PREVIEW & VERIFIED REVIEWS INVITE */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 space-y-16">
        <div>
          <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-cyan-300">07. Photo Gallery</p>
              <h2 className="mt-1 font-display text-3xl font-bold text-white">
                Inside the Lounge
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Temporary development photography — real venue photographs uploaded via Admin.
              </p>
            </div>
            <Link to="/gallery" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
              Open full gallery &rarr;
            </Link>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {gallery.map((item, idx) => (
              <InteractiveCard key={item.id} delay={idx * 0.05}>
                <Link
                  to="/gallery"
                  className="group relative block aspect-[4/3] overflow-hidden rounded-xl border border-white/10"
                >
                  <ImageWithFallback
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-xs font-medium text-white">
                    {item.title}
                  </div>
                </Link>
              </InteractiveCard>
            ))}
          </div>
        </div>

        {/* Honest Reviews Card */}
        <Reveal>
          <div className="rounded-2xl border border-white/10 bg-[#11151E] p-6 sm:p-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-300">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Verified Customer Reviews</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                Genuine Google Business Profile Reviews
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We do not display fabricated testimonials or synthetic star ratings. Once the owner
                links the verified Google Business Profile review URL in the Admin settings,
                visitors can read and submit genuine Bhagalpur customer reviews directly.
              </p>
            </div>
            {settings?.google_review_url ? (
              <a
                href={settings.google_review_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 whitespace-nowrap shrink-0"
              >
                <span>Read Google Reviews</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            ) : (
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-slate-200 hover:bg-white/5 whitespace-nowrap shrink-0"
              >
                <span>Leave Feedback</span>
              </Link>
            )}
          </div>
        </Reveal>
      </section>

      {/* 08. LOCATION & FINAL BOOKING CTA */}
      <section className="border-t border-white/10 bg-[#0D1119]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal className="space-y-5">
              <p className="text-xs font-medium text-cyan-300">08. Visit Us in Bhagalpur</p>
              <h2 className="font-display text-3xl font-bold text-white sm:text-4xl [text-wrap:balance]">
                Ready for your next session at SM College Road?
              </h2>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-1" aria-hidden="true" />
                  <span>{settings?.address || VENUE_INFO.fullAddress}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>
                    {phoneDisplay}{' '}
                    <span className="text-xs text-slate-500">
                      (Publicly listed — confirm with owner)
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>{settings?.business_hours}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <MagneticWrapper>
                  <Link
                    to="/book"
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-6 py-3.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    <span>BOOK YOUR SESSION</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </MagneticWrapper>
                <a
                  href={VENUE_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3.5 text-sm font-medium text-white hover:bg-white/5"
                >
                  <span>Get Google Maps Directions</span>
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-white/10 bg-[#11151E] p-6 space-y-4">
                <h3 className="font-display text-lg font-semibold text-white">
                  Quick Booking Channels
                </h3>
                <p className="text-sm text-slate-400">
                  Reserve a time window online or reach the desk directly on WhatsApp for group
                  blocks, private parties, and tournament enquiries.
                </p>
                <div className="space-y-3 pt-2">
                  <Link
                    to="/book"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#090B10] px-4 py-3.5 text-sm font-medium text-white hover:border-cyan-400/50 transition-colors"
                  >
                    <span>Online Booking Request</span>
                    <ArrowRight className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                  </Link>
                  <a
                    href={buildWhatsAppUrl(
                      'Hello Infinity Gaming Zone! I would like to enquire about gaming sessions and available packages.',
                      whatsappNumber
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-[#090B10] px-4 py-3.5 text-sm font-medium text-white hover:border-emerald-400/50 transition-colors"
                  >
                    <span>WhatsApp Desk ({phoneDisplay})</span>
                    <ExternalLink className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
