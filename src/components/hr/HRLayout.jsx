import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  CalendarCheck,
  CalendarDays,
  Bell,
  User,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Users,
  CheckCircle2,
  SlidersHorizontal,
  FileText,
  Coffee,
  Play,
  Square,
  Award,
  Calendar,
  BarChart3,
  FileSpreadsheet,
  ChevronRight,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const HRLayout = ({
  children,
  attendanceStatus: propStatus,
  workingTime: propWorkingTime,
  breakTime: propBreakTime,
  onPunchIn: propPunchIn,
  onTakeBreak: propTakeBreak,
  onEndBreak: propEndBreak,
  onPunchOut: propPunchOut,
  unreadNotifications: propUnread,
  onApplyLeaveClick,
  onLogout: propLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (user?.name || user?.email?.split('@')[0] || 'User');
  const userRole = user?.designation || user?.role || 'HR';
  const userEmail = user?.email || '';
  const userAvatar = user?.avatarUrl || user?.avatar || null;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);

  // Live Attendance Clock State for HR User (defaults to 0, controlled by real API prop)
  const [internalAttendanceStatus, setInternalAttendanceStatus] = useState('NOT_PUNCHED_IN');
  const [workingSeconds, setWorkingSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);

  const attendanceStatus = propStatus !== undefined ? propStatus : internalAttendanceStatus;

  // Live Timer Interval Effect (when not controlled by prop)
  useEffect(() => {
    if (propWorkingTime !== undefined) return;
    let interval = null;
    if (attendanceStatus === 'WORKING') {
      interval = setInterval(() => {
        setWorkingSeconds((prev) => prev + 1);
      }, 1000);
    } else if (attendanceStatus === 'ON_BREAK') {
      interval = setInterval(() => {
        setBreakSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [attendanceStatus, propWorkingTime]);

  const formatTime = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const workingTimeFormatted = propWorkingTime !== undefined ? propWorkingTime : formatTime(workingSeconds);
  const breakTimeFormatted = propBreakTime !== undefined ? propBreakTime : formatTime(breakSeconds);

  const handlePunchIn = () => {
    if (propPunchIn) propPunchIn();
    else setInternalAttendanceStatus('WORKING');
  };
  const handleTakeBreak = () => {
    if (propTakeBreak) propTakeBreak();
    else setInternalAttendanceStatus('ON_BREAK');
  };
  const handleEndBreak = () => {
    if (propEndBreak) propEndBreak();
    else setInternalAttendanceStatus('WORKING');
  };
  const handlePunchOut = () => {
    if (propPunchOut) propPunchOut();
    else setInternalAttendanceStatus('PUNCHED_OUT');
  };

  const unreadCount = propUnread !== undefined ? propUnread : 4;

  // Status configuration matching EmployeeLayout
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

  // Active route matching
  const currentPath = location.pathname;
  const isDashboard = currentPath === '/hr' || currentPath.startsWith('/hr/dashboard');
  const isAttendance = currentPath.startsWith('/hr/attendance') && !currentPath.includes('correction');
  const isMyAttendance = currentPath.startsWith('/hr/my-attendance') || currentPath.startsWith('/hr/myattendance');
  const isPersonalLeaves = currentPath.startsWith('/hr/leaves');
  const isAttendanceCorrection = currentPath.startsWith('/hr/attendance-correction');
  const isStaffLeaves = (currentPath.startsWith('/hr/leave-requests') || currentPath.startsWith('/hr/leave-detail')) && !currentPath.includes('LEV-101');
  const isHolidayManagement = currentPath.startsWith('/hr/holiday') || currentPath.startsWith('/hr/holidays');
  const isReports = currentPath.startsWith('/hr/reports');
  const isNotifications = currentPath.startsWith('/hr/notifications');
  const isProfile = currentPath.startsWith('/hr/profile');

  // Complete nav items containing ALL employee fields + ALL HR fields
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/hr/dashboard',
      isActive: isDashboard,
    },
    {
      id: 'attendance',
      label: 'Live Punch & Timer',
      icon: Clock,
      path: '/hr/attendance',
      isActive: isAttendance,
    },
    {
      id: 'my-attendance',
      label: 'My Attendance',
      icon: CalendarCheck,
      path: '/hr/my-attendance',
      isActive: isMyAttendance,
    },
    {
      id: 'leaves',
      label: 'Leaves & Requests',
      icon: CalendarDays,
      path: '/hr/leaves',
      isActive: isPersonalLeaves,
    },
    {
      id: 'attendance-correction',
      label: 'Attendance Corrections',
      icon: Clock,
      path: '/hr/attendance-correction',
      isActive: isAttendanceCorrection,
    },
    {
      id: 'leave-requests',
      label: 'Staff Leave Approvals',
      icon: CalendarDays,
      path: '/hr/leave-requests',
      isActive: isStaffLeaves,
    },
    {
      id: 'holiday-management',
      label: 'Holiday Management',
      icon: Calendar,
      path: '/hr/holiday-management',
      isActive: isHolidayManagement,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileSpreadsheet,
      path: '/hr/reports',
      isActive: isReports,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      path: '/hr/notifications',
      isActive: isNotifications,
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      path: '/hr/profile',
      isActive: isProfile,
    },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      {/* Top Global Portal Switcher & System Bar */}
      <div className="bg-slate-950 text-white px-4 sm:px-6 py-2 flex items-center justify-between text-xs border-b border-slate-800 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>WorkPulse Enterprise</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">&bull;</span>
          <span className="text-slate-400 hidden sm:inline font-medium">
            HR Operations & Workforce Approvals Hub
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/employee/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white font-semibold transition-colors cursor-pointer text-[11px]"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Employee Portal</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer text-[11px]"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </button>
        </div>
      </div>

      {/* Main Sticky Header matching EmployeeLayout */}
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
              onClick={() => navigate('/hr/dashboard')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B1D2C] to-[#5C101B] flex items-center justify-center text-white shadow-md shadow-[#8B1D2C]/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-rose-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-[#8B1D2C] transition-colors">
                    WorkPulse
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C]">
                    HRMS
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">People Operations Hub</p>
              </div>
            </div>
          </div>

          {/* Center: Live Punch Clock Status Indicator matching EmployeeLayout */}
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 shadow-2xs">
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.bg}`}>
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
              {statusBadge.label}
            </div>

            <div className="text-xs font-mono font-bold text-slate-700">
              {attendanceStatus === 'ON_BREAK' ? (
                <span>Break: {breakTimeFormatted}</span>
              ) : attendanceStatus === 'WORKING' ? (
                <span>Working: {workingTimeFormatted}</span>
              ) : attendanceStatus === 'PUNCHED_OUT' ? (
                <span>Total: {workingTimeFormatted}</span>
              ) : (
                <span className="text-slate-400">Shift: 09:00 AM - 06:00 PM</span>
              )}
            </div>

            {/* Quick action button inside header matching EmployeeLayout */}
            {attendanceStatus === 'NOT_PUNCHED_IN' && (
              <button
                type="button"
                onClick={handlePunchIn}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                <Play className="w-3 h-3 fill-white" /> Punch In
              </button>
            )}

            {attendanceStatus === 'WORKING' && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleTakeBreak}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <Coffee className="w-3 h-3" /> Break
                </button>
                <button
                  type="button"
                  onClick={handlePunchOut}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                >
                  <Square className="w-3 h-3 fill-white" /> Out
                </button>
              </div>
            )}

            {attendanceStatus === 'ON_BREAK' && (
              <button
                type="button"
                onClick={handleEndBreak}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                <Play className="w-3 h-3 fill-white" /> Resume Work
              </button>
            )}

            {/* HR Approvals Queue Indicator */}
            <div className="h-4 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => navigate('/hr/leave-requests')}
              className="text-xs font-bold text-[#8B1D2C] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Queue: 4 Pending</span>
            </button>
          </div>

          {/* Right Action Tools: Notifications & Profile matching EmployeeLayout */}
          <div className="flex items-center gap-2.5">
            {/* Notification Bell matching EmployeeLayout */}
            <div className="relative">
              <button
                type="button"
                onClick={() => navigate('/hr/notifications')}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#8B1D2C] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Dropdown Chip matching EmployeeLayout */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#8B1D2C] text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-200 uppercase">
                    {userName.charAt(0) || 'H'}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">{userName}</div>
                  <div className="text-[10px] text-slate-400">{userRole}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
              </button>

              {/* Profile Dropdown Menu matching EmployeeLayout */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{userName}</p>
                    <p className="text-[11px] text-slate-500">{userEmail}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      Active HR Manager
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      navigate('/hr/profile');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4 text-slate-400" /> My Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      navigate('/hr/attendance');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-slate-400" /> Live Timer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (onApplyLeaveClick) onApplyLeaveClick();
                      else navigate('/hr/leaves');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                  >
                    <CalendarDays className="w-4 h-4 text-slate-400" /> Apply Leaves
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      navigate('/employee/dashboard');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-[#8B1D2C] hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-bold"
                  >
                    <Users className="w-4 h-4 text-[#8B1D2C]" /> Switch to Employee Portal
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      navigate('/admin/dashboard');
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer font-semibold"
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-500" /> Switch to Admin Portal
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (propLogout) propLogout();
                      else navigate('/hr/signin');
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

      {/* Main Body with Sidebar + Page Content matching EmployeeLayout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 flex gap-6">
        {/* Left Desktop Sidebar Navigation matching EmployeeLayout */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-6 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Navigation Links List matching EmployeeLayout */}
          <nav className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.isActive;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

          {/* Shift Details Info Card matching EmployeeLayout + HR SLA */}
          <div className="bg-gradient-to-br from-rose-50 to-orange-50/50 rounded-2xl p-4 border border-rose-100/80 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span className="whitespace-nowrap">Shift Details</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-semibold text-[#8B1D2C] shadow-2xs whitespace-nowrap">
                9h Required
              </span>
            </div>
            <div className="text-slate-600 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 whitespace-nowrap">Timing:</span>
                <span className="font-semibold text-slate-700 whitespace-nowrap">09:00 AM - 06:00 PM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 whitespace-nowrap">Grace Period:</span>
                <span className="font-semibold text-slate-700 whitespace-nowrap">15 Minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 whitespace-nowrap">Location:</span>
                <span className="font-semibold text-slate-700 whitespace-nowrap">Main Campus / HQ</span>
              </div>
              <div className="pt-1.5 border-t border-rose-200/60 flex justify-between items-center text-[11px]">
                <span className="text-[#8B1D2C] font-bold">HR Approvals SLA:</span>
                <span className="font-bold text-emerald-700">&lt; 4h (99%)</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer matching EmployeeLayout */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-white h-full p-5 flex flex-col justify-between z-10 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#8B1D2C] flex items-center justify-center text-white font-bold">
                      W
                    </div>
                    <div>
                      <span className="font-extrabold text-slate-900 block leading-tight">WorkPulse</span>
                      <span className="text-[10px] text-slate-400 font-medium">HR Operations Hub</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.isActive;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                          isActive
                            ? 'bg-[#8B1D2C] text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && item.badge > 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              isActive ? 'bg-white/20 text-white' : 'bg-rose-500 text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Drawer Bottom Portal Switchers */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/employee/dashboard');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 text-[#8B1D2C] text-xs font-bold text-center block cursor-pointer"
                >
                  Switch to Employee Portal &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/hr/signin');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-medium text-center block cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Center / Right Dynamic Page Viewport */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar matching mockup */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-4 py-2 flex items-center justify-around shadow-lg">
        {/* Home */}
        <button
          type="button"
          onClick={() => navigate('/hr/dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
            isDashboard ? 'text-[#8B1D2C]' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Dashboard"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Staff / Approvals */}
        <button
          type="button"
          onClick={() => navigate('/hr/attendance-correction')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
            isAttendanceCorrection || isStaffLeaves ? 'text-[#8B1D2C]' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Approvals"
        >
          <Users className="w-5 h-5" />
        </button>

        {/* Live Attendance Timer */}
        <button
          type="button"
          onClick={() => navigate('/hr/attendance')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
            isAttendance ? 'text-[#8B1D2C]' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Timer"
        >
          <Clock className="w-5 h-5" />
        </button>

        {/* Leaves */}
        <button
          type="button"
          onClick={() => navigate('/hr/leaves')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors cursor-pointer ${
            isPersonalLeaves ? 'text-[#8B1D2C]' : 'text-slate-400 hover:text-slate-700'
          }`}
          title="Leaves"
        >
          <CalendarDays className="w-5 h-5" />
        </button>

        {/* More Button matching user screenshot (Burgundy Square with Hamburger) */}
        <button
          type="button"
          onClick={() => setIsMoreModalOpen(true)}
          className="w-10 h-10 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white flex items-center justify-center shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer active:scale-95"
          title="More Options"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </nav>

      {/* Frame 473: "More" Bottom Sheet Modal matching user mockup */}
      {isMoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl z-10 border border-slate-100 animate-in slide-in-from-bottom-6 duration-200">
            {/* Top pill bar handle matching Frame 473 */}
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">More</h3>
              <button
                type="button"
                onClick={() => setIsMoreModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4 text-rose-600" />
              </button>
            </div>

            <div className="mt-3 space-y-1">
              {/* Holiday Management */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  navigate('/hr/holiday-management');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span>Holiday Management</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* Reports */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  navigate('/hr/reports');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span>Reports</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>

              {/* Notification */}
              <button
                type="button"
                onClick={() => {
                  setIsMoreModalOpen(false);
                  navigate('/hr/notifications');
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span>Notification</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRLayout;
