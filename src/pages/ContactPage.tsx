import React, { useState } from 'react';
import { MapPin, Phone, Clock, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { useVenue } from '../context/VenueContext';
import { VENUE_INFO, buildWhatsAppUrl } from '../config/businessConfig';

export function ContactPage() {
  const { data } = useVenue();
  const settings = data?.settings;

  const phoneDisplay = settings?.phone_display || VENUE_INFO.phoneDisplay;
  const whatsappNumber = settings?.whatsapp_number || VENUE_INFO.whatsappNumber;
  const address = settings?.address || VENUE_INFO.fullAddress;
  const hours = settings?.business_hours || 'Hours [OWNER VERIFICATION REQUIRED]';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Session & Pricing Enquiry');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, topic, message }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: json.error || 'Could not send enquiry.' });
        return;
      }
      setFeedback({
        type: 'ok',
        text: 'Thank you. Your enquiry has been logged and our team will reach out shortly.',
      });
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch {
      setFeedback({ type: 'err', text: 'Network error while sending enquiry.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
      <SeoHead
        title="Contact & Location – SM College Road, Bhagalpur | Infinity Gaming Zone"
        description="Find directions, phone number, WhatsApp desk, and business hours for Infinity Gaming Zone & Cafe at SM College Road, Choti Khanjarpur Chowk, Bhagalpur."
      />

      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium text-cyan-300">Location &amp; Contact</p>
        <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
          Visit Infinity Gaming Zone &amp; Cafe in Bhagalpur.
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Venue Info & Maps */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#11151E] p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-2xl font-bold text-white">
              Infinity Gaming Zone &amp; Cafe
            </h2>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium text-white">Address</p>
                  <p className="text-slate-400 mt-0.5">{address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium text-white">Phone &amp; WhatsApp</p>
                  <p className="text-slate-300 mt-0.5 font-mono">{phoneDisplay}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {settings?.phone_verified === 'true'
                      ? 'Owner verified contact'
                      : 'Publicly listed contact — [OWNER VERIFICATION REQUIRED]'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium text-white">Business Hours</p>
                  <p className="text-slate-400 mt-0.5">{hours}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={VENUE_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
              <a
                href={buildWhatsAppUrl(
                  'Hello Infinity Gaming Zone! I would like directions / information about visiting today.',
                  whatsappNumber
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/5"
              >
                <span>Message on WhatsApp</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#11151E]">
            <iframe
              title="Infinity Gaming Zone & Cafe Bhagalpur Map"
              src="https://maps.google.com/maps?q=INFINITY%20GAMING%20ZONE%20%26%20CAFE%20Bhagalpur%20Bihar&t=&z=16&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-72 w-full border-0"
            />
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-6">
          <div className="rounded-2xl border border-white/10 bg-[#11151E] p-6 sm:p-8 space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">Send an Enquiry</h2>
              <p className="mt-1 text-sm text-slate-400">
                Questions about group rates, private parties, tournaments, or hardware? Send a
                direct message to our desk.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    id="c-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label htmlFor="c-phone" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    id="c-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white"
                    placeholder="+91 9XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email (Optional)
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label htmlFor="c-topic" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Enquiry Topic
                  </label>
                  <select
                    id="c-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white"
                  >
                    <option value="Session & Pricing Enquiry">Session &amp; Pricing Enquiry</option>
                    <option value="VIP Lounge / Private Party">VIP Lounge / Private Party</option>
                    <option value="Group & College Event">Group &amp; College Event</option>
                    <option value="Tournament Partnership">Tournament Partnership</option>
                    <option value="General Feedback">General Feedback</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="c-msg" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Message *
                </label>
                <textarea
                  id="c-msg"
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#090B10] px-4 py-2.5 text-sm text-white"
                  placeholder="Tell us your preferred date, squad size, or question..."
                />
              </div>

              {feedback && (
                <div
                  className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
                    feedback.type === 'ok'
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
                      : 'border-rose-400/30 bg-rose-400/10 text-rose-200'
                  }`}
                >
                  {feedback.type === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-cyan-400 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
              >
                {busy ? 'Sending Enquiry...' : 'Submit Enquiry'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
