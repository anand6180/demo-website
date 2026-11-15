import React, { useState } from 'react';
import { Calendar, CheckCircle2, AlertCircle, Users, ExternalLink } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { InteractiveCard, Reveal } from '../components/common/MotionPrimitives';
import { VerificationNotice } from '../components/common/VerificationNotice';
import { useVenue } from '../context/VenueContext';
import { buildWhatsAppUrl, VENUE_INFO } from '../config/businessConfig';

export function EventsPage() {
  const { data, refresh } = useVenue();
  const events = data?.events || [];
  const whatsappNumber = data?.settings?.whatsapp_number || VENUE_INFO.whatsappNumber;

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [playersCount, setPlayersCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          participantName,
          phone,
          email,
          playersCount,
          notes,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'err', text: json.error || 'Could not submit registration.' });
        return;
      }
      setStatusMsg({
        type: 'ok',
        text: `Registration received for "${json.eventTitle}". Venue staff will confirm details with you.`,
      });
      setParticipantName('');
      setPhone('');
      setEmail('');
      setNotes('');
      await refresh();
    } catch {
      setStatusMsg({ type: 'err', text: 'Network error while registering.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <SeoHead
        title="Events & Tournaments – Gaming Competitions | Infinity Bhagalpur"
        description="Discover upcoming console tournaments, group gaming nights, and community events at Infinity Gaming Zone & Cafe in Bhagalpur."
      />

      <Reveal className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-cyan-300">Events &amp; Tournaments</p>
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
          Local brackets, LAN nights, and group gaming events.
        </h1>
      </Reveal>

      <VerificationNotice message="Tournament details marked [Enquiry Draft — Owner Confirmation Pending] await final prize pool, entry fee, and schedule confirmation from the venue owner." />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Events list */}
        <div className="lg:col-span-7 space-y-6">
          {events.map((ev, idx) => {
            const active = selectedEvent?.id === ev.id;
            const remaining = Math.max(0, ev.max_participants - ev.current_participants);
            return (
              <InteractiveCard
                key={ev.id}
                delay={idx * 0.06}
                className={`group overflow-hidden rounded-2xl border transition-colors ${
                  active ? 'border-cyan-400/50 bg-[#121826]' : 'border-white/10 bg-[#11151E]'
                }`}
              >
                <div className="h-52 overflow-hidden">
                  <ImageWithFallback
                    src={ev.image_url}
                    alt={ev.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                      {ev.event_date} · {ev.time_label}
                    </span>
                    <span>{ev.event_type}</span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-white">{ev.title}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{ev.rules_summary}</p>
                  <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs">
                    <div>
                      <span className="text-slate-400">Entry Fee</span>
                      <p className="mt-0.5 font-mono text-cyan-300">{ev.entry_fee_label}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Participant Slots</span>
                      <p className="mt-0.5 font-mono text-white tabular-nums">
                        {remaining} of {ev.max_participants} remaining
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedEventId(ev.id)}
                      className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
                    >
                      {active ? 'Selected for Registration' : 'Select Event'}
                    </button>
                    <a
                      href={buildWhatsAppUrl(
                        `Hello Infinity Gaming Zone! I would like to enquire about the event: ${ev.title}.`,
                        whatsappNumber
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/5"
                    >
                      <span>WhatsApp Enquiry</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </InteractiveCard>
            );
          })}
        </div>

        {/* Registration Form */}
        <Reveal delay={0.08} className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-[#11151E] p-6 space-y-5">
            <div>
              <h2 className="font-display text-xl font-bold text-white">Event Registration</h2>
              <p className="mt-1 text-xs text-slate-400">
                Registering for:{' '}
                <strong className="text-cyan-300">
                  {selectedEvent ? selectedEvent.title : 'Select an event'}
                </strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="ev-name" className="block text-xs font-medium text-slate-300 mb-1">
                  Player / Team Name *
                </label>
                <input
                  id="ev-name"
                  type="text"
                  required
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3.5 py-2.5 text-sm text-white"
                  placeholder="Player or squad name"
                />
              </div>
              <div>
                <label htmlFor="ev-phone" className="block text-xs font-medium text-slate-300 mb-1">
                  Phone / WhatsApp Number *
                </label>
                <input
                  id="ev-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3.5 py-2.5 text-sm text-white"
                  placeholder="+91 9XXXXXXXXX"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ev-email" className="block text-xs font-medium text-slate-300 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    id="ev-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ev-players"
                    className="flex items-center gap-1 text-xs font-medium text-slate-300 mb-1"
                  >
                    <Users className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                    <span>Players</span>
                  </label>
                  <input
                    id="ev-players"
                    type="number"
                    min={1}
                    max={10}
                    value={playersCount}
                    onChange={(e) => setPlayersCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3.5 py-2.5 text-sm text-white font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="ev-notes" className="block text-xs font-medium text-slate-300 mb-1">
                  Notes / Preferred Game Title
                </label>
                <textarea
                  id="ev-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              {statusMsg && (
                <div
                  className={`flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-xs ${
                    statusMsg.type === 'ok'
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : 'border-rose-400/30 bg-rose-400/10 text-rose-200'
                  }`}
                >
                  {statusMsg.type === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy || !selectedEvent}
                className="w-full rounded-lg bg-cyan-400 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
              >
                {busy ? 'Submitting...' : 'Submit Registration'}
              </button>
            </form>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
