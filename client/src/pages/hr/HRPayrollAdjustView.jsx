import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  SlidersHorizontal,
  PlusCircle,
  MinusCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Percent,
  DollarSign,
  ShieldCheck,
  User
} from 'lucide-react';
import { getPayrollById, adjustPayroll } from '../../services/hrService';

export const HRPayrollAdjustView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bonus, setBonus] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('0');
  const [remarks, setRemarks] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const res = await getPayrollById(id);
        const data = res?.data || res;
        setPayroll(data);
        setBonus(data.bonus !== undefined ? String(data.bonus) : '0');
        setOtherDeductions(data.otherDeductions !== undefined ? String(data.otherDeductions) : '0');
        setRemarks(data.remarks || '');
      } catch (err) {
        console.error('Failed to load payroll for adjustment:', err);
        setErrorMessage(
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load payroll details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const emp = payroll?.user || {};
  const baseGross = Number(payroll?.monthlyGross || 0) - Number(payroll?.lopDeduction || 0);

  const numBonus = parseFloat(bonus) || 0;
  const numOtherDed = parseFloat(otherDeductions) || 0;

  const calculatedGross = Math.max(0, baseGross + numBonus);
  const calculatedDeductions = Math.max(
    0,
    Number(payroll?.pfDeduction || 0) +
      Number(payroll?.esiDeduction || 0) +
      Number(payroll?.taxDeduction || 0) +
      numOtherDed
  );
  const calculatedNet = Math.max(0, calculatedGross - calculatedDeductions);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await adjustPayroll(id, {
        bonus: numBonus,
        otherDeductions: numOtherDed,
        remarks: remarks.trim()
      });

      setSuccessMessage('Salary adjustment saved and recalculated successfully!');
      setTimeout(() => {
        navigate('/hr/payroll');
      }, 1200);
    } catch (err) {
      console.error('Adjust payroll failed:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to save adjustment.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
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
              <span className="text-xs text-slate-500">Manual Adjustment</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Adjust Employee Compensation
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

      {/* Loading */}
      {loading && (
        <div className="p-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading payroll record...</p>
        </div>
      )}

      {/* Error Alert */}
      {!loading && errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-[#8B1D2C] text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Adjustment View */}
      {!loading && payroll && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Employee Info Header */}
          <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
                {emp.firstName?.[0]}{emp.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {emp.firstName} {emp.lastName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {emp.employeeCode || 'EMP-ID'} &bull; {emp.departmentDetails?.name || emp.department || 'General'} &bull; {emp.designationDetails?.title || emp.designation || 'Staff'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Billing Cycle
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                Month {payroll.month}/{payroll.year}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Success Notification */}
            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage} Redirecting to Payroll Directory...</span>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bonus Input */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  Additional Bonus / Incentive
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Direct addition to monthly gross earnings
                </p>
              </div>

              {/* Other Deductions */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MinusCircle className="w-4 h-4 text-rose-600" />
                  Other Deductions / Advance Recovery
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(e.target.value)}
                    placeholder="0"
                    className="w-full pl-8 pr-3 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Loan / advance salary recovery or penalty
                </p>
              </div>
            </div>

            {/* Adjustment Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Adjustment Reason / Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Festival Performance Incentive / Shift Overtime Approval"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
              />
            </div>

            {/* Live Recalculation Preview Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block">
                Calculated Net Take-Home Salary (In-Hand Preview)
              </span>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  ₹{Math.round(calculatedNet).toLocaleString()}
                </span>
                <div className="text-xs text-slate-500 space-x-2 font-mono">
                  <span>Gross: ₹{Math.round(calculatedGross).toLocaleString()}</span>
                  <span>&bull;</span>
                  <span>Deductions: ₹{Math.round(calculatedDeductions).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/hr/payroll')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
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
                    <span>Recalculating...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Confirm & Save Adjustment</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HRPayrollAdjustView;
