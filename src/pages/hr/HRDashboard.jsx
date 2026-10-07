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
  getAdminDailyAttendance
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

  // Staff Attendance state
  const [staffAttendance, setStaffAttendance] = useState([]);

  // Fetch dynamic personal and HR workforce dashboard metrics
  const fetchDashboard = useCallback(async () => {
    try {
      const [hrRes, empRes, staffRes] = await Promise.all([
        getHRDashboard().catch(() => null),
        getEmployeeDashboard().catch(() => null),
        getAdminDailyAttendance({ date: new Date().toISOString().split('T')[0] }).catch(() => null)
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

      // 7. Staff Attendance
      if (staffRes?.data) {
        setStaffAttendance(staffRes.data);
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

  const handleDetailedClock = () => {
    if (onNavigateToAttendance) onNavigateToAttendance();
    else navigate('/hr/attendance');
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

      {/* Staff Attendance Records Table (Moved to Top) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Staff Attendance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live attendance roster for all employees</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/hr/staff-attendance')}
            className="text-xs font-bold text-[#8B1D2C] hover:underline flex items-center gap-1 cursor-pointer"
          >
            View Full Records &rarr;
          </button>
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
              {staffAttendance.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                    No attendance records found for today.
                  </td>
                </tr>
              ) : (
                staffAttendance.map((record, index) => (
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
      </div>

      {/* Live Attendance Control Card (Directly from Employee UI) */}
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

    </div>

  );
};

export default HRDashboard;
