import { useSearchParams, Link } from 'react-router-dom';
import { SeoHead } from '../components/common/SeoHead';
import { BookingWizard } from '../components/booking/BookingWizard';
import { useVenue } from '../context/VenueContext';

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const initialSlug = searchParams.get('exp') || undefined;
  const { data } = useVenue();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
      <SeoHead
        title="Book a Gaming Session | Infinity Gaming Zone & Cafe Bhagalpur"
        description="Reserve PC gaming rigs, PlayStation consoles, VIP lounge rooms, or group sessions at Infinity Gaming Zone & Cafe, SM College Road, Bhagalpur."
      />

      <div className="space-y-3">
        <p className="text-xs font-medium text-cyan-300">Session Reservation</p>
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
          Book Your Gaming Session
        </h1>
        <p className="max-w-2xl text-sm sm:text-base text-slate-300">
          Select your preferred zone, date, duration, and squad size. Every submission generates a
          unique booking reference and prevents conflicting station reservations.
        </p>
      </div>

      <BookingWizard initialExperienceSlug={initialSlug} />

      <div className="rounded-xl border border-white/10 bg-[#11151E] p-5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-2xl leading-relaxed">
          <strong className="text-slate-200">Cancellation Policy:</strong>{' '}
          {data?.settings?.cancellation_policy}
        </p>
        <Link to="/legal#cancellation" className="text-cyan-300 hover:text-cyan-200 whitespace-nowrap">
          Full Booking Policy &rarr;
        </Link>
      </div>
    </div>
  );
}
