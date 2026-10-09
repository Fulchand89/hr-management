import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  Calculator,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Percent,
  Wallet,
  User
} from 'lucide-react';
import { getEmployeeById, updateEmployeeSalary } from '../../services/hrService';

export const HREmployeeSalaryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [ctc, setCtc] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [hra, setHra] = useState('');
  const [specialAllowance, setSpecialAllowance] = useState('');
  const [pfDeduction, setPfDeduction] = useState('');
  const [esiDeduction, setEsiDeduction] = useState('');
  const [taxDeduction, setTaxDeduction] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Calculate standard 50-20-30 breakdown helper
  const calculateStandardBreakdown = (annualCtc) => {
    if (!annualCtc || annualCtc <= 0) return;
    const monthlyGross = Math.round(annualCtc / 12);
    const basic = Math.round(monthlyGross * 0.5);
    const houseRent = Math.round(monthlyGross * 0.2);
    const allowance = Math.max(0, monthlyGross - basic - houseRent);
    const pf = Math.round(basic * 0.12);
    const esi = monthlyGross <= 21000 ? Math.round(monthlyGross * 0.0075) : 0;
    const tax = 0;

    setBasicSalary(String(basic));
    setHra(String(houseRent));
    setSpecialAllowance(String(allowance));
    setPfDeduction(String(pf));
    setEsiDeduction(String(esi));
    setTaxDeduction(String(tax));
  };

  useEffect(() => {
    if (!id) return;

    const fetchEmp = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const res = await getEmployeeById(id);
        const data = res?.data || res;
        setEmployee(data);

        const initialCtc = data.salary || data.salaryStructure?.ctc || '';
        setCtc(initialCtc ? String(initialCtc) : '');

        if (data.salaryStructure) {
          const s = data.salaryStructure;
          setBasicSalary(s.basicSalary !== undefined ? String(s.basicSalary) : '');
          setHra(s.hra !== undefined ? String(s.hra) : '');
          setSpecialAllowance(s.specialAllowance !== undefined ? String(s.specialAllowance) : '');
          setPfDeduction(s.pfDeduction !== undefined ? String(s.pfDeduction) : '');
          setEsiDeduction(s.esiDeduction !== undefined ? String(s.esiDeduction) : '0');
          setTaxDeduction(s.taxDeduction !== undefined ? String(s.taxDeduction) : '0');
        } else if (initialCtc && Number(initialCtc) > 0) {
          calculateStandardBreakdown(Number(initialCtc));
        }
      } catch (err) {
        console.error('Failed to load employee for salary:', err);
        setErrorMessage('Failed to load employee details. Please verify your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmp();
  }, [id]);

  const handleCtcChange = (e) => {
    const val = e.target.value;
    setCtc(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      calculateStandardBreakdown(num);
    }
  };

  const numBasic = parseFloat(basicSalary) || 0;
  const numHra = parseFloat(hra) || 0;
  const numAllowance = parseFloat(specialAllowance) || 0;
  const totalEarnings = numBasic + numHra + numAllowance;

  const numPf = parseFloat(pfDeduction) || 0;
  const numEsi = parseFloat(esiDeduction) || 0;
  const numTax = parseFloat(taxDeduction) || 0;
  const totalDeductions = numPf + numEsi + numTax;

  const netTakeHome = Math.max(0, totalEarnings - totalDeductions);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

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

      await updateEmployeeSalary(id, payload);
      setSuccessMessage('Salary structure configured and saved successfully!');

      setTimeout(() => {
        navigate('/hr/employees');
      }, 1200);
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
    <div className="space-y-6 max-w-4xl mx-auto pb-12 font-sans text-slate-800">
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/employees')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Back to Employees"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8B1D2C]">
                Staff Directory
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500">Compensation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Manage Salary Structure
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/hr/employees')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 self-start sm:self-auto cursor-pointer"
        >
          Cancel & Return
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="p-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading employee salary profile...</p>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage} Redirecting to Employee Directory...</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-[#8B1D2C] text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!loading && employee && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Employee Info Header */}
          <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {employee.employeeCode || 'EMP-ID'} &bull; {employee.departmentDetails?.name || employee.department || 'General'} &bull; {employee.designationDetails?.title || employee.designation || 'Staff'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Current CTC</span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                {employee.salary ? `₹${Number(employee.salary).toLocaleString()}` : 'Not set'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* CTC Input Box */}
            <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#8B1D2C]" />
                  Annual Cost to Company (CTC) <span className="text-rose-500">*</span>
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
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={ctc}
                  onChange={handleCtcChange}
                  placeholder="e.g. 840000"
                  required
                  className="w-full pl-8 pr-4 py-2 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#8B1D2C] transition-colors"
                />
              </div>

              {ctc && Number(ctc) > 0 && (
                <div className="text-xs text-slate-500 flex items-center justify-between pt-0.5">
                  <span>Monthly Gross: ₹{Math.round(Number(ctc) / 12).toLocaleString()} / month</span>
                  <span className="text-emerald-700 font-semibold">
                    Standard Payroll Compliant
                  </span>
                </div>
              )}
            </div>

            {/* Breakdown Component Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Earnings Card */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Monthly Earnings Components
                  </span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    ₹{Math.round(totalEarnings).toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Basic Salary (Monthly)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={basicSalary}
                    onChange={(e) => setBasicSalary(e.target.value)}
                    placeholder="e.g. 35000"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    House Rent Allowance (HRA)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={hra}
                    onChange={(e) => setHra(e.target.value)}
                    placeholder="e.g. 14000"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special / Other Allowance
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={specialAllowance}
                    onChange={(e) => setSpecialAllowance(e.target.value)}
                    placeholder="e.g. 21000"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>
              </div>

              {/* Deductions Card */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-rose-600" />
                    Monthly Deductions
                  </span>
                  <span className="text-xs font-bold text-rose-700 font-mono">
                    ₹{Math.round(totalDeductions).toLocaleString()}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PF Deduction (Employee 12%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={pfDeduction}
                    onChange={(e) => setPfDeduction(e.target.value)}
                    placeholder="e.g. 4200"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ESIC Deduction
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={esiDeduction}
                    onChange={(e) => setEsiDeduction(e.target.value)}
                    placeholder="e.g. 0"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tax / TDS Deduction
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxDeduction}
                    onChange={(e) => setTaxDeduction(e.target.value)}
                    placeholder="e.g. 0"
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>
              </div>
            </div>

            {/* In-Hand Take-Home Banner */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Estimated Net Take-Home Salary (In-Hand)
                </span>
                <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
                  ₹{Math.round(netTakeHome).toLocaleString()}
                  <span className="text-xs text-slate-500 font-sans font-normal"> / month</span>
                </span>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                <div>Monthly Earnings: ₹{Math.round(totalEarnings).toLocaleString()}</div>
                <div>Monthly Deductions: -₹{Math.round(totalDeductions).toLocaleString()}</div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/hr/employees')}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
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
      )}
    </div>
  );
};

export default HREmployeeSalaryView;
