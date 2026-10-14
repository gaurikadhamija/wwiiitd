import { Router, Request, Response } from 'express';
import { EventService } from '../services/eventService.js';
import { UserService } from '../services/userService.js';
import { AuthService } from '../services/authService.js';
import { FreeTimeService } from '../services/freeTimeService.js';
import { ComparisonService } from '../services/comparisonService.js';
import { ClaimVerificationService } from '../services/claimVerificationService.js';
import { ReviewService } from '../services/reviewService.js';
import { OrganizerService } from '../services/organizerService.js';
import { NotificationService } from '../services/notificationService.js';
import { VerificationService } from '../services/verificationService.js';
import { calculateRelevanceScore } from '../services/relevanceEngine.js';
import { db } from '../db/connection.js';
import { HttpError } from '../services/errors.js';
import { verifyGoogleIdToken } from '../services/googleAuth.js';
import { getSession, getPersonalizationProfile, requireAuth, requireRole, requireEventManager, canManageOrganizer, extractToken } from '../middleware/auth.js';

export const apiRouter = Router();

// Identity comes only from a server-issued session token (see middleware/auth.ts).
// Client-supplied user ids (e.g. x-user-id) are never trusted.
function getCurrentProfile(req: Request) {
  return getPersonalizationProfile(req);
}

/** Returns the authenticated user's id or throws HttpError(401). */
function getCurrentUserId(req: Request): string {
  return requireAuth(req).user.id;
}

