import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  Search,
  FileText
} from 'lucide-react';
import { getPayrollDirectory, getPayrollSummary } from '../../services/hrService';

export const PayrollPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPayroll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dirRes, sumRes] = await Promise.all([
        getPayrollDirectory().catch(() => ({ data: [] })),
        getPayrollSummary().catch(() => null)
      ]);

      const rawPayrolls = Array.isArray(dirRes?.data) ? dirRes.data : (Array.isArray(dirRes) ? dirRes : []);
      setPayrolls(
        rawPayrolls.map((p) => {
          const emp = p.user || p.employee || {};
          const net = parseFloat(p.netSalary || p.netPay || 0);
          const basic = parseFloat(p.basicSalary || p.basic || 0);
          const hra = parseFloat(p.hra || 0);
          const allow = parseFloat(p.allowances || 0);
          const ded = parseFloat(p.deductions || 0);

          return {
            id: p.id,
            employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || emp.email || 'Employee',
            employeeCode: emp.employeeCode || 'EMP',
            designation: emp.designationDetails?.title || emp.designation || 'Staff',
            basic: `₹${basic.toLocaleString()}`,
            hra: `₹${(hra + allow).toLocaleString()}`,
            deductions: `₹${ded.toLocaleString()}`,
            netSalary: `₹${net.toLocaleString()}`,
            netNum: net,
            dedNum: ded,
            status: (p.status || 'pending').toLowerCase()
          };
        })
      );

      if (sumRes?.data) {
        setSummary(sumRes.data);
      }
    } catch (err) {
      console.error('Failed to load payroll directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const totalDisbursement = payrolls.reduce((sum, p) => sum + (p.netNum || 0), 0);
  const totalDeductions = payrolls.reduce((sum, p) => sum + (p.dedNum || 0), 0);
  const totalProcessed = payrolls.filter((p) => p.status === 'paid' || p.status === 'processed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-indigo-600" />
            Payroll & Compensation Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automate monthly salary calculations, payslip distribution, and tax deductions.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">Total Net Disbursement</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ₹{totalDisbursement.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Live Calculation</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">Employees Processed</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {totalProcessed} / {payrolls.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{payrolls.length - totalProcessed} pending</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">Statutory Deductions (PF/ESI)</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            ₹{totalDeductions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Auto calculated</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">Payslips Generated</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{payrolls.length} Slips</div>
          <div className="text-[11px] text-indigo-600 mt-1">Ready for PDF download</div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-800">Staff Salary Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Basic Pay</th>
                <th className="py-3 px-4">HRA & Allowances</th>
                <th className="py-3 px-4">Total Deductions</th>
                <th className="py-3 px-4 font-bold">Net Salary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    {isLoading ? 'Loading payroll records...' : 'No payroll records processed yet.'}
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{p.employeeName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.designation}</td>
                    <td className="py-3.5 px-4 font-mono">{p.basic}</td>
                    <td className="py-3.5 px-4 font-mono">{p.hra}</td>
                    <td className="py-3.5 px-4 font-mono text-rose-600">{p.deductions}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.netSalary}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'processed'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                        <FileText className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;
