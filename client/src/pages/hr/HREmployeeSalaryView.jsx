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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/employees')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-[#8B1D2C] transition-colors cursor-pointer group"
            title="Back to Employees"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Manage Salary & Compensation
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C]">
                Payroll Structure
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Configure annual cost to company, monthly earnings components, and statutory compliance
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/hr/employees')}
          className="text-xs font-bold text-slate-600 hover:text-[#8B1D2C] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage} Redirecting to Employee Directory...</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-[#8B1D2C] text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!loading && employee && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Employee Info Header */}
          <div className="p-5 bg-gradient-to-r from-slate-50 to-rose-50/30 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B1D2C] to-[#5C101B] text-white flex items-center justify-center font-bold text-base shadow-xs">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {employee.employeeCode || 'EMP-ID'} • {employee.departmentDetails?.name || employee.department || 'General'} • {employee.designationDetails?.title || employee.designation || 'Staff'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current CTC</span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                {employee.salary ? `₹${Number(employee.salary).toLocaleString()}` : 'Not set'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* CTC Input Box */}
            <div className="p-5 bg-gradient-to-br from-rose-50/50 to-slate-50 border border-rose-100 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#8B1D2C]" />
                  Annual Cost to Company (CTC) <span className="text-[#8B1D2C]">*</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const num = parseFloat(ctc);
                    if (num > 0) calculateStandardBreakdown(num);
                  }}
                  disabled={!ctc || parseFloat(ctc) <= 0}
                  className="text-xs font-bold text-[#8B1D2C] hover:text-[#731724] flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Auto-calculate standard 50-20-30 split
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-500 font-bold text-base">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={ctc}
                  onChange={handleCtcChange}
                  placeholder="e.g. 840000"
                  required
                  className="w-full pl-9 pr-4 py-3 text-base font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                />
              </div>

              {ctc && Number(ctc) > 0 && (
                <div className="text-xs text-slate-500 flex items-center justify-between font-medium pt-1">
                  <span>Monthly Gross: ₹{Math.round(Number(ctc) / 12).toLocaleString()} / month</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Standard Payroll Compliant
                  </span>
                </div>
              )}
            </div>

            {/* Breakdown Component Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Earnings Card */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
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
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
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
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
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
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>
              </div>

              {/* Deductions Card */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
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
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
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
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
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
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>
              </div>
            </div>

            {/* In-Hand Take-Home Banner */}
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                  Estimated Net Take-Home Salary (In-Hand)
                </span>
                <span className="text-2xl font-bold text-emerald-950 font-mono mt-0.5 block">
                  ₹{Math.round(netTakeHome).toLocaleString()}
                  <span className="text-xs text-emerald-700 font-sans font-medium"> / month</span>
                </span>
              </div>

              <div className="text-xs text-emerald-800/90 font-medium">
                <div>Monthly Earnings: ₹{Math.round(totalEarnings).toLocaleString()}</div>
                <div>Monthly Deductions: -₹{Math.round(totalDeductions).toLocaleString()}</div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/hr/employees')}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Structure...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm & Save Salary Structure</span>
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
