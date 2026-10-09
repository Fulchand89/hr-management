import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Calculator,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Percent,
  Wallet
} from 'lucide-react';
import { updateEmployeeSalary } from '../../services/hrService';

export const HRManageSalaryModal = ({
  isOpen,
  onClose,
  onSuccess,
  employee = null
}) => {
  const [ctc, setCtc] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [hra, setHra] = useState('');
  const [specialAllowance, setSpecialAllowance] = useState('');
  const [pfDeduction, setPfDeduction] = useState('');
  const [esiDeduction, setEsiDeduction] = useState('');
  const [taxDeduction, setTaxDeduction] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Pre-fill initial data when employee changes
  useEffect(() => {
    if (!isOpen || !employee) return;

    const initialCtc = employee.salary || employee.salaryStructure?.ctc || '';
    setCtc(initialCtc ? String(initialCtc) : '');

    if (employee.salaryStructure) {
      const s = employee.salaryStructure;
      setBasicSalary(s.basicSalary !== undefined ? String(s.basicSalary) : '');
      setHra(s.hra !== undefined ? String(s.hra) : '');
      setSpecialAllowance(s.specialAllowance !== undefined ? String(s.specialAllowance) : '');
      setPfDeduction(s.pfDeduction !== undefined ? String(s.pfDeduction) : '');
      setEsiDeduction(s.esiDeduction !== undefined ? String(s.esiDeduction) : '0');
      setTaxDeduction(s.taxDeduction !== undefined ? String(s.taxDeduction) : '0');
    } else if (initialCtc && Number(initialCtc) > 0) {
      calculateStandardBreakdown(Number(initialCtc));
    } else {
      setBasicSalary('');
      setHra('');
      setSpecialAllowance('');
      setPfDeduction('');
      setEsiDeduction('0');
      setTaxDeduction('0');
    }

    setErrorMessage('');
  }, [isOpen, employee]);

  // Standard salary breakdown calculation helper
  const calculateStandardBreakdown = (annualCtc) => {
    if (!annualCtc || annualCtc <= 0) return;
    const monthlyGross = Math.round(annualCtc / 12);
    const basic = Math.round(monthlyGross * 0.5); // 50% Basic
    const houseRent = Math.round(monthlyGross * 0.2); // 20% HRA
    const allowance = Math.max(0, monthlyGross - basic - houseRent); // remaining allowance
    const pf = Math.round(basic * 0.12); // 12% of basic
    const esi = monthlyGross <= 21000 ? Math.round(monthlyGross * 0.0075) : 0;
    const tax = 0;

    setBasicSalary(String(basic));
    setHra(String(houseRent));
    setSpecialAllowance(String(allowance));
    setPfDeduction(String(pf));
    setEsiDeduction(String(esi));
    setTaxDeduction(String(tax));
  };

  const handleCtcChange = (e) => {
    const val = e.target.value;
    setCtc(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      calculateStandardBreakdown(num);
    }
  };

  // Real-time calculations
  const numBasic = parseFloat(basicSalary) || 0;
  const numHra = parseFloat(hra) || 0;
  const numAllowance = parseFloat(specialAllowance) || 0;
  const totalEarnings = numBasic + numHra + numAllowance;

  const numPf = parseFloat(pfDeduction) || 0;
  const numEsi = parseFloat(esiDeduction) || 0;
  const numTax = parseFloat(taxDeduction) || 0;
  const totalDeductions = numPf + numEsi + numTax;

  const netTakeHome = Math.max(0, totalEarnings - totalDeductions);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedCtc = parseFloat(ctc);
    if (isNaN(parsedCtc) || parsedCtc <= 0) {
      setErrorMessage('Please enter a valid Annual CTC greater than 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ctc: parsedCtc,
        basicSalary: numBasic,
        hra: numHra,
        specialAllowance: numAllowance,
        pfDeduction: numPf,
        esiDeduction: numEsi,
        taxDeduction: numTax,
        netSalary: netTakeHome
      };

      const res = await updateEmployeeSalary(employee.id, payload);
      onSuccess(res?.data || res, `Salary structure for ${employee.firstName} configured successfully!`);
      onClose();
    } catch (err) {
      console.error('Update salary error:', err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to save salary structure.';
      setErrorMessage(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#8B1D2C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Manage Salary & Compensation
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  Payroll
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Configure CTC, monthly basic, allowances, and statutory deductions for {employee.firstName} {employee.lastName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee Summary Ribbon */}
        <div className="px-6 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">
              {employee.firstName} {employee.lastName}
            </span>
            <span className="text-slate-400 font-mono font-medium">
              ({employee.employeeCode || 'EMP-ID'})
            </span>
            <span>&bull;</span>
            <span className="text-slate-600 font-medium">
              {employee.departmentDetails?.name || employee.department || 'General'}
            </span>
          </div>

          <div className="text-slate-500">
            Current CTC:{' '}
            <span className="font-bold text-slate-900 font-mono">
              {employee.salary ? `₹${Number(employee.salary).toLocaleString()}` : 'Not Set'}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-[#8B1D2C] text-xs font-semibold animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Section 1: Annual CTC Input */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#8B1D2C]" />
                Annual Cost To Company (CTC) <span className="text-rose-500">*</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  const num = parseFloat(ctc);
                  if (num > 0) calculateStandardBreakdown(num);
                }}
                disabled={!ctc || parseFloat(ctc) <= 0}
                className="text-xs font-semibold text-[#8B1D2C] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Calculator className="w-3.5 h-3.5" />
                Auto-calculate 50-20-30 split
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-500 font-bold text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                value={ctc}
                onChange={handleCtcChange}
                placeholder="e.g. 750000"
                required
                className="w-full pl-8 pr-4 py-2.5 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
              />
            </div>

            {ctc && Number(ctc) > 0 && (
              <p className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
                <span>Monthly Gross: ₹{Math.round(Number(ctc) / 12).toLocaleString()} / month</span>
                <span className="text-emerald-700 font-bold">Standard Payroll Compliant</span>
              </p>
            )}
          </div>

          {/* Section 2: Monthly Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monthly Earnings Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Monthly Earnings (₹)
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  ₹{Math.round(totalEarnings).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Basic Salary (Monthly)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  placeholder="e.g. 30000"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  House Rent Allowance (HRA)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={hra}
                  onChange={(e) => setHra(e.target.value)}
                  placeholder="e.g. 12000"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Special / Other Allowance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={specialAllowance}
                  onChange={(e) => setSpecialAllowance(e.target.value)}
                  placeholder="e.g. 18000"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>
            </div>

            {/* Monthly Deductions Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-rose-600" />
                  Monthly Deductions (₹)
                </span>
                <span className="text-xs font-bold text-rose-700">
                  ₹{Math.round(totalDeductions).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  PF Deduction (Employee 12%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pfDeduction}
                  onChange={(e) => setPfDeduction(e.target.value)}
                  placeholder="e.g. 3600"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ESIC Deduction (if applicable)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={esiDeduction}
                  onChange={(e) => setEsiDeduction(e.target.value)}
                  placeholder="e.g. 0"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  TDS / Professional Tax
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={taxDeduction}
                  onChange={(e) => setTaxDeduction(e.target.value)}
                  placeholder="e.g. 0"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: In-Hand Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Estimated Net Take-Home Salary
              </span>
              <span className="text-2xl font-bold font-mono text-slate-900 mt-0.5 block">
                ₹{Math.round(netTakeHome).toLocaleString()}
                <span className="text-xs text-slate-500 font-sans font-normal"> / mo</span>
              </span>
            </div>

            <div className="text-right text-xs text-slate-500 font-mono">
              <div>Earnings: ₹{Math.round(totalEarnings).toLocaleString()}</div>
              <div>Deductions: -₹{Math.round(totalDeductions).toLocaleString()}</div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Structure...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Save Salary Structure</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRManageSalaryModal;
