import React, { useState } from 'react';
import {
  Bell,
  Sliders,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Edit3,
  User,
  ShieldCheck,
  Award,
  Building2,
  GraduationCap,
  Clock,
  Info
} from 'lucide-react';
import { useApp, NavigationPage } from '../context/AppContext.js';
import { UserRole } from '../types/index.js';

export const Navbar: React.FC = () => {
  const {
    activePage,
    navigateTo,
    currentUserRole,
    setCurrentUserRole,
    compareEventIds,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setIsGoalsModalOpen,
    setIsEditProfileOpen,
    setIsVerificationModalOpen,
    currentUser,
    isAuthenticated,
    logout,
    setIsGuestPreview
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const navLinks: { label: string; page: NavigationPage }[] = [
    { label: 'Discover', page: 'discover' },
    { label: '2-Hour Window', page: 'freetime' },
    { label: 'Compare', page: 'compare' },
    { label: 'Campus Map', page: 'heatmap' },
    { label: 'Portfolio', page: 'myevents' },
    { label: 'Organizer Desk', page: 'organizer' }
  ];

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('')
    : 'W';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFDF8]/96 backdrop-blur-md border-b border-[#E2D7C8] shadow-[0_2px_12px_rgba(36,20,16,0.04)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          
          {/* ZONE 1: BRAND LOGO */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => navigateTo('discover')}
              className="flex items-center gap-3 text-left group focus-visible:outline-none"
              aria-label="WorthWhile Home"
            >
              <div className="flex items-center gap-3">
                {!logoLoadError ? (
                  <img
                    src="/worthwhile-icon.svg"
                    alt="WorthWhile Emblem"
                    onError={() => setLogoLoadError(true)}
                    className="h-10 w-10 shrink-0 object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-[#5B2435] to-[#30231F] flex items-center justify-center text-[#FFFDF8] font-serif font-bold text-xl shadow-xs">
                    W
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-serif text-2xl sm:text-[26px] font-bold tracking-tight text-[#241410] leading-none">
                    WorthWhile
                  </span>
                  <span className="text-[9.5px] font-sans font-bold uppercase tracking-widest text-[#5B2435] mt-1 hidden sm:block">
                    The right events · For your goals
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* ZONE 2: NAVIGATION LINKS */}
          <nav className="hidden lg:flex items-center gap-6 text-sm">
            {navLinks.map(link => {
              const isActive = activePage === link.page;
              return (
                <button
                  key={link.page}
                  onClick={() => navigateTo(link.page)}
                  className={`relative py-1 text-xs uppercase tracking-wider font-bold whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#5B2435]'
                      : 'text-[#4A3830] hover:text-[#241410]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.page === 'compare' && compareEventIds.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#5B2435] text-[#FFFDF8] font-bold">
                      {compareEventIds.length}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-[#5B2435]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: ACTIONS & USER PROFILE */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            
            {/* Quick Goals Trigger Button */}
            <button
              onClick={() => setIsGoalsModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D5C7B5] bg-[#F8F4EC] hover:bg-[#EFE5D5] text-xs font-bold text-[#241410] transition-colors whitespace-nowrap shadow-xs"
              title="Calibrate semester goals"
            >
              <Sliders className="w-3.5 h-3.5 text-[#5B2435]" />
              <span>My Goals</span>
            </button>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] hover:bg-[#F8F4EC] text-xs font-semibold text-[#241410] transition-colors capitalize shadow-xs"
                aria-expanded={roleMenuOpen}
              >
                <span className="w-2 h-2 rounded-full bg-[#5B2435]" />
                <span className="text-[11px] font-bold">{currentUserRole} View</span>
                <ChevronDown className="w-3 h-3 text-[#665249]" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#FFFDF8] border border-[#D5C7B5] shadow-xl py-1 z-50 animate-fadeIn">
                  {(['student', 'organizer'] as UserRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentUserRole(role);
                        setRoleMenuOpen(false);
                        if (role === 'organizer') navigateTo('organizer');
                        else if (activePage === 'organizer') navigateTo('discover');
                      }}
                      className={`w-full px-3 py-2 text-left text-xs capitalize flex items-center justify-between ${
                        currentUserRole === role
                          ? 'bg-[#F8F4EC] font-bold text-[#5B2435]'
                          : 'text-[#241410] hover:bg-[#FAF4EB]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {role === 'student' ? <GraduationCap className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                        <span>{role} Perspective</span>
                      </span>
                      {currentUserRole === role && <CheckCircle2 className="w-3.5 h-3.5 text-[#5B2435]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Student Verification Pill */}
            {isAuthenticated && currentUser?.role === 'student' && (
              <button
                onClick={() => setIsVerificationModalOpen(true)}
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-xs ${
                  currentUser.student_verification_status === 'verified'
                    ? 'border-[#194D33]/30 bg-[#194D33]/10 text-[#194D33] hover:bg-[#194D33]/15'
                    : currentUser.student_verification_status === 'pending'
                    ? 'border-[#8A5A16]/30 bg-[#8A5A16]/10 text-[#8A5A16] hover:bg-[#8A5A16]/15'
                    : currentUser.student_verification_status === 'info_requested'
                    ? 'border-[#B45309]/30 bg-[#B45309]/10 text-[#B45309] hover:bg-[#B45309]/15'
                    : 'border-[#5B2435]/30 bg-[#5B2435]/10 text-[#5B2435] hover:bg-[#5B2435]/15'
                }`}
                title="Student Verification Status"
              >
                {currentUser.student_verification_status === 'verified' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#194D33]" />
                    <span className="text-[11px] font-bold">Verified Student</span>
                  </>
                ) : currentUser.student_verification_status === 'pending' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-[#8A5A16]" />
                    <span className="text-[11px] font-bold">Verification Pending</span>
                  </>
                ) : currentUser.student_verification_status === 'info_requested' ? (
                  <>
                    <Info className="w-3.5 h-3.5 text-[#B45309]" />
                    <span className="text-[11px] font-bold">Action Required</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#5B2435]" />
                    <span className="text-[11px] font-bold">Verify ID</span>
                  </>
                )}
              </button>
            )}

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-[#4A3830] hover:text-[#241410] hover:bg-[#F8F4EC] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5B2435]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#FFFDF8] border border-[#D5C7B5] shadow-2xl p-4 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2D7C8]">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#241410]">
                        Campus Intelligence Alerts
                      </h4>
                      {unreadNotificationCount > 0 && (
                        <span className="text-[10px] bg-[#5B2435] text-white px-1.5 py-0.2 rounded-full font-bold">
                          {unreadNotificationCount}
                        </span>
                      )}
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] text-[#5B2435] hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#665249] py-4 text-center">
                        No notifications right now.
                      </p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.event_id) {
                              navigateTo('event-details', n.event_id);
                              setNotificationsOpen(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                            n.read
                              ? 'border-transparent bg-[#F8F4EC]/60 text-[#4A3830]'
                              : 'border-[#5B2435]/30 bg-[#F8F4EC] text-[#241410]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-xs text-[#241410]">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#5B2435] shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#4A3830] mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Authenticated User Menu or Guest Sign In */}
            {isAuthenticated && currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F8F4EC] transition-colors"
                  aria-label="User Account"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#5B2435] to-[#30231F] text-[#FFFDF8] flex items-center justify-center font-serif text-xs font-bold shadow-xs">
                    {initials}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-[#241410] leading-tight truncate max-w-[110px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[9.5px] font-mono font-semibold text-[#5B2435] uppercase tracking-wider capitalize">
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#7A6860] hidden sm:block" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#FFFDF8] border border-[#D5C7B5] shadow-2xl p-2 z-50 animate-fadeIn text-xs">
                    <div className="px-3 py-2.5 border-b border-[#E2D7C8] mb-1">
                      <p className="font-bold text-[#241410]">{currentUser.name}</p>
                      <p className="text-[10px] text-[#7A6860] font-mono truncate">{currentUser.email}</p>
                      <span className="mt-1 inline-block text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#194D33] bg-[#194D33]/10 px-2 py-0.2 rounded">
                        Active {currentUser.role}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        navigateTo('myevents');
                      }}
                      className="w-full px-3 py-2 text-left rounded-lg hover:bg-[#F8F4EC] flex items-center gap-2 text-[#241410]"
                    >
                      <Award className="w-3.5 h-3.5 text-[#5B2435]" />
                      <span>My Portfolio & Transcript</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setIsEditProfileOpen(true);
                      }}
                      className="w-full px-3 py-2 text-left rounded-lg hover:bg-[#F8F4EC] flex items-center gap-2 text-[#241410]"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#5B2435]" />
                      <span>Edit Student Profile</span>
                    </button>

                    {currentUser.role === 'student' && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setIsVerificationModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-[#F8F4EC] flex items-center justify-between text-[#241410]"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#5B2435]" />
                          <span>Student ID Verification</span>
                        </span>
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          currentUser.student_verification_status === 'verified'
                            ? 'bg-[#194D33]/10 text-[#194D33]'
                            : currentUser.student_verification_status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : currentUser.student_verification_status === 'info_requested'
                            ? 'bg-orange-100 text-orange-900'
                            : 'bg-[#5B2435]/10 text-[#5B2435]'
                        }`}>
                          {currentUser.student_verification_status || 'Unverified'}
                        </span>
                      </button>
                    )}

                    {currentUser.role === 'organizer' && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          navigateTo('organizer');
                        }}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-[#F8F4EC] flex items-center gap-2 text-[#241410] font-bold text-[#5B2435]"
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#5B2435]" />
                        <span>Organizer Desk & Check-in</span>
                      </button>
                    )}

                    <div className="pt-1 mt-1 border-t border-[#E2D7C8]">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full px-3 py-2 text-left rounded-lg hover:bg-[#5B2435]/10 flex items-center gap-2 text-[#5B2435] font-bold"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsGuestPreview(false)}
                className="px-3.5 py-1.5 rounded-xl bg-[#5B2435] text-[#FFFDF8] hover:bg-[#3F1723] text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#241410] hover:bg-[#F8F4EC]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E2D7C8] bg-[#FFFDF8] px-4 py-4 space-y-1.5 animate-fadeIn shadow-lg">
          {navLinks.map(link => (
            <button
              key={link.page}
              onClick={() => {
                navigateTo(link.page);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                activePage === link.page
                  ? 'bg-[#5B2435] text-[#FFFDF8]'
                  : 'text-[#241410] hover:bg-[#F8F4EC]'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-[#E2D7C8] flex flex-col gap-2">
            <button
              onClick={() => {
                setIsGoalsModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 text-center text-xs font-bold rounded-lg bg-[#5B2435] text-[#FFFDF8]"
            >
              Semester Goals
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-center text-xs font-bold rounded-lg border border-[#D5C7B5] text-[#5B2435]"
              >
                Sign Out ({currentUser?.name})
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsGuestPreview(false);
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 text-center text-xs font-bold rounded-lg bg-[#5B2435] text-[#FFFDF8]"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
