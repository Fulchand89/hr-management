import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calculator,
  Calendar,
  Building2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Users
} from 'lucide-react';
import { generateMonthlyPayroll, getDepartments } from '../../services/hrService';

export const HRPayrollProcessView = () => {
  const navigate = useNavigate();

  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [autoSyncAttendance, setAutoSyncAttendance] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const monthsList = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const yearsList = [2024, 2025, 2026, 2027];

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments();
        setDepartments(res?.data || res || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const payload = {
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        departmentId: departmentId || null
      };

      const res = await generateMonthlyPayroll(payload);
      const msg = res?.message || 'Monthly payroll generated successfully!';
      setSuccessMessage(msg);

      setTimeout(() => {
        navigate('/hr/payroll');
      }, 1400);
    } catch (err) {
      console.error('Failed to generate payroll:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to generate payroll cycle.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16 font-sans text-slate-800">
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/payroll')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Back to Payroll Directory"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8B1D2C]">Payroll</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500">Batch Processing</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Process Monthly Payroll Cycle
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/hr/payroll')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 self-start sm:self-auto cursor-pointer"
        >
          Cancel & Return
        </button>
      </div>

      {/* Main Execution Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Notifications */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage} Redirecting to Payroll Directory...</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-[#8B1D2C] text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Month & Year Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#8B1D2C]" />
                Select Payroll Month <span className="text-rose-500">*</span>
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                disabled={loading}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C] transition-colors cursor-pointer"
              >
                {monthsList.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Select Fiscal Year <span className="text-rose-500">*</span>
              </label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                disabled={loading}
                className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C] transition-colors cursor-pointer"
              >
                {yearsList.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Target Workforce Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-[#8B1D2C]"
            >
              <option value="">All Departments (Entire Active Staff)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rules Explanation Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-[#8B1D2C]" />
              <span>What Happens During Batch Calculation?</span>
            </div>
            <ul className="text-slate-600 space-y-1 list-disc list-inside text-xs leading-relaxed">
              <li>
                <strong className="text-slate-800">Attendance Audit:</strong> Pulls clock-in punches, live stopwatch totals, and approved leaves.
              </li>
              <li>
                <strong className="text-slate-800">LOP Proration:</strong> Deducts per-day gross rate for unapproved absences and Loss of Pay (LOP).
              </li>
              <li>
                <strong className="text-slate-800">Statutory Compliance:</strong> Applies 12% Employee PF, 0.75% ESIC (wage &le; ₹21,000), and income tax TDS.
              </li>
              <li>
                <strong className="text-slate-800">Snapshot Integrity:</strong> Generates salary slips in <span className="font-semibold text-amber-700">"PENDING"</span> status for HR review before bank disbursement.
              </li>
            </ul>
          </div>

          {/* Sync Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={autoSyncAttendance}
              onChange={(e) => setAutoSyncAttendance(e.target.checked)}
              className="w-4 h-4 rounded text-[#8B1D2C] focus:ring-[#8B1D2C] border-slate-300 cursor-pointer"
            />
            <span>Auto-sync live biometric punch clock and stopwatch attendance logs</span>
          </label>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/hr/payroll')}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Salaries...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Execute Monthly Payroll</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRPayrollProcessView;
