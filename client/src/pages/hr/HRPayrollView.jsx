import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet,
  Calendar,
  CreditCard,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Loader2,
  Building2,
  RefreshCw,
  TrendingUp,
  Percent,
  Sparkles,
  Users,
  Send,
  Eye
} from 'lucide-react';
import {
  getPayrollDirectory,
  getPayrollSummary,
  exportBankPayoutSheet,
  getDepartments
} from '../../services/hrService';
import HRPayrollProcessModal from './HRPayrollProcessModal';
import HRPayrollAdjustModal from './HRPayrollAdjustModal';
import HRDisburseModal from './HRDisburseModal';
import HRPayslipModal from './HRPayslipModal';

export const HRPayrollView = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentDate = new Date();
  const initialMonth = searchParams.get('month') ? parseInt(searchParams.get('month'), 10) : currentDate.getMonth() + 1;
  const initialYear = searchParams.get('year') ? parseInt(searchParams.get('year'), 10) : currentDate.getFullYear();
  const initialStatus = searchParams.get('status') || 'all';
  const initialDept = searchParams.get('department') || 'all';

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(initialDept);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);
  const [departments, setDepartments] = useState([]);

  // Data states
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals state
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [payrollToAdjust, setPayrollToAdjust] = useState(null);

  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [payrollToDisburse, setPayrollToDisburse] = useState(null);
  const [isBulkDisburse, setIsBulkDisburse] = useState(false);

  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [activePayslipId, setActivePayslipId] = useState(null);

  const monthsList = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const yearsList = [2024, 2025, 2026, 2027];

  // Fetch departments list
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments();
        setDepartments(res?.data || res || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepts();
  }, []);

  // Fetch payroll records and summary
  const loadPayrollData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [listRes, summaryRes] = await Promise.all([
        getPayrollDirectory({
          month: selectedMonth,
          year: selectedYear,
          status: selectedStatus,
          departmentId: selectedDepartment !== 'all' ? selectedDepartment : undefined,
          search: searchQuery.trim() || undefined,
          page: 1,
          limit: 100
        }),
        getPayrollSummary({
          month: selectedMonth,
          year: selectedYear
        })
      ]);

      const dirData = listRes?.data || listRes;
      setPayrolls(dirData?.payrolls || []);

      const sumData = summaryRes?.data || summaryRes;
      setSummary(sumData || null);
    } catch (err) {
      console.error('Failed to fetch payroll:', err);
      setErrorMessage(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch payroll records for the selected month.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedStatus, selectedDepartment, searchQuery]);

  useEffect(() => {
    loadPayrollData();
  }, [loadPayrollData]);

  // Synchronize URL search params with state
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('month', String(selectedMonth));
        next.set('year', String(selectedYear));
        if (selectedStatus !== 'all') next.set('status', selectedStatus);
        else next.delete('status');
        if (selectedDepartment !== 'all') next.set('department', selectedDepartment);
        else next.delete('department');
        return next;
      },
      { replace: true }
    );
  }, [selectedMonth, selectedYear, selectedStatus, selectedDepartment, setSearchParams]);

  // Handle Export Bank Sheet (CSV)
  const handleExportBankSheet = async () => {
    setIsExporting(true);
    try {
      const blob = await exportBankPayoutSheet({
        month: selectedMonth,
        year: selectedYear
      });

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Bank_Payout_Sheet_${selectedMonth}_${selectedYear}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export CSV failed:', err);
      alert('Failed to export bank sheet. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            PAID
          </span>
        );
      case 'processed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            PROCESSED
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800">
      {/* ── 1. Simple Top Header ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Payroll Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monthly salary processing, bank payout sheets, and attendance audit
          </p>
        </div>

        {/* Right Action Tools */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Month Dropdown */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-hidden cursor-pointer"
          >
            {monthsList.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-hidden cursor-pointer"
          >
            {yearsList.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Export Bank Sheet Button */}
          <button
            type="button"
            onClick={handleExportBankSheet}
            disabled={isExporting || payrolls.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
            title="Download CSV for Corporate Netbanking Payouts"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Export Bank Sheet</span>
          </button>

          {/* Bulk Disburse Button */}
          {summary && summary.counts.processed > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsBulkDisburse(true);
                setPayrollToDisburse(null);
                setIsDisburseModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Bulk Disburse</span>
            </button>
          )}

          {/* Primary Process Button */}
          <button
            type="button"
            onClick={() => navigate('/hr/payroll/process')}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Process Payroll</span>
          </button>
        </div>
      </div>

      {/* ── 2. Simple Stats Strip ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Net Disbursement</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">
            ₹{summary ? summary.totalNetDisbursement.toLocaleString() : '0'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {monthsList.find((m) => m.value === selectedMonth)?.label} {selectedYear}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 block">Staff Processed</span>
          <span className="text-xl font-bold text-blue-950 font-mono mt-0.5 block">
            {summary ? summary.counts.processed + summary.counts.paid : 0} / {summary ? summary.totalStaff : 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {summary?.counts?.pending || 0} pending review
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-700 block">Statutory Deductions (PF/ESI)</span>
          <span className="text-xl font-bold text-rose-950 font-mono mt-0.5 block">
            ₹{summary ? summary.statutoryTotal.toLocaleString() : '0'}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            PF: ₹{summary?.totalPf?.toLocaleString() || 0} &bull; ESI: ₹{summary?.totalEsi?.toLocaleString() || 0}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">Disbursed / Paid</span>
          <span className="text-xl font-bold text-emerald-950 font-mono mt-0.5 block">
            {summary?.counts?.paid || 0} Staff
          </span>
          <span className="text-[11px] text-emerald-700 mt-1 block">
            {summary?.counts?.paid > 0 ? 'UTR Recorded' : 'Pending payment'}
          </span>
        </div>
      </div>

      {/* ── 3. Simple Search & Filter Bar ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee name, code..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#8B1D2C] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['all', 'pending', 'processed', 'paid'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadPayrollData}
            className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4. Staff Payroll Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Loading Spinner */}
        {loading && (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
            <p className="text-xs font-semibold text-slate-500">
              Loading staff payroll records for{' '}
              {monthsList.find((m) => m.value === selectedMonth)?.label} {selectedYear}...
            </p>
          </div>
        )}

        {/* Error Alert */}
        {!loading && errorMessage && (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs font-semibold text-rose-800">{errorMessage}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !errorMessage && payrolls.length === 0 && (
          <div className="p-16 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mx-auto shadow-2xs">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                No Payroll Records for this Period
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                Payroll has not been processed for {monthsList.find((m) => m.value === selectedMonth)?.label} {selectedYear} yet.
                Click below to run batch calculation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/hr/payroll/process')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Process Payroll for this Month</span>
            </button>
          </div>
        )}

        {/* Data Table */}
        {!loading && !errorMessage && payrolls.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department / Role</th>
                  <th className="py-3.5 px-4">Attendance Audit</th>
                  <th className="py-3.5 px-4">Gross Earnings</th>
                  <th className="py-3.5 px-4">Deductions</th>
                  <th className="py-3.5 px-4 font-bold text-slate-900">Net Take-Home</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrolls.map((p) => {
                  const emp = p.user || {};
                  const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Employee Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 leading-tight">
                              {fullName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {emp.employeeCode || 'EMP-ID'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department / Designation */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-semibold">
                          {emp.departmentDetails?.name || emp.department || 'General'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {emp.designationDetails?.title || emp.designation || 'Staff'}
                        </div>
                      </td>

                      {/* Attendance Audit */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 font-semibold">
                          Worked: {p.presentDays} / {p.workingDays}d
                        </div>
                        <div className="text-[11px] text-rose-600 font-mono">
                          {Number(p.lopDays) > 0 ? `LOP: ${p.lopDays} days` : '0 LOP'}
                        </div>
                        {Number(p.actualLoggedHours) > 0 && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Logged: {p.actualLoggedHours}h
                          </div>
                        )}
                        {Number(p.underTimeHours) > 0 && (
                          <div className="text-[10px] text-amber-700 font-mono font-medium">
                            {p.underTimeHours}h Short {p.waiveUnderTime ? '(Waived)' : ''}
                          </div>
                        )}
                        {Number(p.overtimeHours) > 0 && (
                          <div className="text-[10px] text-emerald-700 font-mono font-medium">
                            +{p.overtimeHours}h OT ({p.overtimeRateMultiplier || 1.0}x)
                          </div>
                        )}
                        {Number(p.lateMarksCount || p.lateCount) > 0 && (
                          <div className="text-[10px] text-amber-600 font-mono">
                            {p.lateMarksCount || p.lateCount} Late Mark(s)
                          </div>
                        )}
                        {Number(p.sandwichLopDays) > 0 && (
                          <div className="text-[10px] text-purple-600 font-mono">
                            {p.sandwichLopDays}d Sandwich LOP
                          </div>
                        )}
                      </td>

                      {/* Gross Earnings */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        ₹{Math.round(p.grossSalary).toLocaleString()}
                        {Number(p.bonus) > 0 && (
                          <span className="block text-[10px] text-emerald-600">
                            +₹{Math.round(p.bonus)} Bonus
                          </span>
                        )}
                        {Number(p.overtimePay) > 0 && (
                          <span className="block text-[10px] text-emerald-600 font-medium">
                            +₹{Math.round(p.overtimePay)} OT Pay
                          </span>
                        )}
                      </td>

                      {/* Total Deductions */}
                      <td className="py-3.5 px-4 font-mono text-rose-600 font-semibold">
                        -₹{Math.round(p.totalDeductions).toLocaleString()}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          PF: ₹{Math.round(p.pfDeduction || 0)}
                        </span>
                        {Number(p.underTimeDeduction) > 0 && !p.waiveUnderTime && (
                          <span className="block text-[10px] text-amber-600 font-normal">
                            Short Hrs: -₹{Math.round(p.underTimeDeduction)}
                          </span>
                        )}
                        {Number(p.lateDeduction) > 0 && (
                          <span className="block text-[10px] text-amber-600 font-normal">
                            Late: -₹{Math.round(p.lateDeduction)}
                          </span>
                        )}
                        {Number(p.sandwichLopDeduction) > 0 && (
                          <span className="block text-[10px] text-purple-600 font-normal">
                            Sandwich: -₹{Math.round(p.sandwichLopDeduction)}
                          </span>
                        )}
                      </td>

                      {/* Net Take-Home */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                        ₹{Math.round(p.netSalary).toLocaleString()}
                        {p.isManuallyAdjusted && (
                          <span className="block text-[10px] font-sans font-medium text-amber-600 mt-0.5">
                            Adjusted by HR
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(p.paymentStatus)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* View Payslip */}
                        <button
                          type="button"
                          onClick={() => navigate(`/hr/payroll/${p.id}/payslip`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#8B1D2C] hover:text-[#8B1D2C] text-slate-600 text-xs font-semibold cursor-pointer transition-colors"
                          title="View Official Payslip Voucher"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Payslip</span>
                        </button>

                        {/* Adjust Bonus/Penalty */}
                        {p.paymentStatus !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayrollToAdjust(p);
                              setIsAdjustModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-colors"
                            title="Adjust Days, Hours, Shortfall, OT or Salary"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Adjust</span>
                          </button>
                        )}

                        {/* Pay Now Button */}
                        {p.paymentStatus !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsBulkDisburse(false);
                              setPayrollToDisburse(p);
                              setIsDisburseModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                            title="Mark as Paid"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modals Mount */}
      {/* Batch Process Modal */}
      <HRPayrollProcessModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        departments={departments}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
        onSuccess={loadPayrollData}
      />

      {/* Salary Adjustment Modal */}
      <HRPayrollAdjustModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setPayrollToAdjust(null);
        }}
        payroll={payrollToAdjust}
        onSuccess={loadPayrollData}
      />

      {/* Disbursement Modal */}
      <HRDisburseModal
        isOpen={isDisburseModalOpen}
        onClose={() => {
          setIsDisburseModalOpen(false);
          setPayrollToDisburse(null);
          setIsBulkDisburse(false);
        }}
        payroll={payrollToDisburse}
        isBulk={isBulkDisburse}
        selectedCount={summary?.counts?.processed || payrolls.length}
        totalAmount={summary?.totalNetDisbursement || 0}
        month={selectedMonth}
        year={selectedYear}
        onSuccess={loadPayrollData}
      />

      {/* Official Formatted Payslip Modal */}
      <HRPayslipModal
        isOpen={isPayslipModalOpen}
        onClose={() => {
          setIsPayslipModalOpen(false);
          setActivePayslipId(null);
        }}
        payrollId={activePayslipId}
      />
    </div>
  );
};

export default HRPayrollView;
