import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  Download,
  Edit3,
  Plus,
  X,
  Building2,
  CreditCard
} from 'lucide-react';
import {
  getMyProfile,
  getMyPayslips,
  downloadMyPayslipPDF,
  updateMyProfile
} from '../../services/employeeService';
import HRPayslipModal from '../hr/HRPayslipModal';
import { PageSkeleton } from '../../components/common/Skeleton';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const EmployeeSalaryView = () => {
  const [profile, setProfile] = useState(null);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [selectedYear, setSelectedYear] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Payslip preview modal & download states
  const [selectedPayslipId, setSelectedPayslipId] = useState(null);
  const [downloadingSlipId, setDownloadingSlipId] = useState(null);

  // Masking & copy state
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Bank edit modal states
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: '',
    bankAccountNumber: '',
    confirmAccountNumber: '',
    bankIfsc: ''
  });
  const [bankFormLoading, setBankFormLoading] = useState(false);
  const [bankFormError, setBankFormError] = useState('');
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');

  const handleCopy = (text, key) => {
    if (!text || text === 'Not Configured' || text === '--') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadPDF = async (slip) => {
    try {
      setDownloadingSlipId(slip.id);
      const blob = await downloadMyPayslipPDF(slip.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${MONTH_NAMES[slip.month] || slip.month}_${slip.year}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF payslip:', err);
      alert('Failed to download payslip PDF. Please try again.');
    } finally {
      setDownloadingSlipId(null);
    }
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

  // Open bank update modal
  const handleOpenBankModal = () => {
    const rawAcc = profile?.bankAccountNumber || '';
    setBankFormData({
      bankName: profile?.bankName || '',
      bankAccountNumber: rawAcc,
      confirmAccountNumber: rawAcc,
      bankIfsc: profile?.bankIfsc || ''
    });
    setBankFormError('');
    setIsBankModalOpen(true);
  };

  // Submit bank update
  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setBankFormError('');

    const bName = bankFormData.bankName.trim();
    const accNo = bankFormData.bankAccountNumber.trim();
    const confAcc = bankFormData.confirmAccountNumber.trim();
    const ifsc = bankFormData.bankIfsc.trim().toUpperCase();

    if (!bName) {
      setBankFormError('Please enter Bank Name');
      return;
    }
    if (!accNo) {
      setBankFormError('Please enter Account Number');
      return;
    }
    if (accNo !== confAcc) {
      setBankFormError('Account Number and Confirm Account Number do not match');
      return;
    }
    if (!ifsc) {
      setBankFormError('Please enter Bank IFSC Code');
      return;
    }
    if (ifsc.length < 5) {
      setBankFormError('Please enter a valid IFSC Code (e.g. HDFC0001234)');
      return;
    }

    setBankFormLoading(true);
    try {
      const res = await updateMyProfile({
        bankName: bName,
        bankAccountNumber: accNo,
        bankIfsc: ifsc
      });

      const updatedData = res?.data ?? res ?? {};
      setProfile((prev) => ({
        ...prev,
        bankName: updatedData.bankName || bName,
        bankAccountNumber: updatedData.bankAccountNumber || accNo,
        bankIfsc: updatedData.bankIfsc || ifsc
      }));

      setIsBankModalOpen(false);
      setBankSuccessMsg('Salary bank account updated successfully!');
      setTimeout(() => setBankSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update bank details:', err);
      setBankFormError(
        err?.response?.data?.message || 'Failed to update bank account. Please try again.'
      );
    } finally {
      setBankFormLoading(false);
    }
  };

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
  const maskedAccount = rawAccount.length >= 4 ? `•••• •••• ${rawAccount.slice(-4)}` : rawAccount;
  const isBankConfigured = Boolean(profile?.bankName || rawAccount || profile?.bankIfsc);

  // Filtered payslips
  const filteredPayslips = payslips.filter((slip) => {
    if (selectedYear === 'all') return true;
    return String(slip.year) === String(selectedYear);
  });

  const availableYears = Array.from(new Set(payslips.map((s) => s.year))).filter(Boolean);

  if (loading) {
    return <PageSkeleton statsCount={4} tableRows={4} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Salary &amp; Payslips
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your compensation and monthly salary slips
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium self-start sm:self-auto">
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

      {bankSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bankSuccessMsg}</span>
        </div>
      )}

      {/* ── 4 Clean Summary Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Annual CTC</span>
          <span className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-1 block">
            ₹{Math.round(ctc).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Monthly Gross</span>
          <span className="text-lg sm:text-xl font-bold text-slate-900 font-mono mt-1 block">
            ₹{Math.round(grossMonthly).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Monthly Deductions</span>
          <span className="text-lg sm:text-xl font-bold text-rose-600 font-mono mt-1 block">
            -₹{Math.round(totalDeductions).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-emerald-200 bg-emerald-50/30 shadow-2xs">
          <span className="text-xs font-medium text-emerald-800 block">Net Take-Home</span>
          <span className="text-lg sm:text-xl font-bold text-emerald-700 font-mono mt-1 block">
            ₹{Math.round(netSalary).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* ── Salary Bank Account ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Salary Bank Account
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct deposit account on record for payroll disbursement
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenBankModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            {isBankConfigured ? (
              <>
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Bank Details</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Add Bank Details</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Bank Name
            </span>
            <span className="font-semibold text-slate-800 text-sm mt-1 block truncate">
              {profile?.bankName || 'Not Configured'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Account Number
              </span>
              <div className="flex items-center gap-1">
                {rawAccount && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowFullAccount(!showFullAccount)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={showFullAccount ? 'Hide Account Number' : 'Show Account Number'}
                    >
                      {showFullAccount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(rawAccount, 'acc')}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy Account Number"
                    >
                      {copiedKey === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}
              </div>
            </div>
            <span className="font-mono font-semibold text-slate-800 text-sm mt-1 block truncate">
              {rawAccount ? (showFullAccount ? rawAccount : maskedAccount) : 'Not Provided'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                IFSC Code
              </span>
              {profile?.bankIfsc && (
                <button
                  type="button"
                  onClick={() => handleCopy(profile.bankIfsc, 'ifsc')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Copy IFSC"
                >
                  {copiedKey === 'ifsc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
            <span className="font-mono font-semibold text-slate-800 text-sm mt-1 block truncate">
              {profile?.bankIfsc || 'Not Provided'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Monthly Payslip History ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Payslip History ({filteredPayslips.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              View and download your monthly salary slips
            </p>
          </div>

          {availableYears.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none"
              >
                <option value="all">All</option>
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
              Your monthly payslips will appear here once payroll is processed by HR.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4">Work Days</th>
                  <th className="py-2.5 px-4">Gross</th>
                  <th className="py-2.5 px-4">Deductions</th>
                  <th className="py-2.5 px-4">Net Paid</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayslips.map((slip) => {
                  const monthName = MONTH_NAMES[slip.month] || `Month ${slip.month}`;
                  const isPaid = slip.paymentStatus === 'paid';

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {monthName} {slip.year}
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-semibold text-slate-900">{Number(slip.presentDays || 0)}</span>
                        <span className="text-slate-400"> / {slip.workingDays || 26} days</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        ₹{Math.round(Number(slip.grossSalary || 0)).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-rose-600">
                        -₹{Math.round(Number(slip.totalDeductions || 0)).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        ₹{Math.round(Number(slip.netSalary || 0)).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          }`}
                        >
                          {slip.paymentStatus || 'Pending'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedPayslipId(slip.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                            title="View Payslip"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            disabled={downloadingSlipId === slip.id}
                            onClick={() => handleDownloadPDF(slip)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#8B1D2C] hover:bg-[#721724] text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                            title="Download PDF"
                          >
                            {downloadingSlipId === slip.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bank Details Edit/Add Modal ──────────────────────────────────── */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => !bankFormLoading && setIsBankModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-10 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isBankConfigured ? 'Edit Bank Account' : 'Add Bank Account'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Direct salary deposit credentials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !bankFormLoading && setIsBankModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bankFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bankFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBankDetails} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Bank Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
                  value={bankFormData.bankName}
                  onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter direct deposit account number"
                  value={bankFormData.bankAccountNumber}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, bankAccountNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Confirm Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Re-enter account number"
                  value={bankFormData.confirmAccountNumber}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, confirmAccountNumber: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  IFSC Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={bankFormData.bankIfsc}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, bankIfsc: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-semibold uppercase text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  11-character Indian Financial System Code
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={bankFormLoading}
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankFormLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B1D2C] hover:bg-[#721724] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {bankFormLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Bank Details</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
