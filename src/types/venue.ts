export interface SiteSettings {
  business_name: string;
  phone_display: string;
  phone_verified: string;
  whatsapp_number: string;
  contact_email: string;
  address: string;
  business_hours: string;
  opening_hour_24: string;
  closing_hour_24: string;
  live_slots_enabled: string;
  promo_banner: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  google_review_url: string;
  razorpay_enabled: string;
  cancellation_policy: string;
  [key: string]: string;
}

export interface GamingExperience {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  capacity_label: string;
  price_label: string;
  supported_games_note: string;
  image_url: string;
  is_verified: number;
  is_active: number;
  station_count?: number;
  total_seats?: number;
}

export interface GamingStation {
  id: number;
  experience_id: number;
  experience_name?: string;
  name: string;
  hardware_summary: string;
  seat_capacity: number;
  hourly_rate_inr: number;
  status: 'active' | 'maintenance' | 'inactive';
  is_verified: number;
}

export interface PricingPackage {
  id: number;
  title: string;
  tier_type: string;
  target_audience: string;
  price_label: string;
  duration_label: string;
  inclusions: string;
  is_featured: number;
  is_verified: number;
  is_active: number;
}

export interface GameItem {
  id: number;
  title: string;
  platform: string;
  genre: string;
  mode: string;
  description: string;
  image_url: string;
  is_verified: number;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  description: string;
  price_label: string;
  image_url: string;
  is_available: number;
  is_verified: number;
}

export interface EventItem {
  id: number;
  title: string;
  event_type: string;
  event_date: string;
  time_label: string;
  entry_fee_label: string;
  max_participants: number;
  current_participants: number;
  rules_summary: string;
  image_url: string;
  is_verified: number;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: string;
  caption: string;
  image_url: string;
  is_verified: number;
}

export interface BootstrapPayload {
  settings: SiteSettings;
  experiences: GamingExperience[];
  packages: PricingPackage[];
  games: GameItem[];
  menuItems: MenuItem[];
  events: EventItem[];
  gallery: GalleryItem[];
  razorpayConfigured: boolean;
}

export interface TimeSlotAvailability {
  startTime: string;
  endTime: string;
  availableCount: number;
  totalStations: number;
  isAvailable: boolean;
}

export interface BookingRecord {
  id: number;
  booking_ref: string;
  experience_id: number;
  experience_name?: string;
  station_id: number | null;
  station_name?: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  end_time: string;
  player_count: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  special_requirements: string;
  payment_method: string;
  total_estimate_inr: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected';
  availability_mode: string;
  created_at: string;
}
