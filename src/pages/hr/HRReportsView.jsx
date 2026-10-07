import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  CalendarDays,
  User,
  Building2,
  Clock,
  LogOut,
  FileText,
  PieChart,
  ExternalLink,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Filter,
  Sparkles,
  Printer
} from 'lucide-react';
import {
  getAttendanceReport,
  getLeaveReport,
  getEmployeeSummaryReport
} from '../../services/hrService';

const REPORTS_LIST = [
  {
    id: 'daily-attendance',
    title: 'Daily Attendance Report',
    description: 'Detailed log of employee punch-ins, punch-outs, and real-time statuses for today.',
    icon: CalendarCheck,
    defaultType: 'Daily'
  },
  {
    id: 'monthly-attendance',
    title: 'Monthly Attendance Report',
    description: 'Aggregated view of employee total working hours, present days, and overtime per month.',
    icon: CalendarDays,
    defaultType: 'Monthly'
  },
  {
    id: 'employee-wise',
    title: 'Employee-wise Attendance',
    description: 'Individual audit trail of an employee with biometric timestamps, breaks, and shifts.',
    icon: User,
    defaultType: 'Employee'
  },
  {
    id: 'department-wise',
    title: 'Department-wise Attendance',
    description: 'Attendance percentage, absenteeism, and headcounts organized by organizational department.',
    icon: Building2,
    defaultType: 'Department'
  },
  {
    id: 'late-arrival',
    title: 'Late Arrival Report',
    description: 'Audit of all employees arriving after the designated shift start and grace period.',
    icon: Clock,
    defaultType: 'Late'
  },
  {
    id: 'early-departure',
    title: 'Early Departure Report',
    description: 'Audit of clock-outs recorded before the standard mandatory 8/9 work hours completion.',
    icon: LogOut,
    defaultType: 'Early'
  },
  {
    id: 'leave-report',
    title: 'Leave Report',
    description: 'Breakdown of Paid, Sick, Casual, and Unpaid leave balances and consumption across staff.',
    icon: FileText,
    defaultType: 'Leaves'
  },
  {
    id: 'half-day',
    title: 'Half Day Report',
    description: 'Summary of half-day leaves taken, first-half/second-half requests, and hour deductions.',
    icon: PieChart,
    defaultType: 'HalfDay'
  },
  {
    id: 'export-data',
    title: 'Export Data',
    description: 'Full payroll-ready raw telemetry and attendance CSV/Excel export for external ERP.',
    icon: ExternalLink,
    defaultType: 'Export'
  }
];

export const HRReportsView = () => {
  const navigate = useNavigate();

  const [selectedReport, setSelectedReport] = useState(null);
  const [reportFormat, setReportFormat] = useState('csv'); // 'csv' | 'excel' | 'pdf'
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [dateRange, setDateRange] = useState('Current Month');
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
      const params = {
        format: 'csv',
        ...(selectedDepartment !== 'All Departments' && { department: selectedDepartment })
      };

      let dataBlob;
      const ext = reportFormat === 'excel' ? 'csv' : reportFormat === 'csv' ? 'csv' : 'txt';
      const filename = `${selectedReport.id}_report_${new Date().toISOString().slice(0, 10)}.${ext}`;

      if (selectedReport.id.includes('leave')) {
        dataBlob = await getLeaveReport(params);
      } else if (selectedReport.id.includes('employee-wise')) {
        dataBlob = await getEmployeeSummaryReport(params);
      } else {
        dataBlob = await getAttendanceReport(params);
      }

      const blob = dataBlob instanceof Blob ? dataBlob : new Blob([dataBlob], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Downloaded ${selectedReport.title} successfully!`);
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

      {/* Header section matching user mockup */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/hr/dashboard')}
          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Reports</h1>
          <p className="text-xs text-slate-500">Generate, audit, and export workforce analytics & payroll data</p>
        </div>
      </div>

      {/* Reports Card List matching Screen 4 of the mockup */}
      <div className="bg-white rounded-3xl p-3 sm:p-5 border border-slate-200/80 shadow-2xs divide-y divide-slate-100">
        {REPORTS_LIST.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Rose/Burgundy Icon container matching mockup */}
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#8B1D2C] border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-rose-100 transition-all shadow-2xs">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#8B1D2C] transition-colors truncate">
                    {report.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                    {report.description}
                  </p>
                </div>
              </div>

              {/* Chevron right matching mockup */}
              <div className="p-1 rounded-lg text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Report Generator Drawer / Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#8B1D2C] flex items-center justify-center">
                  <selectedReport.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">{selectedReport.title}</h3>
                  <p className="text-xs text-slate-400">Configure parameters and export</p>
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

            {/* Modal Body */}
            <div className="space-y-4 text-xs">
              {/* Date Filter */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Time Period</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                >
                  <option value="Today">Today (Real-time snapshot)</option>
                  <option value="Current Week">Current Week (Mon - Today)</option>
                  <option value="Current Month">Current Month (Full month to date)</option>
                  <option value="Previous Month">Previous Month (Closed cycle)</option>
                  <option value="Current Quarter">Current Quarter (Q1 2026)</option>
                  <option value="Custom Range">Custom Date Range...</option>
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                >
                  <option value="All Departments">All Departments (Entire Organization)</option>
                  <option value="Engineering">Engineering & Product</option>
                  <option value="UI/UX Design">UI/UX Design Team</option>
                  <option value="Human Resources">Human Resources & Ops</option>
                  <option value="Marketing">Growth & Marketing</option>
                  <option value="Finance">Finance & Accounts</option>
                </select>
              </div>

              {/* Format Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">File Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportFormat('excel')}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      reportFormat === 'excel'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportFormat('csv')}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      reportFormat === 'csv'
                        ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>CSV (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportFormat('pdf')}
                    className={`py-2.5 px-3 rounded-xl font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      reportFormat === 'pdf'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Printer className="w-4 h-4 text-rose-600" />
                    <span>PDF (.pdf)</span>
                  </button>
                </div>
              </div>

              {/* Data Preview Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Estimated Rows: 142 records</span>
                  <span className="text-emerald-700">Audit Status: Ready</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Includes biometric timestamps, punch anomalies, leave deductions, and system verification signatures.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadReport}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold shadow-md shadow-[#8B1D2C]/20 cursor-pointer transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGenerating ? 'Generating...' : 'Export & Download'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRReportsView;
