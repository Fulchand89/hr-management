import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Coffee,
  XCircle,
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { getAdminDailyAttendance } from '../../services/hrService';

export const AttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDailyAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAdminDailyAttendance({ date: selectedDate });
      const rawRecords = Array.isArray(res?.data?.records)
        ? res.data.records
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      setRecords(
        rawRecords.map((att) => {
          const emp = att.user || att.employee || {};
          const formatTime = (timeStr) => {
            if (!timeStr) return '--:--';
            try {
              const d = new Date(timeStr);
              return !isNaN(d.getTime())
                ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                : timeStr;
            } catch {
              return timeStr;
            }
          };

          const rawStatus = (att.status || 'absent').toLowerCase();
          const hrs = att.workingHours || att.totalHours || '00:00:00';
          const hrsFormatted = typeof hrs === 'number'
            ? `${Math.floor(hrs / 3600)}h ${Math.floor((hrs % 3600) / 60)}m`
            : hrs;

          return {
            id: att.id,
            employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || emp.email || 'Employee',
            employeeCode: emp.employeeCode || emp.id?.slice(0, 8) || 'EMP',
            avatar: emp.avatar || '',
            department: emp.departmentDetails?.name || emp.department || 'General',
            clockIn: formatTime(att.punchInTime || att.punchIn),
            clockOut: formatTime(att.punchOutTime || att.punchOut),
            totalHours: hrsFormatted,
            status: rawStatus
          };
        })
      );
    } catch (err) {
      console.error('Failed to load attendance roster:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadDailyAttendance();
  }, [loadDailyAttendance]);

  const filtered = records.filter(
    (r) =>
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const onLeaveCount = records.filter((r) => r.status === 'on_leave' || r.status === 'leave').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-indigo-600" />
            Daily Attendance Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time biometric & web punch logging across organization branches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-indigo-500"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{presentCount}</div>
            <div className="text-xs text-slate-500">Present Today</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{lateCount}</div>
            <div className="text-xs text-slate-500">Late Arrivals</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{onLeaveCount}</div>
            <div className="text-xs text-slate-500">On Leave</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600">{absentCount}</div>
            <div className="text-xs text-slate-500">Absent</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Total Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    {isLoading ? 'Loading attendance records...' : 'No attendance records found for this date.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {item.avatar ? (
                          <img src={item.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {(item.employeeName?.[0] || 'E').toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900">{item.employeeName}</div>
                          <div className="text-[11px] text-slate-400">{item.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{item.department}</td>
                    <td className="py-3 px-4 font-mono">{item.clockIn}</td>
                    <td className="py-3 px-4 font-mono">{item.clockOut}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{item.totalHours}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.status === 'present'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'late'
                            ? 'bg-amber-50 text-amber-700'
                            : item.status === 'on_leave'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-slate-400 font-medium">Logged</span>
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

export default AttendancePage;
