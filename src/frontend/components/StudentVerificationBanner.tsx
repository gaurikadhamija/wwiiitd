import React from 'react';
import { ShieldCheck, Clock, AlertCircle, Info, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext.js';

export const StudentVerificationBanner: React.FC = () => {
  const { currentUser, setIsVerificationModalOpen, isAuthenticated } = useApp();

  if (!isAuthenticated || currentUser?.role !== 'student') {
    return null;
  }

  const status = currentUser?.student_verification_status || 'unverified';

  if (status === 'verified') {
    return null; // Verified students don't need a reminder banner
  }

  return (
    <div className="w-full bg-[#FFFDF8] border-b border-[#E2D7C8] px-4 py-3 transition-all">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          {status === 'unverified' && (
            <div className="w-8 h-8 rounded-lg bg-[#5B2435]/10 text-[#5B2435] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
          )}
          {status === 'pending' && (
            <div className="w-8 h-8 rounded-lg bg-[#8A5A16]/10 text-[#8A5A16] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          )}
          {status === 'info_requested' && (
            <div className="w-8 h-8 rounded-lg bg-[#B45309]/10 text-[#B45309] flex items-center justify-center shrink-0">
              <Info className="w-4 h-4" />
            </div>
          )}
          {status === 'rejected' && (
            <div className="w-8 h-8 rounded-lg bg-[#8E283B]/10 text-[#8E283B] flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-sm text-[#241410]">
                {status === 'unverified' && 'Student Identity Verification Required'}
                {status === 'pending' && 'Student Verification Under Review'}
                {status === 'info_requested' && 'Action Required: Additional Verification Info Requested'}
                {status === 'rejected' && 'Student Verification Application Rejected'}
              </span>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                status === 'unverified'
                  ? 'bg-amber-100 text-amber-900'
                  : status === 'pending'
                  ? 'bg-amber-50 text-amber-800'
                  : status === 'info_requested'
                  ? 'bg-orange-100 text-orange-900'
                  : 'bg-red-100 text-red-900'
              }`}>
                {status === 'unverified' ? 'Not Verified' : status === 'pending' ? 'Pending Review' : status === 'info_requested' ? 'Action Needed' : 'Needs Resubmission'}
              </span>
            </div>
            <p className="text-xs text-[#5A453D] mt-0.5">
              {status === 'unverified' && 'Verify your institutional credentials to earn accredited attendance, claim verified skills, and publish peer reviews.'}
              {status === 'pending' && 'Your collegiate credentials are being audited by authorized campus organizers. Verified badges will appear automatically.'}
              {status === 'info_requested' && (currentUser?.verification_info_request ? `Reviewer message: "${currentUser.verification_info_request}"` : 'The reviewer needs clarification before certifying your collegiate standing.')}
              {status === 'rejected' && (currentUser?.verification_rejection_reason ? `Reviewer feedback: "${currentUser.verification_rejection_reason}"` : 'Please correct your collegiate credentials and resubmit for verification.')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsVerificationModalOpen(true)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs ${
            status === 'unverified'
              ? 'bg-[#5B2435] text-[#FFFDF8] hover:bg-[#3F1723]'
              : status === 'info_requested' || status === 'rejected'
              ? 'bg-[#92400E] text-[#FFFDF8] hover:bg-[#78350F]'
              : 'bg-[#F8F4EC] text-[#241410] border border-[#D5C7B5] hover:bg-[#EFE5D5]'
          }`}
        >
          <span>
            {status === 'unverified' && 'Verify Student ID'}
            {status === 'pending' && 'View Application'}
            {status === 'info_requested' && 'Respond & Resubmit'}
            {status === 'rejected' && 'Review & Resubmit'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
