
import { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import {
  AnimatePresence,
  MotionConfig,
  motion,
} from 'motion/react';

import { VenueProvider } from './context/VenueContext';
import { AuthProvider } from './context/AuthContext';

import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { WhatsAppFloatingButton } from './components/layout/WhatsAppFloatingButton';

import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ExperiencesPage } from './pages/ExperiencesPage';
import { GamesLibraryPage } from './pages/GamesLibraryPage';
import { PricingPage } from './pages/PricingPage';
import { CafeMenuPage } from './pages/CafeMenuPage';
import { EventsPage } from './pages/EventsPage';
import { GalleryPage } from './pages/GalleryPage';
import { ContactPage } from './pages/ContactPage';
import { BookingPage } from './pages/BookingPage';
import { LegalPage } from './pages/LegalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(
        decodeURIComponent(hash.slice(1))
      );

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        return;
      }
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname, hash]);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{
          duration: 0.22,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/experiences" element={<ExperiencesPage />} />
          <Route path="/games" element={<GamesLibraryPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/cafe" element={<CafeMenuPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <VenueProvider>
          <BrowserRouter basename="/demo-website">
            <ScrollToTop />

            <div className="min-h-screen flex flex-col bg-[#090B10] text-slate-100">
              <Navbar />

              <main className="flex-1">
                <AnimatedRoutes />
              </main>

              <Footer />

              <WhatsAppFloatingButton />
            </div>
          </BrowserRouter>
        </VenueProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
