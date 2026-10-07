import React, { useState, useEffect, useCallback } from 'react';
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
  Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getHRDashboard,
  getEmployeeDashboard,
  actionAttendanceCorrection,
  actionLeaveRequest
} from '../../services/hrService';

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
  const [statTab, setStatTab] = useState('all'); // 'all' | 'personal' | 'workforce'

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
    pendingCorrectionRequests: 0
  });

  // Attendance correction requests state
  const [attendanceQueue, setAttendanceQueue] = useState([]);

  // Leave queue state
  const [leaveQueue, setLeaveQueue] = useState([]);

  // Fetch dynamic personal and HR workforce dashboard metrics
  const fetchDashboard = useCallback(async () => {
    try {
      const [hrRes, empRes] = await Promise.all([
        getHRDashboard().catch(() => null),
        getEmployeeDashboard().catch(() => null)
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
      }

      // 6. Available Leave Balances
      const balances = empData?.leaveBalances || [];
      if (Array.isArray(balances) && balances.length > 0) {
        const totalRemaining = balances.reduce(
          (sum, b) => sum + (parseFloat(b.remainingDays ?? b.remaining) || 0),
          0
        );
        setAvailableLeaveDays(totalRemaining);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err?.message);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchDashboard();
  }, [token, user?.role, fetchDashboard]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleApproveAttendance = async (id) => {
    try {
      await actionAttendanceCorrection(id, { status: 'approved' });
      showToast(`Attendance correction #${id} approved!`);
      fetchDashboard();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to approve attendance correction');
    }
  };

  const handleRejectAttendance = async (id) => {
    try {
      await actionAttendanceCorrection(id, { status: 'rejected' });
      showToast(`Attendance correction #${id} rejected.`);
      fetchDashboard();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reject attendance correction');
    }
  };

  const handleApproveLeave = async (id) => {
    try {
      await actionLeaveRequest(id, { status: 'approved' });
      showToast(`Leave application #${id} sanctioned!`);
      fetchDashboard();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to approve leave request');
    }
  };

  const handleRejectLeave = async (id) => {
    try {
      await actionLeaveRequest(id, { status: 'rejected' });
      showToast(`Leave application #${id} rejected.`);
      fetchDashboard();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reject leave request');
    }
  };

  const handleDetailedClock = () => {
    if (onNavigateToAttendance) onNavigateToAttendance();
    else navigate('/hr/attendance');
  };

  const handleApplyLeaveClick = () => {
    if (onOpenApplyLeave) onOpenApplyLeave();
    else navigate('/hr/leaves');
  };

  const handleAttendanceLogClick = () => {
    if (onNavigateToMyAttendance) onNavigateToMyAttendance();
    else navigate('/hr/my-attendance');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Welcome Banner matching EmployeeDashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#5C101B] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        {/* Decorative backdrop shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-[#8B1D2C] opacity-30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-48 -mb-10 w-48 h-48 rounded-full bg-amber-500 opacity-20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-rose-200 backdrop-blur-xs">
                {todayFormatted}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Shift & HR Operations Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Good morning, {userName}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Welcome back to your employee & HR operations dashboard.{' '}
              {user?.shift ? `Your assigned shift is ${user.shift}.` : ''}{' '}
              You also have <span className="text-rose-200 font-bold">{leaveQueue.filter(x => x.status === 'pending').length + attendanceQueue.filter(x => x.status === 'pending').length} staff requests</span> awaiting review.
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-nowrap">
            <button
              type="button"
              onClick={handleDetailedClock}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Clock className="w-4 h-4 text-[#8B1D2C] shrink-0" />
              Open Live Timer
            </button>
            <button
              type="button"
              onClick={handleApplyLeaveClick}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/40 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              Apply Leave
            </button>
            <button
              type="button"
              onClick={() => navigate('/hr/leave-requests')}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              Sanction Leaves
            </button>
          </div>
        </div>
      </div>

      {/* Stat Section Header & View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Overview Metrics & Key Performance
          </h2>
          <p className="text-xs text-slate-500">
            Real-time tracking for your personal attendance and workforce operations
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setStatTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Metrics
          </button>
          <button
            type="button"
            onClick={() => setStatTab('personal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statTab === 'personal'
                ? 'bg-white text-[#8B1D2C] shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Personal Attendance
          </button>
          <button
            type="button"
            onClick={() => setStatTab('workforce')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statTab === 'workforce'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Workforce HR Desk
          </button>
        </div>
      </div>

      {/* 4 Personal Employee Stat Overview Cards (Directly from Employee UI) */}
      {(statTab === 'all' || statTab === 'personal') && (
        <div className="space-y-2">
          {statTab === 'all' && (
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
              Personal Attendance & Quotas
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Days Present */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Days Present</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{attendanceSummary.presentDays || 0}</span>
                <span className="text-xs text-slate-400 font-medium">/ {attendanceSummary.totalRecordedDays || 0} days</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />{' '}
                {attendanceSummary.totalRecordedDays > 0
                  ? `${((attendanceSummary.presentDays / attendanceSummary.totalRecordedDays) * 100).toFixed(1)}%`
                  : '0%'}{' '}
                attendance this month
              </div>
            </div>

            {/* Avg Working Hours */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Avg Daily Hours</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {attendanceSummary.averageHoursPerDay ? `${attendanceSummary.averageHoursPerDay}h` : '0h'}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ 8h goal</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Met shift criteria
              </div>
            </div>

            {/* Available Leaves */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Available Leaves</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{availableLeaveDays}</span>
                <span className="text-xs text-slate-400 font-medium">Days remaining</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-slate-500">
                Available annual quota
              </div>
            </div>

            {/* Punctuality Score */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Punctuality Score</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {attendanceSummary.totalRecordedDays > 0
                    ? `${Math.max(0, Math.round(((attendanceSummary.presentDays - (attendanceSummary.lateDays || 0)) / attendanceSummary.totalRecordedDays) * 100))}%`
                    : '100%'}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">&uarr; On track</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Punctuality record
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 HR Operations Stat Overview Cards (Workforce Metrics) */}
      {(statTab === 'all' || statTab === 'workforce') && (
        <div className="space-y-2">
          {statTab === 'all' && (
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
              Workforce Operations & Sanction Metrics
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Staff Present */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Staff Present</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{workforceOverview.presentToday}</span>
                <span className="text-xs text-slate-400 font-medium">/ {workforceOverview.totalEmployees} employees</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {workforceOverview.attendanceRate} attendance today
              </div>
            </div>

            {/* On Leave Today */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">On Leave Today</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{workforceOverview.onLeaveToday || 0}</span>
                <span className="text-xs text-slate-400 font-medium">employees</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Approved leave requests
              </div>
            </div>

            {/* Pending Leaves */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Leaves</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {workforceOverview.pendingLeaveRequests !== undefined
                    ? workforceOverview.pendingLeaveRequests
                    : leaveQueue.filter((x) => x.status === 'pending').length}
                </span>
                <span className="text-xs text-slate-400 font-medium">Awaiting action</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-rose-700">
                Staff time-off requests
              </div>
            </div>

            {/* Corrections Queue */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Corrections Queue</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {workforceOverview.pendingCorrectionRequests !== undefined
                    ? workforceOverview.pendingCorrectionRequests
                    : attendanceQueue.filter((x) => x.status === 'pending').length}
                </span>
                <span className="text-xs text-amber-700 font-semibold">Needs review</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Biometric timestamp fixes
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Live Attendance & Approvals (Left 2 Cols) + Quick Actions & Holidays (Right 1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Attendance Control Card & Approvals Action Desk */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Live Attendance Control Card (Directly from Employee UI) */}
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
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                {attendanceStatus === 'NOT_PUNCHED_IN' && (
                  <button
                    type="button"
                    onClick={onPunchIn}
                    className="flex-1 py-3 px-4 sm:px-6 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-sm shadow-md shadow-[#8B1D2C]/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 fill-white shrink-0" /> Punch In for Today
                  </button>
                )}

                {attendanceStatus === 'WORKING' && (
                  <>
                    <button
                      type="button"
                      onClick={onTakeBreak}
                      className="flex-1 py-3 px-4 sm:px-6 rounded-2xl bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
                    >
                      <Coffee className="w-4 h-4 text-amber-600 shrink-0" /> Take Break
                    </button>
                    <button
                      type="button"
                      onClick={onPunchOut}
                      className="flex-1 py-3 px-4 sm:px-6 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-sm shadow-md shadow-[#8B1D2C]/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] whitespace-nowrap shrink-0"
                    >
                      <Square className="w-4 h-4 fill-white shrink-0" /> Punch Out & Finish Day
                    </button>
                  </>
                )}

                {attendanceStatus === 'ON_BREAK' && (
                  <button
                    type="button"
                    onClick={onEndBreak}
                    className="flex-1 py-3 px-4 sm:px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] whitespace-nowrap shrink-0"
                  >
                    <Play className="w-4 h-4 fill-white shrink-0" /> Resume Work (End Break)
                  </button>
                )}

                {attendanceStatus === 'PUNCHED_OUT' && (
                  <button
                    type="button"
                    onClick={handleDetailedClock}
                    className="flex-1 py-3 px-4 sm:px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
                  >
                    View Full Attendance Summary &rarr;
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDetailedClock}
                  className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Detailed Clock &rarr;
                </button>
              </div>
            </div>

            {/* Location Verification Note */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <ShieldCheck className="w-4 h-4" /> {user?.branchDetails?.name ? `${user.branchDetails.name} Network` : 'Authorized Network Access'}
              </span>
              <span className="text-slate-400">Authenticated Session &bull; Secure Portal</span>
            </div>
          </div>

          {/* 2. Today's Approvals & Action Desk (HR Operations) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Today's Approvals & Action Desk</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time workforce attendance overrides & leave approvals</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200">
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5 bg-amber-500 animate-ping" />
                    {leaveQueue.filter(x => x.status === 'pending').length + attendanceQueue.filter(x => x.status === 'pending').length} Actions Required
                  </span>
                </div>
              </div>

              {/* Time / Request Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
                {/* Check-In Overrides */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="text-xs text-slate-400 font-semibold block">In-Time Fixes</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
                    {attendanceQueue.filter((x) => x.type === 'Check In Time' && x.status === 'pending').length} Pending
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Biometric override
                  </span>
                </div>

                {/* Check-Out Overrides */}
                <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100">
                  <span className="text-xs text-[#8B1D2C] font-semibold block">Out-Time Fixes</span>
                  <span className="text-xl font-black text-[#8B1D2C] font-mono mt-1 block">
                    {attendanceQueue.filter((x) => x.type === 'Check Out Time' && x.status === 'pending').length} Pending
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Overtime / Late punch
                  </span>
                </div>

                {/* Leave Applications */}
                <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100">
                  <span className="text-xs text-amber-800 font-semibold block">Time-Off Requests</span>
                  <span className="text-xl font-black text-amber-700 font-mono mt-1 block">
                    {leaveQueue.filter((x) => x.status === 'pending').length} Pending
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Casual & Sick leaves
                  </span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/hr/leave-requests')}
                  className="flex-1 py-3 px-4 sm:px-6 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-sm shadow-md shadow-[#8B1D2C]/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] whitespace-nowrap"
                >
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  Sanction Leave Applications &rarr;
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/hr/attendance-correction')}
                  className="flex-1 py-3 px-4 sm:px-6 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
                >
                  <Clock className="w-4 h-4 text-[#8B1D2C] shrink-0" />
                  Attendance Corrections &rarr;
                </button>
              </div>
            </div>

            {/* Audit Trail Note */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <ShieldCheck className="w-4 h-4" /> Full HR Sanction Privileges Active
              </span>
              <span className="text-slate-400">Authenticated HR Lead Session &bull; Secure Audit Trail</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Actions, Holidays & Pending Requests */}
        <div className="space-y-6">
          {/* Quick Actions Shortcuts */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quick Shortcuts
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleApplyLeaveClick}
                className="p-3 sm:p-3.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100/60 border border-rose-100 text-left transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#8B1D2C] text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 whitespace-nowrap">Apply Leave</div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap">Fast submission</div>
              </button>

              <button
                type="button"
                onClick={handleAttendanceLogClick}
                className="p-3 sm:p-3.5 rounded-2xl bg-sky-50/60 hover:bg-sky-100/60 border border-sky-100 text-left transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 whitespace-nowrap">Attendance Log</div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap">Monthly calendar</div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/hr/leave-requests')}
                className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/60 hover:bg-amber-100/60 border border-amber-100 text-left transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 whitespace-nowrap">Leave Desk</div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap">Review & sanction</div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/hr/attendance-correction')}
                className="p-3 sm:p-3.5 rounded-2xl bg-indigo-50/60 hover:bg-indigo-100/60 border border-indigo-100 text-left transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 whitespace-nowrap">Correction Log</div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap">Override verify</div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/hr/reports')}
                className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50/60 hover:bg-emerald-100/60 border border-emerald-100 text-left transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 whitespace-nowrap">Reports Hub</div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap">Audit & export</div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/hr/holiday-management')}
                className="p-3 sm:p-3.5 rounded-2xl bg-rose-50/60 hover:bg-rose-100/60 border border-rose-100 text-left transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#8B1D2C] text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 whitespace-nowrap">Holidays</div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap">Annual calendar</div>
              </button>
            </div>
          </div>

          {/* Upcoming Holidays Card (Directly from Employee UI) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upcoming Holidays
              </h3>
              <button
                type="button"
                onClick={() => navigate('/hr/holiday-management')}
                className="text-[11px] font-bold text-[#8B1D2C] hover:underline cursor-pointer"
              >
                Manage &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingHolidays.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No upcoming public holidays this month.
                </div>
              ) : (
                upcomingHolidays.map((holiday, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold text-xs flex flex-col items-center justify-center leading-tight">
                        <span>{holiday.date.split(' ')[0]}</span>
                        <span className="text-[8px] text-slate-400 uppercase font-semibold">
                          {holiday.date.split(' ')[1]}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{holiday.title}</h4>
                        <p className="text-[10px] text-slate-400">{holiday.type}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600">
                      {holiday.daysLeft}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Staff Requests Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Pending Staff Requests
              </h3>
              <span className="text-[11px] font-semibold text-[#8B1D2C]">
                Action Required
              </span>
            </div>

            <div className="space-y-2.5">
              {leaveQueue.filter((x) => x.status === 'pending').length === 0 &&
              attendanceQueue.filter((x) => x.status === 'pending').length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No pending staff requests awaiting review.
                </div>
              )}

              {leaveQueue.filter((x) => x.status === 'pending').map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/hr/leave-requests/${item.id}`)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#8B1D2C] border border-rose-100 font-bold text-xs flex items-center justify-center">
                      {item.avatarInitial}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.employeeName}</h4>
                      <p className="text-[10px] text-slate-400">{item.leaveType} &bull; {(item.dates ? item.dates.split('(')[0] : item.startDate) || 'Pending'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Review
                  </span>
                </div>
              ))}

              {attendanceQueue.filter((x) => x.status === 'pending').map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate('/hr/attendance-correction')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 font-bold text-xs flex items-center justify-center">
                      {item.avatarInitial}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.employeeName}</h4>
                      <p className="text-[10px] text-slate-400">{item.type} &bull; {item.date}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Fix
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Personal Attendance Activity Table (Directly from Employee UI) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Attendance Records</h3>
            <p className="text-xs text-slate-500 mt-0.5">Your punch in/out timestamps for the past week</p>
          </div>
          <button
            type="button"
            onClick={handleAttendanceLogClick}
            className="text-xs font-bold text-[#8B1D2C] hover:underline flex items-center gap-1 cursor-pointer"
          >
            View Full Month Records &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Date & Day</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Punch In</th>
                <th className="py-3 px-4">Punch Out</th>
                <th className="py-3 px-4">Effective Hours</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    No recent attendance records found. Punch in to record today's session!
                  </td>
                </tr>
              ) : (
                recentLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{log.date}</div>
                      <div className="text-[11px] text-slate-400">{log.day}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          log.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.status === 'Absent'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'Present'
                              ? 'bg-emerald-500'
                              : log.status === 'Absent'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{log.in}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{log.out}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{log.duration}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectAttendanceRecord && onSelectAttendanceRecord(log)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold text-[#8B1D2C] hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        View Details &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Attendance Corrections Queue Table (HR Operations - without 'Reason for Adjustment') */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Attendance Correction Requests</h3>
            <p className="text-xs text-slate-500 mt-0.5">Biometric timestamp overrides and manual adjustment requests</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/hr/attendance-correction')}
            className="text-xs font-bold text-[#8B1D2C] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Manage All ({attendanceQueue.length}) &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Correction Type</th>
                <th className="py-3 px-4">Original Time</th>
                <th className="py-3 px-4">Requested Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {attendanceQueue.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 font-medium">
                    No pending attendance corrections awaiting review.
                  </td>
                </tr>
              ) : (
                attendanceQueue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold text-xs shrink-0">
                        {item.avatarInitial}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{item.employeeName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{item.department}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{item.date}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{item.type}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{item.originalTime}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">{item.requestedTime}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        item.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : item.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'approved'
                            ? 'bg-emerald-500'
                            : item.status === 'rejected'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {item.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRejectAttendance(item.id)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveAttendance(item.id)}
                          className="px-3 py-1 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                        >
                          Approve
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
