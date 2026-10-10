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
  Clock,
  Calendar,
  Zap,
  RotateCcw,
  ShieldCheck,
  User,
  DollarSign,
  TrendingUp,
  Info,
  History
} from 'lucide-react';
import { getPayrollById, adjustPayroll } from '../../services/hrService';

export const HRPayrollAdjustView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [presentDays, setPresentDays] = useState('');
  const [paidLeaves, setPaidLeaves] = useState('');
  const [lopDays, setLopDays] = useState('');

  const [underTimeHours, setUnderTimeHours] = useState('');
  const [waiveUnderTime, setWaiveUnderTime] = useState(false);

  const [overtimeHours, setOvertimeHours] = useState('');
  const [overtimeRateMultiplier, setOvertimeRateMultiplier] = useState('1.0');
  const [customOvertimePay, setCustomOvertimePay] = useState('');
  const [useCustomOvertimePay, setUseCustomOvertimePay] = useState(false);

  const [bonus, setBonus] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('0');
  const [waiveLatePenalty, setWaiveLatePenalty] = useState(false);

  const [isManualNetOverride, setIsManualNetOverride] = useState(false);
  const [manualNetSalaryOverride, setManualNetSalaryOverride] = useState('');

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

        // Pre-fill existing record values
        setPresentDays(data.presentDays !== undefined ? String(data.presentDays) : '0');
        setPaidLeaves(data.paidLeaves !== undefined ? String(data.paidLeaves) : '0');
        setLopDays(data.lopDays !== undefined ? String(data.lopDays) : '0');

        setUnderTimeHours(data.underTimeHours !== undefined ? String(data.underTimeHours) : '0');
        setWaiveUnderTime(Boolean(data.waiveUnderTime));

        setOvertimeHours(data.overtimeHours !== undefined ? String(data.overtimeHours) : '0');
        setOvertimeRateMultiplier(
          data.overtimeRateMultiplier !== undefined ? String(data.overtimeRateMultiplier) : '1.0'
        );
        setCustomOvertimePay(data.overtimePay !== undefined ? String(data.overtimePay) : '');

        setBonus(data.bonus !== undefined ? String(data.bonus) : '0');
        setOtherDeductions(data.otherDeductions !== undefined ? String(data.otherDeductions) : '0');
        setWaiveLatePenalty(Boolean(data.waiveLatePenalty));

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
  const daysInMonth = Number(payroll?.totalDays) || 30;
  const standardDailyWorkHours = 8.0;
  const monthlyGross = Number(payroll?.monthlyGross || 0);

  // Computed standard rates
  const perDayRate = daysInMonth > 0 ? monthlyGross / daysInMonth : 0;
  const perHourRate = standardDailyWorkHours > 0 ? perDayRate / standardDailyWorkHours : 0;

  // Live parsed numbers
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

  const calculatedOvertimePay = useCustomOvertimePay && customOvertimePay !== ''
    ? parseFloat(customOvertimePay) || 0
    : Math.round(numOvertimeHours * perHourRate * numOtMultiplier);

  const calculatedGross = Math.max(
    0,
    monthlyGross -
      calculatedLopDeduction -
      calculatedUnderTimeDeduction +
      calculatedOvertimePay +
      numBonus
  );

  const statutoryDeductions =
    Number(payroll?.pfDeduction || 0) +
    Number(payroll?.esiDeduction || 0) +
    Number(payroll?.taxDeduction || 0);

  const calculatedTotalDeductions = Math.max(0, statutoryDeductions + numOtherDeductions);

  const finalCalculatedNet = isManualNetOverride && manualNetSalaryOverride !== ''
    ? Math.max(0, parseFloat(manualNetSalaryOverride) || 0)
    : Math.max(0, calculatedGross - calculatedTotalDeductions);

  const initialNet = Number(payroll?.netSalary || 0);
  const netDifference = finalCalculatedNet - initialNet;

  const handleResetToBaseline = () => {
    if (!payroll) return;
    setPresentDays(payroll.presentDays !== undefined ? String(payroll.presentDays) : '0');
    setPaidLeaves(payroll.paidLeaves !== undefined ? String(payroll.paidLeaves) : '0');
    setLopDays(payroll.lopDays !== undefined ? String(payroll.lopDays) : '0');
    setUnderTimeHours(payroll.underTimeHours !== undefined ? String(payroll.underTimeHours) : '0');
    setWaiveUnderTime(false);
    setOvertimeHours(payroll.overtimeHours !== undefined ? String(payroll.overtimeHours) : '0');
    setOvertimeRateMultiplier('1.0');
    setCustomOvertimePay('');
    setUseCustomOvertimePay(false);
    setBonus(payroll.bonus !== undefined ? String(payroll.bonus) : '0');
    setOtherDeductions(payroll.otherDeductions !== undefined ? String(payroll.otherDeductions) : '0');
    setWaiveLatePenalty(false);
    setIsManualNetOverride(false);
    setManualNetSalaryOverride('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

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
        waiveLatePenalty,
        bonus: numBonus,
        otherDeductions: numOtherDeductions,
        manualNetSalaryOverride: isManualNetOverride && manualNetSalaryOverride !== ''
          ? parseFloat(manualNetSalaryOverride)
          : null,
        remarks: remarks.trim()
      };

      await adjustPayroll(id, payload);

      setSuccessMessage('Salary adjustment & dynamic recalculation saved successfully!');
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
    <div className="space-y-6 max-w-5xl mx-auto pb-20 font-sans text-slate-800">
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
              <span className="text-xs text-slate-500">Live Dynamic Adjuster</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dynamic Salary Override & Proration Engine
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToBaseline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
            title="Reset form fields to recorded snapshot"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Baseline</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/hr/payroll')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
        </div>
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

      {/* Main Content */}
      {!loading && payroll && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Form: Controls (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Employee Profile & Hourly Baseline Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-rose-50/20 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
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
                    Cycle
                  </span>
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {payroll.month}/{payroll.year} ({daysInMonth} Days)
                  </span>
                </div>
              </div>

              {/* Rate Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/50 text-xs">
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Monthly Gross</span>
                  <span className="font-bold font-mono text-slate-900 text-sm mt-0.5 block">
                    ₹{monthlyGross.toLocaleString()}
                  </span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Per Day Rate (Rday)</span>
                  <span className="font-bold font-mono text-slate-800 text-sm mt-0.5 block">
                    ₹{perDayRate.toFixed(2)}/d
                  </span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Per Hour Rate (Rhour)</span>
                  <span className="font-bold font-mono text-slate-800 text-sm mt-0.5 block">
                    ₹{perHourRate.toFixed(2)}/h
                  </span>
                </div>
                <div className="p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Actual Logged</span>
                  <span className="font-bold font-mono text-blue-700 text-sm mt-0.5 block">
                    {payroll.actualLoggedHours || 0} hrs
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Notification Banner */}
              {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{successMessage} Redirecting to Payroll Directory...</span>
                </div>
              )}

              {/* 1. SECTION: Attendance & Leaves */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Calendar className="w-4 h-4 text-[#8B1D2C]" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    1. Attendance & Leave Days
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Present Days */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Present Days Worked
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={daysInMonth}
                      value={presentDays}
                      onChange={(e) => setPresentDays(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#8B1D2C]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Standard: {payroll.workingDays} working days</p>
                  </div>

                  {/* Paid Leaves */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Approved Paid Leaves
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={paidLeaves}
                      onChange={(e) => setPaidLeaves(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#8B1D2C]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Full wage credited</p>
                  </div>

                  {/* LOP Days */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Unpaid LOP Days
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={lopDays}
                      onChange={(e) => setLopDays(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#8B1D2C]"
                    />
                    <p className="text-[10px] text-rose-600 font-medium mt-1">
                      Deduction: -₹{calculatedLopDeduction.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. SECTION: Working Hours Deficit (Under-Time) & Overtime */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-[#8B1D2C]" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    2. Dynamic Shift Hours (Under-Time Shortfall & Overtime)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Under-Time / Short Hours */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                        <MinusCircle className="w-4 h-4 text-amber-600" />
                        Under-Time Deficit (Short Hours)
                      </span>
                      <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        ₹{perHourRate.toFixed(2)}/hr
                      </span>
                    </div>

                    <div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={underTimeHours}
                        onChange={(e) => setUnderTimeHours(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm font-bold bg-white border border-amber-300 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                      />
                      <p className="text-[11px] text-slate-600 mt-1">
                        e.g. 1.0 hour if worked 7h instead of 8h standard shift.
                      </p>
                    </div>

                    {/* Waive Toggle */}
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer pt-1 border-t border-amber-200/60">
                      <input
                        type="checkbox"
                        checked={waiveUnderTime}
                        onChange={(e) => setWaiveUnderTime(e.target.checked)}
                        className="w-4 h-4 rounded-sm text-[#8B1D2C] focus:ring-[#8B1D2C] cursor-pointer"
                      />
                      <span>Waive Under-Time Shortfall (Forgive penalty)</span>
                    </label>

                    <div className="text-xs font-mono font-bold text-right">
                      {waiveUnderTime ? (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Waived (Deduction: ₹0)
                        </span>
                      ) : (
                        <span className="text-rose-700">
                          Shortfall Deduction: -₹{calculatedUnderTimeDeduction.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Overtime / Extra Hours */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4 text-emerald-600" />
                        Overtime Extra Hours
                      </span>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Multiplier Based
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                          OT Hours
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={overtimeHours}
                          onChange={(e) => setOvertimeHours(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2 text-sm font-bold bg-white border border-emerald-300 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-600 block mb-1">
                          Rate Multiplier
                        </label>
                        <select
                          value={overtimeRateMultiplier}
                          onChange={(e) => setOvertimeRateMultiplier(e.target.value)}
                          className="w-full px-2.5 py-2 text-xs font-semibold bg-white border border-emerald-300 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                        >
                          <option value="1.0">1.0x (Normal)</option>
                          <option value="1.5">1.5x (Standard OT)</option>
                          <option value="2.0">2.0x (Double Pay)</option>
                        </select>
                      </div>
                    </div>

                    {/* Custom Pay Override Toggle */}
                    <div className="pt-1 border-t border-emerald-200/60 space-y-2">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomOvertimePay}
                          onChange={(e) => setUseCustomOvertimePay(e.target.checked)}
                          className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                        />
                        <span>Specify Custom Lump-Sum OT Pay</span>
                      </label>
                      {useCustomOvertimePay && (
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            step="1"
                            value={customOvertimePay}
                            onChange={(e) => setCustomOvertimePay(e.target.value)}
                            placeholder="Custom OT Amount"
                            className="w-full pl-7 pr-3 py-1.5 text-xs font-bold bg-white border border-emerald-300 rounded-lg focus:outline-hidden"
                          />
                        </div>
                      )}
                    </div>

                    <div className="text-xs font-mono font-bold text-right text-emerald-700">
                      Calculated OT Pay: +₹{calculatedOvertimePay.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SECTION: Bonus & Other Deductions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <TrendingUp className="w-4 h-4 text-[#8B1D2C]" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    3. Variable Incentive & Deductions
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bonus */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Performance / Festival Bonus
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={bonus}
                        onChange={(e) => setBonus(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#8B1D2C]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Direct addition to monthly gross</p>
                  </div>

                  {/* Other Deductions */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Other Deductions / Advance Recovery
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        value={otherDeductions}
                        onChange={(e) => setOtherDeductions(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#8B1D2C]"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Loan, advance salary or damage recovery</p>
                  </div>
                </div>
              </div>

              {/* 4. SECTION: Direct Hard Net Salary Override */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#8B1D2C]" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      4. Direct Net Salary Override (Optional)
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-purple-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isManualNetOverride}
                      onChange={(e) => setIsManualNetOverride(e.target.checked)}
                      className="w-4 h-4 rounded-sm text-purple-600 focus:ring-purple-600 cursor-pointer"
                    />
                    <span>Enable Direct Override</span>
                  </label>
                </div>

                {isManualNetOverride && (
                  <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-2 animate-in fade-in">
                    <p className="text-xs text-purple-900">
                      When active, the employee will receive exactly this in-hand salary amount. The itemized formula differences will be logged in the audit trail.
                    </p>
                    <div className="relative max-w-sm">
                      <span className="absolute left-3.5 top-2.5 text-purple-500 font-bold text-base">₹</span>
                      <input
                        type="number"
                        step="1"
                        value={manualNetSalaryOverride}
                        onChange={(e) => setManualNetSalaryOverride(e.target.value)}
                        placeholder="e.g. 19500"
                        className="w-full pl-8 pr-3 py-2 text-base font-bold bg-white border border-purple-300 rounded-xl focus:outline-hidden focus:border-purple-600 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 5. SECTION: Reason / Remarks */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2 shadow-2xs">
                <label className="block text-xs font-bold text-slate-700">
                  Adjustment Reason & Audit Remarks <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Adjusted 2 unpaid leaves, 1h short shift waived by manager approval."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#8B1D2C]"
                />
                <p className="text-[10px] text-slate-400">
                  This note is permanently preserved in the HR adjustment audit trail.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/hr/payroll')}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving & Recalculating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Save Dynamic Adjustment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Recalculation Sticky Card (1 col) */}
          <div className="space-y-5 lg:sticky lg:top-4">
            {/* Live Recalculator Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Live Calculation Preview
                  </h4>
                </div>
                <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-slate-200">
                  Instant
                </span>
              </div>

              <div className="p-5 space-y-4 text-xs font-sans">
                {/* Earned Gross Breakdown */}
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Gross Earnings Breakdown
                  </span>
                  <div className="flex justify-between text-slate-600">
                    <span>Base Monthly Gross</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{monthlyGross.toLocaleString()}
                    </span>
                  </div>
                  {numLopDays > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Loss of Pay ({numLopDays}d)</span>
                      <span className="font-mono font-semibold">
                        -₹{calculatedLopDeduction.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {numUnderTimeHours > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>
                        Short Hours ({numUnderTimeHours}h) {waiveUnderTime ? '(Waived)' : ''}
                      </span>
                      <span className="font-mono font-semibold">
                        {waiveUnderTime ? '₹0' : `-₹${calculatedUnderTimeDeduction.toLocaleString()}`}
                      </span>
                    </div>
                  )}
                  {calculatedOvertimePay > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Overtime Pay ({numOvertimeHours}h)</span>
                      <span className="font-mono font-semibold">
                        +₹{calculatedOvertimePay.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {numBonus > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Performance Bonus</span>
                      <span className="font-mono font-semibold">
                        +₹{numBonus.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="pt-1.5 flex justify-between font-bold text-slate-900 border-t border-dashed border-slate-200">
                    <span>Adjusted Gross Earnings</span>
                    <span className="font-mono text-sm">
                      ₹{Math.round(calculatedGross).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Deductions Breakdown */}
                <div className="space-y-2 pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Deductions Breakdown
                  </span>
                  <div className="flex justify-between text-slate-500">
                    <span>Statutory (PF/ESI/TDS)</span>
                    <span className="font-mono font-semibold">
                      -₹{Math.round(statutoryDeductions).toLocaleString()}
                    </span>
                  </div>
                  {numOtherDeductions > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Other Recoveries</span>
                      <span className="font-mono font-semibold">
                        -₹{numOtherDeductions.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="pt-1.5 flex justify-between font-bold text-slate-900 border-t border-dashed border-slate-200">
                    <span>Total Deductions</span>
                    <span className="font-mono text-sm text-rose-600">
                      -₹{Math.round(calculatedTotalDeductions).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Net Take-Home Highlight */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Net In-Hand Pay
                    </span>
                    {isManualNetOverride && (
                      <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-sm">
                        Manual Override
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900">
                    ₹{Math.round(finalCalculatedNet).toLocaleString()}
                  </div>
                  {netDifference !== 0 && (
                    <div className={`text-[11px] font-mono font-semibold ${netDifference > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {netDifference > 0 ? `+₹${Math.round(netDifference).toLocaleString()} vs original` : `-₹${Math.round(Math.abs(netDifference)).toLocaleString()} vs original`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Audit Trail Card */}
            {payroll.adjustmentAuditTrail && payroll.adjustmentAuditTrail.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <History className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Adjustment History ({payroll.adjustmentAuditTrail.length})
                  </h4>
                </div>
                <div className="space-y-2.5 max-h-56 overflow-y-auto text-xs">
                  {payroll.adjustmentAuditTrail.map((audit, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-700">{audit.adjustedBy}</span>
                        <span>{new Date(audit.timestamp).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-slate-900">
                        Net: ₹{Math.round(audit.resultingNetSalary || 0).toLocaleString()}
                      </div>
                      {audit.applied?.remarks && (
                        <p className="text-[11px] text-slate-600 italic">
                          &ldquo;{audit.applied.remarks}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPayrollAdjustView;
