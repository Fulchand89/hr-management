import React, { useState, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  DollarSign,
  TrendingUp,
  Percent
} from 'lucide-react';
import { adjustPayroll } from '../../services/hrService';

export const HRPayrollAdjustModal = ({ isOpen, onClose, payroll, onSuccess }) => {
  const [bonus, setBonus] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (payroll) {
      setBonus(payroll.bonus !== undefined ? String(payroll.bonus) : '0');
      setOtherDeductions(payroll.otherDeductions !== undefined ? String(payroll.otherDeductions) : '0');
      setRemarks(payroll.remarks || '');
    }
  }, [payroll]);

  if (!isOpen || !payroll) return null;

  const emp = payroll.user || {};
  const baseGross = Number(payroll.monthlyGross || 0) - Number(payroll.lopDeduction || 0);

  const numBonus = parseFloat(bonus) || 0;
  const numOtherDed = parseFloat(otherDeductions) || 0;

  const calculatedGross = Math.max(0, baseGross + numBonus);
  const calculatedDeductions = Math.max(
    0,
    Number(payroll.pfDeduction || 0) +
      Number(payroll.esiDeduction || 0) +
      Number(payroll.taxDeduction || 0) +
      numOtherDed
  );
  const calculatedNet = Math.max(0, calculatedGross - calculatedDeductions);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await adjustPayroll(payroll.id, {
        bonus: numBonus,
        otherDeductions: numOtherDed,
        remarks: remarks.trim()
      });

      setSuccessMessage('Salary adjustment saved successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to adjust payroll:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to save adjustment.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => !loading && onClose()} />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-[#8B1D2C]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Adjust Employee Salary
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Add one-off festival bonuses, overtime, or advance recovery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Messages */}
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-[#8B1D2C] text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Employee Chip */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                {emp.firstName?.[0]}{emp.lastName?.[0]}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {emp.firstName} {emp.lastName}
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  {emp.employeeCode || 'EMP-ID'} &bull; {emp.department || 'General'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Cycle</span>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {payroll.month}/{payroll.year}
              </span>
            </div>
          </div>

          {/* Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bonus Input */}
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-1.5">
              <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                Additional Bonus / Reward
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 text-xs font-bold bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <span className="text-[10px] text-emerald-700 font-medium block">
                Adds directly to gross earnings
              </span>
            </div>

            {/* Other Deduction Input */}
            <div className="p-3.5 bg-rose-50/50 border border-rose-200/80 rounded-2xl space-y-1.5">
              <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
                Other Deductions / Penalty
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={otherDeductions}
                  onChange={(e) => setOtherDeductions(e.target.value)}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 text-xs font-bold bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
              <span className="text-[10px] text-rose-700 font-medium block">
                Advance salary / loan recovery
              </span>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Adjustment Reason / Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Festival Performance Incentive / Shift Overtime"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
            />
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl space-y-2">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Revised Net Take-Home Salary (Preview)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-emerald-400">
                ₹{Math.round(calculatedNet).toLocaleString()}
              </span>
              <div className="text-[11px] text-slate-300 space-x-3 text-right">
                <span>Gross: ₹{Math.round(calculatedGross).toLocaleString()}</span>
                <span>Deductions: ₹{Math.round(calculatedDeductions).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Save & Recalculate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRPayrollAdjustModal;
