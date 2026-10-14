import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EventItem, UserProfile, Notification, UserRole, AuthUser, SkillItem, StudentVerification } from '../types/index.js';
import { api } from '../services/api.js';
import { safeStorage } from '../utils/storage.js';

export type NavigationPage =
  | 'discover'
  | 'freetime'
  | 'heatmap'
  | 'compare'
  | 'myevents'
  | 'organizer'
  | 'event-details';

interface AppContextType {
  activePage: NavigationPage;
  selectedEventId: string | null;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  navigateTo: (page: NavigationPage, eventId?: string) => void;

  // Authentication State
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isGuestPreview: boolean;
  setIsGuestPreview: (guest: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string; role?: 'student' | 'organizer'; delhi_region?: string; organization_name?: string }) => Promise<void>;
  demoLogin: (role: 'student' | 'organizer') => Promise<void>;
  logout: () => Promise<void>;

  // Student Verification State & Modal
  studentVerification: StudentVerification | null;
  isVerificationModalOpen: boolean;
  setIsVerificationModalOpen: (open: boolean) => void;
  refreshVerificationStatus: () => Promise<void>;

  // Saved & Registered
  savedEventIds: Set<string>;
  registeredEventIds: Set<string>;
  toggleSave: (eventId: string) => Promise<void>;
  registerForEvent: (eventId: string) => Promise<void>;
  cancelRegistration: (eventId: string) => Promise<void>;

  // Comparison
  compareEventIds: string[];
  addToCompare: (eventId: string) => void;
  removeFromCompare: (eventId: string) => void;
  clearCompare: () => void;

  // Profile & Goals & Skills
  profile: UserProfile | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateSkills: (skills: SkillItem[]) => Promise<void>;
  updateSemesterGoals: (goals: string[], interests: string[], career_interests: string[]) => Promise<void>;

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Modals & Panels
  isGoalsModalOpen: boolean;
  setIsGoalsModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: (open: boolean) => void;
  isAddSkillOpen: boolean;
  setIsAddSkillOpen: (open: boolean) => void;
  scoreModalEvent: EventItem | null;
  setScoreModalEvent: (event: EventItem | null) => void;
  reviewModalEvent: EventItem | null;
  setReviewModalEvent: (event: EventItem | null) => void;

  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavigationPage>('discover');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isGuestPreview, setIsGuestPreview] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('student');

  // Student Verification
  const [studentVerification, setStudentVerification] = useState<StudentVerification | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  // Event interaction states
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [compareEventIds, setCompareEventIds] = useState<string[]>(['evt_genai_masterclass', 'evt_faang_mock_interviews']);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Modals
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [scoreModalEvent, setScoreModalEvent] = useState<EventItem | null>(null);
  const [reviewModalEvent, setReviewModalEvent] = useState<EventItem | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const [profileData, savedData, notifs] = await Promise.all([
        api.getUserProfile().catch(err => {
          console.warn('Could not load user profile:', err);
          return null;
        }),
        api.getSavedEvents().catch(err => {
          console.warn('Could not load saved events:', err);
          return [];
        }),
        api.getNotifications().catch(err => {
          console.warn('Could not load notifications:', err);
          return [];
        })
      ]);

      if (profileData?.profile) {
        setProfile(profileData.profile);
      }
      if (profileData?.user) {
        setCurrentUser(profileData.user);
        setCurrentUserRole(profileData.user.role || 'student');
        if (profileData.user.role === 'student') {
          try {
            const vData = await api.getVerificationStatus();
            if (vData?.verification) {
              setStudentVerification(vData.verification);
            }
          } catch (e) {
            // ignore
          }
        }
      }

      if (Array.isArray(savedData)) {
        setSavedEventIds(new Set(savedData.map(e => e.id)));
      }

      if (Array.isArray(notifs)) {
        setNotifications(notifs);
      }

      // Also hydrate registered events from user activity if available
      try {
        const activity = await api.getUserActivity();
        const registered = new Set<string>();
        if (activity?.upcomingEvents) {
          activity.upcomingEvents.forEach((ev: any) => registered.add(ev.event_id || ev.id));
        }
        if (activity?.attendedEvents) {
          activity.attendedEvents.forEach((ev: any) => registered.add(ev.event_id || ev.id));
        }
        setRegisteredEventIds(registered);
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.warn('Unexpected error in refreshData:', err);
    }
  }, []);

  // Check persistent session on mount
  useEffect(() => {
    const checkSession = async () => {
      setAuthLoading(true);
      const token = safeStorage.getItem('worthwhile_token');
      if (!token) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setAuthLoading(false);
        return;
      }

      try {
        const session = await api.getCurrentAuth();
        if (session && session.user) {
          setCurrentUser(session.user);
          setCurrentUserRole(session.user.role || 'student');
          setProfile(session.profile);
          setIsAuthenticated(true);
          // If returning user is organizer, land on organizer desk
          if (session.user.role === 'organizer') {
            setActivePage('organizer');
          }
          await refreshData();
        } else {
          safeStorage.removeItem('worthwhile_token');
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn('Session check failed:', err);
        safeStorage.removeItem('worthwhile_token');
        setIsAuthenticated(false);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();
  }, [refreshData]);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    setCurrentUser(data.user);
    setProfile(data.profile);
    setCurrentUserRole(data.user.role || 'student');
    setIsAuthenticated(true);
    setIsGuestPreview(false);
    if (data.user.role === 'organizer') {
      setActivePage('organizer');
    } else {
      setActivePage('discover');
    }
    await refreshData();
  };

  const signup = async (data: { email: string; password: string; name: string; role?: 'student' | 'organizer'; delhi_region?: string; organization_name?: string }) => {
    const res = await api.signup(data);
    setCurrentUser(res.user);
    setProfile(res.profile);
    setCurrentUserRole(res.user.role || 'student');
    setIsAuthenticated(true);
    setIsGuestPreview(false);
    if (res.user.role === 'organizer') {
      setActivePage('organizer');
    } else {
      setActivePage('discover');
    }
    await refreshData();
  };

  const demoLogin = async (role: 'student' | 'organizer') => {
    const data = await api.demoLogin(role);
    setCurrentUser(data.user);
    setProfile(data.profile);
    setCurrentUserRole(data.user.role || role);
    setIsAuthenticated(true);
    setIsGuestPreview(false);
    if (role === 'organizer') {
      setActivePage('organizer');
    } else {
      setActivePage('discover');
    }
    await refreshData();
  };

  const logout = async () => {
    await api.logout();
    setCurrentUser(null);
    setProfile(null);
    setIsAuthenticated(false);
    setIsGuestPreview(false);
    setActivePage('discover');
  };

  const navigateTo = (page: NavigationPage, eventId?: string) => {
    if (eventId) {
      setSelectedEventId(eventId);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSave = async (eventId: string) => {
    try {
      const res = await api.toggleSaveEvent(eventId);
      setSavedEventIds(prev => {
        const next = new Set(prev);
        if (res.saved) {
          next.add(eventId);
        } else {
          next.delete(eventId);
        }
        return next;
      });
    } catch (err) {
      console.error('Toggle save error:', err);
    }
  };

  const registerForEvent = async (eventId: string) => {
    try {
      await api.registerForEvent(eventId);
      setRegisteredEventIds(prev => new Set(prev).add(eventId));
      await refreshData();
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  };

  const cancelRegistration = async (eventId: string) => {
    try {
      await api.cancelRegistration(eventId);
      setRegisteredEventIds(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      await refreshData();
    } catch (err) {
      console.error('Cancel registration error:', err);
      throw err;
    }
  };

  const addToCompare = (eventId: string) => {
    if (compareEventIds.includes(eventId)) return;
    if (compareEventIds.length >= 4) {
      setCompareEventIds(prev => [...prev.slice(1), eventId]);
    } else {
      setCompareEventIds(prev => [...prev, eventId]);
    }
  };

  const removeFromCompare = (eventId: string) => {
    setCompareEventIds(prev => prev.filter(id => id !== eventId));
  };

  const clearCompare = () => {
    setCompareEventIds([]);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updated = await api.updateProfile(updates);
      setProfile(updated);
      setIsEditProfileOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Update profile error:', err);
      throw err;
    }
  };

  const updateSkills = async (skills: SkillItem[]) => {
    try {
      const updated = await api.updateSkills(skills);
      setProfile(updated);
      setIsAddSkillOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Update skills error:', err);
      throw err;
    }
  };

  const updateSemesterGoals = async (goals: string[], interests: string[], career_interests: string[]) => {
    try {
      const updated = await api.updateSemesterGoals({ goals, interests, career_interests });
      setProfile(updated);
      setIsGoalsModalOpen(false);
      await refreshData();
    } catch (err) {
      console.error('Update goals error:', err);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const refreshVerificationStatus = useCallback(async () => {
    try {
      const vData = await api.getVerificationStatus();
      if (vData?.verification) {
        setStudentVerification(vData.verification);
      }
      if (vData?.user) {
        setCurrentUser(vData.user);
      }
    } catch (e) {
      console.warn('Could not refresh verification status:', e);
    }
  }, []);

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        activePage,
        selectedEventId,
        currentUserRole,
        setCurrentUserRole,
        navigateTo,

        // Auth
        currentUser,
        isAuthenticated,
        authLoading,
        isGuestPreview,
        setIsGuestPreview,
        login,
        signup,
        demoLogin,
        logout,

        // Student Verification
        studentVerification,
        isVerificationModalOpen,
        setIsVerificationModalOpen,
        refreshVerificationStatus,

        // Saved & Registered
        savedEventIds,
        registeredEventIds,
        toggleSave,
        registerForEvent,
        cancelRegistration,

        // Comparison
        compareEventIds,
        addToCompare,
        removeFromCompare,
        clearCompare,

        // Profile & Goals & Skills
        profile,
        updateProfile,
        updateSkills,
        updateSemesterGoals,

        // Notifications
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,

        // Modals
        isGoalsModalOpen,
        setIsGoalsModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isEditProfileOpen,
        setIsEditProfileOpen,
        isAddSkillOpen,
        setIsAddSkillOpen,
        scoreModalEvent,
        setScoreModalEvent,
        reviewModalEvent,
        setReviewModalEvent,

        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
