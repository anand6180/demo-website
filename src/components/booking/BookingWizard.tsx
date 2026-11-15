import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Search,
  Users,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVenue } from '../../context/VenueContext';
import { buildWhatsAppUrl, VENUE_INFO } from '../../config/businessConfig';
import type { BookingRecord, TimeSlotAvailability } from '../../types/venue';
import { VerificationNotice } from '../common/VerificationNotice';

interface BookingWizardProps {
  initialExperienceSlug?: string;
}

const STEPS = [
  'Experience',
  'Date & Duration',
  'Time Slot',
  'Your Details',
  'Summary & Payment',
];

export function BookingWizard({ initialExperienceSlug }: BookingWizardProps) {
  const { data, isStaticMode } = useVenue();
  const experiences = data?.experiences || [];
  const settings = data?.settings;
  const razorpayConfigured = Boolean(data?.razorpayConfigured);

  const [activeTab, setActiveTab] = useState<'book' | 'lookup'>('book');
  const [step, setStep] = useState(0);

  const [selectedExpId, setSelectedExpId] = useState<number>(0);
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [durationHours, setDurationHours] = useState<number>(2);
  const [startTime, setStartTime] = useState<string>('');
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pay_at_venue' | 'razorpay_online'>(
    'pay_at_venue'
  );

  const [slots, setSlots] = useState<TimeSlotAvailability[]>([]);
  const [availabilityMode, setAvailabilityMode] = useState<'live' | 'enquiry_pending'>(
    'enquiry_pending'
  );
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    bookingRef: string;
    experienceName: string;
    stationName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    playerCount: number;
    customerName: string;
    customerPhone: string;
    paymentMethod: string;
    status: string;
    availabilityMode: string;
  } | null>(null);

  // Lookup state
  const [lookupRef, setLookupRef] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<{
    booking: BookingRecord;
    history: Array<{
      old_status: string | null;
      new_status: string;
      changed_by: string;
      note: string;
      created_at: string;
    }>;
  } | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);

  useEffect(() => {
    if (experiences.length > 0 && selectedExpId === 0) {
      const matched = initialExperienceSlug
        ? experiences.find((e) => e.slug === initialExperienceSlug)
        : experiences[0];
      setSelectedExpId(matched ? matched.id : experiences[0].id);
    }
  }, [experiences, initialExperienceSlug, selectedExpId]);

  useEffect(() => {
    if (!selectedExpId || !bookingDate) return;
    let active = true;

    const buildStaticSlots = () => {
      const list: TimeSlotAvailability[] = [];
      for (let h = 10; h + durationHours <= 23; h++) {
        list.push({
          startTime: `${String(h).padStart(2, '0')}:00`,
          endTime: `${String(h + durationHours).padStart(2, '0')}:00`,
          availableCount: 1,
          totalStations: 1,
          isAvailable: true,
        });
      }
      return list;
    };

    if (isStaticMode) {
      setSlots(buildStaticSlots());
      setAvailabilityMode('enquiry_pending');
      setSlotsLoading(false);
      return;
    }

    setSlotsLoading(true);
    fetch(
      `/api/bookings/availability?experienceId=${selectedExpId}&date=${encodeURIComponent(
        bookingDate
      )}&duration=${durationHours}`
    )
      .then(async (r) => {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok || !ct.includes('application/json')) {
          throw new Error('Static host');
        }
        return r.json();
      })
      .then((json) => {
        if (!active) return;
        setSlots(json.slots || []);
        setAvailabilityMode(json.availabilityMode || 'enquiry_pending');
        if (
          startTime &&
          !(json.slots || []).some(
            (s: TimeSlotAvailability) => s.startTime === startTime && s.isAvailable
          )
        ) {
          setStartTime('');
        }
      })
      .catch(() => {
        if (active) {
          setSlots(buildStaticSlots());
          setAvailabilityMode('enquiry_pending');
        }
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedExpId, bookingDate, durationHours, isStaticMode]);

  const selectedExperience = experiences.find((e) => e.id === selectedExpId);
  const todayMin = new Date().toISOString().slice(0, 10);

  const handleConfirmBooking = async () => {
    setFormError(null);
    setSubmitting(true);

    const buildStaticEnquiryConfirmation = () => {
      const startH = Number(startTime.split(':')[0] || 10);
      const endTime = `${String(startH + durationHours).padStart(2, '0')}:00`;
      const ref = `INF-${bookingDate.replace(/-/g, '')}-ENQ`;
      setConfirmedBooking({
        bookingRef: ref,
        experienceName: selectedExperience?.name || 'Gaming Session',
        stationName: 'Enquiry Queue',
        bookingDate,
        startTime,
        endTime,
        durationHours,
        playerCount,
        customerName,
        customerPhone,
        paymentMethod,
        status: 'pending',
        availabilityMode: 'enquiry_pending',
      });
    };

    if (isStaticMode) {
      buildStaticEnquiryConfirmation();
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId: selectedExpId,
          bookingDate,
          startTime,
          durationHours,
          playerCount,
          customerName,
          customerPhone,
          customerEmail,
          specialRequirements,
          paymentMethod,
        }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        buildStaticEnquiryConfirmation();
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || 'Could not complete booking.');
        return;
      }
      setConfirmedBooking(json.booking);
    } catch {
      buildStaticEnquiryConfirmation();
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await fetch(
        `/api/bookings/lookup?ref=${encodeURIComponent(lookupRef)}&phone=${encodeURIComponent(
          lookupPhone
        )}`
      );
      const json = await res.json();
      if (!res.ok) {
        setLookupResult(null);
        setLookupError(json.error || 'Booking not found.');
        return;
      }
      setLookupResult(json);
    } catch {
      setLookupError('Unable to check booking right now.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!lookupResult) return;
    setCancelBusy(true);
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingRef: lookupResult.booking.booking_ref,
          phone: lookupPhone,
          reason: 'Cancelled by customer online',
        }),
      });
      if (res.ok) {
        // Refresh lookup
        const refreshed = await fetch(
          `/api/bookings/lookup?ref=${encodeURIComponent(
            lookupResult.booking.booking_ref
          )}&phone=${encodeURIComponent(lookupPhone)}`
        );
        if (refreshed.ok) {
          setLookupResult(await refreshed.json());
        }
      }
    } finally {
      setCancelBusy(false);
    }
  };

  const whatsappNumber = settings?.whatsapp_number || VENUE_INFO.whatsappNumber;

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="inline-flex rounded-xl border border-white/10 bg-[#11151E] p-1">
        <button
          type="button"
          onClick={() => setActiveTab('book')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'book'
              ? 'bg-cyan-400 text-slate-950'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          New Session Booking
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lookup')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'lookup'
              ? 'bg-cyan-400 text-slate-950'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Check Status / History
        </button>
      </div>

      {activeTab === 'lookup' ? (
        <div className="rounded-2xl border border-white/10 bg-[#11151E] p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">
              Track or Manage Your Booking
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Enter your booking reference (e.g. INF-20261115-A1B2) and the phone number used at
              booking.
            </p>
          </div>
          <form onSubmit={handleLookup} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <input
              type="text"
              required
              placeholder="Booking Reference (INF-...)"
              value={lookupRef}
              onChange={(e) => setLookupRef(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 font-mono"
            />
            <input
              type="tel"
              required
              placeholder="Phone Number"
              value={lookupPhone}
              onChange={(e) => setLookupPhone(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={lookupLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60 whitespace-nowrap"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>{lookupLoading ? 'Checking...' : 'Find Booking'}</span>
            </button>
          </form>

          {lookupError && (
            <div className="flex items-center gap-2 text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{lookupError}</span>
            </div>
          )}

          {lookupResult && (
            <div className="space-y-5 border-t border-white/10 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-cyan-300">
                    {lookupResult.booking.booking_ref}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-white">
                    {lookupResult.booking.experience_name}
                  </h3>
                  <p className="text-sm text-slate-400 tabular-nums">
                    {lookupResult.booking.booking_date} · {lookupResult.booking.start_time} –{' '}
                    {lookupResult.booking.end_time} ({lookupResult.booking.duration_hours} hrs) ·{' '}
                    {lookupResult.booking.player_count} players
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Current Status</span>
                  <p className="font-semibold text-white capitalize">
                    {lookupResult.booking.status}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Status Timeline
                </h4>
                <div className="space-y-2">
                  {lookupResult.history.map((h, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2 text-xs text-slate-300"
                    >
                      <span>
                        <strong className="text-white capitalize">{h.new_status}</strong> — {h.note}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums">{h.created_at}</span>
                    </div>
                  ))}
                </div>
              </div>

              {['pending', 'confirmed'].includes(lookupResult.booking.status) && (
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-slate-400 max-w-lg">
                    {settings?.cancellation_policy}
                  </p>
                  <button
                    type="button"
                    disabled={cancelBusy}
                    onClick={handleCancelBooking}
                    className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-400/20 disabled:opacity-60"
                  >
                    {cancelBusy ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : confirmedBooking ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-cyan-400/30 bg-[#11151E] p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-cyan-400 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-mono text-sm text-cyan-300">{confirmedBooking.bookingRef}</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white">
                {confirmedBooking.availabilityMode === 'live_slot'
                  ? 'Session Request Received'
                  : 'Booking Enquiry Submitted — Confirmation Pending'}
              </h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                {confirmedBooking.availabilityMode === 'live_slot'
                  ? 'Your slot has been held in our system. Venue staff will confirm your station arrival.'
                  : 'Live slot availability is awaiting final owner configuration. Your preferred session is saved in our queue with a unique reference and is pending confirmation from Infinity Gaming Zone & Cafe.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-y border-white/10 py-5 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <span className="text-xs text-slate-400">Experience</span>
              <p className="mt-0.5 font-semibold text-white">{confirmedBooking.experienceName}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Date &amp; Time</span>
              <p className="mt-0.5 font-mono text-white tabular-nums">
                {confirmedBooking.bookingDate} · {confirmedBooking.startTime}–
                {confirmedBooking.endTime}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Players &amp; Duration</span>
              <p className="mt-0.5 text-white tabular-nums">
                {confirmedBooking.playerCount} Players · {confirmedBooking.durationHours} hrs
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400">Payment Mode</span>
              <p className="mt-0.5 text-white">
                {confirmedBooking.paymentMethod === 'pay_at_venue'
                  ? 'Pay at Venue'
                  : 'Online Payment'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={buildWhatsAppUrl(
                `Hello Infinity Gaming Zone! I just submitted a booking request.\nRef: ${confirmedBooking.bookingRef}\nExperience: ${confirmedBooking.experienceName}\nDate: ${confirmedBooking.bookingDate}\nTime: ${confirmedBooking.startTime} - ${confirmedBooking.endTime} (${confirmedBooking.durationHours} hrs)\nPlayers: ${confirmedBooking.playerCount}\nName: ${confirmedBooking.customerName}`,
                whatsappNumber
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              <span>Confirm Faster on WhatsApp</span>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => {
                setConfirmedBooking(null);
                setStep(0);
                setStartTime('');
              }}
              className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
            >
              Book Another Session
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#11151E] p-5 sm:p-8 space-y-6">
          {availabilityMode === 'enquiry_pending' && (
            <VerificationNotice message="Enquiry-Based Booking Mode [OWNER VERIFICATION REQUIRED]: Live automated slot guarantees are pending final station & schedule verification by the owner. Selecting a slot checks against saved bookings to avoid overlaps and submits your request as Pending Confirmation." />
          )}

          {/* Stepper Indicator */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 border-b border-white/10 pb-4">
            {STEPS.map((label, idx) => {
              const active = idx === step;
              const done = idx < step;
              return (
                <button
                  key={label}
                  type="button"
                  disabled={idx > step}
                  onClick={() => idx < step && setStep(idx)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
                    active
                      ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30'
                      : done
                      ? 'text-slate-200 hover:bg-white/5'
                      : 'text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="font-mono tabular-nums">0{idx + 1}.</span>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <h2 className="font-display text-xl font-semibold text-white">
                  1. Select Your Gaming Experience
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {experiences.map((exp) => {
                    const selected = exp.id === selectedExpId;
                    return (
                      <button
                        key={exp.id}
                        type="button"
                        onClick={() => setSelectedExpId(exp.id)}
                        className={`text-left rounded-xl border p-5 transition-colors ${
                          selected
                            ? 'border-cyan-400 bg-cyan-400/10'
                            : 'border-white/10 bg-[#0B0E15] hover:border-white/25'
                        }`}
                      >
                        <div className="text-xs text-slate-400">
                          {exp.category} · {exp.capacity_label}
                        </div>
                        <div className="mt-1 font-display text-lg font-semibold text-white">
                          {exp.name}
                        </div>
                        <p className="mt-2 text-sm text-slate-400 line-clamp-2">
                          {exp.description}
                        </p>
                        <div className="mt-3 text-xs font-mono text-cyan-300">
                          {exp.price_label}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!selectedExpId}
                    onClick={() => setStep(1)}
                    className="rounded-lg bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                  >
                    Continue to Date &amp; Duration
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                <h2 className="font-display text-xl font-semibold text-white">
                  2. Choose Date &amp; Session Duration
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="booking-date"
                      className="flex items-center gap-2 text-sm font-medium text-slate-200 mb-2"
                    >
                      <Calendar className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                      <span>Preferred Date</span>
                    </label>
                    <input
                      id="booking-date"
                      type="date"
                      min={todayMin}
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-3 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-200 mb-2">
                      <Clock className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                      <span>Duration (Hours)</span>
                    </span>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {[1, 2, 3, 4, 5, 6].map((hr) => (
                        <button
                          key={hr}
                          type="button"
                          onClick={() => setDurationHours(hr)}
                          className={`rounded-lg border py-2.5 text-sm font-mono tabular-nums transition-colors ${
                            durationHours === hr
                              ? 'border-cyan-400 bg-cyan-400 text-slate-950 font-semibold'
                              : 'border-white/10 bg-[#090B10] text-slate-300 hover:border-white/25'
                          }`}
                        >
                          {hr}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-slate-300 hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!bookingDate}
                    onClick={() => setStep(2)}
                    className="rounded-lg bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    View Time Slots
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-white">
                      3. Select Start Time ({bookingDate})
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {availabilityMode === 'live'
                        ? 'Real-time station availability shown below.'
                        : 'Enquiry window check — slots conflicting with existing reservations are blocked.'}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    Duration: {durationHours} hr{durationHours > 1 ? 's' : ''}
                  </span>
                </div>

                {slotsLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/5"
                      />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No time windows configured for this duration. Try reducing hours or reach out
                    on WhatsApp.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {slots.map((slot) => {
                      const active = startTime === slot.startTime;
                      return (
                        <button
                          key={slot.startTime}
                          type="button"
                          disabled={!slot.isAvailable}
                          onClick={() => setStartTime(slot.startTime)}
                          className={`rounded-xl border p-3 text-left transition-colors ${
                            !slot.isAvailable
                              ? 'border-white/5 bg-white/[0.02] text-slate-600 cursor-not-allowed'
                              : active
                              ? 'border-cyan-400 bg-cyan-400/15 text-white'
                              : 'border-white/10 bg-[#090B10] text-slate-200 hover:border-white/30'
                          }`}
                        >
                          <div className="font-mono text-sm font-semibold tabular-nums">
                            {slot.startTime} – {slot.endTime}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {!slot.isAvailable
                              ? 'Reserved / Unavailable'
                              : availabilityMode === 'live'
                              ? `${slot.availableCount} station${slot.availableCount > 1 ? 's' : ''} free`
                              : 'Open for request'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-slate-300 hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!startTime}
                    onClick={() => setStep(3)}
                    className="rounded-lg bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                  >
                    Enter Player Details
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
              >
                <h2 className="font-display text-xl font-semibold text-white">
                  4. Customer &amp; Squad Details
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cust-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      id="cust-name"
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="cust-phone" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Phone / WhatsApp Number *
                    </label>
                    <input
                      id="cust-phone"
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 9XXXXXXXXX"
                      className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="cust-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Email (Optional)
                    </label>
                    <input
                      id="cust-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="cust-players" className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                      <span>Number of Players</span>
                    </label>
                    <input
                      id="cust-players"
                      type="number"
                      min={1}
                      max={20}
                      value={playerCount}
                      onChange={(e) => setPlayerCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                      className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white font-mono tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="cust-notes" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Special Requirements (Optional)
                  </label>
                  <textarea
                    id="cust-notes"
                    rows={3}
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    placeholder="Specific games you want ready, extra controllers, birthday group notes, or cafe pre-orders..."
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-slate-300 hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={customerName.trim().length < 2 || customerPhone.replace(/\D/g, '').length < 10}
                    onClick={() => setStep(4)}
                    className="rounded-lg bg-cyan-400 px-6 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                  >
                    Review Summary
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                <h2 className="font-display text-xl font-semibold text-white">
                  5. Booking Summary &amp; Payment Option
                </h2>

                <div className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-[#090B10] p-5 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">Experience</span>
                    <p className="mt-0.5 font-semibold text-white">
                      {selectedExperience?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Date &amp; Slot</span>
                    <p className="mt-0.5 font-mono text-white tabular-nums">
                      {bookingDate} · {startTime} ({durationHours}h)
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Players</span>
                    <p className="mt-0.5 text-white tabular-nums">{playerCount} Players</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Customer</span>
                    <p className="mt-0.5 text-white">{customerName}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Phone</span>
                    <p className="mt-0.5 font-mono text-white">{customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Pricing Status</span>
                    <p className="mt-0.5 text-cyan-300">{selectedExperience?.price_label}</p>
                  </div>
                </div>

                {/* Payment Options */}
                <div className="space-y-3">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                    <CreditCard className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                    <span>Payment Method</span>
                  </span>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pay_at_venue')}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        paymentMethod === 'pay_at_venue'
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-white/10 bg-[#090B10]'
                      }`}
                    >
                      <div className="font-semibold text-white text-sm">Pay at Venue</div>
                      <p className="mt-1 text-xs text-slate-400">
                        Confirm slot now and settle payment directly at Infinity Gaming Zone &amp;
                        Cafe reception.
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={!razorpayConfigured}
                      onClick={() => razorpayConfigured && setPaymentMethod('razorpay_online')}
                      className={`rounded-xl border p-4 text-left transition-colors ${
                        !razorpayConfigured
                          ? 'border-white/5 bg-white/[0.02] opacity-60 cursor-not-allowed'
                          : paymentMethod === 'razorpay_online'
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-white/10 bg-[#090B10]'
                      }`}
                    >
                      <div className="font-semibold text-white text-sm">
                        Online Advance Payment (Razorpay)
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {razorpayConfigured
                          ? 'Pay securely online with server-verified Razorpay checkout.'
                          : 'Disabled until owner configures Razorpay API credentials [OWNER VERIFICATION REQUIRED].'}
                      </p>
                    </button>
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-lg border border-white/15 px-5 py-2.5 text-sm text-slate-300 hover:bg-white/5"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleConfirmBooking}
                    className="rounded-lg bg-cyan-400 px-7 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
                  >
                    {submitting
                      ? 'Submitting Request...'
                      : availabilityMode === 'live'
                      ? 'Confirm Booking'
                      : 'Submit Booking Request'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
