import React, { useState } from 'react';
import {
  GraduationCap,
  Building2,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Compass,
  Check,
  Clock,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { api } from '../services/api.js';

const DELHI_REGIONS = [
  'South Delhi (IIT Delhi / IIIT Delhi / JNU)',
  'North Delhi (Delhi University North Campus)',
  'West Delhi (NSUT Dwarka)',
  'North West Delhi (DTU Rohini)',
  'Central Delhi (Connaught Place / IHC Lodhi)',
  'Gurugram NCR (Cyber City)',
  'Noida NCR (Sector 62 Institutional)'
];

export const AuthScreen: React.FC = () => {
  const { login, signup, demoLogin, setIsGuestPreview } = useApp();

  // Selected role for the auth flow
  const [selectedRole, setSelectedRole] = useState<'student' | 'organizer'>('student');

  // Auth mode: 'login' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [delhiRegion, setDelhiRegion] = useState(DELHI_REGIONS[0]);

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    // Validation
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid college or institutional email address.');
      return;
    }

    if (authMode === 'forgot') {
      setLoading(true);
      try {
        await api.forgotPassword(email.trim());
        setSuccessNotice('If an account is associated with this email, password reset instructions have been generated.');
      } catch (err: any) {
        setError(err.message || 'Could not process password reset request.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (authMode === 'signup') {
      if (!name.trim()) {
        setError('Please provide your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
      if (selectedRole === 'organizer' && !organizationName.trim()) {
        setError('Please provide your club, society, or department name.');
        return;
      }

      setLoading(true);
      try {
        await signup({
          email: email.trim(),
          password,
          name: name.trim(),
          role: selectedRole,
          delhi_region: delhiRegion,
          organization_name: selectedRole === 'organizer' ? organizationName.trim() : undefined
        });
      } catch (err: any) {
        setError(err.message || 'Account registration failed. Please verify your details.');
      } finally {
        setLoading(false);
      }
    } else {
      // Login
      setLoading(true);
      try {
        await login(email.trim(), password);
      } catch (err: any) {
        setError(err.message || 'Invalid email or password. Please verify your credentials or use the 1-click test button.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDemoSignIn = async (role: 'student' | 'organizer') => {
    setError(null);
    setSuccessNotice(null);
    setDemoLoading(role);
    try {
      await demoLogin(role);
    } catch (err: any) {
      setError(err.message || `Could not sign in with demo ${role} account.`);
    } finally {
      setDemoLoading(null);
    }
  };

  const prefillAccount = (type: 'alex' | 'rohit' | 'sarah' | 'dean') => {
    setError(null);
    setSuccessNotice(null);
    setAuthMode('login');

    if (type === 'alex') {
      setSelectedRole('student');
      setEmail('alex.chen@campus.edu');
      setPassword('Demo2026!');
    } else if (type === 'rohit') {
      setSelectedRole('student');
      setEmail('rohit.sharma@iiitd.ac.in');
      setPassword('Demo2026!');
    } else if (type === 'sarah') {
      setSelectedRole('organizer');
      setEmail('acm-lead@campus.edu');
      setPassword('Demo2026!');
    } else if (type === 'dean') {
      setSelectedRole('organizer');
      setEmail('studentlife-admin@campus.edu');
      setPassword('Demo2026!');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden text-[#241410] bg-[#F8F4EC] selection:bg-[#5B2435] selection:text-[#FFFDF8]">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-b from-[#5B2435]/8 via-[#FFFDF8]/0 to-transparent pointer-events-none -z-10" />

      {/* Top Banner Navigation */}
      <header className="w-full border-b border-[#E2D7C8]/80 bg-[#FFFDF8]/90 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/worthwhile-icon.svg"
            alt="WorthWhile"
            className="w-10 h-10 object-contain shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#241410] leading-none">
              WorthWhile
            </h1>
            <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#5B2435] mt-1">
              Campus Event Intelligence & Opportunity Platform
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsGuestPreview(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] hover:bg-[#F8F4EC] text-xs font-semibold text-[#4A3830] transition-colors cursor-pointer"
          title="Browse events without logging in"
        >
          <Compass className="w-3.5 h-3.5 text-[#5B2435]" />
          <span>Explore as Guest</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col justify-center">
        
        {/* Editorial Heading */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5B2435]/8 border border-[#5B2435]/20 text-[#5B2435] text-[11px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3 h-3 text-[#5B2435]" />
            <span>Discover Opportunities · Build Your Verified Future</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#241410] tracking-tight">
            Sign In to Campus Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-[#5A453D] mt-3 leading-relaxed max-w-xl mx-auto font-normal">
            Select your role to access your personalized campus workspace. Students build verified co-curricular transcripts; organisers manage certified attendance and student identity audits.
          </p>
        </div>

        {/* Role Selection & Authentication Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Role Switcher & Explanations (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-widest font-bold text-[#5B2435] block">
              1. Select Your Role
            </span>

            {/* Student Role Card */}
            <div
              onClick={() => {
                setSelectedRole('student');
                setError(null);
              }}
              className={`relative p-5 rounded-2xl border cursor-pointer transition-all ${
                selectedRole === 'student'
                  ? 'border-[#5B2435] bg-[#FFFDF8] shadow-md ring-2 ring-[#5B2435]/20'
                  : 'border-[#E2D7C8] bg-[#FFFDF8]/70 hover:bg-[#FFFDF8] shadow-xs'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  selectedRole === 'student' ? 'bg-[#5B2435] text-[#FFFDF8]' : 'bg-[#F8F4EC] text-[#5B2435]'
                }`}>
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-[#241410]">
                      Student Portal
                    </h3>
                    {selectedRole === 'student' && (
                      <CheckCircle2 className="w-4 h-4 text-[#5B2435]" />
                    )}
                  </div>
                  <p className="text-xs text-[#5A453D] mt-1 leading-relaxed">
                    Personalized event relevance matching, verified attendance credits, verified skill portfolios, and 2-hour free time window schedule fit.
                  </p>
                  
                  {/* Quick 1-click test button for evaluator */}
                  <div className="mt-3 pt-3 border-t border-[#E2D7C8]/60 flex items-center justify-between">
                    <span className="text-[10px] text-[#7A6860] font-mono">Quick sign-in:</span>
                    <button
                      type="button"
                      disabled={demoLoading !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDemoSignIn('student');
                      }}
                      className="px-2.5 py-1 rounded bg-[#5B2435]/10 hover:bg-[#5B2435] hover:text-[#FFFDF8] text-[#5B2435] text-[11px] font-bold transition-colors cursor-pointer"
                      title="Instant sign-in as Alex Chen (Student)"
                    >
                      {demoLoading === 'student' ? 'Signing in...' : '1-Click Student Demo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Organiser Role Card */}
            <div
              onClick={() => {
                setSelectedRole('organizer');
                setError(null);
              }}
              className={`relative p-5 rounded-2xl border cursor-pointer transition-all ${
                selectedRole === 'organizer'
                  ? 'border-[#5B2435] bg-[#FFFDF8] shadow-md ring-2 ring-[#5B2435]/20'
                  : 'border-[#E2D7C8] bg-[#FFFDF8]/70 hover:bg-[#FFFDF8] shadow-xs'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${
                  selectedRole === 'organizer' ? 'bg-[#5B2435] text-[#FFFDF8]' : 'bg-[#F8F4EC] text-[#5B2435]'
                }`}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-[#241410]">
                      Organiser Portal
                    </h3>
                    {selectedRole === 'organizer' && (
                      <CheckCircle2 className="w-4 h-4 text-[#5B2435]" />
                    )}
                  </div>
                  <p className="text-xs text-[#5A453D] mt-1 leading-relaxed">
                    Publish campus sessions, manage attendee check-in desks, verify certificates, audit student enrollment, and view verified turnout metrics.
                  </p>

                  {/* Quick 1-click test button for evaluator */}
                  <div className="mt-3 pt-3 border-t border-[#E2D7C8]/60 flex items-center justify-between">
                    <span className="text-[10px] text-[#7A6860] font-mono">Quick sign-in:</span>
                    <button
                      type="button"
                      disabled={demoLoading !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDemoSignIn('organizer');
                      }}
                      className="px-2.5 py-1 rounded bg-[#5B2435]/10 hover:bg-[#5B2435] hover:text-[#FFFDF8] text-[#5B2435] text-[11px] font-bold transition-colors cursor-pointer"
                      title="Instant sign-in as Sarah Lin (ACM President)"
                    >
                      {demoLoading === 'organizer' ? 'Signing in...' : '1-Click Organiser Demo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Evaluator Quick Pre-fills */}
            <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] block mb-2">
                Pre-configured Accounts for Testing:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => prefillAccount('alex')}
                  className="p-2 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE5D5] border border-[#D5C7B5] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-[#241410]">Alex Chen</div>
                  <div className="text-[10px] text-[#194D33] font-semibold">Student · Verified ✓</div>
                </button>
                <button
                  type="button"
                  onClick={() => prefillAccount('rohit')}
                  className="p-2 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE5D5] border border-[#D5C7B5] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-[#241410]">Rohit Sharma</div>
                  <div className="text-[10px] text-[#8A5A16] font-semibold">Student · Pending ⏳</div>
                </button>
                <button
                  type="button"
                  onClick={() => prefillAccount('sarah')}
                  className="p-2 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE5D5] border border-[#D5C7B5] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-[#241410]">Sarah Lin (ACM)</div>
                  <div className="text-[10px] text-[#5B2435] font-semibold">Organiser · Reviewer</div>
                </button>
                <button
                  type="button"
                  onClick={() => prefillAccount('dean')}
                  className="p-2 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE5D5] border border-[#D5C7B5] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-[#241410]">Dean of Students</div>
                  <div className="text-[10px] text-[#241410] font-semibold">Admin · Reviewer</div>
                </button>
              </div>
            </div>

            {/* Security Guarantee Box */}
            <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[#E2D7C8] flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#194D33] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#4A3830] leading-relaxed">
                <strong className="text-[#241410]">Role-Enforced Security:</strong> Permissions are cryptographically verified by server session tokens. Organiser endpoints require verified organizer credentials, and student verification applications require authorized reviewer approvals.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Dedicated Authentication Form Card (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-[#FFFDF8] rounded-2xl border border-[#D5C7B5] shadow-lg p-6 sm:p-8">
              
              {/* Form Mode Tabs */}
              <div className="flex items-center justify-between border-b border-[#E2D7C8] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setError(null);
                      setSuccessNotice(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-[#5B2435] text-[#FFFDF8]'
                        : 'text-[#4A3830] hover:text-[#241410]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setError(null);
                      setSuccessNotice(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      authMode === 'signup'
                        ? 'bg-[#5B2435] text-[#FFFDF8]'
                        : 'text-[#4A3830] hover:text-[#241410]'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <span className="text-[11px] font-mono font-bold text-[#5B2435] bg-[#5B2435]/10 px-2.5 py-1 rounded-md capitalize">
                  {selectedRole === 'student' ? 'Student Portal' : 'Organiser Portal'}
                </span>
              </div>

              {/* Status & Error Alerts */}
              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#5B2435]/10 border border-[#5B2435]/30 text-xs text-[#5B2435] flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{error}</div>
                </div>
              )}

              {successNotice && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#194D33]/10 border border-[#194D33]/30 text-xs text-[#194D33] flex items-start gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{successNotice}</div>
                </div>
              )}

              {/* Interactive Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Full Name (Sign Up only) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-[#7A6860]" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={selectedRole === 'student' ? 'e.g. Alex Chen' : 'e.g. Sarah Lin'}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium placeholder:text-[#8C7A70] focus:outline-none focus:border-[#5B2435] focus:ring-1 focus:ring-[#5B2435]"
                      />
                    </div>
                  </div>
                )}

                {/* Organization / Chapter Name (Organiser Sign Up only) */}
                {authMode === 'signup' && selectedRole === 'organizer' && (
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                      Organization / Society Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-[#7A6860]" />
                      <input
                        type="text"
                        required
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="e.g. ACM Student Chapter / Robotics Club"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium placeholder:text-[#8C7A70] focus:outline-none focus:border-[#5B2435] focus:ring-1 focus:ring-[#5B2435]"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                    {selectedRole === 'student' ? 'College / Campus Email *' : 'Official / Organization Email *'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#7A6860]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedRole === 'student' ? 'student@campus.edu or iiitd.ac.in' : 'lead@society.campus.edu'}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium placeholder:text-[#8C7A70] focus:outline-none focus:border-[#5B2435] focus:ring-1 focus:ring-[#5B2435]"
                    />
                  </div>
                </div>

                {/* Campus Region (Sign Up only) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                      Primary Campus / Delhi NCR Zone
                    </label>
                    <select
                      value={delhiRegion}
                      onChange={(e) => setDelhiRegion(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
                    >
                      {DELHI_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Password field (Login & Sign Up) */}
                {authMode !== 'forgot' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830]">
                        Password *
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('forgot');
                            setError(null);
                          }}
                          className="text-[10px] text-[#5B2435] hover:underline font-semibold cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#7A6860]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium placeholder:text-[#8C7A70] focus:outline-none focus:border-[#5B2435] focus:ring-1 focus:ring-[#5B2435]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-[#7A6860] hover:text-[#241410] cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password (Sign Up only) */}
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#7A6860]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium placeholder:text-[#8C7A70] focus:outline-none focus:border-[#5B2435] focus:ring-1 focus:ring-[#5B2435]"
                      />
                    </div>
                  </div>
                )}

                {/* Forgot Password note */}
                {authMode === 'forgot' && (
                  <p className="text-xs text-[#5A453D] leading-relaxed">
                    Enter the email registered with your account. We will dispatch a password recovery link.
                  </p>
                )}

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-[#5B2435] text-[#FFFDF8] font-bold text-xs uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Processing...</span>
                    ) : authMode === 'login' ? (
                      <>
                        <span>Sign In as {selectedRole === 'student' ? 'Student' : 'Organiser'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : authMode === 'signup' ? (
                      <>
                        <span>Create {selectedRole === 'student' ? 'Student' : 'Organiser'} Account</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Send Password Reset Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Back to sign in link if in forgot mode */}
                {authMode === 'forgot' && (
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setError(null);
                        setSuccessNotice(null);
                      }}
                      className="text-xs text-[#5B2435] hover:underline font-semibold cursor-pointer"
                    >
                      Return to Sign In
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding Note */}
      <footer className="w-full border-t border-[#E2D7C8]/80 py-4 px-4 text-center text-xs text-[#7A6860] bg-[#FFFDF8]/60">
        <span>WorthWhile — Delhi NCR Campus Opportunity & Event Intelligence Platform</span>
        <span className="mx-2">·</span>
        <button
          onClick={() => setIsGuestPreview(true)}
          className="text-[#5B2435] hover:underline font-semibold cursor-pointer"
        >
          Explore Campus as Guest
        </button>
      </footer>
    </div>
  );
};
