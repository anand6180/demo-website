import { db, initializeDatabase } from './db.ts';
import { hashPassword } from './security.ts';

const HERO_IMG = '/src/assets/images/hero_infinity_lounge_1794758886584.jpg';
const VIP_IMG = '/src/assets/images/station_console_vip_1794758885866.jpg';
const PC_IMG = '/src/assets/images/station_pc_arena_1794758887301.jpg';
const CAFE_IMG = '/src/assets/images/cafe_craft_refreshments_1794758886787.jpg';
const EVENT_IMG = '/src/assets/images/tournament_arena_event_1794758887502.jpg';

export function seedDatabaseIfEmpty(): void {
  initializeDatabase();

  // Seed default admin user if users table is empty
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount === 0) {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@infinitygamingzone.in';
    const adminPassword = process.env.ADMIN_PASSWORD || 'InfinityAdmin2026!';
    const info = db
      .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
      .run(adminEmail, 'Infinity Venue Admin', hashPassword(adminPassword));
    db.prepare('INSERT INTO admin_roles (user_id, role) VALUES (?, ?)').run(
      info.lastInsertRowid,
      'owner'
    );
  }

  // Seed default site settings
  const defaultSettings: Record<string, string> = {
    business_name: 'Infinity Gaming Zone & Cafe',
    phone_display: '+91 91222 80318',
    phone_verified: 'false',
    whatsapp_number: '919122280318',
    contact_email: '[OWNER VERIFICATION REQUIRED]',
    address: 'SM College Road, Choti Khanjarpur Chowk, near Galaxy Hotel, Bhagalpur, Bihar 812001',
    business_hours: '10:00 AM – 11:00 PM Daily [OWNER VERIFICATION REQUIRED]',
    opening_hour_24: '10',
    closing_hour_24: '23',
    live_slots_enabled: 'false',
    promo_banner: 'Group bookings & weekend lounge enquiries now open — [OWNER VERIFICATION REQUIRED]',
    instagram_url: '',
    facebook_url: '',
    youtube_url: '',
    google_review_url: '',
    razorpay_enabled: 'false',
    cancellation_policy:
      'Please inform us at least 2 hours prior to your reserved slot via phone or WhatsApp for rescheduling or cancellation. [OWNER VERIFICATION REQUIRED]',
  };

  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)'
  );
  for (const [k, v] of Object.entries(defaultSettings)) {
    insertSetting.run(k, v);
  }

  // Seed Gaming Experiences (clearly marked unverified until owner confirms specs/pricing)
  const expCount = (db.prepare('SELECT COUNT(*) as c FROM gaming_experiences').get() as { c: number }).c;
  if (expCount === 0) {
    const insertExp = db.prepare(`
      INSERT INTO gaming_experiences
      (slug, name, category, description, capacity_label, price_label, supported_games_note, image_url, is_verified, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const pcRes = insertExp.run(
      'pc-gaming-arena',
      'PC Gaming Arena',
      'PC Gaming',
      'Dedicated competitive and casual PC gaming desks built for smooth framerates, low-latency peripherals, and long squad sessions. Exact GPU, monitor refresh rate, and rig count await owner verification.',
      'Station count [OWNER VERIFICATION REQUIRED]',
      'Hourly rate [OWNER VERIFICATION REQUIRED]',
      'Competitive shooters, battle royale, and co-op PC titles [OWNER VERIFICATION REQUIRED]',
      PC_IMG,
      0,
      1
    );

    const consoleRes = insertExp.run(
      'console-playstation-zone',
      'Console & PlayStation Zone',
      'Console & PS5',
      'Big-screen lounge seating designed for head-to-head sports rivalries, story campaigns, and split-screen couch play with comfortable seating.',
      '2–4 players per station [OWNER VERIFICATION REQUIRED]',
      'Hourly rate [OWNER VERIFICATION REQUIRED]',
      'Sports, fighting, racing, and story-driven console titles [OWNER VERIFICATION REQUIRED]',
      HERO_IMG,
      0,
      2
    );

    const vipRes = insertExp.run(
      'vip-private-lounge',
      'VIP Private Lounge',
      'VIP Lounge',
      'Enclosed lounge zone tailored for birthdays, private squad nights, and uninterrupted gaming with dedicated seating and direct cafe service.',
      'Private group capacity [OWNER VERIFICATION REQUIRED]',
      'Lounge package [OWNER VERIFICATION REQUIRED]',
      'Curated console & party library [OWNER VERIFICATION REQUIRED]',
      VIP_IMG,
      0,
      3
    );

    const groupRes = insertExp.run(
      'multiplayer-group-zone',
      'Multiplayer & Group Gaming',
      'Group Gaming',
      'Side-by-side station blocks reserved together for college squads, weekend meetups, and custom mini-tournaments near SM College Road.',
      'Group block [OWNER VERIFICATION REQUIRED]',
      'Group package [OWNER VERIFICATION REQUIRED]',
      'Team tactical shooters, sports leagues & co-op [OWNER VERIFICATION REQUIRED]',
      EVENT_IMG,
      0,
      4
    );

    // Seed placeholder stations linked to experiences (clearly marked unverified)
    const insertStation = db.prepare(`
      INSERT INTO gaming_stations
      (experience_id, name, hardware_summary, seat_capacity, hourly_rate_inr, status, is_verified)
      VALUES (?, ?, ?, ?, ?, 'active', 0)
    `);

    insertStation.run(
      pcRes.lastInsertRowid,
      'PC Zone — Demo Station Block [OWNER VERIFICATION REQUIRED]',
      'Specs pending owner verification',
      5,
      0
    );
    insertStation.run(
      consoleRes.lastInsertRowid,
      'Console Lounge — Demo Bay [OWNER VERIFICATION REQUIRED]',
      'Console model & screen specs pending owner verification',
      4,
      0
    );
    insertStation.run(
      vipRes.lastInsertRowid,
      'VIP Suite — Demo Room [OWNER VERIFICATION REQUIRED]',
      'Suite specs pending owner verification',
      6,
      0
    );
    insertStation.run(
      groupRes.lastInsertRowid,
      'Group Squad Block — Demo Allocation [OWNER VERIFICATION REQUIRED]',
      'Squad configuration pending owner verification',
      10,
      0
    );
  }

  // Seed Pricing Packages (all prices marked [OWNER VERIFICATION REQUIRED])
  const pkgCount = (db.prepare('SELECT COUNT(*) as c FROM pricing_packages').get() as { c: number }).c;
  if (pkgCount === 0) {
    const insertPkg = db.prepare(`
      INSERT INTO pricing_packages
      (title, tier_type, target_audience, price_label, duration_label, inclusions, is_featured, is_verified, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?)
    `);

    insertPkg.run(
      'Standard Hourly Session',
      'Per-Hour Gaming',
      'For solo players and drop-in sessions',
      '[OWNER VERIFICATION REQUIRED]',
      'Per Hour',
      'Single station access · Headset & controller/peripherals · Cafe ordering at desk [OWNER VERIFICATION REQUIRED]',
      0,
      1
    );
    insertPkg.run(
      'Multiplayer Squad Pass',
      'Multiplayer Package',
      'For duos and 4-player console/PC squads',
      '[OWNER VERIFICATION REQUIRED]',
      '2–3 Hours',
      'Adjacent stations or multi-controller bay · Priority slot hold · Optional snack combo [OWNER VERIFICATION REQUIRED]',
      1,
      2
    );
    insertPkg.run(
      'VIP Lounge Experience',
      'VIP Lounge Package',
      'For private hangouts and celebrations',
      '[OWNER VERIFICATION REQUIRED]',
      '2–4 Hours',
      'Private seating zone · Large screen setup · Dedicated cafe service [OWNER VERIFICATION REQUIRED]',
      1,
      3
    );
    insertPkg.run(
      'Weekend & Group Block',
      'Weekend & Group Package',
      'For college groups and custom events',
      '[OWNER VERIFICATION REQUIRED]',
      'Custom Block',
      'Multi-station reservation · Bracket/match setup support · Group refreshment pricing [OWNER VERIFICATION REQUIRED]',
      0,
      4
    );
  }

  // Seed Games Library (clearly flagged as demo catalogue awaiting owner confirmation)
  const gameCount = (db.prepare('SELECT COUNT(*) as c FROM games').get() as { c: number }).c;
  if (gameCount === 0) {
    const insertGame = db.prepare(`
      INSERT INTO games (title, platform, genre, mode, description, image_url, is_verified, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 0, 1)
    `);
    insertGame.run(
      'Competitive Tactical Shooter [Demo Entry — Owner Confirmation Pending]',
      'PC',
      'Tactical FPS',
      'Multiplayer',
      'Team-based 5v5 competitive shooter slot. Confirm exact installed PC library with the venue before session.',
      PC_IMG
    );
    insertGame.run(
      'Football Career & Kick-Off [Demo Entry — Owner Confirmation Pending]',
      'PlayStation / Console',
      'Sports',
      'Multiplayer & Single-Player',
      'Local 1v1 and 2v2 couch football sessions on lounge screens. Confirm installed editions at venue.',
      HERO_IMG
    );
    insertGame.run(
      'Arcade Fighting Showdown [Demo Entry — Owner Confirmation Pending]',
      'PlayStation / Console',
      'Fighting',
      'Multiplayer',
      'Fast-paced local versus matches ideal for weekend hangouts and mini-brackets.',
      VIP_IMG
    );
    insertGame.run(
      'Open-World Action Adventure [Demo Entry — Owner Confirmation Pending]',
      'PC & Console',
      'Action Adventure',
      'Single-Player',
      'Immersive story-driven open-world campaigns with high-contrast lounge visuals.',
      HERO_IMG
    );
    insertGame.run(
      'Motorsport Circuit Racing [Demo Entry — Owner Confirmation Pending]',
      'Console & PC',
      'Racing',
      'Multiplayer & Single-Player',
      'Head-to-head time trials and split-screen track battles for groups.',
      EVENT_IMG
    );
    insertGame.run(
      'Co-Op Battle Royale & Survival [Demo Entry — Owner Confirmation Pending]',
      'PC',
      'Battle Royale',
      'Multiplayer',
      'Squad drop-ins across side-by-side PC rigs with team voice comms.',
      PC_IMG
    );
  }

  // Seed Cafe Menu (clearly flagged as [OWNER VERIFICATION REQUIRED])
  const menuCount = (db.prepare('SELECT COUNT(*) as c FROM menu_items').get() as { c: number }).c;
  if (menuCount === 0) {
    const insertMenu = db.prepare(`
      INSERT INTO menu_items (name, category, description, price_label, image_url, is_available, is_verified)
      VALUES (?, ?, ?, ?, ?, 1, 0)
    `);
    insertMenu.run(
      'Signature Iced Cold Coffee [Demo Item]',
      'Cold Beverages',
      'Chilled espresso blend served for long gaming sessions. Exact menu & price [OWNER VERIFICATION REQUIRED].',
      '[OWNER VERIFICATION REQUIRED]',
      CAFE_IMG
    );
    insertMenu.run(
      'Loaded Peri-Peri Fries [Demo Item]',
      'Quick Bites',
      'Crisp seasoned fries for squad sharing between matches. Exact menu & price [OWNER VERIFICATION REQUIRED].',
      '[OWNER VERIFICATION REQUIRED]',
      CAFE_IMG
    );
    insertMenu.run(
      'Grilled Cafe Sliders [Demo Item]',
      'Combos & Burgers',
      'Toasted brioche sliders served at your gaming lounge table. Exact menu & price [OWNER VERIFICATION REQUIRED].',
      '[OWNER VERIFICATION REQUIRED]',
      CAFE_IMG
    );
    insertMenu.run(
      'Chilled Energy & Craft Coolers [Demo Item]',
      'Refreshments',
      'Zero-spill desk beverages and citrus coolers. Exact selection & price [OWNER VERIFICATION REQUIRED].',
      '[OWNER VERIFICATION REQUIRED]',
      CAFE_IMG
    );
  }

  // Seed Events
  const eventCount = (db.prepare('SELECT COUNT(*) as c FROM events').get() as { c: number }).c;
  if (eventCount === 0) {
    const insertEvent = db.prepare(`
      INSERT INTO events
      (title, event_type, event_date, time_label, entry_fee_label, max_participants, current_participants, rules_summary, image_url, is_verified, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 0, 1)
    `);
    insertEvent.run(
      'Bhagalpur Weekend Console Cup [Enquiry Draft — Owner Confirmation Pending]',
      'Console Tournament',
      '2026-11-29',
      '4:00 PM onwards [OWNER VERIFICATION REQUIRED]',
      '[OWNER VERIFICATION REQUIRED]',
      16,
      'Knockout bracket format. Exact game title, controller rules, and prize pool are awaiting owner confirmation.',
      EVENT_IMG
    );
    insertEvent.run(
      'College Squad LAN Night [Enquiry Draft — Owner Confirmation Pending]',
      'Group Gaming Event',
      '2026-12-06',
      '6:00 PM – 10:00 PM [OWNER VERIFICATION REQUIRED]',
      '[OWNER VERIFICATION REQUIRED]',
      20,
      'Team registration for Bhagalpur student squads. Submit interest to reserve a group block.',
      PC_IMG
    );
  }

  // Seed Gallery (temporary demo photography clearly marked)
  const galleryCount = (db.prepare('SELECT COUNT(*) as c FROM gallery_items').get() as { c: number }).c;
  if (galleryCount === 0) {
    const insertGallery = db.prepare(`
      INSERT INTO gallery_items (title, category, caption, image_url, is_verified, sort_order)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
    insertGallery.run(
      'Main Gaming Floor & Cafe Counter',
      'Lounge Atmosphere',
      'Temporary concept photograph — replace with actual Infinity Gaming Zone & Cafe venue photos.',
      HERO_IMG,
      1
    );
    insertGallery.run(
      'VIP Private Console Suite',
      'VIP Lounge',
      'Temporary concept photograph — [OWNER VERIFICATION REQUIRED].',
      VIP_IMG,
      2
    );
    insertGallery.run(
      'PC Gaming Row',
      'PC Arena',
      'Temporary concept photograph — [OWNER VERIFICATION REQUIRED].',
      PC_IMG,
      3
    );
    insertGallery.run(
      'Cafe Refreshments & Sliders',
      'Cafe & Menu',
      'Temporary concept photograph — [OWNER VERIFICATION REQUIRED].',
      CAFE_IMG,
      4
    );
    insertGallery.run(
      'Tournament Competition Atmosphere',
      'Events',
      'Temporary concept photograph — [OWNER VERIFICATION REQUIRED].',
      EVENT_IMG,
      5
    );
  }
}
