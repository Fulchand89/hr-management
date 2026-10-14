import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Bell,
  User,
  LogOut,
  Smartphone,
  ChevronDown,
  Menu,
  X,
  Coffee,
  Play,
  Square,
  Sparkles,
  Wallet,
  BookOpen,
  TrendingUp,
  UserMinus,
  ShieldCheck,
  CalendarClock,
  Home,
  Users,
  ChevronRight,
} from 'lucide-react';

export const EmployeeLayout = ({
  activeTab = 'dashboard',
  onSelectTab,
  attendanceStatus = 'WORKING',
  workingTime = '00:00:00',
  breakTime = '00:00:00',
  onPunchIn,
  onTakeBreak,
  onEndBreak,
  onPunchOut,
  onSwitchToHR,
  onSwitchToMobile,
  unreadNotifications = 2,
  onApplyLeaveClick,
  onLogout,
  children,
}) => {
  const { user } = useAuth();
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (user?.name || user?.email?.split('@')[0] || 'Employee');
  const userCode = user?.employeeCode || 'EMP-01';
  const userDept = user?.department || 'Operations';
  const userEmail = user?.email || 'employee@company.com';
  const userAvatar = user?.avatar || null;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Live Punch & Timer', icon: Clock },
    { id: 'my-attendance', label: 'My Attendance', icon: CalendarCheck },
    { id: 'attendance-correction', label: 'Attendance Corrections', icon: CalendarClock },
    { id: 'leaves', label: 'Leaves & Requests', icon: CalendarDays },
    { id: 'holidays', label: 'Holiday Calendar', icon: Calendar },
    { id: 'salary', label: 'Salary & Compensation', icon: Wallet },
    { id: 'policies', label: 'Company Policies', icon: BookOpen },
    { id: 'appraisals', label: 'Appraisals & Reviews', icon: TrendingUp },
    { id: 'resignation', label: 'Resignation & Exit', icon: UserMinus },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  // Status configuration
  const getStatusBadge = () => {
    switch (attendanceStatus) {
      case 'WORKING':
        return {
          label: 'Working Now',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500 animate-pulse',
        };
      case 'ON_BREAK':
        return {
          label: 'On Break',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'PUNCHED_OUT':
        return {
          label: 'Punched Out',
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
        };
      default:
        return {
          label: 'Not Punched In',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="min-h-screen lg:h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 lg:overflow-hidden">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer select-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <img src="/logo.png" alt="Gupta Tech Web Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-[#8B1D2C] transition-colors">
                    Gupta Tech Web
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C]">
                    HRMS
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">Employee Self-Service</p>
              </div>
            </div>
          </div>

          {/* Center: Live Punch Clock Status Indicator */}
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 shadow-2xs">
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.bg}`}>
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
              {statusBadge.label}
            </div>

            <div className="text-xs font-mono font-bold text-slate-700">
              {attendanceStatus === 'ON_BREAK' ? (
                <span>Break: {breakTime}</span>
              ) : attendanceStatus === 'WORKING' ? (
                <span>Working: {workingTime}</span>
              ) : attendanceStatus === 'PUNCHED_OUT' ? (
                <span>Total: {workingTime}</span>
              ) : (
                <span className="text-slate-400">Shift: 10:00 AM - 07:00 PM (1h Break)</span>
              )}
            </div>

            {/* Quick action button inside header */}
            {attendanceStatus === 'NOT_PUNCHED_IN' && (
              <button
                type="button"
                onClick={onPunchIn}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                <Play className="w-3 h-3 fill-white" /> Punch In
              </button>
            )}

            {attendanceStatus === 'WORKING' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onTakeBreak}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <Coffee className="w-3 h-3" /> Break
                </button>
                <button
                  type="button"
                  onClick={onPunchOut}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <Square className="w-3 h-3 fill-white" /> Out
                </button>
              </div>
            )}

            {attendanceStatus === 'ON_BREAK' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onEndBreak}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <Play className="w-3 h-3 fill-white" /> Resume Work
                </button>
                <button
                  type="button"
                  onClick={onPunchOut}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                  title="Punch Out and Finish Day"
                >
                  <Square className="w-3 h-3 fill-white" /> Out
                </button>
              </div>
            )}
          </div>

          {/* Right Action Tools: Notifications & Profile */}
          <div className="flex items-center gap-2.5">

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => onSelectTab('notifications')}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#8B1D2C] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Dropdown Chip */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar.startsWith('http') ? userAvatar : `http://localhost:5000${userAvatar}`}
                    alt={userName}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#8B1D2C] text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-200 uppercase">
                    {userName.charAt(0) || 'E'}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{userName}</div>
                  <div className="text-[10px] text-slate-400">{userCode} &bull; {userDept}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{userName}</p>
                    <p className="text-[11px] text-slate-500">{userEmail}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      Active Employee
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onSelectTab('profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400" /> My Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onSelectTab('attendance');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-slate-400" /> Live Timer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onSelectTab('attendance-correction');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <CalendarClock className="w-4 h-4 text-slate-400" /> Attendance Corrections
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onSelectTab('leaves');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <CalendarDays className="w-4 h-4 text-slate-400" /> Apply Leaves
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onSelectTab('salary');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4 text-slate-400" /> Salary & Payslips
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onSelectTab('policies');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-slate-400" /> Company Policies
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      onSelectTab('resignation');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <UserMinus className="w-4 h-4 text-slate-400" /> Resignation & Exit
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (onSwitchToHR) {
                        onSwitchToHR();
                      } else {
                        window.location.href = '/hr/dashboard';
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#8B1D2C] hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-bold"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#8B1D2C]" /> Switch to HR Portal
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Punch Status & Timer Bar for Small Screens */}
      <div className="md:hidden bg-slate-50 border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusBadge.dot}`} />
          <div className="text-[11px] font-mono font-bold text-slate-800 truncate">
            {attendanceStatus === 'ON_BREAK' ? (
              <span>Break: {breakTime}</span>
            ) : attendanceStatus === 'WORKING' ? (
              <span>Work: {workingTime}</span>
            ) : attendanceStatus === 'PUNCHED_OUT' ? (
              <span>Done: {workingTime}</span>
            ) : (
              <span className="text-slate-500 font-sans">Not Punched In</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {attendanceStatus === 'NOT_PUNCHED_IN' && (
            <button
              type="button"
              onClick={onPunchIn}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <Play className="w-3 h-3 fill-white" /> Punch In
            </button>
          )}

          {attendanceStatus === 'WORKING' && (
            <>
              <button
                type="button"
                onClick={onTakeBreak}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Coffee className="w-3 h-3" /> Break
              </button>
              <button
                type="button"
                onClick={onPunchOut}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Square className="w-3 h-3 fill-white" /> Out
              </button>
            </>
          )}

          {attendanceStatus === 'ON_BREAK' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onEndBreak}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-3 h-3 fill-white" /> Resume
              </button>
              <button
                type="button"
                onClick={onPunchOut}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                title="Punch Out and Finish Day"
              >
                <Square className="w-3 h-3 fill-white" /> Out
              </button>
            </div>
          )}

          {attendanceStatus === 'PUNCHED_OUT' && (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
              Shift Ended
            </span>
          )}
        </div>
      </div>

      {/* Main Body with Sidebar + Page Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-0 flex gap-6 lg:overflow-hidden">
        {/* Left Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-2 overflow-y-auto pb-4 no-scrollbar">
          {/* Navigation Links List */}
          <nav className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-2xs space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#8B1D2C] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#8B1D2C] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Shift Details Quick Mini Card */}
          <div className="bg-gradient-to-br from-rose-50/80 to-orange-50/40 rounded-xl p-2 border border-rose-100/70 text-[11px] space-y-0.5">
            <div className="font-bold text-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8B1D2C]" />
                <span>General Shift</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white font-bold text-[#8B1D2C] border border-rose-100 shadow-2xs">
                9h
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[10.5px]">
              <span>10:00 AM – 07:00 PM</span>
              <span className="text-emerald-700 font-semibold">1h Break</span>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-80 max-w-[85vw] bg-white h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
              {/* Drawer Top Header */}
              <div className="p-4 flex items-center justify-between border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-slate-200 flex items-center justify-center shrink-0">
                    <img src="/logo.png" alt="Gupta Tech Web Logo" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block leading-tight text-sm">Gupta Tech Web</span>
                    <span className="text-[10px] text-slate-400 font-medium">Employee Self-Service</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Info Chip */}
              <div className="p-3 mx-4 my-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 shrink-0">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-200 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-[#8B1D2C] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {userName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">{userName}</div>
                  <div className="text-[10px] text-slate-400 truncate font-medium">{userEmail}</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 shrink-0">
                  {userCode}
                </span>
              </div>

              {/* Scrollable Navigation List */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 overscroll-contain no-scrollbar">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Menu Navigation
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#8B1D2C] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && item.badge > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Drawer Bottom Actions */}
              <div className="p-4 border-t border-slate-100 space-y-2 shrink-0 bg-white">
                {onSwitchToHR && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSwitchToHR();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#8B1D2C] text-xs font-bold text-center block cursor-pointer transition-colors"
                  >
                    Switch to HR Operations Portal &rarr;
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium text-center block cursor-pointer transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center / Right Dynamic Page Viewport */}
        <main className="flex-1 min-w-0 w-full lg:overflow-y-auto lg:pb-6 no-scrollbar">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-2 flex items-center justify-around shadow-lg">
        {/* Home / Dashboard */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#8B1D2C]' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Dashboard"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Live Attendance / Timer */}
        <button
          type="button"
          onClick={() => onSelectTab('attendance')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'attendance' ? 'text-[#8B1D2C]' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Punch & Timer"
        >
          <Clock className="w-5 h-5" />
        </button>

        {/* My Attendance */}
        <button
          type="button"
          onClick={() => onSelectTab('my-attendance')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'my-attendance' ? 'text-[#8B1D2C]' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Attendance History"
        >
          <CalendarCheck className="w-5 h-5" />
        </button>

        {/* Leaves */}
        <button
          type="button"
          onClick={() => onSelectTab('leaves')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'leaves' ? 'text-[#8B1D2C]' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Leaves"
        >
          <CalendarDays className="w-5 h-5" />
        </button>

        {/* More Button */}
        <button
          type="button"
          onClick={() => setIsMoreModalOpen(true)}
          className="w-10 h-10 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white flex items-center justify-center shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer active:scale-95"
          title="More Options"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </nav>

      {/* "More" Bottom Sheet Modal for Mobile */}
      {isMoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreModalOpen(false)}
          />
          <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl z-10 border border-slate-100 animate-in slide-in-from-bottom-6 duration-200">
            {/* Top pill bar handle */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900 text-sm">More Options</h3>
              <button
                type="button"
                onClick={() => setIsMoreModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-rose-600" />
              </button>
            </div>

            <div className="mt-3 space-y-1 overflow-y-auto flex-1 pr-1 overscroll-contain">
              {/* Attendance Corrections */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  onSelectTab('attendance-correction');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <span>Attendance Corrections</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* Salary & Compensation */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  onSelectTab('salary');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span>Salary & Payslips</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* Holiday Calendar */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  onSelectTab('holidays');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span>Holiday Calendar</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* Company Policies */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  onSelectTab('policies');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span>Company Policies</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* Appraisals & Performance */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  onSelectTab('appraisals');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span>Appraisals & Reviews</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* Resignation & Exit */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  onSelectTab('resignation');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UserMinus className="w-4 h-4" />
                  </div>
                  <span>Resignation & Exit</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* KYC Documents */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  onSelectTab('kyc');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>My Documents & KYC</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* Profile */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  onSelectTab('profile');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <User className="w-4 h-4" />
                  </div>
                  <span>My Profile</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* Notifications */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  onSelectTab('notifications');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span>Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* Switch to HR Portal (if applicable) */}
              {onSwitchToHR && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreModalOpen(false);
                    onSwitchToHR();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 transition-colors text-xs font-bold text-[#8B1D2C] cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white text-[#8B1D2C] flex items-center justify-center shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <span>Switch to HR Portal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8B1D2C]" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLayout;
