import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  CalendarCheck,
  FileText,
  Clock,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Filter
} from 'lucide-react';
import {
  getAttendanceReport,
  getLeaveReport
} from '../../services/hrService';

// Core workforce reports supported by the backend
const REPORTS_LIST = [
  {
    id: 'attendance',
    title: 'Attendance Report',
    description: 'Comprehensive log of employee check-in, check-out, working hours, and daily attendance status.',
    icon: CalendarCheck,
    tag: 'Attendance & Hours'
  },
  {
    id: 'leave',
    title: 'Leave Report',
    description: 'Overview of employee leave applications, approved days, leave balances, and leave categories.',
    icon: FileText,
    tag: 'Leaves & Balances'
  },
  {
    id: 'late-arrival',
    title: 'Late Arrivals & Punctuality',
    description: 'Audit log of staff punch-ins arriving after shift start time and recorded half-days.',
    icon: Clock,
    tag: 'Punctuality Audit'
  }
];

// Helper to calculate exact start and end dates based on period preset
const getDateRangeForPeriod = (period) => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  const toISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  switch (period) {
    case 'Today': {
      const todayStr = toISO(now);
      return { startDate: todayStr, endDate: todayStr };
    }
    case 'Current Week': {
      const dayOfWeek = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(d - (dayOfWeek - 1));
      return { startDate: toISO(monday), endDate: toISO(now) };
    }
    case 'Previous Month': {
      const firstPrev = new Date(y, m - 1, 1);
      const lastPrev = new Date(y, m, 0);
      return { startDate: toISO(firstPrev), endDate: toISO(lastPrev) };
    }
    case 'Current Month':
    default: {
      const firstCurr = new Date(y, m, 1);
      const lastCurr = new Date(y, m + 1, 0);
      return { startDate: toISO(firstCurr), endDate: toISO(lastCurr) };
    }
  }
};

export const HRReportsView = () => {
  const navigate = useNavigate();

  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [datePeriod, setDatePeriod] = useState('Current Month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleDownloadReport = async () => {
    if (!selectedReport) return;
    setIsGenerating(true);

    try {
      const { startDate, endDate } = getDateRangeForPeriod(datePeriod);
      const params = {
        format: 'csv',
        startDate,
        endDate,
        ...(selectedDepartment !== 'All Departments' && { department: selectedDepartment })
      };

      let dataBlob;
      const filename = `${selectedReport.id}_report_${startDate}_to_${endDate}.csv`;

      if (selectedReport.id === 'leave') {
        dataBlob = await getLeaveReport(params);
      } else if (selectedReport.id === 'late-arrival') {
        dataBlob = await getAttendanceReport({ ...params, type: 'late' });
      } else {
        dataBlob = await getAttendanceReport(params);
      }

      // Create download link for CSV file
      const blob = dataBlob instanceof Blob ? dataBlob : new Blob([dataBlob], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Exported ${selectedReport.title} successfully!`);
      setSelectedReport(null);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/hr/dashboard')}
          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Reports & Exports</h1>
          <p className="text-xs text-slate-500">Download attendance, leaves, and workforce reports in CSV format</p>
        </div>
      </div>

      {/* Simplified Reports Grid */}
      <div className="grid grid-cols-1 gap-3.5">
        {REPORTS_LIST.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-[#8B1D2C]/40 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-[#8B1D2C] border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#8B1D2C] group-hover:text-white transition-all shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#8B1D2C] transition-colors">
                      {report.title}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {report.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {report.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 group-hover:bg-[#8B1D2C] text-slate-600 group-hover:text-white text-xs font-bold border border-slate-200 group-hover:border-transparent transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Simple Export Configuration Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center">
                  <selectedReport.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{selectedReport.title}</h3>
                  <p className="text-xs text-slate-400">Select parameters to download</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-4 text-xs">
              {/* Date Filter */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Time Period</label>
                <select
                  value={datePeriod}
                  onChange={(e) => setDatePeriod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                >
                  <option value="Today">Today</option>
                  <option value="Current Week">Current Week</option>
                  <option value="Current Month">Current Month (Full month to date)</option>
                  <option value="Previous Month">Previous Month</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finance">Finance</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                </select>
              </div>

              {/* Format Badge */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800 text-[11px]">Format: CSV (Spreadsheet)</p>
                  <p className="text-[10px] text-slate-500">Opens directly in Microsoft Excel, Google Sheets, or ERP</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold shadow-md shadow-[#8B1D2C]/20 cursor-pointer transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGenerating ? 'Downloading...' : 'Download CSV'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRReportsView;
