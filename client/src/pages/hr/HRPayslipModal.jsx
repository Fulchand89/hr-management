import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Building,
  CheckCircle2
} from 'lucide-react';
import { getPayslipDetails } from '../../services/hrService';

export const HRPayslipModal = ({ isOpen, onClose, payrollId }) => {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!payrollId || !isOpen) return;

    const fetchSlip = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const res = await getPayslipDetails(payrollId);
        setPayslip(res?.data || res);
      } catch (err) {
        console.error('Failed to load payslip:', err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to load payslip details.';
        setErrorMessage(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchSlip();
  }, [payrollId, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Control Bar */}
        <div className="p-4 sm:px-6 bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8B1D2C]" />
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Official Employee Payslip Preview
            </span>
            {payslip?.period && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 text-slate-700">
                {payslip.period.displayPeriod}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !payslip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
          {loading && (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
              <p className="text-xs font-semibold text-slate-500">
                Formatting official salary slip...
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-[#8B1D2C] text-xs font-semibold">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!loading && payslip && (
            <div
              id="printable-payslip"
              className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 space-y-5 text-slate-800 font-sans print:shadow-none print:border-none print:p-0"
            >
              {/* 1. Company Letterhead */}
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

              {/* 2. Employee Profile & Bank Details Matrix */}
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

              {/* 3. Attendance Summary Matrix */}
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

              {/* 4. Two-Column Itemized Earnings & Deductions Table */}
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

              {/* 5. Net Salary Banner */}
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

              {/* 6. Legal Footer & Computer Generated Disclaimer */}
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
      </div>
    </div>
  );
};

export default HRPayslipModal;
