import crypto from 'node:crypto';
import { db } from '../db/connection.js';
import { StudentVerification, StudentVerificationStatus, User } from '../types/index.js';
import { HttpError } from './errors.js';

export interface SubmitVerificationInput {
  institution: string;
  department: string;
  academic_year: string;
  student_id_number?: string;
  verification_method?: 'institutional_email' | 'student_id_card' | 'admission_letter' | 'digilocker_credential';
  document_name?: string;
  document_url?: string;
  college_email?: string;
  student_name?: string;
}

export class VerificationService {
  /**
   * Retrieves the current student's verification record (most recent application)
   */
  static getStudentVerification(userId: string): StudentVerification | null {
    const row = db.prepare(`
      SELECT * FROM student_verifications
      WHERE user_id = ?
      ORDER BY submitted_at DESC
      LIMIT 1
    `).get(userId) as any;

    if (!row) return null;
    return this.mapRowToVerification(row);
  }

  /**
   * Submits or resubmits a student verification request
   */
  static submitVerification(userId: string, input: SubmitVerificationInput): StudentVerification {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      throw new HttpError(404, 'User not found.');
    }
    if (user.role !== 'student') {
      throw new HttpError(400, 'Only student accounts can submit student verification.');
    }

    if (user.student_verification_status === 'verified') {
      throw new HttpError(400, 'Your student status is already verified.');
    }

    if (!input.institution?.trim()) {
      throw new HttpError(400, 'Institution/University name is required.');
    }
    if (!input.department?.trim()) {
      throw new HttpError(400, 'Department/Major is required.');
    }
    if (!input.academic_year?.trim()) {
      throw new HttpError(400, 'Academic year is required.');
    }

