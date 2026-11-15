import crypto from 'node:crypto';
import express from 'express';
import { db } from './db.ts';
import {
  AuthenticatedRequest,
  createRateLimiter,
  isValidEmail,
  isValidPhone,
  parseCookieHeader,
  requireAdminAuth,
  sanitizeText,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from './security.ts';

function parseHour(timeStr: string): number {
  const match = /^(\d{2}):00$/.exec(timeStr);
  if (!match) return -1;
  const h = Number(match[1]);
  return Number.isInteger(h) && h >= 0 && h <= 23 ? h : -1;
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

function getSettingsMap(): Record<string, string> {
  const rows = db.prepare('SELECT key, value FROM site_settings').all() as Array<{
    key: string;
    value: string;
  }>;
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

function generateBookingRef(dateStr: string): string {
  const compactDate = dateStr.replace(/-/g, '');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `INF-${compactDate}-${rand}`;
}

export function createApiRouter() {
  const router = express.Router();

  const authLimiter = createRateLimiter(12, 5 * 60 * 1000);
  const writeLimiter = createRateLimiter(20, 60 * 1000);

  // ==========================================
  // PUBLIC BOOTSTRAP & CATALOGUE
  // ==========================================
  router.get('/public/bootstrap', (_req, res) => {
    try {
      const settings = getSettingsMap();
      const experiences = db
        .prepare(
          `SELECT e.*,
             (SELECT COUNT(*) FROM gaming_stations s WHERE s.experience_id = e.id AND s.status = 'active') as station_count,
             (SELECT COALESCE(SUM(s.seat_capacity), 0) FROM gaming_stations s WHERE s.experience_id = e.id AND s.status = 'active') as total_seats
           FROM gaming_experiences e
           WHERE e.is_active = 1
           ORDER BY e.sort_order ASC, e.id ASC`
        )
        .all();
      const packages = db
        .prepare('SELECT * FROM pricing_packages WHERE is_active = 1 ORDER BY sort_order ASC, id ASC')
        .all();
      const games = db.prepare('SELECT * FROM games WHERE is_active = 1 ORDER BY id ASC').all();
      const menuItems = db
        .prepare('SELECT * FROM menu_items WHERE is_available = 1 ORDER BY category ASC, id ASC')
        .all();
      const events = db
        .prepare('SELECT * FROM events WHERE is_active = 1 ORDER BY event_date ASC, id ASC')
        .all();
      const gallery = db
        .prepare('SELECT * FROM gallery_items ORDER BY sort_order ASC, id ASC')
        .all();

      const razorpayConfigured = Boolean(
        process.env.RAZORPAY_KEY_ID &&
          process.env.RAZORPAY_KEY_SECRET &&
          settings.razorpay_enabled === 'true'
      );

      res.json({
        settings,
        experiences,
        packages,
        games,
        menuItems,
        events,
        gallery,
        razorpayConfigured,
      });
    } catch (err) {
      console.error('Bootstrap error:', err);
      res.status(500).json({ error: 'Failed to load venue data.' });
    }
  });

  // ==========================================
  // REAL-TIME AVAILABILITY & BOOKING ENGINE
  // ==========================================
  router.get('/bookings/availability', (req, res) => {
    try {
      const experienceId = Number(req.query.experienceId);
      const date = sanitizeText(req.query.date, 20);
      const duration = Math.min(Math.max(Number(req.query.duration) || 1, 1), 6);

      if (!Number.isInteger(experienceId) || experienceId <= 0) {
        return res.status(400).json({ error: 'Valid experienceId is required.' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) is required.' });
      }

      const settings = getSettingsMap();
      const liveSlotsEnabled = settings.live_slots_enabled === 'true';
      const openHour = Math.min(Math.max(Number(settings.opening_hour_24) || 10, 6), 22);
      const closeHour = Math.min(Math.max(Number(settings.closing_hour_24) || 23, openHour + 1), 24);

      const stations = db
        .prepare(
          `SELECT id, name, seat_capacity, hourly_rate_inr, is_verified
           FROM gaming_stations
           WHERE experience_id = ? AND status = 'active'`
        )
        .all(experienceId) as Array<{
        id: number;
        name: string;
        seat_capacity: number;
        hourly_rate_inr: number;
        is_verified: number;
      }>;

      const existingBookings = db
        .prepare(
          `SELECT id, station_id, start_time, end_time, duration_hours, status
           FROM bookings
           WHERE experience_id = ? AND booking_date = ? AND status IN ('pending', 'confirmed')`
        )
        .all(experienceId, date) as Array<{
        id: number;
        station_id: number | null;
        start_time: string;
        end_time: string;
        duration_hours: number;
        status: string;
      }>;

      const slots = [];
      for (let h = openHour; h + duration <= closeHour; h++) {
        const slotStart = h;
        const slotEnd = h + duration;

        // Determine how many stations are free across [slotStart, slotEnd)
        let availableStations = 0;
        for (const st of stations) {
          const hasOverlap = existingBookings.some((b) => {
            if (b.station_id !== st.id) return false;
            const bStart = parseHour(b.start_time);
            const bEnd = parseHour(b.end_time);
            if (bStart < 0 || bEnd < 0) return false;
            return bStart < slotEnd && bEnd > slotStart;
          });
          if (!hasOverlap) availableStations += 1;
        }

        // Also count unassigned bookings that could consume capacity
        const unassignedOverlaps = existingBookings.filter((b) => {
          if (b.station_id !== null) return false;
          const bStart = parseHour(b.start_time);
          const bEnd = parseHour(b.end_time);
          if (bStart < 0 || bEnd < 0) return false;
          return bStart < slotEnd && bEnd > slotStart;
        }).length;

        const effectiveRemaining = Math.max(0, availableStations - unassignedOverlaps);

        slots.push({
          startTime: formatHour(slotStart),
          endTime: formatHour(slotEnd),
          availableCount: effectiveRemaining,
          totalStations: stations.length,
          isAvailable: stations.length > 0 && effectiveRemaining > 0,
        });
      }

      return res.json({
        liveSlotsEnabled,
        availabilityMode: liveSlotsEnabled ? 'live' : 'enquiry_pending',
        totalStations: stations.length,
        slots,
      });
    } catch (err) {
      console.error('Availability check error:', err);
      return res.status(500).json({ error: 'Unable to check availability right now.' });
    }
  });

  router.post('/bookings', writeLimiter, (req, res) => {
    try {
      const experienceId = Number(req.body?.experienceId);
      const bookingDate = sanitizeText(req.body?.bookingDate, 20);
      const startTime = sanitizeText(req.body?.startTime, 10);
      const durationHours = Number(req.body?.durationHours);
      const playerCount = Number(req.body?.playerCount);
      const customerName = sanitizeText(req.body?.customerName, 100);
      const customerPhone = sanitizeText(req.body?.customerPhone, 24);
      const customerEmail = sanitizeText(req.body?.customerEmail, 160);
      const specialRequirements = sanitizeText(req.body?.specialRequirements, 400);
      const paymentMethod =
        req.body?.paymentMethod === 'razorpay_online' ? 'razorpay_online' : 'pay_at_venue';

      if (!Number.isInteger(experienceId) || experienceId <= 0) {
        return res.status(400).json({ error: 'Please select a valid gaming experience.' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
        return res.status(400).json({ error: 'Please select a valid booking date.' });
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      if (bookingDate < todayStr) {
        return res.status(400).json({ error: 'Booking date cannot be in the past.' });
      }

      const startHour = parseHour(startTime);
      if (startHour < 0) {
        return res.status(400).json({ error: 'Please select a valid start time.' });
      }
      if (!Number.isInteger(durationHours) || durationHours < 1 || durationHours > 6) {
        return res.status(400).json({ error: 'Duration must be between 1 and 6 hours.' });
      }
      if (!Number.isInteger(playerCount) || playerCount < 1 || playerCount > 20) {
        return res.status(400).json({ error: 'Player count must be between 1 and 20.' });
      }
      if (customerName.length < 2) {
        return res.status(400).json({ error: 'Please enter your full name.' });
      }
      if (!isValidPhone(customerPhone)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit phone number.' });
      }
      if (!isValidEmail(customerEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      const settings = getSettingsMap();
      const openHour = Math.min(Math.max(Number(settings.opening_hour_24) || 10, 6), 22);
      const closeHour = Math.min(Math.max(Number(settings.closing_hour_24) || 23, openHour + 1), 24);
      const endHour = startHour + durationHours;

      if (startHour < openHour || endHour > closeHour) {
        return res.status(400).json({
          error: `Selected time falls outside configured hours (${formatHour(openHour)} – ${formatHour(closeHour)}).`,
        });
      }

      if (
        paymentMethod === 'razorpay_online' &&
        (!process.env.RAZORPAY_KEY_ID ||
          !process.env.RAZORPAY_KEY_SECRET ||
          settings.razorpay_enabled !== 'true')
      ) {
        return res.status(400).json({
          error: 'Online payment is not yet enabled by the venue. Please choose Pay at Venue.',
        });
      }

      const endTime = formatHour(endHour);
      const liveSlotsEnabled = settings.live_slots_enabled === 'true';

      db.exec('BEGIN IMMEDIATE');
      try {
        const exp = db
          .prepare('SELECT id, name FROM gaming_experiences WHERE id = ? AND is_active = 1')
          .get(experienceId) as { id: number; name: string } | undefined;

        if (!exp) {
          db.exec('ROLLBACK');
          return res.status(404).json({ error: 'Selected gaming experience not found.' });
        }

        const stations = db
          .prepare(
            `SELECT id, name, seat_capacity, hourly_rate_inr
             FROM gaming_stations
             WHERE experience_id = ? AND status = 'active'
             ORDER BY seat_capacity ASC, id ASC`
          )
          .all(experienceId) as Array<{
          id: number;
          name: string;
          seat_capacity: number;
          hourly_rate_inr: number;
        }>;

        if (stations.length === 0) {
          db.exec('ROLLBACK');
          return res.status(409).json({
            error: 'No stations are currently active for this experience. Please contact us on WhatsApp.',
          });
        }

        const existingBookings = db
          .prepare(
            `SELECT id, station_id, start_time, end_time
             FROM bookings
             WHERE experience_id = ? AND booking_date = ? AND status IN ('pending', 'confirmed')`
          )
          .all(experienceId, bookingDate) as Array<{
          id: number;
          station_id: number | null;
          start_time: string;
          end_time: string;
        }>;

        // Find first non-overlapping station (prefer stations with seat_capacity >= playerCount)
        const freeStations = stations.filter((st) => {
          const overlaps = existingBookings.some((b) => {
            if (b.station_id !== st.id) return false;
            const bStart = parseHour(b.start_time);
            const bEnd = parseHour(b.end_time);
            return bStart < endHour && bEnd > startHour;
          });
          return !overlaps;
        });

        const suitableStation =
          freeStations.find((s) => s.seat_capacity >= playerCount) || freeStations[0];

        if (!suitableStation) {
          db.exec('ROLLBACK');
          return res.status(409).json({
            error:
              'That time window is already booked across available stations. Please choose another time slot or message us on WhatsApp.',
          });
        }

        const bookingRef = generateBookingRef(bookingDate);
        const totalEstimate = suitableStation.hourly_rate_inr * durationHours;
        const initialStatus = 'pending';
        const availabilityMode = liveSlotsEnabled ? 'live_slot' : 'enquiry_pending';

        const insertRes = db
          .prepare(
            `INSERT INTO bookings (
              booking_ref, experience_id, station_id, booking_date, start_time,
              duration_hours, end_time, player_count, customer_name, customer_phone,
              customer_email, special_requirements, payment_method, total_estimate_inr,
              status, availability_mode
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            bookingRef,
            experienceId,
            suitableStation.id,
            bookingDate,
            startTime,
            durationHours,
            endTime,
            playerCount,
            customerName,
            customerPhone,
            customerEmail,
            specialRequirements,
            paymentMethod,
            totalEstimate,
            initialStatus,
            availabilityMode
          );

        const bookingId = Number(insertRes.lastInsertRowid);

        db.prepare(
          `INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
           VALUES (?, NULL, ?, 'customer', ?)`
        ).run(
          bookingId,
          initialStatus,
          liveSlotsEnabled
            ? 'Session slot reserved — awaiting venue confirmation.'
            : 'Enquiry-based booking submitted — awaiting owner verification & confirmation.'
        );

        db.prepare(
          `INSERT INTO payments (booking_id, provider, amount_inr, status, verified_on_server)
           VALUES (?, ?, ?, 'pending', 0)`
        ).run(bookingId, paymentMethod, totalEstimate);

        db.exec('COMMIT');

        return res.status(201).json({
          booking: {
            id: bookingId,
            bookingRef,
            experienceName: exp.name,
            stationName: suitableStation.name,
            bookingDate,
            startTime,
            endTime,
            durationHours,
            playerCount,
            customerName,
            customerPhone,
            paymentMethod,
            totalEstimateInr: totalEstimate,
            status: initialStatus,
            availabilityMode,
          },
        });
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }
    } catch (err) {
      console.error('Booking creation error:', err);
      return res.status(500).json({ error: 'Unable to submit booking. Please try again.' });
    }
  });

  // Lookup booking history by reference + phone
  router.get('/bookings/lookup', (req, res) => {
    try {
      const ref = sanitizeText(req.query.ref, 40).toUpperCase();
      const phone = sanitizeText(req.query.phone, 24).replace(/\D/g, '');
      if (!ref || phone.length < 4) {
        return res
          .status(400)
          .json({ error: 'Provide both your Booking Reference and phone number.' });
      }

      const booking = db
        .prepare(
          `SELECT b.*, e.name as experience_name, s.name as station_name
           FROM bookings b
           JOIN gaming_experiences e ON e.id = b.experience_id
           LEFT JOIN gaming_stations s ON s.id = b.station_id
           WHERE UPPER(b.booking_ref) = ?`
        )
        .get(ref) as Record<string, unknown> | undefined;

      if (!booking) {
        return res.status(404).json({ error: 'Booking reference not found.' });
      }

      const storedDigits = String(booking.customer_phone || '').replace(/\D/g, '');
      if (!storedDigits.endsWith(phone.slice(-4)) && storedDigits !== phone) {
        return res.status(403).json({ error: 'Phone number does not match this booking.' });
      }

      const history = db
        .prepare(
          'SELECT old_status, new_status, changed_by, note, created_at FROM booking_status_history WHERE booking_id = ? ORDER BY id ASC'
        )
        .all(booking.id as number);

      return res.json({ booking, history });
    } catch (err) {
      console.error('Lookup error:', err);
      return res.status(500).json({ error: 'Lookup failed.' });
    }
  });

  router.post('/bookings/cancel', writeLimiter, (req, res) => {
    try {
      const ref = sanitizeText(req.body?.bookingRef, 40).toUpperCase();
      const phone = sanitizeText(req.body?.phone, 24).replace(/\D/g, '');
      const reason = sanitizeText(req.body?.reason, 200) || 'Cancelled by customer';

      if (!ref || phone.length < 6) {
        return res.status(400).json({ error: 'Booking reference and phone number are required.' });
      }

      const booking = db
        .prepare('SELECT id, customer_phone, status FROM bookings WHERE UPPER(booking_ref) = ?')
        .get(ref) as { id: number; customer_phone: string; status: string } | undefined;

      if (!booking) {
        return res.status(404).json({ error: 'Booking reference not found.' });
      }
      const storedDigits = booking.customer_phone.replace(/\D/g, '');
      if (!storedDigits.endsWith(phone.slice(-6)) && storedDigits !== phone) {
        return res.status(403).json({ error: 'Phone verification failed.' });
      }
      if (booking.status === 'cancelled' || booking.status === 'completed') {
        return res.status(400).json({ error: `Booking is already ${booking.status}.` });
      }

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(
          `UPDATE bookings SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`
        ).run(booking.id);
        db.prepare(
          `INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
           VALUES (?, ?, 'cancelled', 'customer', ?)`
        ).run(booking.id, booking.status, reason);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      return res.json({ success: true, status: 'cancelled' });
    } catch (err) {
      console.error('Cancel booking error:', err);
      return res.status(500).json({ error: 'Failed to cancel booking.' });
    }
  });

  // ==========================================
  // EVENT REGISTRATIONS & ENQUIRIES
  // ==========================================
  router.post('/events/register', writeLimiter, (req, res) => {
    try {
      const eventId = Number(req.body?.eventId);
      const participantName = sanitizeText(req.body?.participantName, 100);
      const phone = sanitizeText(req.body?.phone, 24);
      const email = sanitizeText(req.body?.email, 160);
      const playersCount = Math.min(Math.max(Number(req.body?.playersCount) || 1, 1), 10);
      const notes = sanitizeText(req.body?.notes, 300);

      if (!Number.isInteger(eventId) || eventId <= 0) {
        return res.status(400).json({ error: 'Invalid event selected.' });
      }
      if (participantName.length < 2) {
        return res.status(400).json({ error: 'Please enter participant or team name.' });
      }
      if (!isValidPhone(phone)) {
        return res.status(400).json({ error: 'Please provide a valid phone number.' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      db.exec('BEGIN IMMEDIATE');
      try {
        const eventRow = db
          .prepare('SELECT id, title, max_participants, current_participants FROM events WHERE id = ? AND is_active = 1')
          .get(eventId) as
          | { id: number; title: string; max_participants: number; current_participants: number }
          | undefined;

        if (!eventRow) {
          db.exec('ROLLBACK');
          return res.status(404).json({ error: 'Event not found.' });
        }

        if (eventRow.current_participants + playersCount > eventRow.max_participants) {
          db.exec('ROLLBACK');
          return res.status(409).json({
            error: 'Not enough participant slots remaining for this event.',
          });
        }

        db.prepare(
          `INSERT INTO event_registrations (event_id, participant_name, phone, email, players_count, notes)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(eventId, participantName, phone, email, playersCount, notes);

        db.prepare(
          'UPDATE events SET current_participants = current_participants + ? WHERE id = ?'
        ).run(playersCount, eventId);

        db.exec('COMMIT');
        return res.status(201).json({ success: true, eventTitle: eventRow.title });
      } catch (txErr) {
        db.exec('ROLLBACK');
        throw txErr;
      }
    } catch (err) {
      console.error('Event registration error:', err);
      return res.status(500).json({ error: 'Failed to submit event registration.' });
    }
  });

  router.post('/enquiries', writeLimiter, (req, res) => {
    try {
      const name = sanitizeText(req.body?.name, 100);
      const phone = sanitizeText(req.body?.phone, 24);
      const email = sanitizeText(req.body?.email, 160);
      const topic = sanitizeText(req.body?.topic, 80) || 'General Enquiry';
      const message = sanitizeText(req.body?.message, 1000);

      if (name.length < 2) {
        return res.status(400).json({ error: 'Please enter your name.' });
      }
      if (!isValidPhone(phone)) {
        return res.status(400).json({ error: 'Please enter a valid phone number.' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Please enter a valid email.' });
      }
      if (message.length < 5) {
        return res.status(400).json({ error: 'Please include a short message.' });
      }

      db.prepare(
        `INSERT INTO customer_enquiries (name, phone, email, topic, message)
         VALUES (?, ?, ?, ?, ?)`
      ).run(name, phone, email, topic, message);

      return res.status(201).json({ success: true });
    } catch (err) {
      console.error('Enquiry error:', err);
      return res.status(500).json({ error: 'Unable to submit enquiry.' });
    }
  });

  // Razorpay Webhook verification endpoint (server-only secret)
  router.post('/payments/razorpay-webhook', (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(503).json({ error: 'Razorpay webhook secret not configured.' });
    }
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    if (!signature) {
      return res.status(400).json({ error: 'Missing Razorpay signature.' });
    }
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body || {}))
      .digest('hex');

    if (signature !== expected) {
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }
    return res.json({ received: true });
  });

  // ==========================================
  // ADMIN AUTHENTICATION
  // ==========================================
  router.post('/auth/login', authLimiter, (req, res) => {
    try {
      const email = sanitizeText(req.body?.email, 160).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = db
        .prepare(
          `SELECT u.id, u.email, u.name, u.password_hash, r.role
           FROM users u
           JOIN admin_roles r ON r.user_id = u.id
           WHERE LOWER(u.email) = ?`
        )
        .get(email) as
        | { id: number; email: string; name: string; password_hash: string; role: string }
        | undefined;

      if (!user || !verifyPassword(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = signSessionToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      res.cookie('infinity_admin_session', token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 * 12,
      });

      return res.json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Authentication failed.' });
    }
  });

  router.post('/auth/logout', (_req, res) => {
    res.clearCookie('infinity_admin_session', { path: '/' });
    return res.json({ success: true });
  });

  router.get('/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    let token: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice('Bearer '.length).trim();
    } else {
      token = parseCookieHeader(req.headers.cookie)['infinity_admin_session'];
    }
    if (!token) return res.status(401).json({ error: 'Not authenticated.' });
    const payload = verifySessionToken(token);
    if (!payload) return res.status(401).json({ error: 'Session invalid.' });
    return res.json({ user: payload });
  });

  // ==========================================
  // PROTECTED ADMIN APIs
  // ==========================================
  router.get('/admin/overview', requireAdminAuth, (_req, res) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const counts = db
        .prepare(
          `SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN booking_date >= ? AND status IN ('pending', 'confirmed') THEN 1 ELSE 0 END) as upcoming
           FROM bookings`
        )
        .get(today);
      const enquiries = db
        .prepare(
          `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as unread FROM customer_enquiries`
        )
        .get();
      const dailyReport = db
        .prepare(
          `SELECT booking_date as date, COUNT(*) as bookings,
             SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed
           FROM bookings
           GROUP BY booking_date
           ORDER BY booking_date DESC
           LIMIT 14`
        )
        .all();
      const monthlyReport = db
        .prepare(
          `SELECT substr(booking_date, 1, 7) as month, COUNT(*) as bookings,
             SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
             SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
           FROM bookings
           GROUP BY substr(booking_date, 1, 7)
           ORDER BY month DESC
           LIMIT 12`
        )
        .all();

      return res.json({ counts, enquiries, dailyReport, monthlyReport });
    } catch (err) {
      console.error('Admin overview error:', err);
      return res.status(500).json({ error: 'Failed to load admin overview.' });
    }
  });

  router.get('/admin/bookings', requireAdminAuth, (req, res) => {
    try {
      const status = sanitizeText(req.query.status, 30);
      const date = sanitizeText(req.query.date, 20);
      const q = sanitizeText(req.query.q, 80);

      let sql = `
        SELECT b.*, e.name as experience_name, s.name as station_name
        FROM bookings b
        JOIN gaming_experiences e ON e.id = b.experience_id
        LEFT JOIN gaming_stations s ON s.id = b.station_id
        WHERE 1=1
      `;
      const params: Array<string> = [];

      if (status && status !== 'all') {
        sql += ' AND b.status = ?';
        params.push(status);
      }
      if (date) {
        sql += ' AND b.booking_date = ?';
        params.push(date);
      }
      if (q) {
        sql += ' AND (b.customer_name LIKE ? OR b.customer_phone LIKE ? OR b.booking_ref LIKE ?)';
        const like = `%${q}%`;
        params.push(like, like, like);
      }
      sql += ' ORDER BY b.created_at DESC, b.id DESC LIMIT 200';

      const rows = db.prepare(sql).all(...params);
      return res.json({ bookings: rows });
    } catch (err) {
      console.error('Admin bookings error:', err);
      return res.status(500).json({ error: 'Failed to load bookings.' });
    }
  });

  router.patch('/admin/bookings/:id/status', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const newStatus = sanitizeText(req.body?.status, 30);
      const note = sanitizeText(req.body?.note, 300);

      if (!['pending', 'confirmed', 'cancelled', 'completed', 'rejected'].includes(newStatus)) {
        return res.status(400).json({ error: 'Invalid status.' });
      }

      const existing = db.prepare('SELECT id, status FROM bookings WHERE id = ?').get(id) as
        | { id: number; status: string }
        | undefined;
      if (!existing) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(
          newStatus,
          id
        );
        db.prepare(
          `INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
           VALUES (?, ?, ?, ?, ?)`
        ).run(id, existing.status, newStatus, req.adminUser?.email || 'admin', note);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }

      return res.json({ success: true });
    } catch (err) {
      console.error('Status update error:', err);
      return res.status(500).json({ error: 'Failed to update booking status.' });
    }
  });

  // Stations CRUD
  router.get('/admin/stations', requireAdminAuth, (_req, res) => {
    const stations = db
      .prepare(
        `SELECT s.*, e.name as experience_name
         FROM gaming_stations s
         JOIN gaming_experiences e ON e.id = s.experience_id
         ORDER BY s.experience_id ASC, s.id ASC`
      )
      .all();
    res.json({ stations });
  });

  router.post('/admin/stations', requireAdminAuth, (req, res) => {
    const experienceId = Number(req.body?.experience_id);
    const name = sanitizeText(req.body?.name, 120);
    const hardwareSummary = sanitizeText(req.body?.hardware_summary, 240);
    const seatCapacity = Math.max(Number(req.body?.seat_capacity) || 1, 1);
    const hourlyRateInr = Math.max(Number(req.body?.hourly_rate_inr) || 0, 0);
    const isVerified = req.body?.is_verified ? 1 : 0;

    if (!Number.isInteger(experienceId) || !name) {
      return res.status(400).json({ error: 'Experience and station name are required.' });
    }
    const info = db
      .prepare(
        `INSERT INTO gaming_stations (experience_id, name, hardware_summary, seat_capacity, hourly_rate_inr, status, is_verified)
         VALUES (?, ?, ?, ?, ?, 'active', ?)`
      )
      .run(experienceId, name, hardwareSummary, seatCapacity, hourlyRateInr, isVerified);
    return res.status(201).json({ id: info.lastInsertRowid });
  });

  router.patch('/admin/stations/:id', requireAdminAuth, (req, res) => {
    const id = Number(req.params.id);
    const name = sanitizeText(req.body?.name, 120);
    const hardwareSummary = sanitizeText(req.body?.hardware_summary, 240);
    const seatCapacity = Math.max(Number(req.body?.seat_capacity) || 1, 1);
    const hourlyRateInr = Math.max(Number(req.body?.hourly_rate_inr) || 0, 0);
    const status = ['active', 'maintenance', 'inactive'].includes(req.body?.status)
      ? req.body.status
      : 'active';
    const isVerified = req.body?.is_verified ? 1 : 0;

    db.prepare(
      `UPDATE gaming_stations
       SET name = ?, hardware_summary = ?, seat_capacity = ?, hourly_rate_inr = ?, status = ?, is_verified = ?
       WHERE id = ?`
    ).run(name, hardwareSummary, seatCapacity, hourlyRateInr, status, isVerified, id);
    return res.json({ success: true });
  });

  router.delete('/admin/stations/:id', requireAdminAuth, (req, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM gaming_stations WHERE id = ?').run(id);
    return res.json({ success: true });
  });

  // Pricing packages CRUD
  router.post('/admin/packages', requireAdminAuth, (req, res) => {
    const title = sanitizeText(req.body?.title, 120);
    const tierType = sanitizeText(req.body?.tier_type, 80);
    const targetAudience = sanitizeText(req.body?.target_audience, 140);
    const priceLabel = sanitizeText(req.body?.price_label, 80);
    const durationLabel = sanitizeText(req.body?.duration_label, 60);
    const inclusions = sanitizeText(req.body?.inclusions, 400);
    const isFeatured = req.body?.is_featured ? 1 : 0;
    const isVerified = req.body?.is_verified ? 1 : 0;
    if (!title || !priceLabel) {
      return res.status(400).json({ error: 'Title and price label are required.' });
    }
    const info = db
      .prepare(
        `INSERT INTO pricing_packages (title, tier_type, target_audience, price_label, duration_label, inclusions, is_featured, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
      )
      .run(
        title,
        tierType || 'Custom Package',
        targetAudience,
        priceLabel,
        durationLabel || 'Flexible',
        inclusions,
        isFeatured,
        isVerified
      );
    return res.status(201).json({ id: info.lastInsertRowid });
  });

  router.patch('/admin/packages/:id', requireAdminAuth, (req, res) => {
    const id = Number(req.params.id);
    const title = sanitizeText(req.body?.title, 120);
    const tierType = sanitizeText(req.body?.tier_type, 80);
    const targetAudience = sanitizeText(req.body?.target_audience, 140);
    const priceLabel = sanitizeText(req.body?.price_label, 80);
    const durationLabel = sanitizeText(req.body?.duration_label, 60);
    const inclusions = sanitizeText(req.body?.inclusions, 400);
    const isFeatured = req.body?.is_featured ? 1 : 0;
    const isVerified = req.body?.is_verified ? 1 : 0;

    db.prepare(
      `UPDATE pricing_packages
       SET title = ?, tier_type = ?, target_audience = ?, price_label = ?, duration_label = ?, inclusions = ?, is_featured = ?, is_verified = ?
       WHERE id = ?`
    ).run(
      title,
      tierType,
      targetAudience,
      priceLabel,
      durationLabel,
      inclusions,
      isFeatured,
      isVerified,
      id
    );
    return res.json({ success: true });
  });

  router.delete('/admin/packages/:id', requireAdminAuth, (req, res) => {
    db.prepare('DELETE FROM pricing_packages WHERE id = ?').run(Number(req.params.id));
    return res.json({ success: true });
  });

  // Games CRUD
  router.post('/admin/games', requireAdminAuth, (req, res) => {
    const title = sanitizeText(req.body?.title, 120);
    const platform = sanitizeText(req.body?.platform, 60) || 'PC';
    const genre = sanitizeText(req.body?.genre, 60) || 'Action';
    const mode = sanitizeText(req.body?.mode, 60) || 'Multiplayer';
    const description = sanitizeText(req.body?.description, 300);
    const imageUrl =
      sanitizeText(req.body?.image_url, 240) || '/src/assets/images/station_pc_arena_1794758887301.jpg';
    const isVerified = req.body?.is_verified ? 1 : 0;
    if (!title) return res.status(400).json({ error: 'Game title is required.' });
    const info = db
      .prepare(
        'INSERT INTO games (title, platform, genre, mode, description, image_url, is_verified, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
      )
      .run(title, platform, genre, mode, description, imageUrl, isVerified);
    return res.status(201).json({ id: info.lastInsertRowid });
  });

  router.delete('/admin/games/:id', requireAdminAuth, (req, res) => {
    db.prepare('DELETE FROM games WHERE id = ?').run(Number(req.params.id));
    return res.json({ success: true });
  });

  // Menu CRUD
  router.post('/admin/menu', requireAdminAuth, (req, res) => {
    const name = sanitizeText(req.body?.name, 120);
    const category = sanitizeText(req.body?.category, 60) || 'Refreshments';
    const description = sanitizeText(req.body?.description, 300);
    const priceLabel = sanitizeText(req.body?.price_label, 60);
    const imageUrl =
      sanitizeText(req.body?.image_url, 240) ||
      '/src/assets/images/cafe_craft_refreshments_1794758886787.jpg';
    const isVerified = req.body?.is_verified ? 1 : 0;
    if (!name || !priceLabel) return res.status(400).json({ error: 'Name and price are required.' });
    const info = db
      .prepare(
        'INSERT INTO menu_items (name, category, description, price_label, image_url, is_available, is_verified) VALUES (?, ?, ?, ?, ?, 1, ?)'
      )
      .run(name, category, description, priceLabel, imageUrl, isVerified);
    return res.status(201).json({ id: info.lastInsertRowid });
  });

  router.delete('/admin/menu/:id', requireAdminAuth, (req, res) => {
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(Number(req.params.id));
    return res.json({ success: true });
  });

  // Events CRUD & registrations
  router.post('/admin/events', requireAdminAuth, (req, res) => {
    const title = sanitizeText(req.body?.title, 140);
    const eventType = sanitizeText(req.body?.event_type, 80) || 'Tournament';
    const eventDate = sanitizeText(req.body?.event_date, 20) || '2026-12-15';
    const timeLabel = sanitizeText(req.body?.time_label, 80) || '5:00 PM';
    const entryFeeLabel = sanitizeText(req.body?.entry_fee_label, 80) || '[OWNER VERIFICATION REQUIRED]';
    const maxParticipants = Math.max(Number(req.body?.max_participants) || 16, 2);
    const rulesSummary = sanitizeText(req.body?.rules_summary, 400);
    const imageUrl =
      sanitizeText(req.body?.image_url, 240) ||
      '/src/assets/images/tournament_arena_event_1794758887502.jpg';
    const isVerified = req.body?.is_verified ? 1 : 0;
    if (!title) return res.status(400).json({ error: 'Event title is required.' });
    const info = db
      .prepare(
        `INSERT INTO events (title, event_type, event_date, time_label, entry_fee_label, max_participants, current_participants, rules_summary, image_url, is_verified, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 1)`
      )
      .run(
        title,
        eventType,
        eventDate,
        timeLabel,
        entryFeeLabel,
        maxParticipants,
        rulesSummary,
        imageUrl,
        isVerified
      );
    return res.status(201).json({ id: info.lastInsertRowid });
  });

  router.delete('/admin/events/:id', requireAdminAuth, (req, res) => {
    db.prepare('DELETE FROM events WHERE id = ?').run(Number(req.params.id));
    return res.json({ success: true });
  });

  router.get('/admin/events/:id/registrations', requireAdminAuth, (req, res) => {
    const rows = db
      .prepare('SELECT * FROM event_registrations WHERE event_id = ? ORDER BY created_at DESC')
      .all(Number(req.params.id));
    return res.json({ registrations: rows });
  });

  // Gallery CRUD
  router.post('/admin/gallery', requireAdminAuth, (req, res) => {
    const title = sanitizeText(req.body?.title, 120);
    const category = sanitizeText(req.body?.category, 60) || 'Lounge Atmosphere';
    const caption = sanitizeText(req.body?.caption, 240);
    const imageUrl = sanitizeText(req.body?.image_url, 300);
    const isVerified = req.body?.is_verified ? 1 : 0;
    if (!title || !imageUrl) return res.status(400).json({ error: 'Title and image URL required.' });
    const info = db
      .prepare(
        'INSERT INTO gallery_items (title, category, caption, image_url, is_verified, sort_order) VALUES (?, ?, ?, ?, ?, 10)'
      )
      .run(title, category, caption, imageUrl, isVerified);
    return res.status(201).json({ id: info.lastInsertRowid });
  });

  router.delete('/admin/gallery/:id', requireAdminAuth, (req, res) => {
    db.prepare('DELETE FROM gallery_items WHERE id = ?').run(Number(req.params.id));
    return res.json({ success: true });
  });

  // Customer Enquiries
  router.get('/admin/enquiries', requireAdminAuth, (_req, res) => {
    const enquiries = db
      .prepare('SELECT * FROM customer_enquiries ORDER BY created_at DESC, id DESC LIMIT 100')
      .all();
    res.json({ enquiries });
  });

  router.patch('/admin/enquiries/:id', requireAdminAuth, (req, res) => {
    const status = sanitizeText(req.body?.status, 30);
    if (!['new', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    db.prepare('UPDATE customer_enquiries SET status = ? WHERE id = ?').run(
      status,
      Number(req.params.id)
    );
    return res.json({ success: true });
  });

  // Site Settings
  router.put('/admin/settings', requireAdminAuth, (req, res) => {
    const updates = req.body?.settings;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload.' });
    }
    const allowedKeys = new Set([
      'business_hours',
      'opening_hour_24',
      'closing_hour_24',
      'live_slots_enabled',
      'phone_display',
      'phone_verified',
      'whatsapp_number',
      'contact_email',
      'promo_banner',
      'instagram_url',
      'facebook_url',
      'youtube_url',
      'google_review_url',
      'razorpay_enabled',
      'cancellation_policy',
    ]);
    const upsert = db.prepare(
      `INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    );
    for (const [k, v] of Object.entries(updates)) {
      if (allowedKeys.has(k) && typeof v === 'string') {
        upsert.run(k, sanitizeText(v, 400));
      }
    }
    return res.json({ success: true, settings: getSettingsMap() });
  });

  return router;
}
