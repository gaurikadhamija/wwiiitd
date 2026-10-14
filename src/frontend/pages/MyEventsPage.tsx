import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Clock,
  Bookmark,
  CheckCircle2,
  Star,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Plus,
  Trash2,
  Github,
  Linkedin,
  Globe,
  User,
  MapPin,
  ShieldCheck,
  Edit3,
  Info,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.js';
import { EventItem, SkillItem } from '../types/index.js';
import { EventCard } from '../components/EventCard.js';
import { AddSkillModal } from '../components/AddSkillModal.js';
import { EditProfileModal } from '../components/EditProfileModal.js';

export const MyEventsPage: React.FC = () => {
  const {
    navigateTo,
    setIsGoalsModalOpen,
    setReviewModalEvent,
    profile,
    currentUser,
    updateSkills,
    cancelRegistration,
    toggleSave,
    isEditProfileOpen,
    setIsEditProfileOpen,
    isAddSkillOpen,
    setIsAddSkillOpen,
    setIsVerificationModalOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState<'skills' | 'transcript' | 'saved' | 'upcoming' | 'attended'>('skills');
  const [activity, setActivity] = useState<any | null>(null);
  const [savedEvents, setSavedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<'all' | 'technical' | 'creative' | 'leadership' | 'other'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [actData, savedData] = await Promise.all([
        api.getUserActivity(),
        api.getSavedEvents()
      ]);
      setActivity(actData);
      setSavedEvents(savedData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = activity?.stats || {
    eventsAttended: 0,
    skillsExplored: 0,
    certificatesEarned: 0,
    networkingEvents: 0,
    reviewsContributed: 0,
    verifiedHoursLogged: 0
  };

  // Skills list from profile
  const skillsList: SkillItem[] = profile?.skills_portfolio || [];

  const filteredSkills = skillCategoryFilter === 'all'
    ? skillsList
    : skillsList.filter(s => s.category === skillCategoryFilter);

  const handleDeleteSkill = async (skillId: string) => {
    const updated = skillsList.filter(s => s.id !== skillId);
    try {
      await updateSkills(updated);
    } catch (err) {
      console.error('Delete skill error:', err);
    }
  };

  const handleCancelRegistration = async (eventId: string) => {
    if (!window.confirm('Cancel your RSVP for this event? Your seat will be freed.')) return;
    try {
      await cancelRegistration(eventId);
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let score = 0;
    if (currentUser?.name) score += 15;
    if (profile?.college_email || currentUser?.email) score += 15;
    if (profile?.degree && profile?.major) score += 20;
    if (profile?.graduation_year) score += 10;
    if (profile?.bio && profile.bio.length > 20) score += 15;
    if (profile?.portfolio_links?.github || profile?.portfolio_links?.linkedin || profile?.portfolio_links?.website) score += 10;
    if (skillsList.length > 0) score += 15;
    return Math.min(100, score);
  };

  const completionPct = calculateProfileCompletion();

  const getProficiencyBadge = (level: string) => {
    switch (level) {
      case 'expert':
        return <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#194D33] bg-[#194D33]/10 px-2 py-0.5 rounded">Expert</span>;
      case 'advanced':
        return <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B2435] bg-[#5B2435]/10 px-2 py-0.5 rounded">Advanced</span>;
      case 'intermediate':
        return <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#78350F] bg-[#78350F]/10 px-2 py-0.5 rounded">Intermediate</span>;
      default:
        return <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] bg-[#E2D7C8]/50 px-2 py-0.5 rounded">Beginner</span>;
    }
  };

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* SECTION 1: STUDENT PROFILE HEADER & PORTFOLIO HERO */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            
            {/* Student Info */}
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#5B2435] to-[#30231F] text-[#FFFDF8] flex items-center justify-center font-serif text-2xl sm:text-3xl font-bold shadow-md shrink-0 border-2 border-[#FFFDF8]">
                {currentUser?.name
                  ? currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')
                  : 'SC'}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#241410]">
                    {currentUser?.name || 'Alex Chen'}
                  </h1>
                  {currentUser?.student_verification_status === 'verified' && (
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="text-[11px] font-mono font-bold text-[#194D33] bg-[#194D33]/10 hover:bg-[#194D33]/15 px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                      title="Click to view collegiate verification details"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#194D33]" />
                      <span>Verified Student</span>
                    </button>
                  )}
                  {currentUser?.student_verification_status === 'pending' && (
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="text-[11px] font-mono font-bold text-[#8A5A16] bg-[#8A5A16]/10 hover:bg-[#8A5A16]/15 px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                      title="Verification application under review"
                    >
                      <Clock className="w-3 h-3 text-[#8A5A16]" />
                      <span>Verification Pending</span>
                    </button>
                  )}
                  {currentUser?.student_verification_status === 'info_requested' && (
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="text-[11px] font-mono font-bold text-[#B45309] bg-[#B45309]/10 hover:bg-[#B45309]/15 px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                      title="Click to see requested info"
                    >
                      <Info className="w-3 h-3 text-[#B45309]" />
                      <span>Action Required</span>
                    </button>
                  )}
                  {currentUser?.student_verification_status === 'rejected' && (
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="text-[11px] font-mono font-bold text-[#8E283B] bg-[#8E283B]/10 hover:bg-[#8E283B]/15 px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                      title="Click to review reason and resubmit"
                    >
                      <AlertCircle className="w-3 h-3 text-[#8E283B]" />
                      <span>Application Rejected</span>
                    </button>
                  )}
                  {(!currentUser?.student_verification_status || currentUser?.student_verification_status === 'unverified') && (
                    <button
                      onClick={() => setIsVerificationModalOpen(true)}
                      className="text-[11px] font-mono font-bold text-[#5B2435] bg-[#5B2435]/10 hover:bg-[#5B2435]/15 px-2.5 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
                      title="Click to submit verification credentials"
                    >
                      <ShieldCheck className="w-3 h-3 text-[#5B2435]" />
                      <span>Verify Student ID</span>
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-[#4A3830] font-medium">
                  {profile?.degree || 'B.Tech'} in {profile?.major || 'Computer Science & Engineering'} · {profile?.year_of_study || 'Junior (3rd Year)'} (Class of {profile?.graduation_year || '2026'})
                </p>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#7A6860] mt-2">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[#5B2435]" />
                    <span>{profile?.college_email || currentUser?.email || 'alex.chen@campus.edu'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#5B2435]" />
                    <span>{profile?.campus_location || 'South Delhi (IIT Delhi / IIIT Delhi)'}</span>
                  </span>
                </div>

                {profile?.bio && (
                  <p className="text-xs text-[#30231F] mt-3 leading-relaxed max-w-2xl italic">
                    "{profile.bio}"
                  </p>
                )}

                {/* Portfolio Links */}
                <div className="flex flex-wrap items-center gap-2.5 mt-4">
                  {profile?.portfolio_links?.github && (
                    <a
                      href={profile.portfolio_links.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE5D5] border border-[#E2D7C8] text-xs font-semibold text-[#241410] transition-colors"
                    >
                      <Github className="w-3.5 h-3.5 text-[#5B2435]" />
                      <span>GitHub</span>
                      <ExternalLink className="w-3 h-3 text-[#7A6860]" />
                    </a>
                  )}

                  {profile?.portfolio_links?.linkedin && (
                    <a
                      href={profile.portfolio_links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE5D5] border border-[#E2D7C8] text-xs font-semibold text-[#241410] transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-[#5B2435]" />
                      <span>LinkedIn</span>
                      <ExternalLink className="w-3 h-3 text-[#7A6860]" />
                    </a>
                  )}

                  {profile?.portfolio_links?.website && (
                    <a
                      href={profile.portfolio_links.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE5D5] border border-[#E2D7C8] text-xs font-semibold text-[#241410] transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#5B2435]" />
                      <span>Portfolio Web</span>
                      <ExternalLink className="w-3 h-3 text-[#7A6860]" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Actions & Completion Indicator */}
            <div className="flex flex-col items-start md:items-end justify-between gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => setIsGoalsModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#F8F4EC] hover:bg-[#EFE5D5] border border-[#D5C7B5] text-xs font-bold text-[#241410] transition-colors"
                >
                  Semester Goals
                </button>
              </div>

              {/* Completion Progress Bar */}
              <div className="w-full md:w-56 p-3 rounded-xl bg-[#F8F4EC]/80 border border-[#E2D7C8]">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#241410] mb-1.5">
                  <span className="font-mono uppercase tracking-wider text-[10px] text-[#7A6860]">Profile Strength</span>
                  <span className="text-[#5B2435]">{completionPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#E2D7C8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#5B2435] transition-all duration-500 rounded-full"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#7A6860] mt-1.5">
                  {completionPct === 100 ? 'All portfolio fields complete' : 'Add skills or bio to reach 100%'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: VERIFIED CO-CURRICULAR SCORECARD */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#241410] font-mono block">
              {stats.eventsAttended}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Sessions Attended
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#5B2435] font-mono block">
              {stats.verifiedHoursLogged} hrs
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Verified Hours
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#194D33] font-mono block">
              {stats.certificatesEarned}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Certificates
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#5B2435] font-mono block">
              {skillsList.length}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Portfolio Skills
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#241410] font-mono block">
              {stats.networkingEvents}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Networking
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#78350F] font-mono block">
              {savedEvents.length}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Saved Sessions
            </span>
          </div>
        </div>

        {/* SECTION 3: TAB NAVIGATION */}
        <div className="flex border-b border-[#E2D7C8] overflow-x-auto gap-2 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-3 px-4 border-b-2 font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'skills'
                ? 'border-[#5B2435] text-[#5B2435]'
                : 'border-transparent text-[#7A6860] hover:text-[#241410]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Skills Portfolio ({skillsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`py-3 px-4 border-b-2 font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'transcript'
                ? 'border-[#5B2435] text-[#5B2435]'
                : 'border-transparent text-[#7A6860] hover:text-[#241410]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Verified Transcript ({activity?.attendedEvents?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-3 px-4 border-b-2 font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'border-[#5B2435] text-[#5B2435]'
                : 'border-transparent text-[#7A6860] hover:text-[#241410]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Upcoming Registrations ({activity?.upcomingEvents?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`py-3 px-4 border-b-2 font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'border-[#5B2435] text-[#5B2435]'
                : 'border-transparent text-[#7A6860] hover:text-[#241410]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Events ({savedEvents.length})</span>
          </button>
        </div>

        {/* SECTION 4: TAB CONTENT PANELS */}

        {/* TAB 1: SKILLS PORTFOLIO */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Category filter pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {(['all', 'technical', 'creative', 'leadership', 'other'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSkillCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-colors ${
                      skillCategoryFilter === cat
                        ? 'bg-[#5B2435] text-[#FFFDF8]'
                        : 'bg-[#FFFDF8] border border-[#D5C7B5] text-[#4A3830] hover:bg-[#F8F4EC]'
                    }`}
                  >
                    {cat === 'all' ? 'All Competencies' : cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAddSkillOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Skill</span>
              </button>
            </div>

            {/* Explanatory banner */}
            <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[#E2D7C8] text-xs text-[#5A453D] flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#194D33] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-[#241410]">Verified vs. Self-Reported:</strong> Skills highlighted with a green badge are audited via organizer attendance check-ins at curriculum workshops. Self-reported skills showcase your personal projects and learning pursuits.
              </div>
            </div>

            {/* Skills Cards Grid */}
            {filteredSkills.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#FFFDF8] border border-[#E2D7C8]">
                <Award className="w-10 h-10 text-[#7A6860] mx-auto mb-3" />
                <h4 className="text-base font-serif font-bold text-[#241410]">No skills listed yet</h4>
                <p className="text-xs text-[#7A6860] mt-1 max-w-sm mx-auto">
                  Showcase technical competencies, creative tools, or leadership experiences to elevate your verified student profile.
                </p>
                <button
                  onClick={() => setIsAddSkillOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#5B2435] text-[#FFFDF8] text-xs font-bold"
                >
                  Add Your First Skill
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSkills.map(skill => (
                  <div
                    key={skill.id}
                    className="p-5 rounded-2xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs flex flex-col justify-between group hover:border-[#5B2435]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#7A6860]">
                          {skill.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {getProficiencyBadge(skill.proficiency)}
                          <button
                            onClick={() => handleDeleteSkill(skill.id)}
                            className="text-[#7A6860] hover:text-[#5B2435] p-1 transition-colors"
                            title="Remove skill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-base font-serif font-bold text-[#241410]">
                        {skill.name}
                      </h4>

                      {skill.isVerified ? (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#194D33]/10 text-[10px] text-[#194D33] font-mono font-bold">
                          <CheckCircle2 className="w-3 h-3 text-[#194D33]" />
                          <span>Verified: {skill.verifiedSource || 'Campus Event Attendance'}</span>
                        </div>
                      ) : (
                        <span className="mt-2 block text-[10px] font-mono text-[#7A6860]">
                          Claimed Competency
                        </span>
                      )}

                      {skill.evidenceNotes && (
                        <p className="text-xs text-[#4A3830] mt-2.5 leading-relaxed bg-[#F8F4EC]/60 p-2 rounded-lg">
                          {skill.evidenceNotes}
                        </p>
                      )}
                    </div>

                    {skill.evidenceUrl && (
                      <div className="mt-4 pt-3 border-t border-[#E2D7C8]/60">
                        <a
                          href={skill.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#5B2435] hover:underline font-bold"
                        >
                          <span>Inspect Project Evidence</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VERIFIED CO-CURRICULAR TRANSCRIPT */}
        {activeTab === 'transcript' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#241410]">
                  Official Event Attendance Transcript
                </h3>
                <p className="text-xs text-[#5A453D] mt-0.5">
                  Only organizer check-in records are certified on your co-curricular transcript.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-[#194D33] font-bold">
                  ✓ {stats.eventsAttended} Verified Check-ins
                </span>
                <span className="text-[#5B2435] font-bold">
                  ⚡ {stats.verifiedHoursLogged} Verified Hours
                </span>
              </div>
            </div>

            {(!activity?.attendedEvents || activity.attendedEvents.length === 0) ? (
              <div className="p-12 text-center rounded-2xl bg-[#FFFDF8] border border-[#E2D7C8]">
                <Clock className="w-10 h-10 text-[#7A6860] mx-auto mb-3" />
                <h4 className="text-base font-serif font-bold text-[#241410]">No checked-in events yet</h4>
                <p className="text-xs text-[#7A6860] mt-1 max-w-sm mx-auto">
                  When you attend a registered campus workshop or hackathon, the organizer checks you in at the desk to stamp your transcript.
                </p>
                <button
                  onClick={() => navigateTo('discover')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#5B2435] text-[#FFFDF8] text-xs font-bold"
                >
                  Explore Upcoming Sessions
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.attendedEvents.map((r: any) => (
                  <div
                    key={r.id || r.event_id}
                    className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B2435] bg-[#5B2435]/10 px-2 py-0.5 rounded">
                          {r.category || 'Workshop'}
                        </span>
                        {r.attendance_verified && (
                          <span className="text-[10px] font-mono font-bold text-[#194D33] bg-[#194D33]/10 px-2 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#194D33]" />
                            <span>Organizer Check-In Certified</span>
                          </span>
                        )}
                        {r.certificate_offered && (
                          <span className="text-[10px] font-mono font-bold text-[#78350F] bg-[#78350F]/10 px-2 py-0.5 rounded flex items-center gap-1">
                            <Award className="w-3 h-3 text-[#78350F]" />
                            <span>Certificate Issued</span>
                          </span>
                        )}
                      </div>

                      <h4
                        onClick={() => navigateTo('event-details', r.event_id || r.id)}
                        className="text-base font-serif font-bold text-[#241410] hover:text-[#5B2435] cursor-pointer"
                      >
                        {r.title}
                      </h4>

                      <div className="flex items-center gap-4 text-xs text-[#7A6860] mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(r.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setReviewModalEvent({ id: r.event_id || r.id, title: r.title } as any);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#F8F4EC] hover:bg-[#EFE5D5] text-xs font-bold text-[#241410] transition-colors border border-[#D5C7B5]"
                      >
                        Write Review
                      </button>
                      <button
                        onClick={() => navigateTo('event-details', r.event_id || r.id)}
                        className="px-3.5 py-2 rounded-xl bg-[#5B2435] text-[#FFFDF8] text-xs font-bold hover:bg-[#3F1723] transition-colors shadow-xs"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: UPCOMING REGISTRATIONS */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {(!activity?.upcomingEvents || activity.upcomingEvents.length === 0) ? (
              <div className="p-12 text-center rounded-2xl bg-[#FFFDF8] border border-[#E2D7C8]">
                <Calendar className="w-10 h-10 text-[#7A6860] mx-auto mb-3" />
                <h4 className="text-base font-serif font-bold text-[#241410]">No upcoming registrations</h4>
                <p className="text-xs text-[#7A6860] mt-1 max-w-sm mx-auto">
                  Browse campus workshops, hackathons, and networking sessions matched to your semester priorities.
                </p>
                <button
                  onClick={() => navigateTo('discover')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#5B2435] text-[#FFFDF8] text-xs font-bold"
                >
                  Discover Events
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.upcomingEvents.map((ev: any) => (
                  <div
                    key={ev.id || ev.event_id}
                    className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B2435] bg-[#5B2435]/10 px-2 py-0.5 rounded">
                          {ev.category || 'Event'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#194D33] bg-[#194D33]/10 px-2 py-0.5 rounded">
                          RSVP Confirmed
                        </span>
                      </div>
                      <h4
                        onClick={() => navigateTo('event-details', ev.event_id || ev.id)}
                        className="text-base font-serif font-bold text-[#241410] hover:text-[#5B2435] cursor-pointer"
                      >
                        {ev.title}
                      </h4>
                      <p className="text-xs text-[#7A6860] mt-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-[#5B2435]" />
                        <span>{new Date(ev.start_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCancelRegistration(ev.event_id || ev.id)}
                        className="px-3 py-1.5 rounded-lg border border-[#D5C7B5] hover:bg-[#5B2435]/10 text-xs text-[#5B2435] font-semibold transition-colors"
                      >
                        Cancel RSVP
                      </button>
                      <button
                        onClick={() => navigateTo('event-details', ev.event_id || ev.id)}
                        className="px-4 py-2 rounded-xl bg-[#5B2435] text-[#FFFDF8] text-xs font-bold hover:bg-[#3F1723] transition-colors shadow-xs"
                      >
                        View Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SAVED SESSIONS */}
        {activeTab === 'saved' && (
          <div>
            {savedEvents.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#FFFDF8] border border-[#E2D7C8]">
                <Bookmark className="w-10 h-10 text-[#7A6860] mx-auto mb-3" />
                <h4 className="text-base font-serif font-bold text-[#241410]">No saved sessions yet</h4>
                <p className="text-xs text-[#7A6860] mt-1 max-w-sm mx-auto">
                  Bookmark interesting workshops and conferences from the Discover catalog to review their fit score later.
                </p>
                <button
                  onClick={() => navigateTo('discover')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#5B2435] text-[#FFFDF8] text-xs font-bold"
                >
                  Browse Campus Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODALS */}
      <EditProfileModal />
      <AddSkillModal
        isOpen={isAddSkillOpen}
        onClose={() => setIsAddSkillOpen(false)}
        existingSkills={skillsList}
      />
    </div>
  );
};