    const verificationId = `vreq_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const studentName = input.student_name?.trim() || user.name;
    const collegeEmail = input.college_email?.trim().toLowerCase() || user.email;
    const method = input.verification_method || 'student_id_card';
    const docName = input.document_name?.trim() || `${studentName.replace(/\s+/g, '_')}_StudentID.pdf`;
    const docUrl = input.document_url?.trim() || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';

    const history = [
      {
        action: 'submitted',
        actor_id: userId,
        actor_name: studentName,
        timestamp: new Date().toISOString(),
        reason: 'Student submitted verification application with institutional credentials.'
      }
    ];

    // Check if an existing request exists for this user to update, or insert new
    const existingReq = db.prepare('SELECT id, history_json FROM student_verifications WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 1').get(userId) as any;

    if (existingReq) {
      let existingHistory: any[] = [];
      try {
        existingHistory = JSON.parse(existingReq.history_json || '[]');
      } catch (e) {
        existingHistory = [];
      }
      existingHistory.push({
        action: 'resubmitted',
        actor_id: userId,
        actor_name: studentName,
        timestamp: new Date().toISOString(),
        reason: 'Student updated and resubmitted verification credentials.'
      });

      db.prepare(`
        UPDATE student_verifications SET
          student_name = ?,
          college_email = ?,
          institution = ?,
          department = ?,
          academic_year = ?,
          student_id_number = ?,
          verification_method = ?,
          document_name = ?,
          document_url = ?,
          status = 'pending',
          status_reason = NULL,
          reviewed_by = NULL,
          reviewed_by_name = NULL,
          reviewed_at = NULL,
          updated_at = datetime('now'),
          history_json = ?
        WHERE id = ?
      `).run(
        studentName,
        collegeEmail,
        input.institution.trim(),
        input.department.trim(),
        input.academic_year.trim(),
        input.student_id_number?.trim() || 'STU-' + Math.floor(100000 + Math.random() * 900000),
        method,
        docName,
        docUrl,
        JSON.stringify(existingHistory),
        existingReq.id
      );

      // Update user state
      db.prepare(`
        UPDATE users SET
          student_verification_status = 'pending',
          verification_rejection_reason = NULL,
          verification_info_request = NULL
        WHERE id = ?
      `).run(userId);

      // Also update student profile college_email and campus_location if provided
      try {
        db.prepare(`
          UPDATE profiles SET
            college_email = COALESCE(?, college_email),
            degree = COALESCE(?, degree),
            major = COALESCE(?, major),
            year_of_study = COALESCE(?, year_of_study)
          WHERE user_id = ?
        `).run(collegeEmail, 'B.Tech', input.department.trim(), input.academic_year.trim(), userId);
      } catch (e) {
        // ignore
      }

      this.logAudit(userId, studentName, 'student', 'resubmitted', 'student_verification', existingReq.id, {
        institution: input.institution,
        department: input.department
      });

      const updated = db.prepare('SELECT * FROM student_verifications WHERE id = ?').get(existingReq.id) as any;
      return this.mapRowToVerification(updated);
    } else {
      db.prepare(`
        INSERT INTO student_verifications (
          id, user_id, student_name, college_email, institution, department, academic_year,
          student_id_number, verification_method, document_name, document_url,
          status, status_reason, submitted_at, updated_at, history_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, datetime('now'), datetime('now'), ?)
      `).run(
        verificationId,
        userId,
        studentName,
        collegeEmail,
        input.institution.trim(),
        input.department.trim(),
        input.academic_year.trim(),
        input.student_id_number?.trim() || 'STU-' + Math.floor(100000 + Math.random() * 900000),
        method,
        docName,
        docUrl,
        JSON.stringify(history)
      );

      // Update user state
      db.prepare(`
        UPDATE users SET
          student_verification_status = 'pending',
          verification_rejection_reason = NULL,
          verification_info_request = NULL
        WHERE id = ?
      `).run(userId);

      // Also update student profile
      try {
        db.prepare(`
          UPDATE profiles SET
            college_email = COALESCE(?, college_email),
            major = COALESCE(?, major),
            year_of_study = COALESCE(?, year_of_study)
          WHERE user_id = ?
        `).run(collegeEmail, input.department.trim(), input.academic_year.trim(), userId);
      } catch (e) {
        // ignore
      }

      this.logAudit(userId, studentName, 'student', 'submitted', 'student_verification', verificationId, {
        institution: input.institution,
        department: input.department
      });

      const created = db.prepare('SELECT * FROM student_verifications WHERE id = ?').get(verificationId) as any;
      return this.mapRowToVerification(created);
    }
  }

  /**
   * Retrieves all verification requests for authorised reviewers with optional filtering and search
   */
  static getAllRequests(filters?: { status?: string; search?: string }): {
    requests: StudentVerification[];
    counts: {
      all: number;
      pending: number;
      approved: number;
      rejected: number;
      info_requested: number;
    };
  } {
    // Total count by status
    const allRows = db.prepare('SELECT status FROM student_verifications').all() as any[];
    const counts = {
      all: allRows.length,
      pending: allRows.filter(r => r.status === 'pending').length,
      approved: allRows.filter(r => r.status === 'approved').length,
      rejected: allRows.filter(r => r.status === 'rejected').length,
      info_requested: allRows.filter(r => r.status === 'info_requested').length,
    };

    let sql = `
      SELECT sv.*, u.avatar_url, u.email as account_email
      FROM student_verifications sv
      LEFT JOIN users u ON sv.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status && filters.status !== 'all') {
      sql += ' AND sv.status = ?';
      params.push(filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim().toLowerCase()}%`;
      sql += ` AND (
        LOWER(sv.student_name) LIKE ? OR
        LOWER(sv.college_email) LIKE ? OR
        LOWER(sv.institution) LIKE ? OR
        LOWER(sv.department) LIKE ? OR
        LOWER(COALESCE(sv.student_id_number, '')) LIKE ?
      )`;
      params.push(q, q, q, q, q);
    }

    // Sort order: pending first, then newest
    sql += `
      ORDER BY 
        CASE sv.status
          WHEN 'pending' THEN 1
          WHEN 'info_requested' THEN 2
          WHEN 'rejected' THEN 3
          WHEN 'approved' THEN 4
          ELSE 5
        END ASC,
        sv.submitted_at DESC
    `;

    const rows = db.prepare(sql).all(...params) as any[];
    const requests = rows.map(r => this.mapRowToVerification(r));

    return { requests, counts };
  }

  /**
   * Authorised reviewer decision on a student verification request
   */
  static reviewRequest(
    reviewer: User,
    requestId: string,
    action: 'approve' | 'reject' | 'request_info',
    reason?: string
  ): StudentVerification {
    if (!this.canReviewVerifications(reviewer)) {
      throw new HttpError(403, 'Permission denied: Only authorized verification reviewers or campus administrators may inspect or decision student applications.');
    }

    const reqRow = db.prepare('SELECT * FROM student_verifications WHERE id = ?').get(requestId) as any;
    if (!reqRow) {
      throw new HttpError(404, 'Verification request not found.');
    }

    // Security rule: A student cannot approve their own verification
    if (reviewer.id === reqRow.user_id) {
      throw new HttpError(403, 'Security violation: Users cannot evaluate their own verification applications.');
    }

    let nextStatus: StudentVerificationStatus = 'pending';
    if (action === 'approve') {
      nextStatus = 'verified';
    } else if (action === 'reject') {
      if (!reason?.trim()) {
        throw new HttpError(400, 'A reason explanation is required when rejecting a student verification application.');
      }
      nextStatus = 'rejected';
    } else if (action === 'request_info') {
      if (!reason?.trim()) {
        throw new HttpError(400, 'Specific instructions detailing what additional information is required must be provided.');
      }
      nextStatus = 'info_requested';
    } else {
      throw new HttpError(400, 'Invalid verification decision action.');
    }

    let history: any[] = [];
    try {
      history = JSON.parse(reqRow.history_json || '[]');
    } catch (e) {
      history = [];
    }

    history.push({
      action: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'info_requested',
      actor_id: reviewer.id,
      actor_name: reviewer.name,
      timestamp: new Date().toISOString(),
      reason: reason?.trim() || (action === 'approve' ? 'Student eligibility and institutional credentials successfully verified.' : '')
    });

    // Update student_verifications table
    db.prepare(`
      UPDATE student_verifications SET
        status = ?,
        status_reason = ?,
        reviewed_by = ?,
        reviewed_by_name = ?,
        reviewed_at = datetime('now'),
        updated_at = datetime('now'),
        history_json = ?
      WHERE id = ?
    `).run(
      action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'info_requested',
      reason?.trim() || (action === 'approve' ? 'Verified by campus authority' : null),
      reviewer.id,
      reviewer.name,
      JSON.stringify(history),
      requestId
    );

    // Update users table
    if (action === 'approve') {
      db.prepare(`
        UPDATE users SET
          student_verification_status = 'verified',
          verification_rejection_reason = NULL,
          verification_info_request = NULL
        WHERE id = ?
      `).run(reqRow.user_id);
    } else if (action === 'reject') {
      db.prepare(`
        UPDATE users SET
          student_verification_status = 'rejected',
          verification_rejection_reason = ?,
          verification_info_request = NULL
        WHERE id = ?
      `).run(reason?.trim() || 'Application was not approved.', reqRow.user_id);
    } else if (action === 'request_info') {
      db.prepare(`
        UPDATE users SET
          student_verification_status = 'info_requested',
          verification_info_request = ?,
          verification_rejection_reason = NULL
        WHERE id = ?
      `).run(reason?.trim() ?? null, reqRow.user_id);
    }

    // Add in-app notification to student
    try {
      const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      let notifTitle = '';
      let notifMsg = '';
      if (action === 'approve') {
        notifTitle = 'Student Verification Approved!';
        notifMsg = `Congratulations! Your student verification for ${reqRow.institution} has been approved by ${reviewer.name}. You now have full access to certified attendance and peer reviews.`;
      } else if (action === 'reject') {
        notifTitle = 'Verification Application Update';
        notifMsg = `Your student verification was not approved. Reviewer note: "${reason?.trim()}". You may resubmit with revised credentials.`;
      } else {
        notifTitle = 'Additional Verification Info Needed';
        notifMsg = `Reviewer ${reviewer.name} requested additional details: "${reason?.trim()}". Please update your application.`;
      }

      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
        VALUES (?, ?, ?, ?, 'recommendation', 0, datetime('now'))
      `).run(notifId, reqRow.user_id, notifTitle, notifMsg);
    } catch (e) {
      // ignore notification errors
    }

    // Audit log
    this.logAudit(reviewer.id, reviewer.name, reviewer.role, action, 'student_verification', requestId, {
      student_id: reqRow.user_id,
      student_name: reqRow.student_name,
      reason: reason?.trim()
    });

    const updated = db.prepare('SELECT * FROM student_verifications WHERE id = ?').get(requestId) as any;
    return this.mapRowToVerification(updated);
  }

  /**
   * Check if user has permission to review student verification applications
   */
  static canReviewVerifications(user: User): boolean {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'organizer' && Boolean(user.is_verification_reviewer)) return true;
    return false;
  }

  private static logAudit(
    actorId: string,
    actorName: string,
    actorRole: string,
    action: string,
    targetType: string,
    targetId: string,
    details?: any
  ) {
    try {
      const id = `aud_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      db.prepare(`
        INSERT INTO verification_audit_logs (
          id, actor_id, actor_name, actor_role, action, target_type, target_id, details_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id,
        actorId,
        actorName,
        actorRole,
        action,
        targetType,
        targetId,
        details ? JSON.stringify(details) : null
      );
    } catch (e) {
      console.warn('Audit logging error:', e);
    }
  }

  private static mapRowToVerification(row: any): StudentVerification {
    let history: any[] = [];
    try {
      history = JSON.parse(row.history_json || '[]');
    } catch (e) {
      history = [];
    }

    return {
      id: row.id,
      user_id: row.user_id,
      student_name: row.student_name,
      college_email: row.college_email,
      institution: row.institution,
      department: row.department,
      academic_year: row.academic_year,
      student_id_number: row.student_id_number,
      verification_method: row.verification_method || 'student_id_card',
      document_name: row.document_name,
      document_url: row.document_url,
      status: row.status,
      status_reason: row.status_reason,
      reviewed_by: row.reviewed_by,
      reviewed_by_name: row.reviewed_by_name,
      reviewed_at: row.reviewed_at,
      submitted_at: row.submitted_at,
      updated_at: row.updated_at,
      history
    };
  }
}
