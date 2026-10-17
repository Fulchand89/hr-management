import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar as CalendarIcon,
  Table as TableIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ArrowRight
} from 'lucide-react';
import AttendanceDetailModal from './AttendanceDetailModal';
import {
  getMyAttendanceHistory,
  getHolidays
} from '../../services/employeeService';
import { SkeletonTable } from '../../components/common/Skeleton';

export const MyAttendanceView = ({ onBack, onRequestCorrection }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [selectedRecordDate, setSelectedRecordDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;

  const selectedMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYearNum = currentDate.getFullYear();

  // Attendance logs & summary data
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [summaryData, setSummaryData] = useState(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resHistory, resHolidays] = await Promise.all([
        getMyAttendanceHistory(currentMonthNum, currentYearNum),
        getHolidays(currentYearNum).catch(() => null)
      ]);

      const data = resHistory?.data ?? resHistory ?? {};
      const holidaysList = Array.isArray(resHolidays?.data)
        ? resHolidays.data
        : (Array.isArray(resHolidays) ? resHolidays : []);

      const holidayMap = {};
      holidaysList.forEach((h) => {
        if (h.date) {
          const key = String(h.date).split('T')[0];
          holidayMap[key] = h.title || 'Public Holiday';
        }
      });

      if (data?.records && data.records.length > 0) {
        const formatted = data.records.map((r) => {
          const recDate = new Date(r.date);
          const dayNum = recDate.getDate();
          const dayName = recDate.toLocaleDateString('en-US', { weekday: 'short' });
          const dateStr = recDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const hours = parseFloat(r.totalHours) || 0;
          const otMinutes = Math.max(0, Math.round((hours - 8) * 60));
          const otHours = Math.floor(otMinutes / 60);
          const otMins = otMinutes % 60;
          let overtimeFormatted = '--';
          if (otMinutes > 0) {
            if (otHours > 0 && otMins > 0) {
              overtimeFormatted = `+${otHours}h ${otMins}m`;
            } else if (otHours > 0) {
              overtimeFormatted = `+${otHours}h`;
            } else {
              overtimeFormatted = `+0h ${otMins}m`;
            }
          }

          const dateIso = r.date ? String(r.date).split('T')[0] : '';
          const isHoliday = !!holidayMap[dateIso];

          let displayStatus = 'Present';
          if (isHoliday) displayStatus = 'Holiday';
          else if (r.status === 'absent') displayStatus = 'Absent';
          else if (r.status === 'half_day') displayStatus = 'Half Day';
          else if (r.status === 'late') displayStatus = 'Late';
          else if (r.status === 'on_leave') displayStatus = 'Leave';

          let punchOutVal = r.clockOutFormatted;
          if (!punchOutVal || punchOutVal === '--:--') {
            if (r.clockOut) {
              const d = new Date(r.clockOut);
              if (!isNaN(d.getTime())) {
                punchOutVal = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
              }
            } else if (r.punchOut && r.punchOut !== '--:--') {
              punchOutVal = r.punchOut;
            }
          }

          return {
            id: r.id,
            date: dateStr,
            dayNum,
            day: dayName,
            status: displayStatus,
            holidayName: holidayMap[dateIso] || null,
            in: r.clockInFormatted || (r.punchIn && r.punchIn !== '--:--' ? r.punchIn : '--:--'),
            out: punchOutVal || '--:--',
            duration: hours > 0 ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m` : '--',
            break: r.totalBreakMinutes ? `${r.totalBreakMinutes}m` : '0m',
            overtime: overtimeFormatted
          };
        });
        setAttendanceLogs(formatted.reverse());
        setSummaryData(data.summary || null);
      } else {
        setAttendanceLogs([]);
        setSummaryData(data.summary || null);
      }
    } catch {
      setAttendanceLogs([]);
      setSummaryData(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonthNum, currentYearNum]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setCurrentPage(1);
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setCurrentPage(1);
  };

  // Pagination computations
  const totalPages = Math.ceil(attendanceLogs.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = attendanceLogs.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const presentCount = summaryData?.presentDays ?? attendanceLogs.filter((l) => l.status === 'Present' || l.status === 'Late').length;
  const absentCount = summaryData?.absentDays ?? attendanceLogs.filter((l) => l.status === 'Absent').length;
  const halfDayCount = summaryData?.halfDays ?? attendanceLogs.filter((l) => l.status === 'Half Day').length;
  const leaveCount = attendanceLogs.filter((l) => l.status === 'Leave' || l.status === 'Weekend' || l.status === 'Holiday').length;

  const handleOpenDetail = (dateString, record) => {
    setSelectedRecordDate(dateString);
    setSelectedRecord(record || attendanceLogs.find((l) => l.date === dateString) || null);
    setIsDetailModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Day', 'Status', 'Punch In', 'Punch Out', 'Duration', 'Break', 'Overtime'];
    const rows = attendanceLogs.map((r) => [
      r.date,
      r.day,
      r.status,
      r.in,
      r.out,
      r.duration,
      r.break,
      r.overtime
    ]);
    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_${selectedMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── 1. Page Header & Action Controls ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monthly punch records, working hours & audit logs
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month Selector */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200/80 p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 whitespace-nowrap min-w-[110px] text-center">
              {selectedMonth}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* Request Correction Button */}
          <button
            type="button"
            onClick={() => onRequestCorrection ? onRequestCorrection() : navigate('/employee/attendance-correction/new')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-xs cursor-pointer transition-all whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Request Correction</span>
          </button>
        </div>
      </div>

      {/* ── 2. Stat Overview Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Present Days */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {String(presentCount).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present Days
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        {/* Absent Days */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {String(absentCount).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold text-rose-700 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent Days
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Half Days */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {String(halfDayCount).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold text-amber-700 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Half Days
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Holidays / Off */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {String(leaveCount).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold text-blue-700 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Holidays / Off
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── 3. Main Attendance Sheet ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Attendance Log Sheet</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing records for {selectedMonth} &bull; Total {attendanceLogs.length} logged days
            </p>
          </div>

          {/* View Mode Toggle: Table vs Calendar */}
          <div className="flex items-center bg-slate-100/80 rounded-xl p-1 border border-slate-200/60 w-fit">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>
        </div>

        {/* Content: Loading Skeleton vs Table vs Calendar */}
        {isLoading ? (
          <SkeletonTable rows={7} cols={8} hasHeader={false} />
        ) : viewMode === 'table' ? (
          <div>
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[650px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 whitespace-nowrap">Date</th>
                    <th className="py-3 px-4 whitespace-nowrap">Day</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">Punch In</th>
                    <th className="py-3 px-4 whitespace-nowrap">Punch Out</th>
                    <th className="py-3 px-4 whitespace-nowrap">Working Hours</th>
                    <th className="py-3 px-4 whitespace-nowrap">Break</th>
                    <th className="py-3 px-4 whitespace-nowrap">Overtime</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentLogs.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-12 text-center">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <h4 className="text-xs font-bold text-slate-700">No Attendance Records Found</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          No clock-in/out logs exist for {selectedMonth}.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    currentLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{log.date}</td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{log.day}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              log.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : log.status === 'Holiday'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : log.status === 'Absent'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : log.status === 'Half Day'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : log.status === 'Late'
                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                : log.status === 'Leave'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                log.status === 'Present'
                                  ? 'bg-emerald-500'
                                  : log.status === 'Holiday'
                                  ? 'bg-indigo-500'
                                  : log.status === 'Absent'
                                  ? 'bg-rose-500'
                                  : log.status === 'Half Day'
                                  ? 'bg-amber-500'
                                  : log.status === 'Late'
                                  ? 'bg-orange-500'
                                  : log.status === 'Leave'
                                  ? 'bg-blue-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                            {log.status === 'Holiday' && log.holidayName ? log.holidayName : log.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">{log.in}</td>
                        <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">{log.out}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{log.duration}</td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{log.break}</td>
                        <td className="py-3 px-4 font-mono text-emerald-600 font-semibold whitespace-nowrap">{log.overtime}</td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(log.date, log)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer"
                            >
                              Timeline
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/employee/attendance-correction/new?date=${log.date || ''}`)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#8B1D2C] hover:bg-rose-50 border border-rose-200/60 transition-colors cursor-pointer"
                            >
                              Correct
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {attendanceLogs.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-t border-slate-100 text-xs">
                <p className="text-slate-500">
                  Showing <span className="font-bold text-slate-800 font-mono">{startIndex + 1}</span> to{' '}
                  <span className="font-bold text-slate-800 font-mono">
                    {Math.min(endIndex, attendanceLogs.length)}
                  </span>{' '}
                  of <span className="font-bold text-slate-800 font-mono">{attendanceLogs.length}</span> records
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      currentPage === 1
                        ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs'
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[#8B1D2C] text-white shadow-xs'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      currentPage === totalPages
                        ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs'
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 sm:p-6">
            {/* Calendar View */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {attendanceLogs
                .slice()
                .reverse()
                .map((item) => (
                  <div
                    key={item.dayNum}
                    onClick={() => handleOpenDetail(item.date)}
                    className="min-h-[55px] sm:min-h-[75px] bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg sm:rounded-xl p-1 sm:p-2 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xs group hover:border-[#8B1D2C]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] sm:text-xs text-slate-800 group-hover:text-[#8B1D2C]">
                        {item.dayNum}
                      </span>
                      <span
                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                          item.status === 'Present'
                            ? 'bg-emerald-500'
                            : item.status === 'Holiday'
                            ? 'bg-indigo-500'
                            : item.status === 'Absent'
                            ? 'bg-rose-500'
                            : item.status === 'Half Day'
                            ? 'bg-amber-500'
                            : item.status === 'Late'
                            ? 'bg-orange-500'
                            : item.status === 'Leave'
                            ? 'bg-blue-500'
                            : 'bg-slate-300'
                        }`}
                      />
                    </div>

                    <div className="mt-1 space-y-0.5">
                      <span
                        className={`inline-block px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded text-[8px] sm:text-[10px] font-bold max-w-full truncate ${
                          item.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.status === 'Holiday'
                            ? 'bg-indigo-50 text-indigo-700'
                            : item.status === 'Absent'
                            ? 'bg-rose-50 text-rose-700'
                            : item.status === 'Half Day'
                            ? 'bg-amber-50 text-amber-700'
                            : item.status === 'Late'
                            ? 'bg-orange-50 text-orange-700'
                            : item.status === 'Leave'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.status === 'Holiday' && item.holidayName ? item.holidayName : item.status}
                      </span>
                      {item.in !== '--:--' && (
                        <p className="text-[8px] sm:text-[10px] font-mono text-slate-500 truncate hidden sm:block">{item.in}</p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Attendance Detail Modal ─────────────────────────────── */}
      <AttendanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecord(null);
        }}
        selectedDate={selectedRecordDate}
        record={selectedRecord}
        onRequestCorrection={(rec) => onRequestCorrection?.(rec)}
      />
    </div>
  );
};

export default MyAttendanceView;
