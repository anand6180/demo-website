import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarCheck,
  Gamepad2,
  LogOut,
  MessageSquare,
  Monitor,
  Settings,
  Tag,
  Trash2,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { useAuth } from '../context/AuthContext';
import { useVenue } from '../context/VenueContext';
import type { BookingRecord, GamingStation } from '../types/venue';

type AdminTab =
  | 'overview'
  | 'bookings'
  | 'stations'
  | 'pricing'
  | 'content'
  | 'enquiries'
  | 'settings';

export function AdminDashboardPage() {
  const { user, loading: authLoading, login, logout, authFetch } = useAuth();
  const { data: venueData, refresh: refreshVenue } = useVenue();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<{
    counts: Record<string, number>;
    enquiries: Record<string, number>;
    dailyReport: Array<{ date: string; bookings: number; confirmed: number }>;
    monthlyReport: Array<{ month: string; bookings: number; confirmed: number; cancelled: number }>;
  } | null>(null);

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingDateFilter, setBookingDateFilter] = useState('');

  const [stations, setStations] = useState<GamingStation[]>([]);
  const [enquiries, setEnquiries] = useState<
    Array<{
      id: number;
      name: string;
      phone: string;
      email: string;
      topic: string;
      message: string;
      status: string;
      created_at: string;
    }>
  >([]);

  const [settingsDraft, setSettingsDraft] = useState<Record<string, string>>({});
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Add Station Form
  const [newStation, setNewStation] = useState({
    experience_id: 1,
    name: '',
    hardware_summary: '',
    seat_capacity: 2,
    hourly_rate_inr: 150,
    is_verified: true,
  });

  // Add Package Form
  const [newPkg, setNewPkg] = useState({
    title: '',
    tier_type: 'Per-Hour Gaming',
    target_audience: '',
    price_label: '',
    duration_label: '1 Hour',
    inclusions: '',
    is_verified: true,
  });

  // Content Sub-tab
  const [contentSub, setContentSub] = useState<'games' | 'menu' | 'events' | 'gallery'>('games');
  const [newGame, setNewGame] = useState({
    title: '',
    platform: 'PC',
    genre: 'Action',
    mode: 'Multiplayer',
    description: '',
    is_verified: true,
  });
  const [newMenu, setNewMenu] = useState({
    name: '',
    category: 'Refreshments',
    price_label: '',
    description: '',
    is_verified: true,
  });
  const [newEvent, setNewEvent] = useState({
    title: '',
    event_type: 'Console Tournament',
    event_date: '2026-12-15',
    time_label: '5:00 PM',
    entry_fee_label: '',
    max_participants: 16,
    rules_summary: '',
    is_verified: true,
  });
  const [newGallery, setNewGallery] = useState({
    title: '',
    category: 'Lounge Atmosphere',
    caption: '',
    image_url: '',
    is_verified: true,
  });

  const loadAdminData = useCallback(async () => {
    if (!user) return;
    try {
      const [ovRes, bkRes, stRes, enqRes] = await Promise.all([
        authFetch('/api/admin/overview'),
        authFetch(
          `/api/admin/bookings?status=${encodeURIComponent(
            bookingStatusFilter
          )}&date=${encodeURIComponent(bookingDateFilter)}&q=${encodeURIComponent(bookingSearch)}`
        ),
        authFetch('/api/admin/stations'),
        authFetch('/api/admin/enquiries'),
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (bkRes.ok) setBookings((await bkRes.json()).bookings || []);
      if (stRes.ok) setStations((await stRes.json()).stations || []);
      if (enqRes.ok) setEnquiries((await enqRes.json()).enquiries || []);
    } catch (e) {
      console.error('Admin fetch failed:', e);
    }
  }, [user, authFetch, bookingStatusFilter, bookingDateFilter, bookingSearch]);

  useEffect(() => {
    if (user) {
      void loadAdminData();
    }
  }, [user, loadAdminData]);

  useEffect(() => {
    if (venueData?.settings) {
      setSettingsDraft({ ...venueData.settings });
    }
    if (venueData?.experiences?.length && newStation.experience_id === 1) {
      setNewStation((prev) => ({ ...prev, experience_id: venueData.experiences[0].id }));
    }
  }, [venueData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginBusy(true);
    const result = await login(email, password);
    setLoginBusy(false);
    if (!result.ok) {
      setLoginError(result.error || 'Invalid credentials.');
    }
  };

  const updateBookingStatus = async (id: number, status: string) => {
    await authFetch(`/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note: `Updated to ${status} by admin` }),
    });
    await loadAdminData();
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStation),
    });
    if (res.ok) {
      setNewStation((p) => ({ ...p, name: '', hardware_summary: '' }));
      await loadAdminData();
      await refreshVenue();
    }
  };

  const handleDeleteStation = async (id: number) => {
    await authFetch(`/api/admin/stations/${id}`, { method: 'DELETE' });
    await loadAdminData();
    await refreshVenue();
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch('/api/admin/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPkg),
    });
    if (res.ok) {
      setNewPkg({
        title: '',
        tier_type: 'Per-Hour Gaming',
        target_audience: '',
        price_label: '',
        duration_label: '1 Hour',
        inclusions: '',
        is_verified: true,
      });
      await refreshVenue();
    }
  };

  const handleDeleteEntity = async (endpoint: string) => {
    await authFetch(endpoint, { method: 'DELETE' });
    await refreshVenue();
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contentSub === 'games') {
      const res = await authFetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGame),
      });
      if (res.ok) {
        setNewGame({ ...newGame, title: '', description: '' });
        await refreshVenue();
      }
    } else if (contentSub === 'menu') {
      const res = await authFetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMenu),
      });
      if (res.ok) {
        setNewMenu({ ...newMenu, name: '', price_label: '', description: '' });
        await refreshVenue();
      }
    } else if (contentSub === 'events') {
      const res = await authFetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      if (res.ok) {
        setNewEvent({ ...newEvent, title: '', entry_fee_label: '', rules_summary: '' });
        await refreshVenue();
      }
    } else if (contentSub === 'gallery') {
      const res = await authFetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGallery),
      });
      if (res.ok) {
        setNewGallery({ ...newGallery, title: '', caption: '', image_url: '' });
        await refreshVenue();
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback(null);
    const res = await authFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: settingsDraft }),
    });
    if (res.ok) {
      setSaveFeedback('Settings saved and published.');
      await refreshVenue();
    } else {
      setSaveFeedback('Failed to save settings.');
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-slate-400">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <SeoHead
          title="Admin Portal Login | Infinity Gaming Zone & Cafe"
          description="Protected staff and owner administration portal for Infinity Gaming Zone & Cafe."
        />
        <div className="rounded-2xl border border-white/10 bg-[#11151E] p-7 space-y-6">
          <div>
            <p className="text-xs font-medium text-cyan-300">Restricted Access</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white">
              Infinity Admin Portal
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">
              Sign in with your configured owner or manager credentials (default seeded email:{' '}
              <span className="font-mono text-slate-300">admin@infinitygamingzone.in</span>).
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="adm-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Admin Email
              </label>
              <input
                id="adm-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3.5 py-2.5 text-sm text-white"
                placeholder="admin@infinitygamingzone.in"
              />
            </div>
            <div>
              <label htmlFor="adm-pass" className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="adm-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3.5 py-2.5 text-sm text-white"
              />
            </div>
            {loginError && <p className="text-xs text-rose-300">{loginError}</p>}
            <button
              type="submit"
              disabled={loginBusy}
              className="w-full rounded-lg bg-cyan-400 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            >
              {loginBusy ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview & Reports', icon: BarChart3 },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
    { id: 'stations', label: 'Stations', icon: Monitor },
    { id: 'pricing', label: 'Pricing & Packages', icon: Tag },
    { id: 'content', label: 'Games, Menu & Events', icon: Gamepad2 },
    { id: 'enquiries', label: 'Enquiries', icon: MessageSquare },
    { id: 'settings', label: 'Venue Settings', icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SeoHead
        title="Admin Dashboard | Infinity Gaming Zone & Cafe"
        description="Manage bookings, gaming stations, pricing packages, games, menu items, events, and venue settings."
      />

      {/* Top Admin Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs text-slate-400">
            Admin Console · {user.name} ({user.role})
          </p>
          <h1 className="font-display text-2xl font-bold text-white">
            Infinity Venue Management
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/5"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="lg:col-span-3 space-y-1">
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/30'
                      : 'text-slate-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Workspace */}
        <div className="lg:col-span-9 space-y-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { label: 'Total Bookings', value: overview?.counts?.total || 0 },
                  { label: 'Pending', value: overview?.counts?.pending || 0 },
                  { label: 'Confirmed', value: overview?.counts?.confirmed || 0 },
                  { label: 'Cancelled', value: overview?.counts?.cancelled || 0 },
                  { label: 'Upcoming', value: overview?.counts?.upcoming || 0 },
                  { label: 'New Enquiries', value: overview?.enquiries?.unread || 0 },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-white/10 bg-[#11151E] p-4"
                  >
                    <p className="text-xs text-slate-400">{stat.label}</p>
                    <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#11151E] p-5">
                  <h2 className="font-display text-base font-semibold text-white mb-4">
                    Daily Booking Report (Recent)
                  </h2>
                  {overview?.dailyReport?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 text-slate-400">
                          <tr>
                            <th className="py-2">Date</th>
                            <th className="py-2 text-right">Total</th>
                            <th className="py-2 text-right">Confirmed</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono tabular-nums">
                          {overview.dailyReport.map((r) => (
                            <tr key={r.date}>
                              <td className="py-2 text-slate-200">{r.date}</td>
                              <td className="py-2 text-right text-white">{r.bookings}</td>
                              <td className="py-2 text-right text-cyan-300">{r.confirmed}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No bookings recorded yet.</p>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-[#11151E] p-5">
                  <h2 className="font-display text-base font-semibold text-white mb-4">
                    Monthly Booking Report
                  </h2>
                  {overview?.monthlyReport?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-white/10 text-slate-400">
                          <tr>
                            <th className="py-2">Month</th>
                            <th className="py-2 text-right">Total</th>
                            <th className="py-2 text-right">Confirmed</th>
                            <th className="py-2 text-right">Cancelled</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono tabular-nums">
                          {overview.monthlyReport.map((r) => (
                            <tr key={r.month}>
                              <td className="py-2 text-slate-200">{r.month}</td>
                              <td className="py-2 text-right text-white">{r.bookings}</td>
                              <td className="py-2 text-right text-cyan-300">{r.confirmed}</td>
                              <td className="py-2 text-right text-rose-300">{r.cancelled}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No monthly statistics yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'bookings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl border border-white/10 bg-[#11151E] p-4">
                <input
                  type="search"
                  placeholder="Search ref, name, phone..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                />
                <input
                  type="date"
                  value={bookingDateFilter}
                  onChange={(e) => setBookingDateFilter(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white font-mono"
                />
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#11151E] overflow-x-auto">
                {bookings.length === 0 ? (
                  <p className="p-8 text-center text-sm text-slate-400">
                    No bookings match the current filters.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 text-slate-400">
                      <tr>
                        <th className="p-3">Ref</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Experience &amp; Slot</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-mono text-cyan-300 whitespace-nowrap">
                            {b.booking_ref}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-white">{b.customer_name}</div>
                            <div className="text-slate-400 font-mono">{b.customer_phone}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-white">{b.experience_name}</div>
                            <div className="text-slate-400 font-mono tabular-nums">
                              {b.booking_date} · {b.start_time}–{b.end_time} ({b.player_count}p)
                            </div>
                          </td>
                          <td className="p-3 capitalize font-medium text-white">{b.status}</td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {b.status === 'pending' && (
                                <button
                                  type="button"
                                  title="Confirm Booking"
                                  onClick={() => void updateBookingStatus(b.id, 'confirmed')}
                                  className="rounded-md bg-emerald-500/20 p-1.5 text-emerald-300 hover:bg-emerald-500/30"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {b.status === 'confirmed' && (
                                <button
                                  type="button"
                                  onClick={() => void updateBookingStatus(b.id, 'completed')}
                                  className="rounded-md bg-cyan-500/20 px-2 py-1 text-[11px] text-cyan-300 hover:bg-cyan-500/30"
                                >
                                  Complete
                                </button>
                              )}
                              {['pending', 'confirmed'].includes(b.status) && (
                                <button
                                  type="button"
                                  title="Cancel Booking"
                                  onClick={() => void updateBookingStatus(b.id, 'cancelled')}
                                  className="rounded-md bg-rose-500/20 p-1.5 text-rose-300 hover:bg-rose-500/30"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {tab === 'stations' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreateStation}
                className="rounded-xl border border-white/10 bg-[#11151E] p-5 space-y-4"
              >
                <h2 className="font-display text-base font-semibold text-white">
                  Add Gaming Station
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <select
                    value={newStation.experience_id}
                    onChange={(e) =>
                      setNewStation({ ...newStation, experience_id: Number(e.target.value) })
                    }
                    className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                  >
                    {(venueData?.experiences || []).map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="Station Name (e.g. PS5 Bay 1)"
                    value={newStation.name}
                    onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                    className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Hardware Summary"
                    value={newStation.hardware_summary}
                    onChange={(e) =>
                      setNewStation({ ...newStation, hardware_summary: e.target.value })
                    }
                    className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Seat Capacity"
                    value={newStation.seat_capacity}
                    onChange={(e) =>
                      setNewStation({ ...newStation, seat_capacity: Number(e.target.value) || 1 })
                    }
                    className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white font-mono"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Hourly Rate (INR)"
                    value={newStation.hourly_rate_inr}
                    onChange={(e) =>
                      setNewStation({
                        ...newStation,
                        hourly_rate_inr: Number(e.target.value) || 0,
                      })
                    }
                    className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Station</span>
                  </button>
                </div>
              </form>

              <div className="rounded-xl border border-white/10 bg-[#11151E] overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 text-slate-400">
                    <tr>
                      <th className="p-3">Station</th>
                      <th className="p-3">Experience</th>
                      <th className="p-3">Seats</th>
                      <th className="p-3">Rate (INR/hr)</th>
                      <th className="p-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stations.map((s) => (
                      <tr key={s.id}>
                        <td className="p-3">
                          <div className="font-medium text-white">{s.name}</div>
                          <div className="text-slate-400">{s.hardware_summary}</div>
                        </td>
                        <td className="p-3 text-slate-300">{s.experience_name}</td>
                        <td className="p-3 font-mono tabular-nums text-white">{s.seat_capacity}</td>
                        <td className="p-3 font-mono tabular-nums text-cyan-300">
                          {s.hourly_rate_inr > 0 ? `INR ${s.hourly_rate_inr}` : 'Unverified'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleDeleteStation(s.id)}
                            className="rounded-md p-1.5 text-rose-300 hover:bg-rose-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'pricing' && (
            <div className="space-y-6">
              <form
                onSubmit={handleCreatePackage}
                className="rounded-xl border border-white/10 bg-[#11151E] p-5 space-y-4"
              >
                <h2 className="font-display text-base font-semibold text-white">
                  Add Pricing Package or Offer
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    placeholder="Package Title"
                    value={newPkg.title}
                    onChange={(e) => setNewPkg({ ...newPkg, title: e.target.value })}
                    className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Price Label (e.g. INR 150 / hr)"
                    value={newPkg.price_label}
                    onChange={(e) => setNewPkg({ ...newPkg, price_label: e.target.value })}
                    className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Category (e.g. Weekend Package)"
                    value={newPkg.tier_type}
                    onChange={(e) => setNewPkg({ ...newPkg, tier_type: e.target.value })}
                    className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Duration (e.g. 3 Hours)"
                    value={newPkg.duration_label}
                    onChange={(e) => setNewPkg({ ...newPkg, duration_label: e.target.value })}
                    className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Inclusions summary"
                  value={newPkg.inclusions}
                  onChange={(e) => setNewPkg({ ...newPkg, inclusions: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  Publish Package
                </button>
              </form>

              <div className="space-y-3">
                {(venueData?.packages || []).map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#11151E] p-4 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white">{pkg.title}</div>
                      <div className="text-slate-400">
                        {pkg.tier_type} · {pkg.price_label} · {pkg.duration_label}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteEntity(`/api/admin/packages/${pkg.id}`)}
                      className="rounded-md p-1.5 text-rose-300 hover:bg-rose-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'content' && (
            <div className="space-y-6">
              <div className="inline-flex rounded-xl border border-white/10 bg-[#11151E] p-1">
                {(['games', 'menu', 'events', 'gallery'] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setContentSub(sub)}
                    className={`rounded-lg px-4 py-2 text-xs font-medium capitalize ${
                      contentSub === sub
                        ? 'bg-cyan-400 text-slate-950'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              <form
                onSubmit={handleCreateContent}
                className="rounded-xl border border-white/10 bg-[#11151E] p-5 space-y-4"
              >
                <h2 className="font-display text-base font-semibold text-white capitalize">
                  Add New {contentSub} Item
                </h2>

                {contentSub === 'games' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      required
                      placeholder="Game Title"
                      value={newGame.title}
                      onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      placeholder="Platform (PC / PS5)"
                      value={newGame.platform}
                      onChange={(e) => setNewGame({ ...newGame, platform: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      placeholder="Genre"
                      value={newGame.genre}
                      onChange={(e) => setNewGame({ ...newGame, genre: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      placeholder="Mode (Multiplayer / Single-Player)"
                      value={newGame.mode}
                      onChange={(e) => setNewGame({ ...newGame, mode: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      placeholder="Short Description"
                      value={newGame.description}
                      onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                      className="sm:col-span-2 rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                  </div>
                )}

                {contentSub === 'menu' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      required
                      placeholder="Item Name"
                      value={newMenu.name}
                      onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      required
                      placeholder="Price (e.g. INR 90)"
                      value={newMenu.price_label}
                      onChange={(e) => setNewMenu({ ...newMenu, price_label: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      placeholder="Category"
                      value={newMenu.category}
                      onChange={(e) => setNewMenu({ ...newMenu, category: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      placeholder="Description"
                      value={newMenu.description}
                      onChange={(e) => setNewMenu({ ...newMenu, description: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                  </div>
                )}

                {contentSub === 'events' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      required
                      placeholder="Event / Tournament Title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="date"
                      value={newEvent.event_date}
                      onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white font-mono"
                    />
                    <input
                      placeholder="Entry Fee Label"
                      value={newEvent.entry_fee_label}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, entry_fee_label: e.target.value })
                      }
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="number"
                      min={2}
                      placeholder="Max Participants"
                      value={newEvent.max_participants}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          max_participants: Number(e.target.value) || 16,
                        })
                      }
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white font-mono"
                    />
                    <input
                      placeholder="Rules Summary"
                      value={newEvent.rules_summary}
                      onChange={(e) => setNewEvent({ ...newEvent, rules_summary: e.target.value })}
                      className="sm:col-span-2 rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                  </div>
                )}

                {contentSub === 'gallery' && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      required
                      placeholder="Photo Title"
                      value={newGallery.title}
                      onChange={(e) => setNewGallery({ ...newGallery, title: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      required
                      placeholder="Image URL"
                      value={newGallery.image_url}
                      onChange={(e) => setNewGallery({ ...newGallery, image_url: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      placeholder="Category"
                      value={newGallery.category}
                      onChange={(e) => setNewGallery({ ...newGallery, category: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                    <input
                      placeholder="Caption"
                      value={newGallery.caption}
                      onChange={(e) => setNewGallery({ ...newGallery, caption: e.target.value })}
                      className="rounded-lg border border-white/10 bg-[#090B10] px-3 py-2 text-xs text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  Add Item
                </button>
              </form>

              <div className="space-y-2">
                {contentSub === 'games' &&
                  (venueData?.games || []).map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#11151E] p-3.5 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{g.title}</span>{' '}
                        <span className="text-slate-400">({g.platform} · {g.mode})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteEntity(`/api/admin/games/${g.id}`)}
                        className="text-rose-300 p-1 hover:bg-rose-400/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                {contentSub === 'menu' &&
                  (venueData?.menuItems || []).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#11151E] p-3.5 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{m.name}</span>{' '}
                        <span className="text-cyan-300 font-mono">{m.price_label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteEntity(`/api/admin/menu/${m.id}`)}
                        className="text-rose-300 p-1 hover:bg-rose-400/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                {contentSub === 'events' &&
                  (venueData?.events || []).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#11151E] p-3.5 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{ev.title}</span>{' '}
                        <span className="text-slate-400 font-mono tabular-nums">
                          {ev.event_date} · {ev.current_participants}/{ev.max_participants}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteEntity(`/api/admin/events/${ev.id}`)}
                        className="text-rose-300 p-1 hover:bg-rose-400/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                {contentSub === 'gallery' &&
                  (venueData?.gallery || []).map((gl) => (
                    <div
                      key={gl.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#11151E] p-3.5 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white">{gl.title}</span>{' '}
                        <span className="text-slate-400">{gl.category}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleDeleteEntity(`/api/admin/gallery/${gl.id}`)}
                        className="text-rose-300 p-1 hover:bg-rose-400/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {tab === 'enquiries' && (
            <div className="space-y-3">
              {enquiries.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-[#11151E] p-8 text-center text-sm text-slate-400">
                  No customer enquiries received yet.
                </div>
              ) : (
                enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className="rounded-xl border border-white/10 bg-[#11151E] p-5 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <strong className="text-sm text-white">{enq.name}</strong>{' '}
                        <span className="font-mono text-cyan-300">· {enq.phone}</span>{' '}
                        <span className="text-slate-400">· {enq.topic}</span>
                      </div>
                      <select
                        value={enq.status}
                        onChange={async (e) => {
                          await authFetch(`/api/admin/enquiries/${enq.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: e.target.value }),
                          });
                          await loadAdminData();
                        }}
                        className="rounded-lg border border-white/10 bg-[#090B10] px-2.5 py-1 text-xs text-white"
                      >
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{enq.message}</p>
                    <p className="font-mono text-[11px] text-slate-500">{enq.created_at}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'settings' && (
            <form
              onSubmit={handleSaveSettings}
              className="rounded-xl border border-white/10 bg-[#11151E] p-6 space-y-5"
            >
              <h2 className="font-display text-lg font-semibold text-white">
                Venue Configuration &amp; Verification Controls
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Booking Availability Mode</label>
                  <select
                    value={settingsDraft.live_slots_enabled || 'false'}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, live_slots_enabled: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white"
                  >
                    <option value="false">Enquiry Mode (Confirmation Pending)</option>
                    <option value="true">Live Real-Time Slot Mode</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Phone Verification Status</label>
                  <select
                    value={settingsDraft.phone_verified || 'false'}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, phone_verified: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white"
                  >
                    <option value="false">Pending Owner Confirmation</option>
                    <option value="true">Verified by Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Business Hours Label</label>
                  <input
                    type="text"
                    value={settingsDraft.business_hours || ''}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, business_hours: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Contact Phone Display</label>
                  <input
                    type="text"
                    value={settingsDraft.phone_display || ''}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, phone_display: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Opening Hour (24h)</label>
                  <input
                    type="number"
                    min={6}
                    max={22}
                    value={settingsDraft.opening_hour_24 || '10'}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, opening_hour_24: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Closing Hour (24h)</label>
                  <input
                    type="number"
                    min={12}
                    max={24}
                    value={settingsDraft.closing_hour_24 || '23'}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, closing_hour_24: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 mb-1">Promotional Banner Text</label>
                  <input
                    type="text"
                    value={settingsDraft.promo_banner || ''}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, promo_banner: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Instagram URL</label>
                  <input
                    type="url"
                    value={settingsDraft.instagram_url || ''}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, instagram_url: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Facebook URL</label>
                  <input
                    type="url"
                    value={settingsDraft.facebook_url || ''}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, facebook_url: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Google Business Review URL</label>
                  <input
                    type="url"
                    value={settingsDraft.google_review_url || ''}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, google_review_url: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">YouTube URL</label>
                  <input
                    type="url"
                    value={settingsDraft.youtube_url || ''}
                    onChange={(e) =>
                      setSettingsDraft({ ...settingsDraft, youtube_url: e.target.value })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#090B10] px-3 py-2.5 text-white"
                  />
                </div>
              </div>

              {saveFeedback && <p className="text-xs text-cyan-300">{saveFeedback}</p>}

              <button
                type="submit"
                className="rounded-lg bg-cyan-400 px-6 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Save Venue Settings
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
