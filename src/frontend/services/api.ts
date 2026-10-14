import { EventItem, UserProfile, Notification, RelevanceBreakdown } from '../types/index.js';
import { safeStorage } from '../utils/storage.js';

// Supports relative /api (local Vite dev & Vercel proxy rewrites)
// and absolute backend origins (via VITE_API_URL or VITE_API_BASE_URL in Vercel)
const rawBase = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '') as string;
const normalizedBase = rawBase.trim().replace(/\/+$/, '');
const API_BASE = normalizedBase
  ? (normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`)
  : '/api';

function getAuthHeader(): Record<string, string> {
  const token = safeStorage.getItem('worthwhile_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async signup(data: { email: string; password: string; name: string; role?: string; delhi_region?: string; organization_name?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to sign up');
    if (json.data?.token) {
      safeStorage.setItem('worthwhile_token', json.data.token);
    }
    return json.data;
  },

  async login(email: string, password: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to sign in');
    if (json.data?.token) {
      safeStorage.setItem('worthwhile_token', json.data.token);
    }
    return json.data;
  },

  async demoLogin(role: 'student' | 'organizer'): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Demo login failed');
    if (json.data?.token) {
      safeStorage.setItem('worthwhile_token', json.data.token);
    }
    return json.data;
  },

  /** `credential` is the Google-issued ID token; the server verifies it. Profile fields are never sent. */
  async googleLogin(credential: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to sign in with Google');
    if (json.data?.token) {
      safeStorage.setItem('worthwhile_token', json.data.token);
    }
    return json.data;
  },

  async getCurrentAuth(): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
    } catch {
      // Ignore network errors on logout
    }
    safeStorage.removeItem('worthwhile_token');
  },

  async forgotPassword(email: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to request password reset');
    return json;
  },

  async resetPassword(token: string, newPassword: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to reset password');
    return json;
  },

  // Onboarding & Priorities persistence
  async submitOnboarding(data: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/onboarding`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save onboarding');
    return json.data;
  },

  async updatePriorities(priorities: Record<string, number>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/priorities`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ priorities }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to save priorities');
    return json.data;
  },

  async getVenues(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/venues`);
    if (!res.ok) throw new Error('Failed to fetch venues');
    const json = await res.json();
    return json.data;
  },

  // Events
  async getEvents(filters: {
    category?: string;
    search?: string;
    is_free?: boolean;
    certificate_only?: boolean;
    networking_level?: string;
  } = {}): Promise<EventItem[]> {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.is_free !== undefined) params.append('is_free', String(filters.is_free));
    if (filters.certificate_only) params.append('certificate_only', 'true');
    if (filters.networking_level && filters.networking_level !== 'All') params.append('networking_level', filters.networking_level);

    const res = await fetch(`${API_BASE}/events?${params.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch events');
    const json = await res.json();
    return json.data;
  },

  async getRecommendedEvents(): Promise<EventItem[]> {
    const res = await fetch(`${API_BASE}/events/recommended`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    const json = await res.json();
    return json.data;
  },

  async getEventById(id: string): Promise<EventItem> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch event');
    const json = await res.json();
    return json.data;
  },

  async createEvent(eventData: any): Promise<EventItem> {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(eventData),
    });
    if (!res.ok) throw new Error('Failed to create event');
    const json = await res.json();
    return json.data;
  },

  // 2-Hour Mode Free Time
  async getFreeTimeRecommendations(params: {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    currentZone?: string;
    originLat?: number;
    originLng?: number;
    originName?: string;
  }): Promise<any[]> {
    const res = await fetch(`${API_BASE}/free-time/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to fetch free-time recommendations');
    const json = await res.json();
    return json.data;
  },

  // Event Comparison
  async compareEvents(eventIds: string[], priority: string = 'career'): Promise<any> {
    const res = await fetch(`${API_BASE}/events/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ event_ids: eventIds, priority }),
    });
    if (!res.ok) throw new Error('Failed to compare events');
    const json = await res.json();
    return json.data;
  },

  // Relevance Score Breakdown
  async getRelevanceBreakdown(eventId: string): Promise<RelevanceBreakdown> {
    const res = await fetch(`${API_BASE}/relevance/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ event_id: eventId }),
    });
    if (!res.ok) throw new Error('Failed to calculate score');
    const json = await res.json();
    return json.data;
  },

  // Heatmap Clusters
  async getHeatmap(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/heatmap`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch heatmap');
    const json = await res.json();
    return json.data;
  },

  // Claims & Evidence
  async submitClaimEvidence(eventId: string, claimId: string, confirmed: boolean, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/events/${eventId}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ claim_id: claimId, confirmed, notes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit claim evidence');
    return json.data;
  },

  // Reviews
  async submitReview(reviewData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(reviewData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit review');
    return json.data;
  },

  // Saved Events & Registrations
  async getSavedEvents(): Promise<EventItem[]> {
    try {
      const res = await fetch(`${API_BASE}/events/saved`, {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) {
        console.warn('Failed to fetch saved events, returning empty list');
        return [];
      }
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.warn('Network issue fetching saved events:', e);
      return [];
    }
  },

  async toggleSaveEvent(eventId: string): Promise<{ saved: boolean }> {
    const res = await fetch(`${API_BASE}/events/${eventId}/save`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to toggle save');
    const json = await res.json();
    return json.data;
  },

  async registerForEvent(eventId: string): Promise<{ success: boolean; registered: boolean }> {
    const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to register');
    const json = await res.json();
    return json.data;
  },

  async cancelRegistration(eventId: string): Promise<{ success: boolean; registered: boolean }> {
    const res = await fetch(`${API_BASE}/events/${eventId}/register`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to cancel registration');
    const json = await res.json();
    return json.data;
  },

  // User Profile & Activity
  async getUserProfile(): Promise<{ user: any; profile: UserProfile }> {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    const json = await res.json();
    return json.data;
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const json = await res.json();
    return json.data;
  },

  async updateSkills(skills: any[]): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/skills`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ skills }),
    });
    if (!res.ok) throw new Error('Failed to update skills');
    const json = await res.json();
    return json.data;
  },

  async updateSemesterGoals(data: { goals: string[]; interests: string[]; career_interests: string[] }): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/user/goals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update semester goals');
    const json = await res.json();
    return json.data;
  },

  async getUserActivity(): Promise<any> {
    const res = await fetch(`${API_BASE}/user/activity`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch activity');
    const json = await res.json();
    return json.data;
  },

  // Organizer Desk & Attendee Management
  async getOrganizerDashboard(organizerId?: string): Promise<any> {
    const url = organizerId ? `${API_BASE}/organizer/dashboard?organizer_id=${encodeURIComponent(organizerId)}` : `${API_BASE}/organizer/dashboard`;
    const res = await fetch(url, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch organizer dashboard');
    const json = await res.json();
    return json.data;
  },

  async getEventAttendees(eventId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/events/${eventId}/attendees`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch attendees');
    const json = await res.json();
    return json.data;
  },

  async markAttendance(eventId: string, userId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/events/${eventId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!res.ok) throw new Error('Failed to record attendance');
    const json = await res.json();
    return json.data;
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const json = await res.json();
    return json.data;
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json.marked;
  },

  async markAllNotificationsRead(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) return false;
    const json = await res.json();
    return json.marked;
  },

  // Student & Organiser Verification Methods
  async getVerificationStatus(): Promise<{
    status: string;
    rejection_reason?: string;
    info_request?: string;
    verification: any;
    user: any;
  }> {
    const res = await fetch(`${API_BASE}/verification/my-status`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch verification status');
    const json = await res.json();
    return json.data;
  },

  async submitStudentVerification(data: {
    institution: string;
    department: string;
    academic_year: string;
    student_id_number?: string;
    verification_method?: string;
    document_name?: string;
    document_url?: string;
    college_email?: string;
    student_name?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/verification/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit student verification');
    return json.data;
  },

  async getVerificationRequests(params?: { status?: string; search?: string }): Promise<{
    requests: any[];
    counts: { all: number; pending: number; approved: number; rejected: number; info_requested: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'all') searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    const res = await fetch(`${API_BASE}/verification/requests${qs ? `?${qs}` : ''}`, {
      headers: { ...getAuthHeader() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch verification requests');
    return { requests: json.data, counts: json.counts };
  },

  async reviewVerificationRequest(id: string, action: 'approve' | 'reject' | 'request_info', reason?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/verification/requests/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ action, reason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to review verification application');
    return json.data;
  },
};
