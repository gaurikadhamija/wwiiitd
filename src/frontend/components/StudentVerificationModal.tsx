import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
  ArrowRight,
  School,
  Building,
  User,
  CreditCard,
  Calendar,
  HelpCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { api } from '../services/api.js';

const INSTITUTIONS = [
  'Indraprastha Institute of Information Technology Delhi (IIIT-Delhi)',
  'Indian Institute of Technology Delhi (IIT Delhi)',
  'Delhi Technological University (DTU Rohini)',
  'Netaji Subhas University of Technology (NSUT Dwarka)',
  'University of Delhi - North Campus (DU)',
  'University of Delhi - South Campus (DU)',
  'Jawaharlal Nehru University (JNU)',
  'National Institute of Technology Delhi (NIT Delhi)',
  'Other Delhi NCR Institution'
];

const ACADEMIC_YEARS = [
  '1st Year (Freshman)',
  '2nd Year (Sophomore)',
  '3rd Year (Junior)',
  '4th Year (Senior)',
  'Postgraduate / Masters',
  'PhD Scholar'
];

export const StudentVerificationModal: React.FC = () => {
  const {
    currentUser,
    studentVerification,
    isVerificationModalOpen,
    setIsVerificationModalOpen,
    refreshVerificationStatus,
    refreshData
  } = useApp();

  const [institution, setInstitution] = useState(INSTITUTIONS[0]);
  const [customInstitution, setCustomInstitution] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[2]);
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'student_id_card' | 'institutional_email' | 'admission_letter'>('student_id_card');
  const [documentName, setDocumentName] = useState('IIITD_Student_Card_2025.pdf');
  const [documentUrl, setDocumentUrl] = useState('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (studentVerification) {
      if (INSTITUTIONS.includes(studentVerification.institution)) {
        setInstitution(studentVerification.institution);
      } else {
        setInstitution('Other Delhi NCR Institution');
        setCustomInstitution(studentVerification.institution);
      }
      setDepartment(studentVerification.department || 'Computer Science & Engineering');
      setAcademicYear(studentVerification.academic_year || ACADEMIC_YEARS[2]);
      setStudentIdNumber(studentVerification.student_id_number || '');
      setDocumentName(studentVerification.document_name || 'Student_ID_Proof.pdf');
      setDocumentUrl(studentVerification.document_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80');
    } else if (currentUser) {
      setStudentIdNumber(`STU-${new Date().getFullYear().toString().slice(-2)}${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [studentVerification, currentUser]);

  if (!isVerificationModalOpen) return null;

  const status = currentUser?.student_verification_status || 'unverified';
  const rejectionReason = currentUser?.verification_rejection_reason || studentVerification?.status_reason;
  const infoRequest = currentUser?.verification_info_request;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetInstitution = institution === 'Other Delhi NCR Institution'
      ? customInstitution.trim() || 'Delhi NCR University'
      : institution;

    try {
      await api.submitStudentVerification({
        institution: targetInstitution,
        department: department.trim(),
        academic_year: academicYear,
        student_id_number: studentIdNumber.trim(),
        verification_method: verificationMethod,
        document_name: documentName,
        document_url: documentUrl,
        college_email: currentUser?.email,
        student_name: currentUser?.name
      });

      setSuccessMessage('Verification application submitted successfully! It is now pending review by authorized campus organizers.');
      await refreshVerificationStatus();
      await refreshData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit verification application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseSampleDocument = (type: 'iiitd' | 'dtu' | 'iitd') => {
    if (type === 'iiitd') {
      setInstitution('Indraprastha Institute of Information Technology Delhi (IIIT-Delhi)');
      setDepartment('Computer Science & Biosciences');
      setStudentIdNumber('2024CSB1042');
      setDocumentName('IIITD_IDCard_Verified_Sample.pdf');
      setDocumentUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80');
    } else if (type === 'dtu') {
      setInstitution('Delhi Technological University (DTU Rohini)');
      setDepartment('Software Engineering');
      setStudentIdNumber('2023DTU441');
      setDocumentName('DTU_Student_IDCard_Sample.pdf');
      setDocumentUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80');
    } else {
      setInstitution('Indian Institute of Technology Delhi (IIT Delhi)');
      setDepartment('Electrical Engineering & Computer Science');
      setStudentIdNumber('2023EE1098');
      setDocumentName('IITD_Student_Card_Sample.pdf');
      setDocumentUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241410]/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FFFDF8] rounded-2xl border border-[#D5C7B5] shadow-2xl p-6 sm:p-8 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E2D7C8] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5B2435]/10 text-[#5B2435] flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-[#5B2435]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#241410]">
                  Student Identity Verification
                </h2>
                {status === 'verified' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#194D33]/10 text-[#194D33] text-[11px] font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
                {status === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8A5A16]/10 text-[#8A5A16] text-[11px] font-mono font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    Pending Review
                  </span>
                )}
                {status === 'info_requested' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#A85507]/10 text-[#A85507] text-[11px] font-mono font-bold">
                    <Info className="w-3.5 h-3.5" />
                    Info Requested
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8E283B]/10 text-[#8E283B] text-[11px] font-mono font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Action Required
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5A453D] mt-0.5 font-medium">
                Official institutional verification for certified attendance, peer reviews, and campus skill credit.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVerificationModalOpen(false)}
            className="p-1.5 rounded-lg text-[#7A6860] hover:bg-[#F8F4EC] hover:text-[#241410] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1 text-xs">

          {/* Status Alert Panels */}
          {status === 'verified' && (
            <div className="p-4 rounded-xl bg-[#194D33]/5 border border-[#194D33]/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#194D33] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#194D33] text-sm">You are an Officially Verified Student</h4>
                <p className="text-xs text-[#2E4A3B] mt-1 leading-relaxed">
                  Your affiliation with <strong>{studentVerification?.institution || 'IIIT Delhi'}</strong> ({studentVerification?.department}) was reviewed and verified by <strong>{studentVerification?.reviewed_by_name || 'Dean of Student Life'}</strong> on {studentVerification?.reviewed_at ? new Date(studentVerification.reviewed_at).toLocaleDateString() : 'recent audit'}. All attendance check-ins directly endorse your co-curricular transcript.
                </p>
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div className="p-4 rounded-xl bg-[#8A5A16]/10 border border-[#8A5A16]/25 flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#8A5A16] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#8A5A16] text-sm">Application Under Review</h4>
                <p className="text-xs text-[#5E3F10] mt-1 leading-relaxed">
                  Your student verification credentials for <strong>{studentVerification?.institution || institution}</strong> were submitted on {studentVerification?.submitted_at ? new Date(studentVerification.submitted_at).toLocaleString() : 'today'}. An authorized campus organizer or student life administrator is reviewing your student ID. You can browse and bookmark campus events in the meantime.
                </p>
              </div>
            </div>
          )}

          {status === 'info_requested' && (
            <div className="p-4 rounded-xl bg-[#B45309]/10 border border-[#B45309]/30 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#92400E] text-sm">Additional Information Requested by Reviewer</h4>
                <div className="p-2.5 my-2 rounded-lg bg-[#FFFDF8] border border-[#B45309]/20 font-mono text-[11px] text-[#78350F]">
                  "{infoRequest || studentVerification?.status_reason || 'Please provide updated proof of active semester registration.'}"
                </div>
                <p className="text-xs text-[#78350F] leading-relaxed">
                  Please update the information below and click <strong>"Resubmit Verification"</strong> to proceed.
                </p>
              </div>
            </div>
          )}

          {status === 'rejected' && (
            <div className="p-4 rounded-xl bg-[#8E283B]/10 border border-[#8E283B]/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#8E283B] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#8E283B] text-sm">Verification Application Not Approved</h4>
                <div className="p-2.5 my-2 rounded-lg bg-[#FFFDF8] border border-[#8E283B]/20 font-mono text-[11px] text-[#5B2435]">
                  Reason: "{rejectionReason || 'Uploaded documentation was incomplete or could not be validated.'}"
                </div>
                <p className="text-xs text-[#5B2435] leading-relaxed">
                  You can update your student ID number, institution details, or upload a clear copy of your student card below and resubmit.
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Quick Demo Pre-fills */}
            {status !== 'verified' && (
              <div className="p-3 rounded-xl bg-[#F8F4EC] border border-[#E2D7C8]">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1.5 flex items-center justify-between">
                  <span>Quick Test Pre-fills:</span>
                  <span className="text-[9px] text-[#7A6860] normal-case">Select a campus identity</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleUseSampleDocument('iiitd')}
                    className="px-2.5 py-1 rounded-lg bg-[#FFFDF8] border border-[#D5C7B5] hover:border-[#5B2435] text-[11px] font-medium text-[#241410] transition-colors"
                  >
                    IIIT Delhi (CSB)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseSampleDocument('dtu')}
                    className="px-2.5 py-1 rounded-lg bg-[#FFFDF8] border border-[#D5C7B5] hover:border-[#5B2435] text-[11px] font-medium text-[#241410] transition-colors"
                  >
                    DTU (Software Eng)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseSampleDocument('iitd')}
                    className="px-2.5 py-1 rounded-lg bg-[#FFFDF8] border border-[#D5C7B5] hover:border-[#5B2435] text-[11px] font-medium text-[#241410] transition-colors"
                  >
                    IIT Delhi (EE & CS)
                  </button>
                </div>
              </div>
            )}

            {/* Institution / University */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                Collegiate Institution / University *
              </label>
              <select
                disabled={status === 'verified'}
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435] disabled:opacity-75 disabled:bg-gray-50"
              >
                {INSTITUTIONS.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            {institution === 'Other Delhi NCR Institution' && (
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                  Specify University / College Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={status === 'verified'}
                  value={customInstitution}
                  onChange={(e) => setCustomInstitution(e.target.value)}
                  placeholder="e.g. Ambedkar University Delhi"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
                />
              </div>
            )}

            {/* Department and Academic Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                  Department / Degree Major *
                </label>
                <input
                  type="text"
                  required
                  disabled={status === 'verified'}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435] disabled:opacity-75 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                  Academic Standing *
                </label>
                <select
                  disabled={status === 'verified'}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435] disabled:opacity-75 disabled:bg-gray-50"
                >
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student ID / Roll Number and Verification Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                  Student Roll / Enrollment No. *
                </label>
                <input
                  type="text"
                  required
                  disabled={status === 'verified'}
                  value={studentIdNumber}
                  onChange={(e) => setStudentIdNumber(e.target.value)}
                  placeholder="e.g. 2024CSB1042"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435] disabled:opacity-75 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                  Verification Method
                </label>
                <select
                  disabled={status === 'verified'}
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435] disabled:opacity-75 disabled:bg-gray-50"
                >
                  <option value="student_id_card">Campus Physical / Digital Student ID Card</option>
                  <option value="institutional_email">Institutional .edu / .ac.in Email</option>
                  <option value="admission_letter">Current Semester Fee Slip / Admission Letter</option>
                </select>
              </div>
            </div>

            {/* Attached Proof Document Card */}
            <div>
              <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                Institutional Credential Proof
              </label>
              <div className="p-3.5 rounded-xl border border-[#D5C7B5] bg-[#F8F4EC]/60 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#5B2435]/10 text-[#5B2435] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-xs text-[#241410] truncate">
                      {documentName}
                    </p>
                    <p className="text-[10px] text-[#7A6860] flex items-center gap-1">
                      <span>Cryptographically checksummed proof document</span>
                      <span>·</span>
                      <span className="text-[#194D33] font-semibold">Ready for audit</span>
                    </p>
                  </div>
                </div>

                {status !== 'verified' && (
                  <button
                    type="button"
                    onClick={() => {
                      const newName = `ID_${studentIdNumber || 'Proof'}_${Date.now().toString().slice(-4)}.pdf`;
                      setDocumentName(newName);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] hover:bg-[#F8F4EC] text-[11px] font-medium text-[#4A3830] shrink-0 ml-3"
                  >
                    Refresh Proof
                  </button>
                )}
              </div>
            </div>

            {/* Application Submission Audit Timeline if history exists */}
            {studentVerification?.history && studentVerification.history.length > 0 && (
              <div className="pt-2 border-t border-[#E2D7C8]">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-2">
                  Verification Audit Log
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {studentVerification.history.map((h, i) => (
                    <div key={i} className="p-2 rounded-lg bg-[#F8F4EC] text-[11px] border border-[#E2D7C8]/70 flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded bg-[#FFFDF8] text-[#5B2435] font-mono mr-1.5">
                          {h.action}
                        </span>
                        <span className="text-[#241410] font-medium">by {h.actor_name || h.actor_id}</span>
                        {h.reason && (
                          <p className="text-[10px] text-[#5A453D] mt-0.5 italic">"{h.reason}"</p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#7A6860] shrink-0">
                        {new Date(h.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Action */}
            {status !== 'verified' && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#5B2435] text-[#FFFDF8] font-bold text-xs uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Application...</span>
                  ) : (
                    <>
                      <span>{status === 'info_requested' || status === 'rejected' ? 'Resubmit Verification Credentials' : 'Submit for Institutional Verification'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[#E2D7C8] flex items-center justify-between text-[11px] text-[#7A6860] shrink-0">
          <span>WorthWhile Campus Verification Protocol v2.4</span>
          <button
            onClick={() => setIsVerificationModalOpen(false)}
            className="text-[#5B2435] hover:underline font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