function sendError(res: Response, err: any, fallbackStatus: number) {
  if (err instanceof HttpError) return res.status(err.status).json({ success: false, error: err.message });
  if (fallbackStatus >= 500) {
    console.error('API error:', err?.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
  return res.status(fallbackStatus).json({ success: false, error: err?.message || 'Request failed' });
}

// -------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------
apiRouter.post('/auth/signup', (req: Request, res: Response) => {
  try {
    const { email, password, name, role, delhi_region, organization_name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }
    const session = AuthService.signup({ email, password, name, role, delhi_region, organization_name });
    res.status(201).json({ success: true, data: session });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    const session = AuthService.login(email, password);
    res.json({ success: true, data: session });
  } catch (err: any) {
    sendError(res, err, 401);
  }
});

apiRouter.post('/auth/demo-login', (req: Request, res: Response) => {
  try {
    const role = req.body?.role === 'organizer' ? 'organizer' : 'student';
    const session = AuthService.demoLogin(role);
    res.json({ success: true, data: session });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.post('/auth/google', async (req: Request, res: Response) => {
  try {
    // The server verifies a Google-issued ID token; email/name from the client body are ignored.
    const identity = await verifyGoogleIdToken(req.body?.credential);
    const session = AuthService.googleLogin({ email: identity.email, name: identity.name, avatar_url: identity.picture });
    res.json({ success: true, data: session });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  try {
    const session = getSession(req);
    if (!session) return res.status(401).json({ success: false, error: 'Not signed in.' });
    res.json({ success: true, data: session });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (token) AuthService.logout(token);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = AuthService.requestPasswordReset(email);
    res.json({ success: true, message: 'If an account exists for that email, a reset link will be sent.', data: result.resetToken ? { resetToken: result.resetToken } : undefined });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Token and new password required.' });
    }
    const ok = AuthService.resetPassword(token, newPassword);
    res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

// -------------------------------------------------------------
// POST-LOGIN ONBOARDING & PRIORITIES (PERSISTED IN DATABASE)
// -------------------------------------------------------------
apiRouter.put('/user/onboarding', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const {
      goals,
      interests,
      priorities,
      year_of_study,
      degree,
      major,
      delhi_region,
      commute_mode,
      career_interests,
      preferred_event_types,
      preferred_duration_max,
      preferred_distance_max,
      preferred_time_of_day
    } = req.body;

    const updated = UserService.updateProfile(userId, {
      goals,
      interests,
      priorities,
      year_of_study,
      degree,
      major,
      delhi_region,
      commute_mode,
      career_interests,
      preferred_event_types,
      preferred_duration_max,
      preferred_distance_max,
      preferred_time_of_day,
      onboarding_completed: true
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.put('/user/priorities', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const { priorities } = req.body;
    const updated = UserService.updateProfile(userId, { priorities });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.get('/venues', (req: Request, res: Response) => {
  try {
    const venues = db.prepare('SELECT * FROM venues ORDER BY name ASC').all();
    res.json({ success: true, count: venues.length, data: venues });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// -------------------------------------------------------------
// EVENTS ENDPOINTS
// -------------------------------------------------------------
apiRouter.get('/events', (req: Request, res: Response) => {
  try {
    const profile = getCurrentProfile(req);
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const isFree = req.query.is_free !== undefined ? req.query.is_free === 'true' : undefined;
    const certOnly = req.query.certificate_only === 'true';
    const networking = req.query.networking_level as string | undefined;

    const events = EventService.getAllEvents({
      category,
      search,
      is_free: isFree,
      certificate_only: certOnly,
      networking_level: networking,
      profile
    });

    res.json({ success: true, count: events.length, data: events });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.get('/events/recommended', (req: Request, res: Response) => {
  try {
    const profile = getCurrentProfile(req);
    const all = EventService.getAllEvents({ profile });
    // Sort by personalized relevance score descending
    const recommended = [...all].sort((a, b) => b.relevance.totalScore - a.relevance.totalScore);
    res.json({ success: true, count: recommended.length, data: recommended });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.get('/events/saved', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const saved = UserService.getSavedEvents(userId);
    res.json({ success: true, count: saved.length, data: saved });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.get('/events/:id', (req: Request, res: Response) => {
  try {
    const profile = getCurrentProfile(req);
    const event = EventService.getEventById(req.params.id, profile);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    const insights = ReviewService.getCommunityInsights(req.params.id);
    const reviews = ReviewService.getReviewsForEvent(req.params.id);

    res.json({
      success: true,
      data: {
        ...event,
        community_insights: insights,
        reviews
      }
    });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.post('/events', (req: Request, res: Response) => {
  try {
    const session = requireRole(req, 'organizer', 'admin');
    // The event is created under an organizer this user manages (admins may pick any).
    let organizerId = req.body?.organizer_id as string | undefined;
    if (!organizerId && session.user.role === 'organizer') {
      organizerId = (db.prepare('SELECT id FROM organizers WHERE owner_user_id = ?').get(session.user.id) as any)?.id;
    }
    if (!organizerId || !canManageOrganizer(session.user.id, session.user.role, organizerId)) {
      throw new HttpError(403, 'You do not manage this organizer.');
    }
    const created = EventService.createEvent({ ...req.body, organizer_id: organizerId });
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.put('/events/:id', (req: Request, res: Response) => {
  try {
    requireEventManager(req, req.params.id);
    const updated = EventService.updateEvent(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.delete('/events/:id', (req: Request, res: Response) => {
  try {
    requireEventManager(req, req.params.id);
    const ok = EventService.deleteEvent(req.params.id);
    if (!ok) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// -------------------------------------------------------------
// RELEVANCE & 2-HOUR & COMPARE
// -------------------------------------------------------------
apiRouter.post('/relevance/calculate', (req: Request, res: Response) => {
  try {
    const { event_id } = req.body;
    const profile = getCurrentProfile(req);
    const event = EventService.getEventById(event_id, profile);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    const breakdown = calculateRelevanceScore(profile, event);
    res.json({ success: true, data: breakdown });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.post('/free-time/recommend', (req: Request, res: Response) => {
  try {
    const profile = getCurrentProfile(req);
    const {
      startHour = 15,
      startMinute = 0,
      endHour = 17,
      endMinute = 0,
      currentZone,
      originLat,
      originLng,
      originName
    } = req.body;

    const recs = FreeTimeService.findEventsForFreeTime({
      startHour: Number(startHour),
      startMinute: Number(startMinute),
      endHour: Number(endHour),
      endMinute: Number(endMinute),
      currentZone,
      originLat: originLat ? Number(originLat) : undefined,
      originLng: originLng ? Number(originLng) : undefined,
      originName,
      profile
    });

    res.json({ success: true, count: recs.length, data: recs });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.post('/events/compare', (req: Request, res: Response) => {
  try {
    const profile = getCurrentProfile(req);
    const { event_ids, priority = 'career' } = req.body;

    if (!Array.isArray(event_ids) || event_ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Provide at least 2 event IDs to compare' });
    }

    const result = ComparisonService.compareEvents(event_ids, priority, profile);
    res.json({ success: true, data: result });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// -------------------------------------------------------------
// CAMPUS HEATMAP & VENUES
// -------------------------------------------------------------
apiRouter.get('/heatmap', (req: Request, res: Response) => {
  try {
    const profile = getCurrentProfile(req);
    const events = EventService.getAllEvents({ profile });

    // Group events by venue for map rendering
    const venueMap: Record<string, any> = {};
    for (const ev of events) {
      if (!ev.venue) continue;
      if (!venueMap[ev.venue.id]) {
        venueMap[ev.venue.id] = {
          venue: ev.venue,
          events: [],
          totalCapacity: ev.venue.capacity,
          densityScore: 0,
        };
      }
      venueMap[ev.venue.id].events.push({
        id: ev.id,
        title: ev.title,
        category: ev.category,
        start_time: ev.start_time,
        end_time: ev.end_time,
        relevance: ev.relevance.totalScore,
        cost_cents: ev.cost_cents,
        networking: ev.networking_potential
      });
      venueMap[ev.venue.id].densityScore += 1;
    }

    const clusters = Object.values(venueMap);
    res.json({ success: true, count: clusters.length, data: clusters });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.get('/events/nearby', (req: Request, res: Response) => {
  try {
    const profile = getCurrentProfile(req);
    const maxMinutes = Number(req.query.max_walking_minutes || 15);
    const events = EventService.getAllEvents({ profile });

    // Filter by walking threshold
    const nearby = events.filter(e => (e.venue?.campus_zone || '').includes('North') || (e.venue?.campus_zone || '').includes('Central'));
    res.json({ success: true, count: nearby.length, data: nearby });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// -------------------------------------------------------------
// CLAIMS & EVIDENCE VERIFICATION
// -------------------------------------------------------------
apiRouter.get('/events/:id/claims', (req: Request, res: Response) => {
  try {
    const claims = ClaimVerificationService.getClaimsForEvent(req.params.id);
    res.json({ success: true, count: claims.length, data: claims });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.post('/events/:id/evidence', (req: Request, res: Response) => {
  try {
    const session = requireAuth(req);
    const { claim_id, confirmed, notes } = req.body || {};
    if (typeof claim_id !== 'string' || !claim_id) {
      return res.status(400).json({ success: false, error: 'claim_id and confirmed are required' });
    }
    const claim = db.prepare('SELECT event_id FROM organizer_claims WHERE id = ?').get(claim_id) as any;
    if (!claim || claim.event_id !== req.params.id) throw new HttpError(404, 'Claim not found for this event');

    // Submitting evidence records a response only; status is derived from persisted evidence (see claimVerificationService).
    const result = ClaimVerificationService.submitEvidence({
      claim_id,
      student_id: session.user.id,
      student_role: session.user.role,
      confirmed,
      notes
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// Organizer/admin-only: record that a registered student actually attended (organizer check-in).
// This is the ONLY way attendance evidence is created; it is what makes a review "attendance verified".
apiRouter.post('/events/:id/attendance', (req: Request, res: Response) => {
  try {
    const session = requireEventManager(req, req.params.id);
    const userId = req.body?.user_id;
    if (typeof userId !== 'string' || !userId) throw new HttpError(400, 'user_id is required');
    const ok = UserService.markAttendance(req.params.id, userId, session.user.id);
    if (!ok) throw new HttpError(404, 'That user is not registered for this event.');
    res.json({ success: true, data: { event_id: req.params.id, user_id: userId, attendance_source: 'organizer_checkin' } });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// Organizer/admin-only: list all registered students for an event with check-in status
apiRouter.get('/events/:id/attendees', (req: Request, res: Response) => {
  try {
    requireEventManager(req, req.params.id);
    const attendees = UserService.getEventAttendees(req.params.id);
    res.json({ success: true, count: attendees.length, data: attendees });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// -------------------------------------------------------------
// REVIEWS
// -------------------------------------------------------------
apiRouter.get('/events/:id/reviews', (req: Request, res: Response) => {
  try {
    const reviews = ReviewService.getReviewsForEvent(req.params.id);
    const insights = ReviewService.getCommunityInsights(req.params.id);
    res.json({ success: true, count: reviews.length, data: { reviews, insights } });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.post('/reviews', (req: Request, res: Response) => {
  try {
    const session = requireAuth(req);
    // Any is_verified_attendee / isVerified / user_id / user_name in the body is ignored: identity and
    // verification are derived server-side.
    const input = ReviewService.validatePayload(req.body);
    const profile = session.profile;

    const review = ReviewService.createReview({
      ...input,
      user_id: session.user.id,
      user_name: session.user.name,
      user_degree: profile?.degree ? `${profile.degree} in ${profile.major}` : 'Student'
    });

    res.status(201).json({ success: true, data: review });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// -------------------------------------------------------------
// SAVED & REGISTRATIONS
// -------------------------------------------------------------
apiRouter.post('/events/:id/save', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const result = UserService.toggleSaveEvent(userId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.delete('/events/:id/save', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const result = UserService.toggleSaveEvent(userId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.post('/events/:id/register', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    if (!db.prepare('SELECT id FROM events WHERE id = ?').get(req.params.id)) throw new HttpError(404, 'Event not found');
    const result = UserService.registerForEvent(userId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.delete('/events/:id/register', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const result = UserService.cancelRegistration(userId, req.params.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// -------------------------------------------------------------
// USER PROFILE & GOALS & ACTIVITY
// -------------------------------------------------------------
apiRouter.get('/user/profile', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const user = UserService.getUser(userId);
    const profile = UserService.getProfile(userId);
    res.json({ success: true, data: { user, profile } });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.put('/user/profile', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const updated = UserService.updateProfile(userId, req.body);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.put('/user/skills', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const { skills } = req.body;
    if (!Array.isArray(skills)) {
      return res.status(400).json({ success: false, error: 'skills must be an array' });
    }
    const updated = UserService.updateSkillsPortfolio(userId, skills);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.put('/user/goals', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const { goals, interests, career_interests } = req.body;
    const updated = UserService.updateProfile(userId, {
      goals,
      interests,
      career_interests
    });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

apiRouter.get('/user/activity', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const activity = UserService.getActivityPortfolio(userId);
    res.json({ success: true, data: activity });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// -------------------------------------------------------------
// ORGANIZER DASHBOARD & ANALYTICS
// -------------------------------------------------------------
apiRouter.get('/organizer/dashboard', (req: Request, res: Response) => {
  try {
    const session = requireRole(req, 'organizer', 'admin');
    let orgId = req.query.organizer_id as string | undefined;
    if (!orgId) {
      orgId = (db.prepare('SELECT id FROM organizers WHERE owner_user_id = ?').get(session.user.id) as any)?.id
        || (session.user.role === 'admin' ? 'org_acm' : undefined);
    }
    if (!orgId || !canManageOrganizer(session.user.id, session.user.role, orgId)) {
      throw new HttpError(403, 'You do not manage this organizer.');
    }
    const metrics = OrganizerService.getDashboardMetrics(orgId);
    if (!metrics) throw new HttpError(404, 'Organizer not found');
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
apiRouter.get('/notifications', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const list = NotificationService.getNotifications(userId);
    res.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  try {
    const ok = NotificationService.markAsRead(req.params.id, getCurrentUserId(req));
    res.json({ success: true, marked: ok });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  try {
    const userId = getCurrentUserId(req);
    const ok = NotificationService.markAllAsRead(userId);
    res.json({ success: true, marked: ok });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// -------------------------------------------------------------
// STUDENT & ORGANISER VERIFICATION WORKFLOW
// -------------------------------------------------------------

// Student: Check own verification status and request details
apiRouter.get('/verification/my-status', (req: Request, res: Response) => {
  try {
    const session = requireAuth(req);
    const verification = VerificationService.getStudentVerification(session.user.id);
    res.json({
      success: true,
      data: {
        status: session.user.student_verification_status || 'unverified',
        rejection_reason: session.user.verification_rejection_reason,
        info_request: session.user.verification_info_request,
        verification,
        user: session.user
      }
    });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// Student: Submit verification credentials
apiRouter.post('/verification/submit', (req: Request, res: Response) => {
  try {
    const session = requireRole(req, 'student');
    const verification = VerificationService.submitVerification(session.user.id, req.body || {});
    res.json({ success: true, data: verification });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});

// Reviewer/Organiser/Admin: List all student verification requests with filters
apiRouter.get('/verification/requests', (req: Request, res: Response) => {
  try {
    const session = requireAuth(req);
    if (!VerificationService.canReviewVerifications(session.user)) {
      throw new HttpError(403, 'Permission denied: Only authorized verification reviewers or campus administrators may inspect student applications.');
    }
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const result = VerificationService.getAllRequests({ status, search });
    res.json({ success: true, data: result.requests, counts: result.counts });
  } catch (err: any) {
    sendError(res, err, 500);
  }
});

// Reviewer/Organiser/Admin: Approve, reject, or request additional information
apiRouter.post('/verification/requests/:id/review', (req: Request, res: Response) => {
  try {
    const session = requireAuth(req);
    if (!VerificationService.canReviewVerifications(session.user)) {
      throw new HttpError(403, 'Permission denied: Only authorized verification reviewers or campus administrators may decision student applications.');
    }
    const action = req.body?.action as 'approve' | 'reject' | 'request_info';
    const reason = req.body?.reason as string | undefined;
    const updated = VerificationService.reviewRequest(session.user, req.params.id, action, reason);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    sendError(res, err, 400);
  }
});
