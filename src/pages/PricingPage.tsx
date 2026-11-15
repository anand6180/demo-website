import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { InteractiveCard, MagneticWrapper, Reveal } from '../components/common/MotionPrimitives';
import { VerificationNotice } from '../components/common/VerificationNotice';
import { useVenue } from '../context/VenueContext';
import { buildWhatsAppUrl, VENUE_INFO } from '../config/businessConfig';

export function PricingPage() {
  const { data, loading } = useVenue();
  const packages = data?.packages || [];
  const whatsappNumber = data?.settings?.whatsapp_number || VENUE_INFO.whatsappNumber;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <SeoHead
        title="Pricing & Packages – Gaming Rates | Infinity Gaming Zone Bhagalpur"
        description="Explore hourly gaming rates, multiplayer passes, group packages, VIP lounge rates, and weekend tournament tiers at Infinity Gaming Zone & Cafe, Bhagalpur."
      />

      <Reveal className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-cyan-300">Pricing &amp; Packages</p>
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl [text-wrap:balance]">
          Transparent session tiers managed directly by the venue.
        </h1>
        <p className="text-slate-300 leading-relaxed">
          Per-hour sessions, multiplayer passes, private VIP lounge blocks, and custom weekend
          group packages.
        </p>
      </Reveal>

      <VerificationNotice message="Pricing Transparency: We never invent hourly rates or promotional offers. Prices marked [OWNER VERIFICATION REQUIRED] can be confirmed via WhatsApp or published directly by the owner inside the Admin Dashboard." />

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-60 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {packages.map((pkg, idx) => (
            <InteractiveCard
              key={pkg.id}
              delay={idx * 0.06}
              className={`rounded-2xl border p-7 flex flex-col justify-between space-y-6 transition-colors ${
                pkg.is_featured
                  ? 'border-cyan-400/40 bg-[#121826] hover:border-cyan-400/70'
                  : 'border-white/10 bg-[#11151E] hover:border-white/25'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                  <span>
                    {pkg.tier_type} · {pkg.duration_label}
                  </span>
                  <span>{pkg.is_verified ? 'Verified Rate' : 'Pending Verification'}</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-white">{pkg.title}</h2>
                <p className="text-sm text-slate-400">{pkg.target_audience}</p>
                <div className="pt-2 font-mono text-lg font-semibold text-cyan-300">
                  {pkg.price_label}
                </div>
                <p className="border-t border-white/10 pt-4 text-sm text-slate-300 leading-relaxed">
                  {pkg.inclusions}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <MagneticWrapper>
                  <Link
                    to="/book"
                    className="inline-block rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    Request Session
                  </Link>
                </MagneticWrapper>
                <a
                  href={buildWhatsAppUrl(
                    `Hello Infinity Gaming Zone! I would like to ask about pricing for: ${pkg.title}.`,
                    whatsappNumber
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  Ask on WhatsApp
                </a>
              </div>
            </InteractiveCard>
          ))}
        </div>
      )}
    </div>
  );
}
