import React, { useState, useEffect, useCallback } from 'react';
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
  Filter,
  Loader2,
} from 'lucide-react';
import AttendanceDetailModal from './AttendanceDetailModal';
import { getMyAttendanceHistory, getHolidays } from '../../services/employeeService';

export const MyAttendanceView = ({ onBack }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [selectedRecordDate, setSelectedRecordDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 10;

  const selectedMonth = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYearNum = currentDate.getFullYear();

  // Full attendance logs
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
          const dayName = recDate.toLocaleDateString('en-US', { weekday: 'long' });
          const dateStr = recDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const hours = parseFloat(r.totalHours) || 0;
          const otMinutes = Math.max(0, Math.round((hours - 8) * 60));

          const dateIso = r.date ? String(r.date).split('T')[0] : '';
          const isHoliday = !!holidayMap[dateIso];

          let displayStatus = 'Present';
          if (isHoliday) displayStatus = 'Holiday';
          else if (r.status === 'absent') displayStatus = 'Absent';
          else if (r.status === 'half_day') displayStatus = 'Half Day';
          else if (r.status === 'late') displayStatus = 'Late';
          else if (r.status === 'on_leave') displayStatus = 'Leave';

          return {
            id: r.id,
            date: dateStr,
            dayNum,
            day: dayName,
            status: displayStatus,
            holidayName: holidayMap[dateIso] || null,
            in: r.clockInFormatted || '--:--',
            out: r.clockOutFormatted || '--:--',
            duration: hours > 0 ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m` : '--',
            break: r.totalBreakMinutes ? `${r.totalBreakMinutes}m` : '0m',
            overtime: otMinutes > 0 ? `+${otMinutes}m` : '--'
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
  const leaveCount = attendanceLogs.filter((l) => l.status === 'Leave' || l.status === 'Weekend').length;

  const handleOpenDetail = (dateString, record) => {
    setSelectedRecordDate(dateString);
    setSelectedRecord(record || attendanceLogs.find((l) => l.date === dateString) || null);
    setIsDetailModalOpen(true);
  };

  const handleExportCSV = () => {
    const csvContent =
      'Date,Day,Status,Punch In,Punch Out,Duration,Break\n' +
      attendanceLogs
        .map((r) => `${r.date},${r.day},${r.status},${r.in},${r.out},${r.duration},${r.break}`)
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Attendance_${selectedMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        {/* Month Selector & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800">{selectedMonth}</span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle: Table vs Calendar */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Timesheet</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Present */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {String(presentCount).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold text-emerald-800 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present Days
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Absent */}
        <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {String(absentCount).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold text-rose-800 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Absent Days
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Half Day */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {String(halfDayCount).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold text-amber-800 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Half Days
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Leaves / Holidays */}
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {String(leaveCount).padStart(2, '0')}
            </span>
            <span className="text-xs font-semibold text-blue-800 mt-0.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Holidays / Off
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content: Table View vs Calendar View */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 shadow-2xs flex items-center justify-center gap-2 text-slate-500 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-[#8B1D2C]" />
          <span>Loading attendance history for {selectedMonth}...</span>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 whitespace-nowrap">Attendance Log Sheet</h3>
              <p className="text-xs text-slate-500 mt-0.5">Showing records for {selectedMonth} &bull; 10 records per page</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
              Total {attendanceLogs.length} Logged Days &bull; Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Punch In</th>
                  <th className="py-3 px-4">Punch Out</th>
                  <th className="py-3 px-4">Effective Hours</th>
                  <th className="py-3 px-4">Break</th>
                  <th className="py-3 px-4">Overtime</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {currentLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">No Attendance Records Found</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        No clock-in/out records exist for {selectedMonth}. Your logs will appear here once recorded.
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.date}</td>
                    <td className="py-3 px-4 text-slate-500">{log.day}</td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 font-mono text-slate-700">{log.in}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{log.out}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.duration}</td>
                    <td className="py-3 px-4 text-slate-500">{log.break}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600 font-semibold">{log.overtime}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(log.date, log)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#8B1D2C] hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        View Timeline
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-800 font-mono">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800 font-mono">
                {Math.min(endIndex, attendanceLogs.length)}
              </span>{' '}
              of <span className="font-bold text-slate-800 font-mono">{attendanceLogs.length}</span> days
            </p>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
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
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
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
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {attendanceLogs
              .slice()
              .reverse()
              .map((item) => (
                <div
                  key={item.dayNum}
                  onClick={() => handleOpenDetail(item.date)}
                  className="h-24 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-xs group hover:border-[#8B1D2C]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-800 group-hover:text-[#8B1D2C]">
                      {item.dayNum}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
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

                  <div className="space-y-0.5">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold max-w-full truncate ${
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
                      <p className="text-[10px] font-mono text-slate-500 truncate">{item.in}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRecord(null);
        }}
        selectedDate={selectedRecordDate}
        record={selectedRecord}
      />
    </div>
  );
};

export default MyAttendanceView;
