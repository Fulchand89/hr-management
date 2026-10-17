import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ShieldCheck,
  UserCheck,
  Coffee,
  Check,
  X,
  Eye,
  Filter,
  FileSpreadsheet,
  Users,
  Loader2,
  UserMinus,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getHRDashboard,
  getEmployeeDashboard,
  getAdminDailyAttendance
} from '../../services/hrService';
import { DashboardSkeleton } from '../../components/common/Skeleton';

export const HRDashboard = ({
  attendanceStatus = 'NOT_PUNCHED_IN',
  punchInTime = null,
  workingHours = '00:00:00',
  breakHours = '00:00:00',
  timeline = [],
  onPunchIn,
  onTakeBreak,
  onEndBreak,
  onPunchOut,
  onNavigateToAttendance,
  onNavigateToLeaves,
  onNavigateToMyAttendance,
  onOpenApplyLeave,
  onSelectAttendanceRecord,
}) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (user?.name || user?.email?.split('@')[0] || 'HR Admin');

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const [toastMessage, setToastMessage] = useState('');

  // Recent attendance logs state (dynamically populated from backend)
  const [recentLogs, setRecentLogs] = useState([]);

  // Attendance summary metrics (dynamically populated from backend)
  const [attendanceSummary, setAttendanceSummary] = useState({
    presentDays: 0,
    averageHoursPerDay: 0,
    lateDays: 0,
    totalRecordedDays: 0
  });

  // Upcoming holidays & leave balances
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [availableLeaveDays, setAvailableLeaveDays] = useState(0);

  // Workforce HR Desk overview state
  const [workforceOverview, setWorkforceOverview] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    lateToday: 0,
    halfDayToday: 0,
    attendanceRate: '0.0%',
    pendingLeaveRequests: 0,
    pendingCorrectionRequests: 0,
    pendingResignationRequests: 0
  });

  // Attendance correction requests state
  const [attendanceQueue, setAttendanceQueue] = useState([]);

  // Leave queue state
  const [leaveQueue, setLeaveQueue] = useState([]);

  // Resignation queue state
  const [resignationQueue, setResignationQueue] = useState([]);

  // Staff Attendance state & pagination
  const [staffAttendance, setStaffAttendance] = useState([]);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePageSize, setAttendancePageSize] = useState(5);

  const totalStaffRecords = staffAttendance.length;
  const attendanceTotalPages = Math.max(1, Math.ceil(totalStaffRecords / attendancePageSize));
  const attendanceStartIndex = (attendancePage - 1) * attendancePageSize;
  const paginatedStaffAttendance = staffAttendance.slice(
    attendanceStartIndex,
    attendanceStartIndex + attendancePageSize
  );

  const handleAttendancePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= attendanceTotalPages) {
      setAttendancePage(newPage);
    }
  };

  const [isLoading, setIsLoading] = useState(true);
  const isInitialMountRef = useRef(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  // Fetch dynamic personal and HR workforce dashboard metrics
  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent && isInitialMountRef.current) {
      setIsLoading(true);
    }
    try {
      const [hrRes, empRes, staffRes] = await Promise.all([
        getHRDashboard().catch(() => null),
        getEmployeeDashboard().catch(() => null),
        getAdminDailyAttendance({ date: new Date().toISOString().split('T')[0], limit: 100 }).catch(() => null)
      ]);

      const hrData = hrRes?.data ?? hrRes ?? {};
      const empData = empRes?.data ?? empRes ?? {};

      // 1. Workforce Overview
      if (hrData?.overview) {
        setWorkforceOverview(hrData.overview);
      }

      // 2. Attendance Correction Queue
      if (Array.isArray(hrData?.attendanceQueue)) {
        setAttendanceQueue(
          hrData.attendanceQueue.map((item) => ({
            ...item,
            avatarInitial: (item.employeeName || 'E').charAt(0).toUpperCase()
          }))
        );
      }

      // 3. Leave Queue
      if (Array.isArray(hrData?.leaveQueue)) {
        setLeaveQueue(
          hrData.leaveQueue.map((item) => ({
            ...item,
            avatarInitial: (item.employeeName || 'E').charAt(0).toUpperCase()
          }))
        );
      }

      // 3b. Resignation Queue
      if (Array.isArray(hrData?.resignationQueue)) {
        setResignationQueue(
          hrData.resignationQueue.map((item) => ({
            ...item,
            avatarInitial: (item.employeeName || 'E').charAt(0).toUpperCase()
          }))
        );
      }

      // 4. Personal Attendance Recent Logs & Summary
      const combinedRecent = empData?.recentLogs || hrData?.personalAttendance || [];
      if (Array.isArray(combinedRecent)) {
        setRecentLogs(combinedRecent);
      }

      if (empData?.attendanceSummary) {
        setAttendanceSummary(empData.attendanceSummary);
      } else if (hrData?.personalSummary) {
        setAttendanceSummary(hrData.personalSummary);
      }

      // 5. Upcoming Holidays
      const holidaysList = hrData?.upcomingHolidays || empData?.upcomingHolidays || [];
      if (Array.isArray(holidaysList) && holidaysList.length > 0) {
        const formatted = holidaysList.map((h) => {
          const hDate = new Date(h.date);
          return {
            title: h.title,
            date: hDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            type: h.type || 'Holiday',
            daysLeft: h.daysLeft
          };
        });
        setUpcomingHolidays(formatted);
      } else {
        setUpcomingHolidays([]);
      }

      // 6. Available Leave Balances
      const balances = empData?.leaveBalances || [];
      if (Array.isArray(balances) && balances.length > 0) {
        const totalRemaining = balances.reduce(
          (sum, b) => sum + (parseFloat(b.remainingDays ?? b.remaining) || 0),
          0
        );
        setAvailableLeaveDays(totalRemaining);
      } else {
        setAvailableLeaveDays(0);
      }

      // 7. Staff Attendance
      const staffList = Array.isArray(staffRes?.data)
        ? staffRes.data
        : (staffRes?.data?.records || staffRes?.records || (Array.isArray(staffRes) ? staffRes : []));
      if (staffList.length > 0) {
        setStaffAttendance(staffList);
      }
    } catch (err) {
      console.debug('Dashboard metrics fetch handled:', err?.message);
    } finally {
      if (!isSilent && isInitialMountRef.current) {
        setIsLoading(false);
        isInitialMountRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    if (isInitialMountRef.current) {
      fetchDashboard(false);
    } else {
      // Silent background refresh on attendance status change to prevent full-page flash
      fetchDashboard(true);
    }

    const handleLiveUpdate = () => {
      fetchDashboard(true);
    };

    window.addEventListener('app:resignation_submitted', handleLiveUpdate);
    window.addEventListener('app:notification', handleLiveUpdate);

    return () => {
      window.removeEventListener('app:resignation_submitted', handleLiveUpdate);
      window.removeEventListener('app:notification', handleLiveUpdate);
    };
  }, [token, user?.role, attendanceStatus, fetchDashboard]);

  // Non-refreshing action handler for punch in / out and breaks
  const handleAction = async (actionFn, type) => {
    if (actionInProgress) return;
    setActionInProgress(type);
    try {
      if (actionFn) await actionFn();
    } catch (err) {
      console.debug(`Action ${type} error:`, err?.message || err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Live Auto-Polling: Refresh staff attendance roster every 15s for instant punch sync
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      getAdminDailyAttendance({ date: new Date().toISOString().split('T')[0], limit: 100 })
        .then((res) => {
          const records = Array.isArray(res?.data)
            ? res.data
            : (res?.data?.records || res?.records || (Array.isArray(res) ? res : []));
          if (records.length > 0) {
            setStaffAttendance(records);
          }
        })
        .catch(() => null);
    }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleDetailedClock = () => {
    if (onNavigateToAttendance) onNavigateToAttendance();
    else navigate('/hr/attendance');
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Live Attendance Control Card (Moved to Top of HR Dashboard) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Attendance & Punch Clock</h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time attendance tracking with live counter</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  attendanceStatus === 'WORKING'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : attendanceStatus === 'ON_BREAK'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : attendanceStatus === 'PUNCHED_OUT'
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                <span
                  className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                    attendanceStatus === 'WORKING'
                      ? 'bg-emerald-500 animate-ping'
                      : attendanceStatus === 'ON_BREAK'
                      ? 'bg-amber-500 animate-ping'
                      : attendanceStatus === 'PUNCHED_OUT'
                      ? 'bg-slate-400'
                      : 'bg-rose-500'
                  }`}
                />
                {attendanceStatus === 'WORKING'
                  ? 'Currently Working'
                  : attendanceStatus === 'ON_BREAK'
                  ? 'On Lunch / Tea Break'
                  : attendanceStatus === 'PUNCHED_OUT'
                  ? 'Day Completed'
                  : 'Not Punched In Yet'}
              </span>
            </div>
          </div>

          {/* Time Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            {/* Punch In Time */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <span className="text-xs text-slate-400 font-semibold block">Punched In At</span>
              <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                {punchInTime || '--:--'}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {attendanceStatus !== 'NOT_PUNCHED_IN' ? 'Punch Recorded' : 'Not Clocked In'}
              </span>
            </div>

            {/* Live Working Hours */}
            <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100">
              <span className="text-xs text-[#8B1D2C] font-semibold block">Total Working Hours</span>
              <span className="text-xl font-black text-[#8B1D2C] font-mono mt-1 block tracking-wider">
                {workingHours}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Target: 8h Standard</span>
            </div>

            {/* Break Duration */}
            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100">
              <span className="text-xs text-amber-800 font-semibold block">Break Taken</span>
              <span className="text-xl font-black text-amber-700 font-mono mt-1 block">
                {breakHours || '00:00:00'}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">Break Allocation</span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {attendanceStatus === 'NOT_PUNCHED_IN' && (
              <button
                type="button"
                disabled={!!actionInProgress}
                onClick={(e) => {
                  e.preventDefault();
                  handleAction(onPunchIn, 'punch_in');
                }}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] hover:shadow-lg hover:shadow-[#8B1D2C]/30 hover:-translate-y-0.5 text-white font-bold text-sm shadow-md shadow-[#8B1D2C]/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {actionInProgress === 'punch_in' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                ) : (
                  <Play className="w-4 h-4 fill-white shrink-0" />
                )}
                <span>{actionInProgress === 'punch_in' ? 'Punching In...' : 'Punch In for Today'}</span>
              </button>
            )}

            {attendanceStatus === 'WORKING' && (
              <>
                <button
                  type="button"
                  disabled={!!actionInProgress}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAction(onTakeBreak, 'take_break');
                  }}
                  className="group flex-1 py-3.5 px-6 rounded-2xl bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white hover:shadow-md hover:shadow-amber-500/25 hover:-translate-y-0.5 font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {actionInProgress === 'take_break' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 group-hover:text-white shrink-0" />
                  ) : (
                    <Coffee className="w-4 h-4 text-amber-600 group-hover:text-white transition-colors duration-200 shrink-0" />
                  )}
                  <span>{actionInProgress === 'take_break' ? 'Updating...' : 'Take Break'}</span>
                </button>
                <button
                  type="button"
                  disabled={!!actionInProgress}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAction(onPunchOut, 'punch_out');
                  }}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] hover:shadow-lg hover:shadow-[#8B1D2C]/30 hover:-translate-y-0.5 text-white font-bold text-sm shadow-md shadow-[#8B1D2C]/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {actionInProgress === 'punch_out' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 fill-white shrink-0" />
                  )}
                  <span>{actionInProgress === 'punch_out' ? 'Finishing Day...' : 'Punch Out & Finish Day'}</span>
                </button>
              </>
            )}

            {attendanceStatus === 'ON_BREAK' && (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  type="button"
                  disabled={!!actionInProgress}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAction(onEndBreak, 'end_break');
                  }}
                  className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 hover:-translate-y-0.5 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {actionInProgress === 'end_break' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  ) : (
                    <Play className="w-4 h-4 fill-white shrink-0" />
                  )}
                  <span>{actionInProgress === 'end_break' ? 'Resuming...' : 'Resume Work'}</span>
                </button>
                <button
                  type="button"
                  disabled={!!actionInProgress}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAction(onPunchOut, 'punch_out');
                  }}
                  className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] hover:shadow-lg hover:shadow-[#8B1D2C]/30 hover:-translate-y-0.5 text-white font-bold text-sm shadow-md shadow-[#8B1D2C]/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {actionInProgress === 'punch_out' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 fill-white shrink-0" />
                  )}
                  <span>{actionInProgress === 'punch_out' ? 'Finishing Day...' : 'Punch Out & Finish Day'}</span>
                </button>
              </div>
            )}

            {attendanceStatus === 'PUNCHED_OUT' && (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  type="button"
                  disabled={!!actionInProgress}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAction(onPunchIn, 'punch_in');
                  }}
                  className="flex-1 w-full py-3.5 px-6 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] hover:shadow-lg hover:shadow-[#8B1D2C]/30 hover:-translate-y-0.5 text-white font-bold text-sm shadow-md shadow-[#8B1D2C]/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ease-out active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {actionInProgress === 'punch_in' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                  ) : (
                    <Play className="w-4 h-4 fill-white shrink-0" />
                  )}
                  <span>{actionInProgress === 'punch_in' ? 'Punching In...' : 'Punch In Again'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDetailedClock}
                  className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 hover:shadow-md hover:-translate-y-0.5 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ease-out"
                >
                  Summary &rarr;
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDetailedClock}
              className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-700 font-semibold text-xs hover:-translate-y-0.5 hover:shadow-xs transition-all duration-200 ease-out cursor-pointer text-center"
            >
              Detailed Clock &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Pending Resignations & Exit Notices Queue Card */}
      {resignationQueue && resignationQueue.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50/90 via-white to-orange-50/40 rounded-3xl p-5 border border-rose-200/90 shadow-2xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Pending Resignation Notices
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                    {resignationQueue.length} Action Required
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Employees have submitted formal resignation notices requiring HR review & notice period sanction
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/hr/exit-management')}
              className="px-3.5 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 self-start sm:self-auto shrink-0"
            >
              <span>Manage Resignations</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3.5">
            {resignationQueue.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate('/hr/exit-management')}
                className="bg-white rounded-2xl p-4 border border-rose-100/80 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate group-hover:text-[#8B1D2C] transition-colors">
                      {item.employeeName}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {item.employeeId}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {item.department}
                  </div>
                  <div className="mt-2 text-xs text-slate-700 bg-rose-50/40 p-2.5 rounded-xl border border-rose-100/70 line-clamp-2">
                    <span className="font-semibold text-slate-800">Reason:</span> {item.reason || 'Not specified'}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Req. LWD: <strong className="text-slate-800 font-semibold">{item.requestedLastWorkingDay || '--'}</strong>
                  </span>
                  <span className="text-xs font-bold text-[#8B1D2C] group-hover:underline flex items-center gap-0.5">
                    Review &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Today's Staff Attendance Records Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Today's Staff Attendance</h3>
              {totalStaffRecords > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  {totalStaffRecords} Staff
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Live attendance roster for all employees</p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {totalStaffRecords > 5 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="text-[11px] font-medium">Rows:</span>
                <select
                  value={attendancePageSize}
                  onChange={(e) => {
                    setAttendancePageSize(Number(e.target.value));
                    setAttendancePage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B1D2C]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/hr/staff-attendance')}
              className="text-xs font-bold text-[#8B1D2C] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            >
              View Full Records &rarr;
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Employee</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Punch In</th>
                <th className="py-4 px-6">Punch Out</th>
                <th className="py-4 px-6">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStaffAttendance.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                    No attendance records found for today.
                  </td>
                </tr>
              ) : (
                paginatedStaffAttendance.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                          {record.employeeName?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{record.employeeName}</div>
                          <div className="text-xs text-slate-500 font-mono">{record.employeeId || 'EMP-XX'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        record.status === 'Present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        record.status === 'Absent' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        record.status === 'Late' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm font-medium text-slate-700 font-mono">
                      {record.punchIn || '--:--'}
                    </td>
                    <td className="py-3 px-6 text-sm font-medium text-slate-700 font-mono">
                      {record.punchOut || '--:--'}
                    </td>
                    <td className="py-3 px-6 text-sm font-bold text-slate-900">
                      {record.totalHours || '0h 0m'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalStaffRecords > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{attendanceStartIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800">
                {Math.min(attendanceStartIndex + attendancePageSize, totalStaffRecords)}
              </span>{' '}
              of <span className="font-bold text-slate-800">{totalStaffRecords}</span> staff members
            </div>

            {attendanceTotalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAttendancePageChange(attendancePage - 1)}
                  disabled={attendancePage === 1}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    attendancePage === 1
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: attendanceTotalPages }, (_, i) => i + 1).map((pageNum) => {
                    if (attendanceTotalPages > 7) {
                      if (
                        pageNum === 1 ||
                        pageNum === attendanceTotalPages ||
                        (pageNum >= attendancePage - 1 && pageNum <= attendancePage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handleAttendancePageChange(pageNum)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              attendancePage === pageNum
                                ? 'bg-[#8B1D2C] text-white shadow-xs'
                                : 'border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (pageNum === attendancePage - 2 || pageNum === attendancePage + 2) {
                        return (
                          <span key={pageNum} className="text-slate-400 px-1 text-xs">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handleAttendancePageChange(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          attendancePage === pageNum
                            ? 'bg-[#8B1D2C] text-white shadow-xs'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handleAttendancePageChange(attendancePage + 1)}
                  disabled={attendancePage === attendanceTotalPages}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    attendancePage === attendanceTotalPages
                      ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs'
                  }`}
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>

  );
};

export default HRDashboard;
