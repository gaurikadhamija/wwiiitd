export type UserRole = 'student' | 'organizer' | 'admin';
export type StudentVerificationStatus = 'unverified' | 'pending' | 'verified' | 'approved' | 'rejected' | 'info_requested' | 'suspended';
export type OrganiserApprovalStatus = 'pending_approval' | 'approved' | 'rejected' | 'suspended';

export interface StudentVerification {
  id: string;
  user_id: string;
  student_name: string;
  college_email: string;
  institution: string;
  department: string;
  academic_year: string;
  student_id_number?: string;
  verification_method: 'institutional_email' | 'student_id_card' | 'admission_letter' | 'digilocker_credential';
  document_name?: string;
  document_url?: string;
  status: StudentVerificationStatus;
  status_reason?: string;
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  submitted_at: string;
  updated_at: string;
  history?: Array<{
    action: string;
    actor_id: string;
    actor_name?: string;
    timestamp: string;
    reason?: string;
  }>;
}

export type EventCategory =
  | 'All'
  | 'Workshops'
  | 'Hackathons'
  | 'Career Events'
  | 'Networking'
  | 'Cultural'
  | 'Competitions';

export interface Organizer {
  id: string;
  name: string;
  slug: string;
  type: string;
  verified: boolean; // true only with a real verification process (none implemented yet => always false)
  is_demo?: boolean;
  trust_score: number;
  historical_events_count: number;
  avg_punctuality_rating: number;
  description: string;
  contact_email: string;
}

export interface Venue {
  id: string;
  name: string;
  building: string;
  room: string;
  campus_zone: string;
  address?: string;
  place_id?: string;
  city_region?: string;
  latitude: number;
  longitude: number;
  map_x: number;
  map_y: number;
  capacity: number;
  wheelchair_accessible: boolean;
}

export interface EventOutcome {
  id?: string;
  event_id: string;
  outcome_type: 'skills' | 'career' | 'credential' | 'networking' | 'portfolio';
  title: string;
  description: string;
  highlight?: string;
}

export interface OrganizerClaim {
  id: string;
  event_id: string;
  claim_text: string;
  claim_category: 'certificate' | 'mentorship' | 'food' | 'hands_on' | 'recruiting' | 'speakers';
  promised_outcome: string;
  verification_status: 'verified' | 'partially_verified' | 'contradicted' | 'insufficient_evidence';
  evidence_score: number;
  student_sample_size: number;
  notes?: string;
  is_demo?: boolean;
  /** demo = seeded illustration; submitted = unchecked evidence; verified = corroborated by organizer-checked-in attendees */
  evidence_tier?: 'demo' | 'submitted' | 'verified' | 'none';
  evidence_label?: string;
  submitted_count?: number;
  attendee_responses?: number;
}

export interface EventAnalytics {
  event_id: string;
  seats_total: number;
  seats_registered: number;
  seats_attended_live: number;
  attendance_rate_pct: number;
  delay_minutes_avg: number;
  peak_queue_time?: string;
  demand_level: 'low' | 'moderate' | 'high' | 'surge';
  signal_type: 'live' | 'historical' | 'estimated';
  is_demo?: boolean;
}

export interface RelevanceBreakdown {
  totalScore: number;
  goalFit: number;
  interestFit: number;
  careerValue: number;
  learningValue: number;
  convenience: number;
  communityScore: number;
  organizerTrust: number;
  explanation: string;
  topMatchingFactors: string[];
}

export interface Review {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_degree?: string;
  is_verified_attendee: boolean;
  is_demo?: boolean;
  verification_basis?: 'organizer_checkin' | null;
  rating_overall: number;
  rating_content: number;
  rating_speaker: number;
  rating_networking: number;
  rating_time_spent: number;
  rating_logistics: number;
  comment?: string;
  tags: string[];
  created_at: string;
}

export interface CommunityInsights {
  overallRating: number;
  totalReviews: number;
  verifiedReviews?: number;
  demoReviews?: number;
  isDemoSample?: boolean;
  hasData?: boolean;
  categoryAverages: {
    contentQuality: number;
    speakerQuality: number;
    networking: number;
    timeWellSpent: number;
    logistics: number;
  };
  topPositiveTags: string[];
  topConstructiveTags: string[];
  summaryStatements: {
    pros: string[];
    caveats: string[];
  };
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  organizer_id: string;
  venue_id: string;
  start_time: string;
  end_time: string;
  cost_cents: number;
  is_free: boolean;
  cover_image: string;
  max_capacity: number;
  certificate_offered: boolean;
  networking_potential: 'Low' | 'Moderate' | 'High' | 'Exceptional';
  career_value_rating: number;
  learning_value_rating: number;
  tags: string[];
  skills_taught: string[];
  prerequisites: string;
  is_published: boolean;
  created_at: string;
  organizer?: Organizer;
  venue?: Venue;
  outcomes?: EventOutcome[];
  claims?: OrganizerClaim[];
  analytics?: EventAnalytics;
  rating_avg?: number | null;
  review_count?: number;
  verified_review_count?: number;
  rating_is_demo?: boolean;
  is_demo?: boolean;
  relevance: RelevanceBreakdown;
  community_insights?: CommunityInsights;
  reviews?: Review[];
  saved_at?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category: 'technical' | 'creative' | 'leadership' | 'other';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidenceUrl?: string;
  evidenceNotes?: string;
  isVerified?: boolean;
  verifiedSource?: string;
}

export interface PortfolioLinks {
  github?: string;
  linkedin?: string;
  website?: string;
  twitter?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  status?: 'active' | 'pending_approval' | 'suspended';
  organization_name?: string;
  student_verification_status?: StudentVerificationStatus;
  organiser_approval_status?: OrganiserApprovalStatus;
  is_verification_reviewer?: boolean;
  verification_rejection_reason?: string;
  verification_info_request?: string;
  created_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  attended: boolean;
  checked_in_at?: string;
  attendance_source?: string;
  name: string;
  email: string;
  avatar_url?: string;
  degree: string;
  major: string;
  year_of_study: string;
  graduation_year: string;
  campus_location: string;
}

export interface UserProfile {
  user_id: string;
  year_of_study: string;
  degree: string;
  major: string;
  free_hours_per_week: number;
  commute_mode: string;
  campus_location: string;
  delhi_region?: string;
  preferred_time_of_day?: string;
  onboarding_completed?: boolean;
  graduation_year?: string;
  bio?: string;
  college_email?: string;
  portfolio_links?: PortfolioLinks;
  skills_portfolio?: SkillItem[];
  goals: string[];
  interests: string[];
  priorities?: {
    career: number;
    learning: number;
    networking: number;
    convenience: number;
    fun: number;
  };
  career_interests: string[];
  preferred_event_types: string[];
  preferred_duration_max: number;
  preferred_distance_max: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  event_id?: string;
  read: boolean;
  created_at: string;
}
