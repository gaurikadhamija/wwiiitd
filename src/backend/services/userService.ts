import { db } from '../db/connection.js';
import { User, UserProfile, Event } from '../types/index.js';
import { EventService } from './eventService.js';

export class UserService {
  static getUser(id: string): User | null {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      avatar_url: row.avatar_url,
      status: row.status || 'active',
      organization_name: row.organization_name,
      student_verification_status: row.student_verification_status || 'unverified',
      organiser_approval_status: row.organiser_approval_status || 'approved',
      is_verification_reviewer: Boolean(row.is_verification_reviewer),
      verification_rejection_reason: row.verification_rejection_reason || undefined,
      verification_info_request: row.verification_info_request || undefined,
      created_at: row.created_at
    };
  }

  static getProfile(userId: string): UserProfile | null {
    const row = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId) as any;
    if (!row) return null;
    return {
      user_id: row.user_id,
      year_of_study: row.year_of_study,
      degree: row.degree,
      major: row.major,
      free_hours_per_week: row.free_hours_per_week,
      commute_mode: row.commute_mode,
      campus_location: row.campus_location,
      delhi_region: row.delhi_region || 'South Delhi',
      preferred_time_of_day: row.preferred_time_of_day || 'Afternoon & Evening',
      onboarding_completed: Boolean(row.onboarding_completed),
      graduation_year: row.graduation_year || '2026',
      bio: row.bio || '',
      college_email: row.college_email || '',
      portfolio_links: JSON.parse(row.portfolio_links_json || '{"github":"","linkedin":"","website":""}'),
      skills_portfolio: JSON.parse(row.skills_portfolio_json || '[]'),
      goals: JSON.parse(row.goals_json || '[]'),
      interests: JSON.parse(row.interests_json || '[]'),
      priorities: JSON.parse(row.priorities_json || '{"career":35,"learning":25,"networking":20,"convenience":10,"fun":10}'),
      career_interests: JSON.parse(row.career_interests_json || '[]'),
      preferred_event_types: JSON.parse(row.preferred_event_types_json || '[]'),
      preferred_duration_max: row.preferred_duration_max,
      preferred_distance_max: row.preferred_distance_max
    };
  }

  static updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const current = this.getProfile(userId);
    if (!current) throw new Error('Profile not found');

    db.prepare(`
      UPDATE profiles SET
        year_of_study = COALESCE(?, year_of_study),
        degree = COALESCE(?, degree),
        major = COALESCE(?, major),
        free_hours_per_week = COALESCE(?, free_hours_per_week),
        commute_mode = COALESCE(?, commute_mode),
        campus_location = COALESCE(?, campus_location),
        delhi_region = COALESCE(?, delhi_region),
        preferred_time_of_day = COALESCE(?, preferred_time_of_day),
        onboarding_completed = COALESCE(?, onboarding_completed),
        goals_json = COALESCE(?, goals_json),
        interests_json = COALESCE(?, interests_json),
        priorities_json = COALESCE(?, priorities_json),
        career_interests_json = COALESCE(?, career_interests_json),
        preferred_event_types_json = COALESCE(?, preferred_event_types_json),
        preferred_duration_max = COALESCE(?, preferred_duration_max),
        preferred_distance_max = COALESCE(?, preferred_distance_max),
        graduation_year = COALESCE(?, graduation_year),
        bio = COALESCE(?, bio),
        college_email = COALESCE(?, college_email),
        portfolio_links_json = COALESCE(?, portfolio_links_json),
        skills_portfolio_json = COALESCE(?, skills_portfolio_json)
      WHERE user_id = ?
    `).run(
      updates.year_of_study ?? null,
      updates.degree ?? null,
      updates.major ?? null,
      updates.free_hours_per_week ?? null,
      updates.commute_mode ?? null,
      updates.campus_location ?? null,
      updates.delhi_region ?? null,
      updates.preferred_time_of_day ?? null,
      updates.onboarding_completed !== undefined ? (updates.onboarding_completed ? 1 : 0) : null,
      updates.goals ? JSON.stringify(updates.goals) : null,
      updates.interests ? JSON.stringify(updates.interests) : null,
      updates.priorities ? JSON.stringify(updates.priorities) : null,
      updates.career_interests ? JSON.stringify(updates.career_interests) : null,
      updates.preferred_event_types ? JSON.stringify(updates.preferred_event_types) : null,
      updates.preferred_duration_max ?? null,
      updates.preferred_distance_max ?? null,
      updates.graduation_year ?? null,
      updates.bio ?? null,
      updates.college_email ?? null,
      updates.portfolio_links ? JSON.stringify(updates.portfolio_links) : null,
      updates.skills_portfolio ? JSON.stringify(updates.skills_portfolio) : null,
      userId
    );

    return this.getProfile(userId)!;
  }

  static getSavedEvents(userId: string): (Event & { relevance: any; saved_at: string })[] {
    try {
      const rows = db.prepare(`
        SELECT event_id, saved_at FROM saved_events WHERE user_id = ? ORDER BY saved_at DESC
      `).all(userId) as any[];

      const profile = this.getProfile(userId);
      const events: (Event & { relevance: any; saved_at: string })[] = [];

      for (const r of rows) {
        try {
          const ev = EventService.getEventById(r.event_id, profile);
          if (ev) {
            events.push({
              ...ev,
              saved_at: r.saved_at
            });
          }
        } catch (itemErr) {
          console.warn(`Could not hydrate saved event ${r?.event_id}:`, itemErr);
        }
      }

      return events;
    } catch (e) {
      console.warn('Failed querying saved_events table:', e);
      return [];
    }
  }

  static toggleSaveEvent(userId: string, eventId: string): { saved: boolean } {
    const existing = db.prepare('SELECT id FROM saved_events WHERE user_id = ? AND event_id = ?').get(userId, eventId);
    if (existing) {
      db.prepare('DELETE FROM saved_events WHERE user_id = ? AND event_id = ?').run(userId, eventId);
      return { saved: false };
    } else {
      const id = `sav_${Date.now()}`;
      db.prepare('INSERT INTO saved_events (id, user_id, event_id, saved_at) VALUES (?, ?, ?, datetime("now"))').run(id, userId, eventId);
      return { saved: true };
    }
  }

  static isEventSaved(userId: string, eventId: string): boolean {
    const existing = db.prepare('SELECT id FROM saved_events WHERE user_id = ? AND event_id = ?').get(userId, eventId);
    return Boolean(existing);
  }

  static registerForEvent(userId: string, eventId: string): { success: boolean; registered: boolean } {
    const existing = db.prepare('SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?').get(userId, eventId);
    if (existing) {
      return { success: true, registered: true };
    }

    const id = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO event_registrations (id, event_id, user_id, registered_at, attended)
      VALUES (?, ?, ?, datetime('now'), 0)
    `).run(id, eventId, userId);

    // Bump registration count in analytics
    db.prepare(`
      UPDATE event_analytics SET seats_registered = seats_registered + 1 WHERE event_id = ?
    `).run(eventId);

    return { success: true, registered: true };
  }

  /**
   * Records attendance for a registered user. Called only from an organizer/admin-authorized route.
   * This is the single place that creates attendance evidence ('organizer_checkin').
   */
  static markAttendance(eventId: string, userId: string, checkedInBy: string): boolean {
    const res = db.prepare(`
      UPDATE event_registrations
      SET attended = 1, attendance_source = 'organizer_checkin', checked_in_by = ?, checked_in_at = datetime('now')
      WHERE event_id = ? AND user_id = ?
    `).run(checkedInBy, eventId, userId);
    if (res.changes > 0) {
      db.prepare(`
        UPDATE reviews SET is_verified_attendee = 1, verification_basis = 'organizer_checkin'
        WHERE event_id = ? AND user_id = ? AND is_demo = 0
      `).run(eventId, userId);
    }
    return res.changes > 0;
  }

  static cancelRegistration(userId: string, eventId: string): { success: boolean; registered: boolean } {
    const existing = db.prepare('SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?').get(userId, eventId);
    if (existing) {
      db.prepare('DELETE FROM event_registrations WHERE user_id = ? AND event_id = ?').run(userId, eventId);
      db.prepare(`
        UPDATE event_analytics SET seats_registered = MAX(0, seats_registered - 1) WHERE event_id = ?
      `).run(eventId);
    }
    return { success: true, registered: false };
  }

  /**
   * Returns list of registered attendees for an event with student profile context
   */
  static getEventAttendees(eventId: string) {
    const rows = db.prepare(`
      SELECT er.id as registration_id, er.event_id, er.user_id, er.registered_at, er.attended, er.checked_in_at, er.attendance_source,
             u.name, u.email, u.avatar_url,
             p.degree, p.major, p.year_of_study, p.graduation_year, p.campus_location, p.delhi_region
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE er.event_id = ?
      ORDER BY er.registered_at DESC
    `).all(eventId) as any[];

    return rows.map(r => ({
      id: r.registration_id,
      event_id: r.event_id,
      user_id: r.user_id,
      registered_at: r.registered_at,
      attended: Boolean(r.attended),
      checked_in_at: r.checked_in_at,
      attendance_source: r.attendance_source,
      name: r.name,
      email: r.email,
      avatar_url: r.avatar_url,
      degree: r.degree || 'B.Tech',
      major: r.major || 'Engineering',
      year_of_study: r.year_of_study || 'Junior (3rd Year)',
      graduation_year: r.graduation_year || '2026',
      campus_location: r.campus_location || 'Campus'
    }));
  }

  static updateSkillsPortfolio(userId: string, skills: any[]) {
    db.prepare('UPDATE profiles SET skills_portfolio_json = ? WHERE user_id = ?').run(JSON.stringify(skills), userId);
    return this.getProfile(userId);
  }

  static isEventRegistered(userId: string, eventId: string): boolean {
    const existing = db.prepare('SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?').get(userId, eventId);
    return Boolean(existing);
  }

  /**
   * Generates student Activity Portfolio & Co-curricular record
   */
  static getActivityPortfolio(userId: string) {
    const profile = this.getProfile(userId);
    const saved = this.getSavedEvents(userId);

    const regRows = db.prepare(`
      SELECT er.*, e.title, e.category, e.skills_taught_json, e.certificate_offered, e.start_time, e.end_time
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.user_id = ?
      ORDER BY e.start_time ASC
    `).all(userId) as any[];

    const attendedEvents: any[] = [];
    const upcomingEvents: any[] = [];
    const pastUnattendedEvents: any[] = [];
    const skillsExploredSet = new Set<string>();
    let certificatesEarned = 0;
    let networkingCount = 0;

    const now = new Date();

    for (const r of regRows) {
      const checkedIn = r.attended === 1 && r.attendance_source === 'organizer_checkin';
      if (checkedIn) {
        for (const s of JSON.parse(r.skills_taught_json || '[]')) skillsExploredSet.add(s);
      }

      // An offered certificate is not an earned one; count only for organizer-checked-in attendance.
      if (r.certificate_offered && checkedIn) {
        certificatesEarned++;
      }
      if (r.category === 'Networking' || r.category === 'Career Events') {
        networkingCount++;
      }

      const evDate = new Date(r.start_time);
      if (r.attended === 1) {
        attendedEvents.push({ ...r, attendance_verified: checkedIn });
      } else if (evDate < now) {
        // Registered but no attendance record: NOT counted as attended.
        pastUnattendedEvents.push(r);
      } else {
        upcomingEvents.push(r);
      }
    }

    // Verified hours: only organizer-checked-in attendance counts (registration or a past date does not).
    const verifiedHours = Number(regRows
      .filter(r => r.attended === 1 && r.attendance_source === 'organizer_checkin')
      .reduce((a, r) => a + Math.max(0, (new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / 3600000 || 0), 0)
      .toFixed(1));

    // Also count reviews authored
    const reviewCount = (db.prepare('SELECT COUNT(*) as count FROM reviews WHERE user_id = ?').get(userId) as any)?.count || 0;

    return {
      stats: {
        eventsAttended: attendedEvents.length,
        skillsExplored: skillsExploredSet.size,
        certificatesEarned,
        networkingEvents: networkingCount,
        reviewsContributed: reviewCount,
        verifiedHoursLogged: verifiedHours
      },
      skillsExploredList: Array.from(skillsExploredSet),
      upcomingEvents,
      attendedEvents,
      pastUnattendedEvents,
      savedCount: saved.length
    };
  }
}
