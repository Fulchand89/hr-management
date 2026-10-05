import React, { useState } from 'react';
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
} from 'lucide-react';
import AttendanceDetailModal from './AttendanceDetailModal';

export const MyAttendanceView = ({ onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [selectedRecordDate, setSelectedRecordDate] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Full attendance logs for August 2026 (25 days mock data for pagination)
  const attendanceLogs = [
    { date: '25 Aug 2026', dayNum: 25, day: 'Tuesday', status: 'Present', in: '09:08 AM', out: '05:52 PM', duration: '08h 14m', break: '30m', overtime: '+14m' },
    { date: '24 Aug 2026', dayNum: 24, day: 'Monday', status: 'Present', in: '09:15 AM', out: '06:05 PM', duration: '08h 20m', break: '30m', overtime: '+20m' },
    { date: '23 Aug 2026', dayNum: 23, day: 'Sunday', status: 'Weekend', in: '--:--', out: '--:--', duration: '--', break: '--', overtime: '--' },
    { date: '22 Aug 2026', dayNum: 22, day: 'Saturday', status: 'Weekend', in: '--:--', out: '--:--', duration: '--', break: '--', overtime: '--' },
    { date: '21 Aug 2026', dayNum: 21, day: 'Friday', status: 'Present', in: '09:02 AM', out: '05:58 PM', duration: '08h 26m', break: '30m', overtime: '+26m' },
    { date: '20 Aug 2026', dayNum: 20, day: 'Thursday', status: 'Present', in: '09:10 AM', out: '06:00 PM', duration: '08h 20m', break: '30m', overtime: '+20m' },
    { date: '19 Aug 2026', dayNum: 19, day: 'Wednesday', status: 'Half Day', in: '09:05 AM', out: '01:30 PM', duration: '04h 25m', break: '00m', overtime: '-03h 35m' },
    { date: '18 Aug 2026', dayNum: 18, day: 'Tuesday', status: 'Present', in: '09:12 AM', out: '05:48 PM', duration: '08h 06m', break: '30m', overtime: '+06m' },
    { date: '17 Aug 2026', dayNum: 17, day: 'Monday', status: 'Present', in: '08:58 AM', out: '05:45 PM', duration: '08h 17m', break: '30m', overtime: '+17m' },
    { date: '16 Aug 2026', dayNum: 16, day: 'Sunday', status: 'Weekend', in: '--:--', out: '--:--', duration: '--', break: '--', overtime: '--' },
    { date: '15 Aug 2026', dayNum: 15, day: 'Saturday', status: 'Leave', in: '--:--', out: '--:--', duration: '--', break: '--', overtime: '--' },
    { date: '14 Aug 2026', dayNum: 14, day: 'Friday', status: 'Present', in: '09:05 AM', out: '05:55 PM', duration: '08h 20m', break: '30m', overtime: '+20m' },
    { date: '13 Aug 2026', dayNum: 13, day: 'Thursday', status: 'Present', in: '09:11 AM', out: '06:02 PM', duration: '08h 21m', break: '30m', overtime: '+21m' },
    { date: '12 Aug 2026', dayNum: 12, day: 'Wednesday', status: 'Present', in: '09:12 AM', out: '05:47 PM', duration: '08h 02m', break: '35m', overtime: '+00m' },
    { date: '11 Aug 2026', dayNum: 11, day: 'Tuesday', status: 'Present', in: '09:00 AM', out: '05:45 PM', duration: '08h 15m', break: '30m', overtime: '+15m' },
    { date: '10 Aug 2026', dayNum: 10, day: 'Monday', status: 'Absent', in: '--:--', out: '--:--', duration: '--', break: '--', overtime: '--' },
    { date: '09 Aug 2026', dayNum: 9, day: 'Sunday', status: 'Weekend', in: '--:--', out: '--:--', duration: '--', break: '--', overtime: '--' },
    { date: '08 Aug 2026', dayNum: 8, day: 'Saturday', status: 'Weekend', in: '--:--', out: '--:--', duration: '--', break: '--', overtime: '--' },
    { date: '07 Aug 2026', dayNum: 7, day: 'Friday', status: 'Present', in: '09:05 AM', out: '06:12 PM', duration: '08h 35m', break: '32m', overtime: '+35m' },
    { date: '06 Aug 2026', dayNum: 6, day: 'Thursday', status: 'Half Day', in: '09:12 AM', out: '01:30 PM', duration: '04h 18m', break: '00m', overtime: '-03h 42m' },
    { date: '05 Aug 2026', dayNum: 5, day: 'Wednesday', status: 'Present', in: '09:10 AM', out: '05:50 PM', duration: '08h 10m', break: '30m', overtime: '+10m' },
    { date: '04 Aug 2026', dayNum: 4, day: 'Tuesday', status: 'Leave', in: '--:--', out: '--:--', duration: '--', break: '--', overtime: '--' },
    { date: '03 Aug 2026', dayNum: 3, day: 'Monday', status: 'Present', in: '09:15 AM', out: '06:05 PM', duration: '08h 20m', break: '30m', overtime: '+20m' },
    { date: '02 Aug 2026', dayNum: 2, day: 'Sunday', status: 'Weekend', in: '--:--', out: '--:--', duration: '--', break: '--', overtime: '--' },
    { date: '01 Aug 2026', dayNum: 1, day: 'Saturday', status: 'Absent', in: '--:--', out: '--:--', duration: '--', break: '--', overtime: '--' },
  ];

  // Pagination computations
  const totalPages = Math.ceil(attendanceLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = attendanceLogs.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const presentCount = attendanceLogs.filter((l) => l.status === 'Present').length;
  const absentCount = attendanceLogs.filter((l) => l.status === 'Absent').length;
  const halfDayCount = attendanceLogs.filter((l) => l.status === 'Half Day').length;
  const leaveCount = attendanceLogs.filter((l) => l.status === 'Leave' || l.status === 'Weekend').length;

  const handleOpenDetail = (dateString) => {
    setSelectedRecordDate(dateString);
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
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800">{selectedMonth}</span>
            <button
              type="button"
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
      {viewMode === 'table' ? (
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
                {currentLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.date}</td>
                    <td className="py-3 px-4 text-slate-500">{log.day}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          log.status === 'Present'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : log.status === 'Absent'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : log.status === 'Half Day'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : log.status === 'Leave'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            log.status === 'Present'
                              ? 'bg-emerald-500'
                              : log.status === 'Absent'
                              ? 'bg-rose-500'
                              : log.status === 'Half Day'
                              ? 'bg-amber-500'
                              : log.status === 'Leave'
                              ? 'bg-blue-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{log.in}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{log.out}</td>
                    <td className="py-3 px-4 font-bold font-mono text-slate-900">{log.duration}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{log.break}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">{log.overtime}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(log.date)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#8B1D2C] hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        View Audit &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
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
              of <span className="font-bold text-slate-800 font-mono">{attendanceLogs.length}</span> records
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
        /* Calendar Grid View */
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Calendar View</h3>
              <p className="text-xs text-slate-500 mt-0.5">Click any day cell to view complete punch timestamps</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Half Day
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Leave
              </span>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 border-b border-slate-100">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2.5 pt-3">
            {/* Pad days before Aug 1 (Thursday was 1st) */}
            <div className="h-24 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/50 p-2 text-slate-300 text-xs">
              29
            </div>
            <div className="h-24 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/50 p-2 text-slate-300 text-xs">
              30
            </div>
            <div className="h-24 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/50 p-2 text-slate-300 text-xs">
              31
            </div>

            {/* Days 1 to 12 */}
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
                          : item.status === 'Absent'
                          ? 'bg-rose-500'
                          : item.status === 'Half Day'
                          ? 'bg-amber-500'
                          : item.status === 'Leave'
                          ? 'bg-blue-500'
                          : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="space-y-0.5">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'Absent'
                          ? 'bg-rose-50 text-rose-700'
                          : item.status === 'Half Day'
                          ? 'bg-amber-50 text-amber-700'
                          : item.status === 'Leave'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.in !== '--:--' && (
                      <p className="text-[10px] font-mono text-slate-500 truncate">{item.in}</p>
                    )}
                  </div>
                </div>
              ))}

            {/* Remaining empty days for demonstration */}
            {Array.from({ length: Math.max(0, 31 - attendanceLogs.length) }).map((_, i) => (
              <div
                key={`future-${i}`}
                className="h-24 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60 p-2.5 flex flex-col justify-between text-slate-400"
              >
                <span className="font-bold text-xs">{attendanceLogs.length + 1 + i}</span>
                <span className="text-[10px] text-slate-300 font-medium">Upcoming</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Detail Modal */}
      <AttendanceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedDate={selectedRecordDate}
      />
    </div>
  );
};

export default MyAttendanceView;
