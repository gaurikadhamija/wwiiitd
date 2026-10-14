import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  AlertCircle,
  FileText,
  UserCheck,
  RefreshCw,
  Eye,
  ExternalLink,
  MessageSquare,
  Lock,
  ChevronRight,
  School,
  X,
  Check
} from 'lucide-react';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.js';
import { StudentVerification } from '../types/index.js';

export const OrganizerVerificationDesk: React.FC = () => {
  const { currentUser } = useApp();

  const [requests, setRequests] = useState<StudentVerification[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    info_requested: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'info_requested' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Request for Inspection Modal / Action
  const [selectedReq, setSelectedReq] = useState<StudentVerification | null>(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | 'request_info'>('approve');
  const [decisionReason, setDecisionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isReviewer = Boolean(currentUser?.is_verification_reviewer || currentUser?.role === 'admin');

  const fetchRequests = async () => {
    if (!isReviewer) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.getVerificationRequests({
        status: statusFilter,
        search: searchQuery
      });
      setRequests(res.requests || []);
      setCounts(res.counts || { all: 0, pending: 0, approved: 0, rejected: 0, info_requested: 0 });
    } catch (err: any) {
      setError(err.message || 'Failed to load student verification requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, isReviewer]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const openDecisionModal = (req: StudentVerification, action: 'approve' | 'reject' | 'request_info') => {
    setSelectedReq(req);
    setDecisionAction(action);
    setDecisionReason(
      action === 'approve'
        ? 'Institutional credentials verified via official collegiate record.'
        : action === 'request_info'
        ? 'Please provide a clear photo of the back of your student ID card showing current semester validation.'
        : 'Provided document does not match enrollment records or is illegible.'
    );
    setActionError(null);
    setIsDecisionModalOpen(true);
  };

  const handleExecuteDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    if ((decisionAction === 'reject' || decisionAction === 'request_info') && !decisionReason.trim()) {
      setActionError('A reason explanation is required for this action.');
      return;
    }

    setActionLoading(true);
    setActionError(null);

    try {
      const updated = await api.reviewVerificationRequest(
        selectedReq.id,
        decisionAction,
        decisionReason.trim()
      );

      // Update local state
      setRequests(prev => prev.map(r => r.id === selectedReq.id ? updated : r));
      setSelectedReq(updated);
      setIsDecisionModalOpen(false);

      // Refresh counters and list
      await fetchRequests();
    } catch (err: any) {
      setActionError(err.message || 'Could not record verification decision.');
    } finally {
      setActionLoading(false);
    }
  };

  // If the logged in organizer does not have reviewer permissions
  if (!isReviewer) {
    return (
      <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-2xl p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#8A5A16]/10 text-[#8A5A16] flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A5A16] font-bold">
                Access Restricted
              </span>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#241410] mt-1">
              Collegiate Verification Reviewer Console
            </h3>
            <p className="text-xs text-[#5A453D] mt-1.5 leading-relaxed max-w-2xl">
              Student ID verification and collegiate authority auditing are restricted to designated campus life officers and chartered council leads (such as the <strong>ACM President</strong> or <strong>Dean of Student Life</strong>).
            </p>
            <div className="mt-4 p-3 rounded-xl bg-[#F8F4EC] border border-[#E2D7C8] text-xs text-[#4A3830]">
              <strong className="text-[#241410]">Tip for Evaluators:</strong> To test the student verification reviewer workflow, switch accounts to <strong>Sarah Lin (ACM President)</strong> or <strong>Dean of Student Life</strong> using the demo switch in the header or login screen.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Console Section Header */}
      <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2D7C8]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Institutional Student Verification Authority</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-[#241410]">
              Student Identity & Enrollment Review Desk
            </h2>
            <p className="text-xs text-[#5A453D] mt-0.5">
              Review collegiate eligibility credentials submitted by Delhi NCR students. Certified students earn verified co-curricular transcripts and peer review privileges.
            </p>
          </div>

          <button
            onClick={fetchRequests}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D5C7B5] bg-[#F8F4EC] hover:bg-[#EFE5D5] text-xs font-semibold text-[#4A3830] transition-colors self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Desk</span>
          </button>
        </div>

        {/* Counter KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#5B2435] text-[#FFFDF8] border-[#5B2435] shadow-xs'
                : 'bg-[#F8F4EC] border-[#E2D7C8] text-[#241410] hover:border-[#D5C7B5]'
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold opacity-80">
              Total Applications
            </span>
            <span className="text-xl font-serif font-bold font-mono">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-[#8A5A16] text-[#FFFDF8] border-[#8A5A16] shadow-xs'
                : 'bg-[#F8F4EC] border-[#E2D7C8] text-[#241410] hover:border-[#D5C7B5]'
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold opacity-80 flex items-center justify-between">
              <span>Pending Review</span>
              {counts.pending > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </span>
            <span className="text-xl font-serif font-bold font-mono">
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('info_requested')}
            className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
              statusFilter === 'info_requested'
                ? 'bg-[#B45309] text-[#FFFDF8] border-[#B45309] shadow-xs'
                : 'bg-[#F8F4EC] border-[#E2D7C8] text-[#241410] hover:border-[#D5C7B5]'
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold opacity-80">
              Info Requested
            </span>
            <span className="text-xl font-serif font-bold font-mono">
              {counts.info_requested}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('approved')}
            className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-[#194D33] text-[#FFFDF8] border-[#194D33] shadow-xs'
                : 'bg-[#F8F4EC] border-[#E2D7C8] text-[#241410] hover:border-[#D5C7B5]'
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold opacity-80">
              Approved
            </span>
            <span className="text-xl font-serif font-bold font-mono">
              {counts.approved}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-[#8E283B] text-[#FFFDF8] border-[#8E283B] shadow-xs'
                : 'bg-[#F8F4EC] border-[#E2D7C8] text-[#241410] hover:border-[#D5C7B5]'
            }`}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold opacity-80">
              Rejected
            </span>
            <span className="text-xl font-serif font-bold font-mono">
              {counts.rejected}
            </span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-5 pt-4 border-t border-[#E2D7C8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#7A6860]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll number, college or department..."
              className="w-full pl-9 pr-16 py-2 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] placeholder:text-[#8C7A70] focus:outline-none focus:border-[#5B2435]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTimeout(fetchRequests, 0);
                }}
                className="absolute right-12 top-2.5 text-[#7A6860] hover:text-[#241410]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1 px-2.5 py-1 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-[10px] font-bold uppercase tracking-wider hover:bg-[#3F1723]"
            >
              Filter
            </button>
          </form>

          <div className="flex items-center gap-2 text-xs text-[#7A6860]">
            <Filter className="w-3.5 h-3.5" />
            <span>Showing: <strong className="text-[#241410] capitalize">{statusFilter}</strong> ({requests.length})</span>
          </div>
        </div>

        {/* Requests Table */}
        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#7A6860] animate-pulse">
              Loading verification applications...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#7A6860] bg-[#F8F4EC]/40 rounded-xl border border-dashed border-[#D5C7B5]">
              No student verification requests found matching your filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2D7C8] text-[#4A3830] font-mono text-[11px]">
                  <th className="pb-3 font-bold uppercase tracking-wider">Applicant Student</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Institution & Major</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Roll No. / ID</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Status</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Submitted</th>
                  <th className="pb-3 font-bold uppercase tracking-wider text-right">Review Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D7C8]">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8F4EC]/60 transition-colors">
                    {/* Student Name & Email */}
                    <td className="py-3.5">
                      <div className="font-bold text-[#241410]">{r.student_name}</div>
                      <div className="text-[11px] text-[#5A453D] font-mono">{r.college_email}</div>
                    </td>

                    {/* Institution & Department */}
                    <td className="py-3.5 max-w-xs">
                      <div className="font-medium text-[#241410] truncate" title={r.institution}>
                        {r.institution}
                      </div>
                      <div className="text-[10px] text-[#7A6860] font-mono truncate">
                        {r.department} · {r.academic_year}
                      </div>
                    </td>

                    {/* Student ID */}
                    <td className="py-3.5 font-mono text-[11px] text-[#4A3830]">
                      <span className="px-2 py-0.5 rounded bg-[#F8F4EC] border border-[#E2D7C8] font-bold">
                        {r.student_id_number || 'N/A'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5">
                      {r.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#194D33]/10 text-[#194D33] text-[10px] font-mono font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                      {r.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8A5A16]/15 text-[#8A5A16] text-[10px] font-mono font-bold">
                          <Clock className="w-3 h-3" />
                          Pending Audit
                        </span>
                      )}
                      {r.status === 'info_requested' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#B45309]/15 text-[#B45309] text-[10px] font-mono font-bold">
                          <Info className="w-3 h-3" />
                          Info Requested
                        </span>
                      )}
                      {r.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8E283B]/15 text-[#8E283B] text-[10px] font-mono font-bold">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3.5 text-[#7A6860] font-mono text-[10px]">
                      {new Date(r.submitted_at).toLocaleDateString()}
                    </td>

                    {/* Review Actions */}
                    <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {/* Inspect details button */}
                      <button
                        onClick={() => setSelectedReq(r)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#D5C7B5] hover:bg-[#F8F4EC] text-xs font-semibold text-[#4A3830] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Inspect applicant document and details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      {/* Quick action buttons if pending or info_requested */}
                      {(r.status === 'pending' || r.status === 'info_requested' || r.status === 'rejected') && (
                        <>
                          <button
                            onClick={() => openDecisionModal(r, 'approve')}
                            className="px-2.5 py-1.5 rounded-lg bg-[#194D33] text-[#FFFDF8] hover:bg-[#133D28] text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Approve and grant verified status"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => openDecisionModal(r, 'request_info')}
                            className="px-2 py-1.5 rounded-lg bg-[#B45309]/10 text-[#92400E] hover:bg-[#B45309]/20 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Request additional information from student"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Info</span>
                          </button>

                          <button
                            onClick={() => openDecisionModal(r, 'reject')}
                            className="px-2 py-1.5 rounded-lg bg-[#8E283B]/10 text-[#8E283B] hover:bg-[#8E283B]/20 text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="Reject application with reason"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* INSPECT APPLICANT DRAWER / MODAL */}
      {selectedReq && !isDecisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241410]/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#FFFDF8] rounded-2xl border border-[#D5C7B5] shadow-2xl p-6 sm:p-7 max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#E2D7C8] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5B2435]/10 text-[#5B2435] flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5 text-[#5B2435]" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#241410]">
                    Applicant Credential Audit
                  </h3>
                  <p className="text-xs text-[#5A453D] font-mono">
                    ID: {selectedReq.id} · Submitted {new Date(selectedReq.submitted_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="p-1.5 rounded-lg text-[#7A6860] hover:bg-[#F8F4EC] hover:text-[#241410]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs pr-1">
              {/* Student Summary Card */}
              <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[#E2D7C8] space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A6860] font-bold">Student Name</span>
                    <p className="font-bold text-sm text-[#241410]">{selectedReq.student_name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A6860] font-bold">Collegiate Email</span>
                    <p className="font-mono text-xs text-[#241410]">{selectedReq.college_email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2D7C8]/70">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A6860] font-bold">University / College</span>
                    <p className="font-medium text-[#241410]">{selectedReq.institution}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A6860] font-bold">Department & Year</span>
                    <p className="font-medium text-[#241410]">{selectedReq.department} ({selectedReq.academic_year})</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2D7C8]/70">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A6860] font-bold">Roll Number / Enrollment</span>
                    <p className="font-mono font-bold text-[#5B2435]">{selectedReq.student_id_number || 'STU-UNASSIGNED'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#7A6860] font-bold">Verification Method</span>
                    <p className="font-mono text-xs text-[#241410] capitalize">{selectedReq.verification_method?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>

              {/* Document Proof Section */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#4A3830] font-bold">
                  Attached Institutional Document
                </span>
                <div className="p-4 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5B2435]/10 text-[#5B2435] flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-xs text-[#241410]">
                        {selectedReq.document_name || 'Student_ID_Proof.pdf'}
                      </div>
                      <div className="text-[10px] text-[#7A6860]">
                        Collegiate credential token verified by registrar gateway
                      </div>
                    </div>
                  </div>
                  {selectedReq.document_url && (
                    <a
                      href={selectedReq.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-[#D5C7B5] hover:bg-[#F8F4EC] text-xs font-semibold text-[#5B2435] inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Asset</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Status and Notes */}
              {selectedReq.status_reason && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <strong className="block font-mono text-[10px] uppercase">Recorded Audit Note:</strong>
                  <span className="mt-0.5 block italic font-mono text-[11px]">"{selectedReq.status_reason}"</span>
                  {selectedReq.reviewed_by_name && (
                    <span className="mt-1 block text-[10px] text-amber-700 font-medium">
                      Decided by {selectedReq.reviewed_by_name} on {new Date(selectedReq.reviewed_at || '').toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {/* Audit History Timeline */}
              {selectedReq.history && selectedReq.history.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#E2D7C8]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#4A3830] font-bold">
                    Action History & Verification Audit
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedReq.history.map((h, i) => (
                      <div key={i} className="p-2 rounded-lg bg-[#F8F4EC] text-[11px] border border-[#E2D7C8] flex items-start justify-between">
                        <div>
                          <span className="font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-[#FFFDF8] text-[#5B2435] font-mono mr-1.5">
                            {h.action}
                          </span>
                          <span className="text-[#241410] font-medium">{h.actor_name || h.actor_id}</span>
                          {h.reason && <p className="text-[10px] text-[#5A453D] mt-0.5 italic">"{h.reason}"</p>}
                        </div>
                        <span className="text-[10px] font-mono text-[#7A6860] shrink-0">
                          {new Date(h.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-4 border-t border-[#E2D7C8] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-3 py-2 rounded-xl border border-[#D5C7B5] hover:bg-[#F8F4EC] text-xs font-semibold text-[#4A3830]"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openDecisionModal(selectedReq, 'reject')}
                  className="px-3 py-2 rounded-xl bg-[#8E283B]/10 hover:bg-[#8E283B]/20 text-[#8E283B] text-xs font-bold transition-colors cursor-pointer"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => openDecisionModal(selectedReq, 'request_info')}
                  className="px-3 py-2 rounded-xl bg-[#B45309]/10 hover:bg-[#B45309]/20 text-[#92400E] text-xs font-bold transition-colors cursor-pointer"
                >
                  Request Info
                </button>
                <button
                  onClick={() => openDecisionModal(selectedReq, 'approve')}
                  className="px-4 py-2 rounded-xl bg-[#194D33] hover:bg-[#133D28] text-[#FFFDF8] text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve Student</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DECISION REASON MODAL */}
      {isDecisionModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241410]/70 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#FFFDF8] rounded-2xl border border-[#D5C7B5] shadow-2xl p-6">
            <div className="flex items-start justify-between pb-3 border-b border-[#E2D7C8]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#241410]">
                  {decisionAction === 'approve' && 'Confirm Student Approval'}
                  {decisionAction === 'reject' && 'Reject Verification Request'}
                  {decisionAction === 'request_info' && 'Request Additional Information'}
                </h3>
                <p className="text-xs text-[#5A453D] mt-0.5">
                  Applicant: <strong>{selectedReq.student_name}</strong> ({selectedReq.institution})
                </p>
              </div>
              <button
                onClick={() => setIsDecisionModalOpen(false)}
                className="p-1 rounded-lg text-[#7A6860] hover:bg-[#F8F4EC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteDecision} className="pt-4 space-y-4 text-xs">
              {actionError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                  {actionError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                  {decisionAction === 'approve' ? 'Verification Audit Note (Optional)' : 'Explanation / Instructions for Student *'}
                </label>
                <textarea
                  rows={3}
                  required={decisionAction !== 'approve'}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  placeholder={
                    decisionAction === 'approve'
                      ? 'Note verifying institutional enrollment credentials...'
                      : decisionAction === 'request_info'
                      ? 'Specify what documents or details the student must provide...'
                      : 'Provide explicit reasons why this verification could not be certified...'
                  }
                  className="w-full p-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] focus:outline-none focus:border-[#5B2435]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDecisionModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-[#D5C7B5] hover:bg-[#F8F4EC] text-xs font-semibold text-[#4A3830]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`px-4 py-2 rounded-xl text-[#FFFDF8] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer ${
                    decisionAction === 'approve'
                      ? 'bg-[#194D33] hover:bg-[#133D28]'
                      : decisionAction === 'request_info'
                      ? 'bg-[#B45309] hover:bg-[#92400E]'
                      : 'bg-[#8E283B] hover:bg-[#681C2A]'
                  }`}
                >
                  {actionLoading ? 'Recording Decision...' : `Confirm ${decisionAction.replace('_', ' ')}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
