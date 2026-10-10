import React, { useState, useEffect } from 'react';
import {
  X,
  SlidersHorizontal,
  Loader2,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Clock,
  Calendar,
  Zap,
  RotateCcw,
  ShieldCheck,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adjustPayroll } from '../../services/hrService';

export const HRPayrollAdjustModal = ({ isOpen, onClose, payroll, onSuccess }) => {
  const navigate = useNavigate();

  // Form states
  const [presentDays, setPresentDays] = useState('0');
  const [paidLeaves, setPaidLeaves] = useState('0');
  const [lopDays, setLopDays] = useState('0');

  const [underTimeHours, setUnderTimeHours] = useState('0');
  const [waiveUnderTime, setWaiveUnderTime] = useState(false);

  const [overtimeHours, setOvertimeHours] = useState('0');
  const [overtimeRateMultiplier, setOvertimeRateMultiplier] = useState('1.0');

  const [bonus, setBonus] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('0');

  const [isManualNetOverride, setIsManualNetOverride] = useState(false);
  const [manualNetSalaryOverride, setManualNetSalaryOverride] = useState('');

  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (payroll) {
      setPresentDays(payroll.presentDays !== undefined ? String(payroll.presentDays) : '0');
      setPaidLeaves(payroll.paidLeaves !== undefined ? String(payroll.paidLeaves) : '0');
      setLopDays(payroll.lopDays !== undefined ? String(payroll.lopDays) : '0');

      setUnderTimeHours(payroll.underTimeHours !== undefined ? String(payroll.underTimeHours) : '0');
      setWaiveUnderTime(Boolean(payroll.waiveUnderTime));

      setOvertimeHours(payroll.overtimeHours !== undefined ? String(payroll.overtimeHours) : '0');
      setOvertimeRateMultiplier(
        payroll.overtimeRateMultiplier !== undefined ? String(payroll.overtimeRateMultiplier) : '1.0'
      );

      setBonus(payroll.bonus !== undefined ? String(payroll.bonus) : '0');
      setOtherDeductions(payroll.otherDeductions !== undefined ? String(payroll.otherDeductions) : '0');

      setIsManualNetOverride(false);
      setManualNetSalaryOverride('');
      setRemarks(payroll.remarks || '');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [payroll]);

  if (!isOpen || !payroll) return null;

  const emp = payroll.user || {};
  const daysInMonth = Number(payroll.totalDays) || 30;
  const standardDailyWorkHours = 8.0;
  const monthlyGross = Number(payroll.monthlyGross || 0);

  const perDayRate = daysInMonth > 0 ? monthlyGross / daysInMonth : 0;
  const perHourRate = standardDailyWorkHours > 0 ? perDayRate / standardDailyWorkHours : 0;

  const numPresentDays = parseFloat(presentDays) || 0;
  const numPaidLeaves = parseFloat(paidLeaves) || 0;
  const numLopDays = parseFloat(lopDays) || 0;
  const numUnderTimeHours = parseFloat(underTimeHours) || 0;
  const numOvertimeHours = parseFloat(overtimeHours) || 0;
  const numOtMultiplier = parseFloat(overtimeRateMultiplier) || 1.0;
  const numBonus = parseFloat(bonus) || 0;
  const numOtherDeductions = parseFloat(otherDeductions) || 0;

  // Real-time calculations
  const calculatedLopDeduction = Math.round(numLopDays * perDayRate);
  const calculatedUnderTimeDeduction = waiveUnderTime ? 0 : Math.round(numUnderTimeHours * perHourRate);
  const calculatedOvertimePay = Math.round(numOvertimeHours * perHourRate * numOtMultiplier);

  const calculatedGross = Math.max(
    0,
    monthlyGross -
      calculatedLopDeduction -
      calculatedUnderTimeDeduction +
      calculatedOvertimePay +
      numBonus
  );

  const statutoryDeductions =
    Number(payroll.pfDeduction || 0) +
    Number(payroll.esiDeduction || 0) +
    Number(payroll.taxDeduction || 0);

  const calculatedTotalDeductions = Math.max(0, statutoryDeductions + numOtherDeductions);

  const finalCalculatedNet = isManualNetOverride && manualNetSalaryOverride !== ''
    ? Math.max(0, parseFloat(manualNetSalaryOverride) || 0)
    : Math.max(0, calculatedGross - calculatedTotalDeductions);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const payload = {
        presentDays: numPresentDays,
        paidLeaves: numPaidLeaves,
        lopDays: numLopDays,
        underTimeHours: numUnderTimeHours,
        waiveUnderTime,
        overtimeHours: numOvertimeHours,
        overtimeRateMultiplier: numOtMultiplier,
        overtimePay: calculatedOvertimePay,
        bonus: numBonus,
        otherDeductions: numOtherDeductions,
        manualNetSalaryOverride: isManualNetOverride && manualNetSalaryOverride !== ''
          ? parseFloat(manualNetSalaryOverride)
          : null,
        remarks: remarks.trim()
      };

      await adjustPayroll(payroll.id, payload);

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

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-5 h-5 text-[#8B1D2C]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Adjust Salary & Hours &bull; {emp.firstName} {emp.lastName}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {emp.employeeCode || 'EMP-ID'} &bull; Base Gross: ₹{monthlyGross.toLocaleString()} (₹{perHourRate.toFixed(1)}/h)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/hr/payroll/${payroll.id}/adjust`);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Open Full Page View"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto grow text-xs font-sans">
          {/* Notifications */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-[#8B1D2C] font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Attendance & LOP Days */}
          <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">
              1. Attendance & Unpaid Leaves
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Present Days</label>
                <input
                  type="number"
                  step="0.5"
                  value={presentDays}
                  onChange={(e) => setPresentDays(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-bold bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Paid Leaves</label>
                <input
                  type="number"
                  step="0.5"
                  value={paidLeaves}
                  onChange={(e) => setPaidLeaves(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-bold bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-rose-700 block mb-1">LOP Days</label>
                <input
                  type="number"
                  step="0.5"
                  value={lopDays}
                  onChange={(e) => setLopDays(e.target.value)}
                  className="w-full px-2.5 py-1.5 font-bold bg-white border border-rose-300 rounded-lg focus:outline-hidden"
                />
                <span className="text-[10px] text-rose-600 block mt-0.5">
                  -₹{calculatedLopDeduction.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Shift Hours Shortfall & Overtime */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Short Hours Deficit */}
            <div className="p-3.5 bg-amber-50/40 border border-amber-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-amber-900 flex items-center gap-1">
                  <MinusCircle className="w-3.5 h-3.5 text-amber-600" />
                  Short Hours Deficit
                </span>
                <span className="text-[10px] text-amber-700 font-mono">
                  {waiveUnderTime ? 'Waived' : `-₹${calculatedUnderTimeDeduction}`}
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                value={underTimeHours}
                onChange={(e) => setUnderTimeHours(e.target.value)}
                placeholder="0"
                className="w-full px-2.5 py-1.5 font-bold bg-white border border-amber-300 rounded-lg focus:outline-hidden"
              />
              <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waiveUnderTime}
                  onChange={(e) => setWaiveUnderTime(e.target.checked)}
                  className="rounded-sm text-[#8B1D2C] cursor-pointer"
                />
                <span>Waive Shortfall (No deduction)</span>
              </label>
            </div>

            {/* Overtime */}
            <div className="p-3.5 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-emerald-900 flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Overtime Hours
                </span>
                <span className="text-[10px] text-emerald-700 font-mono">
                  +₹{calculatedOvertimePay}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 font-bold bg-white border border-emerald-300 rounded-lg focus:outline-hidden"
                />
                <select
                  value={overtimeRateMultiplier}
                  onChange={(e) => setOvertimeRateMultiplier(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs font-semibold bg-white border border-emerald-300 rounded-lg focus:outline-hidden"
                >
                  <option value="1.0">1.0x Normal</option>
                  <option value="1.5">1.5x Standard</option>
                  <option value="2.0">2.0x Double</option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 3: Bonus & Other Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Additional Bonus / Incentive (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="w-full px-2.5 py-1.5 font-bold bg-white border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Other Deductions / Advance Recovery (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={otherDeductions}
                onChange={(e) => setOtherDeductions(e.target.value)}
                className="w-full px-2.5 py-1.5 font-bold bg-white border border-slate-200 rounded-lg focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 4: Optional Direct Net Override */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Direct Net Salary Override</span>
              <label className="flex items-center gap-1.5 text-purple-700 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={isManualNetOverride}
                  onChange={(e) => setIsManualNetOverride(e.target.checked)}
                  className="rounded-sm text-purple-600 cursor-pointer"
                />
                <span>Override</span>
              </label>
            </div>
            {isManualNetOverride && (
              <input
                type="number"
                step="1"
                value={manualNetSalaryOverride}
                onChange={(e) => setManualNetSalaryOverride(e.target.value)}
                placeholder="Fixed Net Amount (₹)"
                className="w-full px-2.5 py-1.5 font-bold font-mono bg-white border border-purple-300 rounded-lg focus:outline-hidden"
              />
            )}
          </div>

          {/* Row 5: Remarks */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Adjustment Remarks / Reason <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Approved 2 days leave and 1h shift deficit waiver"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden"
            />
          </div>

          {/* Live Recalculation Preview Box */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <span>Preview Live In-Hand Pay</span>
              <span>Instant Recalc</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xl font-bold font-mono text-emerald-400">
                ₹{Math.round(finalCalculatedNet).toLocaleString()}
              </span>
              <div className="text-[11px] font-mono text-slate-300 space-x-2">
                <span>Gross: ₹{Math.round(calculatedGross).toLocaleString()}</span>
                <span>&bull;</span>
                <span>Ded: ₹{Math.round(calculatedTotalDeductions).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Save Adjustment</span>
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
