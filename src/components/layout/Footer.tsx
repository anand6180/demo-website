import { Link } from 'react-router-dom';
import { MapPin, Phone, Share2, ExternalLink } from 'lucide-react';
import { VENUE_INFO, buildWhatsAppUrl } from '../../config/businessConfig';
import { useVenue } from '../../context/VenueContext';
import { useState } from 'react';

export function Footer() {
  const { data } = useVenue();
  const settings = data?.settings;
  const [copied, setCopied] = useState(false);

  const phoneDisplay = settings?.phone_display || VENUE_INFO.phoneDisplay;
  const whatsappNumber = settings?.whatsapp_number || VENUE_INFO.whatsappNumber;
  const address = settings?.address || VENUE_INFO.fullAddress;
  const hours = settings?.business_hours || 'Hours [OWNER VERIFICATION REQUIRED]';

  const handleShare = async () => {
    const shareUrl = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: VENUE_INFO.brandName,
          text: 'Check out Infinity Gaming Zone & Cafe in Bhagalpur.',
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <footer className="border-t border-white/10 bg-[#07090D] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand & Location */}
          <div className="space-y-4">
            <div className="font-display text-lg font-bold tracking-wide text-white">
              Infinity Gaming Zone &amp; Cafe
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Gaming lounge, console &amp; PC stations, and cafe hangout destination in Bhagalpur, Bihar.
            </p>
            <div className="flex items-start gap-2.5 text-sm text-slate-400">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-1" aria-hidden="true" />
              <span>{address}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <Phone className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
              <a href={`tel:${phoneDisplay.replace(/\s+/g, '')}`} className="hover:text-white">
                {phoneDisplay}
              </a>
            </div>
            <p className="text-xs text-slate-500">
              {hours}
            </p>
          </div>

          {/* Column 2: Explore */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Explore</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/about" className="hover:text-cyan-300 transition-colors">About Us</Link></li>
              <li><Link to="/experiences" className="hover:text-cyan-300 transition-colors">Gaming Experiences</Link></li>
              <li><Link to="/games" className="hover:text-cyan-300 transition-colors">Games Library</Link></li>
              <li><Link to="/pricing" className="hover:text-cyan-300 transition-colors">Pricing &amp; Packages</Link></li>
              <li><Link to="/cafe" className="hover:text-cyan-300 transition-colors">Cafe &amp; Menu</Link></li>
            </ul>
          </div>

          {/* Column 3: Community & Booking */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Sessions &amp; Events</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/book" className="hover:text-cyan-300 transition-colors">Book a Session</Link></li>
              <li><Link to="/events" className="hover:text-cyan-300 transition-colors">Events &amp; Tournaments</Link></li>
              <li><Link to="/gallery" className="hover:text-cyan-300 transition-colors">Photo Gallery</Link></li>
              <li><Link to="/contact" className="hover:text-cyan-300 transition-colors">Location &amp; Directions</Link></li>
              <li><Link to="/admin" className="hover:text-cyan-300 transition-colors">Staff &amp; Admin Portal</Link></li>
            </ul>
          </div>

          {/* Column 4: Connect & Policies */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Connect &amp; Legal</h3>
            <div className="flex flex-col gap-2 text-sm text-slate-400">
              <a
                href={buildWhatsAppUrl(
                  'Hello Infinity Gaming Zone! I would like to enquire about gaming sessions and available packages.',
                  whatsappNumber
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200"
              >
                WhatsApp Enquiry <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              <a
                href={VENUE_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-white"
              >
                Google Maps Directions <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
              {settings?.instagram_url && (
                <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Instagram
                </a>
              )}
              {settings?.facebook_url && (
                <a href={settings.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  Facebook
                </a>
              )}
              {settings?.youtube_url && (
                <a href={settings.youtube_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  YouTube
                </a>
              )}
              {!settings?.instagram_url && !settings?.facebook_url && (
                <span className="text-xs text-slate-500">
                  Social channels [OWNER VERIFICATION REQUIRED]
                </span>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-left text-slate-300 hover:text-white pt-1"
              >
                <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{copied ? 'Link copied' : 'Share this website'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Infinity Gaming Zone &amp; Cafe, Bhagalpur.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/legal#privacy" className="hover:text-slate-300">Privacy Policy</Link>
            <Link to="/legal#terms" className="hover:text-slate-300">Terms &amp; Conditions</Link>
            <Link to="/legal#cancellation" className="hover:text-slate-300">Booking &amp; Cancellation Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
