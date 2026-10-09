import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  FileText,
  Loader2,
  AlertCircle,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Download,
  Calendar,
  CreditCard,
  User
} from 'lucide-react';
import { getPayslipDetails } from '../../services/hrService';

export const HRPayslipDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchPayslip = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const res = await getPayslipDetails(id);
        setPayslip(res?.data || res);
      } catch (err) {
        console.error('Failed to load payslip:', err);
        setErrorMessage(
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to load payslip details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPayslip();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 font-sans text-slate-800">
      {/* ── Top Header (Hidden during print) ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80 print:hidden">
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
              <span className="text-xs text-slate-500">Payslip Voucher</span>
              {payslip?.period && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 text-slate-700">
                  {payslip.period.displayPeriod}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Employee Salary Payslip
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrint}
            disabled={loading || !payslip}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/hr/payroll')}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
          >
            Return to List
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">
            Fetching employee salary voucher...
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && errorMessage && (
        <div className="p-6 bg-white rounded-2xl border border-rose-200 shadow-2xs space-y-3 text-center">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-xs font-bold text-rose-900">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate('/hr/payroll')}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
          >
            Back to Payroll Directory
          </button>
        </div>
      )}

      {/* 2. Printable Official Payslip Voucher */}
      {!loading && payslip && (
        <div
          id="printable-payslip"
          className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 space-y-5 text-slate-800 font-sans print:border-none print:shadow-none print:p-0"
        >
          {/* A. Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Gupta Tech Web Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {payslip.company.name}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {payslip.company.address}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {payslip.company.phone ? `${payslip.company.phone} • ` : ''}
                  {payslip.company.email ? `${payslip.company.email} • ` : ''}
                  CIN: {payslip.company.cin} &bull; PAN: {payslip.company.pan}
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Salary Slip &bull; {payslip.period.displayPeriod}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Slip Ref: #{payslip.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>

          {/* B. Employee & Bank Profile Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Employee Name
              </span>
              <span className="font-semibold text-slate-900 block mt-0.5">
                {payslip.employee.name}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Employee Code
              </span>
              <span className="font-semibold font-mono text-slate-900 block mt-0.5">
                {payslip.employee.employeeCode}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Department
              </span>
              <span className="text-slate-800 block mt-0.5">
                {payslip.employee.department}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Designation
              </span>
              <span className="text-slate-800 block mt-0.5">
                {payslip.employee.designation}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Date of Joining
              </span>
              <span className="text-slate-800 block mt-0.5">
                {payslip.employee.joiningDate}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Bank Name
              </span>
              <span className="text-slate-800 block mt-0.5">
                {payslip.employee.bankName}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Bank Account No
              </span>
              <span className="font-mono text-slate-800 block mt-0.5">
                {payslip.employee.bankAccountNumber}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                IFSC Code
              </span>
              <span className="font-mono text-slate-800 block mt-0.5">
                {payslip.employee.bankIfsc}
              </span>
            </div>
          </div>

          {/* C. Attendance Audit Row */}
          <div className="grid grid-cols-4 gap-2 text-center py-2.5 px-3 bg-white rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Days in Month
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                {payslip.period.totalDays}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Working Days
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                {payslip.period.workingDays}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Worked Days
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                {payslip.period.presentDays}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                Loss of Pay (LOP)
              </span>
              <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                {payslip.period.lopDays}
              </span>
            </div>
          </div>

          {/* D. Two-Column Itemized Earnings & Deductions Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Earnings */}
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex justify-between font-semibold text-slate-700">
                <span>Earnings (Credit)</span>
                <span>Amount (₹)</span>
              </div>
              <div className="divide-y divide-slate-100">
                {payslip.earnings.map((e, idx) => (
                  <div key={idx} className="flex justify-between py-2 px-3.5">
                    <span className="text-slate-600">{e.name}</span>
                    <span className="font-mono font-medium text-slate-900">
                      ₹{Math.round(e.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2.5 flex justify-between font-bold text-slate-900">
                <span>Total Gross Earnings</span>
                <span className="font-mono">
                  ₹{Math.round(payslip.summary.grossEarnings).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Right: Deductions */}
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex justify-between font-semibold text-slate-700">
                <span>Deductions (Debit)</span>
                <span>Amount (₹)</span>
              </div>
              <div className="divide-y divide-slate-100">
                {payslip.deductions.map((d, idx) => (
                  <div key={idx} className="flex justify-between py-2 px-3.5">
                    <span className="text-slate-600">{d.name}</span>
                    <span className="font-mono font-medium text-slate-900">
                      ₹{Math.round(d.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 border-t border-slate-200 px-3.5 py-2.5 flex justify-between font-bold text-slate-900">
                <span>Total Deductions</span>
                <span className="font-mono">
                  ₹{Math.round(payslip.summary.totalDeductions).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* E. Net Salary Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Net Take-Home Salary
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono mt-0.5 block">
                ₹{Math.round(payslip.summary.netSalary).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 italic mt-0.5">
                {payslip.summary.netSalaryInWords}
              </p>
            </div>

            <div className="text-xs sm:text-right space-y-1">
              <div className="flex items-center sm:justify-end gap-1.5">
                <span className="text-slate-500">Status:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-md text-[11px] capitalize ${
                    payslip.summary.paymentStatus === 'paid'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {payslip.summary.paymentStatus}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Channel: {payslip.summary.paymentMode?.toUpperCase() || 'NEFT'}
              </div>
              {payslip.summary.transactionReference && payslip.summary.transactionReference !== 'N/A' && (
                <div className="text-[10px] text-slate-400 font-mono">
                  UTR: {payslip.summary.transactionReference}
                </div>
              )}
            </div>
          </div>

          {/* F. Disclaimer Footer */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <div>
              * Computer-generated payslip verified by Gupta Tech Web HRMS engine.
            </div>
            <div className="font-medium text-slate-600">
              Authorized Signatory &bull; Finance & Accounts
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPayslipDetailView;
