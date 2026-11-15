export interface VerifiedVenueInfo {
  brandName: string;
  shortName: string;
  tagline: string;
  addressLine: string;
  cityStatePin: string;
  fullAddress: string;
  phoneDisplay: string;
  phoneHref: string;
  phoneVerificationNote: string;
  whatsappNumber: string;
  whatsappBaseUrl: string;
  googleMapsUrl: string;
}

export const VENUE_INFO: VerifiedVenueInfo = {
  brandName: 'Infinity Gaming Zone & Cafe',
  shortName: 'INFINITY',
  tagline: 'Gaming Lounge & Cafe in Bhagalpur',
  addressLine: 'SM College Road, Choti Khanjarpur Chowk, near Galaxy Hotel',
  cityStatePin: 'Bhagalpur, Bihar 812001, India',
  fullAddress:
    'SM College Road, Choti Khanjarpur Chowk, near Galaxy Hotel, Bhagalpur, Bihar 812001, India',
  phoneDisplay: '+91 91222 80318',
  phoneHref: 'tel:+919122280318',
  phoneVerificationNote: 'Publicly listed contact — [OWNER VERIFICATION REQUIRED]',
  whatsappNumber: '919122280318',
  whatsappBaseUrl: 'https://wa.me/919122280318',
  googleMapsUrl:
    'https://www.google.com/maps/search/?api=1&query=INFINITY+GAMING+ZONE+%26+CAFE+Bhagalpur+Bihar',
};

export function buildWhatsAppUrl(message: string, phoneNumber = VENUE_INFO.whatsappNumber): string {
  const cleanDigits = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${cleanDigits}?text=${encodeURIComponent(message)}`;
}
