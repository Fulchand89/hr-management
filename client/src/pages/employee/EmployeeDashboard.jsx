import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Play,
  Square,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight,
  CalendarDays,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDashboard } from '../../services/employeeService';

export const EmployeeDashboard = ({
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
  const { user, token } = useAuth();
  const userName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : (user?.name || user?.email?.split('@')[0] || 'Employee');

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Recent attendance logs state (dynamically populated from backend)
  const [recentLogs, setRecentLogs] = useState([]);

  // Attendance summary metrics (dynamically populated from backend)
  const [attendanceSummary, setAttendanceSummary] = useState({
    presentDays: 0,
    averageHoursPerDay: 0,
    lateDays: 0,
    totalRecordedDays: 0
  });

  // Upcoming holidays
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [availableLeaveDays, setAvailableLeaveDays] = useState(0);

  useEffect(() => {
    if (!token) return;

    const fetchDashboard = async () => {
      try {
        const res = await getDashboard();
        const data = res?.data ?? res ?? {};

        if (data?.recentLogs && Array.isArray(data.recentLogs)) {
          setRecentLogs(data.recentLogs);
        }

        if (data?.attendanceSummary) {
          setAttendanceSummary(data.attendanceSummary);
        }

        if (data?.upcomingHolidays && data.upcomingHolidays.length > 0) {
          const formatted = data.upcomingHolidays.map((h) => {
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

        if (data?.leaveBalances && data.leaveBalances.length > 0) {
          const totalRemaining = data.leaveBalances.reduce(
            (sum, b) => sum + (parseFloat(b.remainingDays ?? b.remaining) || 0),
            0
          );
          setAvailableLeaveDays(totalRemaining);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err?.message);
      }
    };
    fetchDashboard();
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
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
                Shift Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Good morning, {userName}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Welcome back to your employee dashboard. {user?.shift ? `Your assigned shift is ${user.shift}.` : ''} Have a productive day ahead!
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-nowrap">
            <button
              type="button"
              onClick={onNavigateToAttendance}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Clock className="w-4 h-4 text-[#8B1D2C] shrink-0" />
              Open Live Timer
            </button>
            <button
              type="button"
              onClick={onOpenApplyLeave}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/40 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <CalendarDays className="w-4 h-4 shrink-0" />
              Apply Leave
            </button>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present Days */}
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

        {/* Leave Balance */}
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

        {/* On-Time Arrival */}
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

      {/* Hero Live Attendance Card & Quick Action Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Attendance Control Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Today's Attendance & Punch Clock</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time attendance tracking with live counter</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${attendanceStatus === 'WORKING'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : attendanceStatus === 'ON_BREAK'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : attendanceStatus === 'PUNCHED_OUT'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${attendanceStatus === 'WORKING'
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
                  onClick={onNavigateToAttendance}
                  className="flex-1 py-3 px-4 sm:px-6 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
                >
                  View Full Attendance Summary &rarr;
                </button>
              )}

              <button
                type="button"
                onClick={onNavigateToAttendance}
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

        {/* Right 1 Col: Quick Actions & Holidays */}
        <div className="space-y-6">
          {/* Quick Actions Shortcuts */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Quick Shortcuts
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenApplyLeave}
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
                onClick={onNavigateToMyAttendance}
                className="p-3 sm:p-3.5 rounded-2xl bg-sky-50/60 hover:bg-sky-100/60 border border-sky-100 text-left transition-colors cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 whitespace-nowrap">Attendance Log</div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap">Monthly calendar</div>
              </button>
            </div>
          </div>

          {/* Upcoming Holidays Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upcoming Holidays
              </h3>
              <span className="text-[11px] font-semibold text-[#8B1D2C]">
                {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
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
        </div>
      </div>

      {/* Recent Attendance Activity Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Attendance Records</h3>
            <p className="text-xs text-slate-500 mt-0.5">Your punch in/out timestamps for the past week</p>
          </div>
          <button
            type="button"
            onClick={onNavigateToMyAttendance}
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
                    No recent attendance records found. Punch in to create your first log!
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
                        onClick={() => onSelectAttendanceRecord(log)}
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
    </div>
  );
};

export default EmployeeDashboard;
