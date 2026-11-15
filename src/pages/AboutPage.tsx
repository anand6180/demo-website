import { Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { InteractiveCard, MagneticWrapper, Reveal } from '../components/common/MotionPrimitives';
import { MEDIA_ASSETS } from '../lib/mediaAssets';
import { VerificationNotice } from '../components/common/VerificationNotice';

export function AboutPage() {
  const pillars = [
    {
      num: '01',
      title: 'Gaming Culture Without Compromise',
      body: 'Infinity Gaming Zone & Cafe brings a structured, comfortable gaming lounge atmosphere to SM College Road, Choti Khanjarpur Chowk — designed for focused solo sessions as much as weekend multiplayer meetups.',
    },
    {
      num: '02',
      title: 'A Social Hangout Built Around Play',
      body: 'Instead of cramped setups, the lounge pairs gaming stations with a welcoming cafe environment where college friends and local squads can relax, grab refreshments, and compete side by side.',
    },
    {
      num: '03',
      title: 'Private VIP Lounge Experiences',
      body: 'Whether celebrating a birthday or organizing an uninterrupted console session with close friends, our VIP lounge zone offers comfortable seating, big-screen immersion, and attentive hospitality.',
    },
    {
      num: '04',
      title: 'Community Events & Local Brackets',
      body: 'From casual couch-play rivalries to scheduled local tournaments, Infinity serves as a neighborhood hub for gamers across Bhagalpur.',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      <SeoHead
        title="About Us – Infinity Gaming Zone & Cafe Bhagalpur"
        description="Learn about the gaming culture, social lounge atmosphere, VIP room, and cafe hangout experience at Infinity Gaming Zone & Cafe in Bhagalpur."
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
        <Reveal className="space-y-5">
          <p className="text-xs font-medium text-cyan-300">About Infinity</p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl [text-wrap:balance]">
            Where Bhagalpur comes together to play, compete, and unwind.
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Located near Galaxy Hotel at Choti Khanjarpur Chowk on SM College Road, Infinity Gaming
            Zone &amp; Cafe combines dedicated PC and console gaming zones with an inviting cafe
            hangout space.
          </p>
          <VerificationNotice message="Accuracy Note: We intentionally avoid inventing owner biographies, founding dates, hardware claims, or awards. Confirmed owner story details can be added once verified." />
        </Reveal>
        <Reveal delay={0.1} className="overflow-hidden rounded-2xl border border-white/10 aspect-[16/10]">
          <ImageWithFallback
            src={MEDIA_ASSETS.heroLounge}
            alt="Infinity Gaming Zone & Cafe lounge concept view"
          />
        </Reveal>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {pillars.map((p, idx) => (
          <InteractiveCard
            key={p.num}
            delay={idx * 0.06}
            className="rounded-2xl border border-white/10 bg-[#11151E] hover:border-cyan-400/35 p-7 space-y-3"
          >
            <span className="font-mono text-xs text-cyan-300">{p.num}.</span>
            <h2 className="font-display text-xl font-semibold text-white">{p.title}</h2>
            <p className="text-sm text-slate-400 leading-relaxed">{p.body}</p>
          </InteractiveCard>
        ))}
      </div>

      <Reveal>
        <div className="rounded-2xl border border-white/10 bg-[#11151E] p-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">
              Experience the zone in person
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Explore our gaming zones or submit a session enquiry online.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/experiences"
              className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/5"
            >
              View Zones
            </Link>
            <MagneticWrapper>
              <Link
                to="/book"
                className="inline-block rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Book Session
              </Link>
            </MagneticWrapper>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
