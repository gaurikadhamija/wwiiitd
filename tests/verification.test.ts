import { test, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.WORTHWHILE_DB_PATH = ':memory:';

let api: any, db: any, AuthService: any, VerificationService: any, seedDatabase: any;
let studentToken = '';
let studentId = '';
let student2Token = '';
let student2Id = '';
let orgReviewerToken = '';
let orgRegularToken = '';
let adminToken = '';

type Resp = { status: number; body: any };

async function call(
  method: string,
  url: string,
  opts: { token?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<Resp> {
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  const q: Record<string, string> = {};
  const qs = url.split('?')[1];
  if (qs) for (const [k, v] of new URLSearchParams(qs)) q[k] = v;
  const req: any = { method, url, headers, body: opts.body ?? {}, query: q };
  return new Promise<Resp>((resolve, reject) => {
    let status = 200;
    const res: any = {
      status(c: number) { status = c; return res; },
      json(b: any) { resolve({ status, body: b }); return res; },
    };
    try {
      const p = api.handle(req, res, () => resolve({ status: 404, body: null }));
      if (p && typeof p.catch === 'function') {
        p.catch(reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}

before(async () => {
  ({ db } = await import('../src/backend/db/connection.ts'));
  ({ seedDatabase } = await import('../src/backend/db/seed.ts'));
  ({ AuthService } = await import('../src/backend/services/authService.ts'));
  ({ VerificationService } = await import('../src/backend/services/verificationService.ts'));
  ({ apiRouter: api } = await import('../src/backend/routes/api.ts'));

  seedDatabase(true);

  // Authenticated sessions
  const s1 = AuthService.signup({ email: 'student_test1@iiitd.ac.in', password: 'password123', name: 'Tanvi Sharma', role: 'student' });
  studentToken = s1.token;
  studentId = s1.user.id;

  const s2 = AuthService.signup({ email: 'student_test2@dtu.ac.in', password: 'password123', name: 'Kabir Mehta', role: 'student' });
  student2Token = s2.token;
  student2Id = s2.user.id;

  // Organiser reviewer (Sarah Lin)
  const oRev = AuthService.demoLogin('organizer');
  orgReviewerToken = oRev.token;

  // Regular organiser without reviewer permissions
  const oReg = AuthService.signup({ email: 'regular_org@campus.edu', password: 'password123', name: 'Chess Club Lead', role: 'organizer' });
  orgRegularToken = oReg.token;

  // Admin
  db.prepare("UPDATE users SET session_token = 'token_admin' WHERE id = 'usr_admin_dean'").run();
  adminToken = 'token_admin';
});

test('student verification lifecycle: submit -> pending -> review', async () => {
  // 1. Initial status for new student is unverified
  const statusRes1 = await call('GET', '/verification/my-status', { token: studentToken });
  assert.equal(statusRes1.status, 200);
  assert.equal(statusRes1.body.data.status, 'unverified');

  // 2. Unauthenticated cannot submit verification
  const anonSubmit = await call('POST', '/verification/submit', {
    body: {
      institution: 'IIIT Delhi',
      department: 'Computer Science',
      academic_year: '3rd Year'
    }
  });
  assert.equal(anonSubmit.status, 401);

  // 3. Student submits verification
  const submitRes = await call('POST', '/verification/submit', {
    token: studentToken,
    body: {
      institution: 'Indraprastha Institute of Information Technology Delhi',
      department: 'Computer Science and Applied Mathematics',
      academic_year: 'Junior (3rd Year)',
      student_id_number: '2023CSAM102',
      verification_method: 'student_id_card',
      document_name: 'tanvi_iiitd_card.pdf',
      document_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136'
    }
  });
  assert.equal(submitRes.status, 200);
  assert.equal(submitRes.body.data.status, 'pending');
  const reqId = submitRes.body.data.id;
  assert.ok(reqId);

  // Status is now pending
  const statusRes2 = await call('GET', '/verification/my-status', { token: studentToken });
  assert.equal(statusRes2.status, 200);
  assert.equal(statusRes2.body.data.status, 'pending');

  // 4. Student CANNOT review or approve any verification request (security rule)
  const selfApprove = await call('POST', `/verification/requests/${reqId}/review`, {
    token: studentToken,
    body: { action: 'approve' }
  });
  assert.equal(selfApprove.status, 403);

  // 5. Ordinary organiser without reviewer rights CANNOT review (security rule)
  const nonReviewerRes = await call('POST', `/verification/requests/${reqId}/review`, {
    token: orgRegularToken,
    body: { action: 'approve' }
  });
  assert.equal(nonReviewerRes.status, 403);

  // 6. Non-reviewer organiser CANNOT list verification requests
  const nonReviewerList = await call('GET', '/verification/requests', { token: orgRegularToken });
  assert.equal(nonReviewerList.status, 403);

  // 7. Authorised reviewer CAN list requests and filter
  const reviewerList = await call('GET', '/verification/requests', { token: orgReviewerToken });
  assert.equal(reviewerList.status, 200);
  assert.ok(reviewerList.body.data.length >= 1);
  assert.ok(reviewerList.body.counts.pending >= 1);

  // Filter by search
  const searchRes = await call('GET', '/verification/requests?search=Tanvi', { token: orgReviewerToken });
  assert.equal(searchRes.status, 200);
  assert.equal(searchRes.body.data.some((r: any) => r.student_name.includes('Tanvi')), true);

  // 8. Authorised reviewer requests additional info
  const reqInfoRes = await call('POST', `/verification/requests/${reqId}/review`, {
    token: orgReviewerToken,
    body: {
      action: 'request_info',
      reason: 'Please upload a photo of the backside of your student ID card showing the current validity sticker.'
    }
  });
  assert.equal(reqInfoRes.status, 200);
  assert.equal(reqInfoRes.body.data.status, 'info_requested');

  // Verify student sees info_requested with reviewer reason
  const statusAfterInfo = await call('GET', '/verification/my-status', { token: studentToken });
  assert.equal(statusAfterInfo.body.data.status, 'info_requested');
  assert.ok(statusAfterInfo.body.data.info_request.includes('validity sticker'));

  // 9. Student resubmits with updated information
  const resubmitRes = await call('POST', '/verification/submit', {
    token: studentToken,
    body: {
      institution: 'Indraprastha Institute of Information Technology Delhi',
      department: 'Computer Science and Applied Mathematics',
      academic_year: 'Junior (3rd Year)',
      student_id_number: '2023CSAM102',
      verification_method: 'student_id_card',
      document_name: 'tanvi_iiitd_card_both_sides.pdf',
      document_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136'
    }
  });
  assert.equal(resubmitRes.status, 200);
  assert.equal(resubmitRes.body.data.status, 'pending');

  // 10. Reviewer approves student
  const approveRes = await call('POST', `/verification/requests/${reqId}/review`, {
    token: orgReviewerToken,
    body: { action: 'approve' }
  });
  assert.equal(approveRes.status, 200);
  assert.equal(approveRes.body.data.status, 'approved');

  // 11. Student is now verified in database
  const statusVerified = await call('GET', '/verification/my-status', { token: studentToken });
  assert.equal(statusVerified.body.data.status, 'verified');

  // 12. Also check GET /auth/me reflects student_verification_status = 'verified'
  const meRes = await call('GET', '/auth/me', { token: studentToken });
  assert.equal(meRes.body.data.user.student_verification_status, 'verified');

  // 13. Rejection test on student 2
  await call('POST', '/verification/submit', {
    token: student2Token,
    body: {
      institution: 'Delhi Technological University',
      department: 'Mechanical Engineering',
      academic_year: '1st Year'
    }
  });
  const s2Req = (await call('GET', '/verification/my-status', { token: student2Token })).body.data.verification;
  const rejectRes = await call('POST', `/verification/requests/${s2Req.id}/review`, {
    token: adminToken,
    body: { action: 'reject', reason: 'Student ID card expired or illegible.' }
  });
  assert.equal(rejectRes.status, 200);
  assert.equal(rejectRes.body.data.status, 'rejected');

  const s2Status = await call('GET', '/verification/my-status', { token: student2Token });
  assert.equal(s2Status.body.data.status, 'rejected');
  assert.ok(s2Status.body.data.rejection_reason.includes('expired or illegible'));
});
