import React, { useState } from 'react';
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

export const PayrollPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  const payrolls = [
    {
      id: 'PAY-01',
      employeeName: 'Sarah Connor',
      employeeCode: 'EMP-001',
      designation: 'HR Lead',
      basic: '₹60,000',
      hra: '₹20,000',
      allowances: '₹15,000',
      deductions: '₹7,500',
      netSalary: '₹87,500',
      status: 'paid'
    },
    {
      id: 'PAY-02',
      employeeName: 'John Doe',
      employeeCode: 'EMP-004',
      designation: 'Full Stack Dev',
      basic: '₹48,000',
      hra: '₹16,000',
      allowances: '₹11,000',
      deductions: '₹6,000',
      netSalary: '₹69,000',
      status: 'processed'
    },
    {
      id: 'PAY-03',
      employeeName: 'Michael Scott',
      employeeCode: 'EMP-003',
      designation: 'Branch Manager',
      basic: '₹70,000',
      hra: '₹24,000',
      allowances: '₹16,000',
      deductions: '₹9,000',
      netSalary: '₹1,01,000',
      status: 'pending'
    }
  ];

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
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer">
            <CreditCard className="w-4 h-4" />
            Process Monthly Payroll
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">Total Net Disbursement</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">₹34,50,000</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">October 2026 Cycle</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">Employees Processed</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">45 / 48</div>
          <div className="text-[11px] text-slate-400 mt-1">3 pending review</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">Statutory Deductions (PF/ESI)</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">₹4,20,500</div>
          <div className="text-[11px] text-slate-400 mt-1">Auto calculated</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500">Payslips Generated</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">45 Slips</div>
          <div className="text-[11px] text-indigo-600 mt-1">Ready for PDF download</div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-800">Staff Salary Breakdown</h3>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
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
              {payrolls.map((p) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollPage;
