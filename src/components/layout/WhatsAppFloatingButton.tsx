import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MessageCircle, X, ExternalLink } from 'lucide-react';
import { VENUE_INFO, buildWhatsAppUrl } from '../../config/businessConfig';
import { useVenue } from '../../context/VenueContext';

export function WhatsAppFloatingButton() {
  const [open, setOpen] = useState(false);
  const { data } = useVenue();
  const whatsappNumber = data?.settings?.whatsapp_number || VENUE_INFO.whatsappNumber;

  const quickMessages = [
    {
      label: 'Gaming Sessions & Packages',
      text: 'Hello Infinity Gaming Zone! I would like to enquire about gaming sessions and available packages.',
    },
    {
      label: 'VIP Lounge / Group Booking',
      text: 'Hello Infinity Gaming Zone! I would like to check availability for a VIP lounge or group gaming session.',
    },
    {
      label: 'Tournament / Event Enquiry',
      text: 'Hello Infinity Gaming Zone! I would like to know about upcoming tournaments and event registrations.',
    },
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-72 rounded-xl border border-white/10 bg-[#11151E] p-4 shadow-2xl origin-bottom-right"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div>
                <p className="text-sm font-semibold text-white">WhatsApp Desk</p>
                <p className="text-xs text-slate-400">Choose an enquiry topic</p>
              </div>
              <button
                type="button"
                aria-label="Close WhatsApp options"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {quickMessages.map((item) => (
                <a
                  key={item.label}
                  href={buildWhatsAppUrl(item.text, whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs font-medium text-slate-200 hover:border-cyan-400/40 hover:bg-cyan-400/10 transition-colors"
                >
                  <span>{item.label}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Opens WhatsApp with a pre-filled message only when you click.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label="Open WhatsApp enquiry menu"
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg hover:bg-emerald-400"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
