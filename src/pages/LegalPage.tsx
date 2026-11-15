import { SeoHead } from '../components/common/SeoHead';
import { useVenue } from '../context/VenueContext';
import { VENUE_INFO } from '../config/businessConfig';

export function LegalPage() {
  const { data } = useVenue();
  const cancellationPolicy = data?.settings?.cancellation_policy;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <SeoHead
        title="Legal & Booking Policies | Infinity Gaming Zone & Cafe Bhagalpur"
        description="Privacy Policy, Terms and Conditions, and Booking & Cancellation Policy for Infinity Gaming Zone & Cafe, Bhagalpur."
      />

      <div className="space-y-3 border-b border-white/10 pb-8">
        <p className="text-xs font-medium text-cyan-300">Policies &amp; Disclosures</p>
        <h1 className="font-display text-4xl font-bold text-white">
          Privacy, Terms &amp; Booking Policy
        </h1>
        <p className="text-sm text-slate-400">
          Applicable to {VENUE_INFO.brandName}, {VENUE_INFO.fullAddress}.
        </p>
      </div>

      <section id="privacy" className="space-y-3">
        <h2 className="font-display text-2xl font-bold text-white">1. Privacy Policy</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          When you submit a session booking request, tournament registration, or contact enquiry,
          we collect only the contact details you provide (name, phone number, optional email, and
          session preferences) solely to coordinate your visit, confirm station availability, and
          respond to your enquiry. We do not sell or share personal details with third-party
          advertisers.
        </p>
      </section>

      <section id="terms" className="space-y-3 border-t border-white/10 pt-8">
        <h2 className="font-display text-2xl font-bold text-white">2. Terms &amp; Conditions</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          All gaming stations, consoles, controllers, peripherals, and lounge furnishings must be
          handled responsibly during your session. Displayed demo specifications, game lists, or
          prices marked <span className="font-mono text-amber-300">[OWNER VERIFICATION REQUIRED]</span>{' '}
          are subject to confirmation by the venue desk at {VENUE_INFO.phoneDisplay}.
        </p>
      </section>

      <section id="cancellation" className="space-y-3 border-t border-white/10 pt-8">
        <h2 className="font-display text-2xl font-bold text-white">
          3. Booking &amp; Cancellation Policy
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          {cancellationPolicy ||
            'Please notify us at least 2 hours prior to your scheduled session if you need to reschedule or cancel. You can cancel online using your booking reference and phone number or via WhatsApp.'}
        </p>
      </section>
    </div>
  );
}
