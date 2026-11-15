import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { InteractiveCard, MagneticWrapper, Reveal } from '../components/common/MotionPrimitives';
import { VerificationNotice } from '../components/common/VerificationNotice';
import { useVenue } from '../context/VenueContext';

export function ExperiencesPage() {
  const { data, loading } = useVenue();
  const experiences = data?.experiences || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <SeoHead
        title="Gaming Experiences – PC, PlayStation & VIP Lounge | Infinity Bhagalpur"
        description="Explore PC gaming rigs, PlayStation console lounges, multiplayer arenas, group blocks, and the private VIP suite at Infinity Gaming Zone & Cafe, Bhagalpur."
      />

      <Reveal className="max-w-3xl space-y-4">
        <p className="text-xs font-medium text-cyan-300">Gaming Zones</p>
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl [text-wrap:balance]">
          Tailored setups for every playstyle and squad size.
        </h1>
        <p className="text-slate-300 leading-relaxed">
          Choose from competitive PC stations, console lounge bays, multiplayer group blocks, or our
          private VIP lounge.
        </p>
      </Reveal>

      <VerificationNotice message="Station capacities, hardware specifications, and hourly pricing marked [OWNER VERIFICATION REQUIRED] are awaiting final owner confirmation and can be edited live via the Admin Portal." />

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {experiences.map((exp, idx) => (
            <InteractiveCard
              key={exp.id}
              delay={idx * 0.06}
              className="group grid grid-cols-1 overflow-hidden rounded-2xl border border-white/10 bg-[#11151E] hover:border-cyan-400/35 lg:grid-cols-12"
            >
              <div
                className={`lg:col-span-5 min-h-[260px] overflow-hidden ${
                  idx % 2 === 1 ? 'lg:order-2' : ''
                }`}
              >
                <ImageWithFallback
                  src={exp.image_url}
                  alt={exp.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="text-xs text-cyan-300 font-medium">
                    {exp.category} · {exp.is_verified ? 'Verified' : '[OWNER VERIFICATION REQUIRED]'}
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">{exp.name}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{exp.description}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 border-y border-white/10 py-4 sm:grid-cols-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">Capacity</span>
                    <p className="mt-0.5 font-medium text-white">{exp.capacity_label}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Supported Games</span>
                    <p className="mt-0.5 font-medium text-white">{exp.supported_games_note}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Pricing</span>
                    <p className="mt-0.5 font-mono text-cyan-300">{exp.price_label}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <MagneticWrapper>
                    <Link
                      to={`/book?exp=${exp.slug}`}
                      className="inline-block rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                    >
                      Book This Experience
                    </Link>
                  </MagneticWrapper>
                  <Link
                    to="/pricing"
                    className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
                  >
                    View Packages
                  </Link>
                </div>
              </div>
            </InteractiveCard>
          ))}
        </div>
      )}
    </div>
  );
}
