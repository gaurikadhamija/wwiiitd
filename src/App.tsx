import React from 'react';
import { AppProvider, useApp } from './frontend/context/AppContext.js';
import { Navbar } from './frontend/components/Navbar.js';
import { Footer } from './frontend/components/Footer.js';
import { CoffeeAtmosphere } from './frontend/components/CoffeeAtmosphere.js';
import { DiscoverPage } from './frontend/pages/DiscoverPage.js';
import { FreeTimePage } from './frontend/pages/FreeTimePage.js';
import { HeatmapPage } from './frontend/pages/HeatmapPage.js';
import { ComparePage } from './frontend/pages/ComparePage.js';
import { MyEventsPage } from './frontend/pages/MyEventsPage.js';
import { OrganizerDashboardPage } from './frontend/pages/OrganizerDashboardPage.js';
import { EventDetailsPage } from './frontend/pages/EventDetailsPage.js';
import { GoalsModal } from './frontend/components/GoalsModal.js';
import { ReviewModal } from './frontend/components/ReviewModal.js';
import { RelevanceScoreModal } from './frontend/components/RelevanceScoreModal.js';
import { AuthModal } from './frontend/components/AuthModal.js';
import { AuthScreen } from './frontend/components/AuthScreen.js';
import { EditProfileModal } from './frontend/components/EditProfileModal.js';
import { StudentVerificationModal } from './frontend/components/StudentVerificationModal.js';
import { StudentVerificationBanner } from './frontend/components/StudentVerificationBanner.js';
import { Sparkles, ArrowRight } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    activePage,
    selectedEventId,
    scoreModalEvent,
    setScoreModalEvent,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isAuthenticated,
    authLoading,
    isGuestPreview,
    setIsGuestPreview
  } = useApp();

  // 1. Initial Authentication Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-4">
        <CoffeeAtmosphere />
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <img
            src="/worthwhile-icon.svg"
            alt="WorthWhile"
            className="w-12 h-12 object-contain animate-bounce"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <h2 className="font-serif text-2xl font-bold text-[#241410]">WorthWhile</h2>
          <div className="flex items-center gap-2 text-xs font-mono text-[#5B2435] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#5B2435] animate-ping" />
            <span>Verifying session credentials...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Visitor Flow: Show dedicated full-page Auth & Role-Selection Screen
  if (!isAuthenticated && !isGuestPreview) {
    return <AuthScreen />;
  }

  // 3. Authenticated or Guest Preview App Flow
  return (
    <div className="relative flex flex-col min-h-screen text-[#241410] selection:bg-[#5B2435] selection:text-[#FFFDF8] bg-transparent">
      {/* Multi-Layer Animated Coffee Atmosphere Background */}
      <CoffeeAtmosphere />

      {/* Guest Mode Floating Invitation Bar if browsing without an account */}
      {!isAuthenticated && isGuestPreview && (
        <div className="sticky top-0 z-50 w-full bg-[#5B2435] text-[#FFFDF8] px-4 py-2 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#EFE5D5]" />
            <span>You are browsing WorthWhile in Guest Mode. Sign in to save events, track verified hours, and build your student portfolio.</span>
          </div>
          <button
            onClick={() => setIsGuestPreview(false)}
            className="px-3 py-1 rounded bg-[#FFFDF8] text-[#5B2435] font-bold text-[11px] uppercase tracking-wider hover:bg-[#F8F4EC] transition-colors shrink-0 ml-3"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Foreground Content Stack */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Sticky Top Navigation */}
        <Navbar />

        {/* Student Verification Status Banner for logged-in students */}
        <StudentVerificationBanner />

        {/* Main Page Content */}
        <main className="flex-1">
          {activePage === 'discover' && <DiscoverPage />}
          {activePage === 'freetime' && <FreeTimePage />}
          {activePage === 'heatmap' && <HeatmapPage />}
          {activePage === 'compare' && <ComparePage />}
          {activePage === 'myevents' && <MyEventsPage />}
          {activePage === 'organizer' && <OrganizerDashboardPage />}
          {activePage === 'event-details' && (
            <EventDetailsPage eventId={selectedEventId || 'evt_genai_masterclass'} />
          )}
        </main>

        {/* Global Modals */}
        <GoalsModal />
        <ReviewModal />
        <EditProfileModal />
        <StudentVerificationModal />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <RelevanceScoreModal
          event={scoreModalEvent}
          onClose={() => setScoreModalEvent(null)}
        />

        {/* Editorial Dark Coffee/Wine Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
