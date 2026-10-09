import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  CalendarCheck,
  CalendarDays,
  Bell,
  User,
  LogOut,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  Coffee,
  Play,
  Square,
  Sparkles,
  Wallet,
  BookOpen,
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
  onSwitchToAdmin,
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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', label: 'Live Punch & Timer', icon: Clock },
    { id: 'my-attendance', label: 'My Attendance', icon: CalendarCheck },
    { id: 'leaves', label: 'Leaves & Requests', icon: CalendarDays },
    { id: 'salary', label: 'Salary & Compensation', icon: Wallet },
    { id: 'policies', label: 'Company Policies', icon: BookOpen },
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
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
              <button
                type="button"
                onClick={onEndBreak}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
              >
                <Play className="w-3 h-3 fill-white" /> Resume Work
              </button>
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
            <div className="relative">
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

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (onSwitchToAdmin) {
                        onSwitchToAdmin();
                      } else {
                        window.location.href = '/admin/dashboard';
                      }
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

      {/* Main Body with Sidebar + Page Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Left Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 space-y-6 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Navigation Links List */}
          <nav className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#8B1D2C] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
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

          {/* Shift Details Info Card */}
          <div className="bg-gradient-to-br from-rose-50 to-orange-50/50 rounded-2xl p-4 border border-rose-100/80 text-xs space-y-2">
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span className="whitespace-nowrap">Shift</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-semibold text-[#8B1D2C] shadow-2xs whitespace-nowrap">
                9h Required
              </span>
            </div>
            <div className="text-slate-600 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 whitespace-nowrap">Timing:</span>
                <span className="font-semibold text-slate-700 whitespace-nowrap">10:00 AM - 07:00 PM</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 whitespace-nowrap">Break Allowance:</span>
                <span className="font-semibold text-emerald-700 whitespace-nowrap">1 Hour (60 Min)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 whitespace-nowrap">Grace Period:</span>
                <span className="font-semibold text-slate-700 whitespace-nowrap">15 Min (till 10:15)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 whitespace-nowrap">Location:</span>
                <span className="font-semibold text-slate-700 whitespace-nowrap">Office / WiFi</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-72 bg-white h-full p-5 flex flex-col justify-between z-10 shadow-2xl">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-slate-200 flex items-center justify-center shrink-0">
                      <img src="/logo.png" alt="Gupta Tech Web Logo" className="h-full w-full object-contain" />
                    </div>
                    <span className="font-extrabold text-slate-900">Gupta Tech Web</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1">
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
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Center / Right Dynamic Page Viewport */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
