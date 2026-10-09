import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  FileText,
  Printer,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { getMyProfile, getMyPayslips } from '../../services/employeeService';
import HRPayslipModal from '../hr/HRPayslipModal';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const EmployeeSalaryView = ({ onBack }) => {
  const [profile, setProfile] = useState(null);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Payslip preview modal
  const [selectedPayslipId, setSelectedPayslipId] = useState(null);

  // Masking & copy state
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text || text === 'Not Configured' || text === '--') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [resProfile, resPayslips] = await Promise.all([
        getMyProfile().catch((err) => {
          console.error('Failed to load profile for salary view:', err);
          return null;
        }),
        getMyPayslips().catch((err) => {
          console.error('Failed to load payslips:', err);
          return null;
        })
      ]);

      const user = resProfile?.data ?? resProfile ?? null;
      setProfile(user);

      if (user?.salaryStructure) {
        setSalaryStructure(user.salaryStructure);
      } else {
        setSalaryStructure(null);
      }

      const slipsData = resPayslips?.data ?? resPayslips ?? [];
      const slipsList = Array.isArray(slipsData) ? slipsData : [];
      setPayslips(slipsList);
    } catch (err) {
      console.error('Error loading employee salary data:', err);
      setErrorMsg('Failed to load salary details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Financial computations
  const ctc = Number(salaryStructure?.ctc || profile?.salary || 0);
  const basicSalary = Number(salaryStructure?.basicSalary || 0);
  const hra = Number(salaryStructure?.hra || 0);
  const specialAllowance = Number(salaryStructure?.specialAllowance || 0);
  const grossMonthly = basicSalary + hra + specialAllowance || (ctc > 0 ? Math.round(ctc / 12) : 0);

  const pfDeduction = Number(salaryStructure?.pfDeduction || 0);
  const esiDeduction = Number(salaryStructure?.esiDeduction || 0);
  const taxDeduction = Number(salaryStructure?.taxDeduction || 0);
  const totalDeductions = pfDeduction + esiDeduction + taxDeduction;

  const netSalary = Number(salaryStructure?.netSalary || Math.max(0, grossMonthly - totalDeductions));

  const rawAccount = profile?.bankAccountNumber || '';
  const maskedAccount = rawAccount.length >= 4 ? `•••• •••• ${rawAccount.slice(-4)}` : (rawAccount || 'Not Configured');

  // Filtered payslips
  const filteredPayslips = payslips.filter((slip) => {
    if (selectedYear === 'all') return true;
    return String(slip.year) === String(selectedYear);
  });

  const availableYears = Array.from(new Set(payslips.map((s) => s.year))).filter(Boolean);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80 max-w-4xl mx-auto my-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
        <p className="text-xs font-semibold text-slate-500">Loading salary details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* ── Simple Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Salary & Compensation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your CTC breakdown, monthly take-home salary, and payslip history
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Read-Only &bull; Managed by HR</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── 4 Clean Stats Strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Annual CTC</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
            ₹{Math.round(ctc).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Cost to Company</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 block">Monthly Gross</span>
          <span className="text-xl font-bold text-blue-950 font-mono mt-0.5 block">
            ₹{Math.round(grossMonthly).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Basic + HRA + Special</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-700 block">Monthly Deductions</span>
          <span className="text-xl font-bold text-rose-950 font-mono mt-0.5 block">
            -₹{Math.round(totalDeductions).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">PF, ESI & Tax</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">Net Take-Home</span>
          <span className="text-xl font-bold text-emerald-950 font-mono mt-0.5 block">
            ₹{Math.round(netSalary).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-emerald-700 mt-1 block">In-hand monthly</span>
        </div>
      </div>



      {/* ── Banking Details ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">
            Registered Salary Bank Account
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct deposit details on file with HR &amp; Accounts
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 block">Bank Name</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
              {profile?.bankName || 'Direct Deposit'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 block">Account Number</span>
              <div className="flex items-center gap-1">
                {rawAccount && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowFullAccount(!showFullAccount)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={showFullAccount ? 'Hide Account Number' : 'Show Account Number'}
                    >
                      {showFullAccount ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(rawAccount, 'acc')}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedKey === 'acc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </>
                )}
              </div>
            </div>
            <span className="font-bold font-mono text-slate-800 text-sm mt-0.5 block truncate">
              {rawAccount ? (showFullAccount ? rawAccount : maskedAccount) : 'Not Provided'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 block">IFSC Code</span>
              {profile?.bankIfsc && (
                <button
                  type="button"
                  onClick={() => handleCopy(profile.bankIfsc, 'ifsc')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Copy IFSC"
                >
                  {copiedKey === 'ifsc' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
            <span className="font-bold font-mono text-slate-800 text-sm mt-0.5 block truncate">
              {profile?.bankIfsc || 'Not Provided'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 block">Employee Code &amp; Dept</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block truncate">
              {profile?.employeeCode || '--'} &bull; {profile?.departmentDetails?.name || profile?.department || 'Operations'}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Note: To update your salary bank account, submit a cancelled cheque to HR &amp; Accounts.
        </p>
      </div>

      {/* ── Monthly Payslips History ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Monthly Payslip History ({filteredPayslips.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Download and view official verified monthly payslips
            </p>
          </div>

          {availableYears.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="all">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredPayslips.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-2 bg-slate-50/50 rounded-xl border border-slate-100">
            <FileText className="w-7 h-7 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No Payslips Issued Yet</p>
            <p className="text-[11px] text-slate-400 max-w-sm">
              Your monthly payslips will be generated automatically when payroll is processed at month-end.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3.5">Period</th>
                  <th className="py-2.5 px-3.5">Attendance</th>
                  <th className="py-2.5 px-3.5">Gross</th>
                  <th className="py-2.5 px-3.5">Deductions</th>
                  <th className="py-2.5 px-3.5">Net Paid</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayslips.map((slip) => {
                  const monthName = MONTH_NAMES[slip.month] || `Month ${slip.month}`;
                  const isPaid = slip.paymentStatus === 'paid';

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 font-semibold text-slate-900">
                        {monthName} {slip.year}
                      </td>

                      <td className="py-3 px-3.5 font-mono text-slate-700">
                        <span className="font-semibold text-emerald-700">{Number(slip.presentDays || 0)}</span>
                        <span className="text-slate-400"> / {slip.workingDays || 26}d</span>
                      </td>

                      <td className="py-3 px-3.5 font-mono text-slate-800">
                        ₹{Math.round(Number(slip.grossSalary || 0)).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3.5 font-mono text-rose-700">
                        -₹{Math.round(Number(slip.totalDeductions || 0)).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                        ₹{Math.round(Number(slip.netSalary || 0)).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {slip.paymentStatus || 'Pending'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayslipId(slip.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Official Printable Payslip Modal ─────────────────────────────── */}
      {selectedPayslipId && (
        <HRPayslipModal
          isOpen={!!selectedPayslipId}
          onClose={() => setSelectedPayslipId(null)}
          payrollId={selectedPayslipId}
        />
      )}
    </div>
  );
};

export default EmployeeSalaryView;
