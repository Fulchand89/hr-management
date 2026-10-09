import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  ShieldCheck,
  FileText,
  Printer,
  ChevronRight,
  Eye,
  Edit3,
  Loader2,
  Check,
  X,
  Building2,
  UserMinus,
  Sparkles,
  Download,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { getAllEmployees, changeEmployeeStatus } from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';

export const HRExitManagementView = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all'); // 'all' | 'under_notice' | 'cleared' | 'fnf_pending'
  const [toastMessage, setToastMessage] = useState('');

  // Sample Mock Resignations integrated with real employee roster
  const [resignationRecords, setResignationRecords] = useState([
    {
      id: 'RES-001',
      employeeCode: 'EMP-004',
      employeeName: 'John Doe',
      designation: 'Full Stack Developer',
      department: 'Engineering & Technology',
      resignationDate: '2026-09-01',
      noticeMonths: 2,
      lastWorkingDay: '2026-11-01',
      leavesTakenInNotice: 0,
      reason: 'Pursuing higher studies & master degree',
      status: 'under_notice', // 'under_notice' | 'clearance_ready' | 'fnf_processed'
      clearance: {
        laptopReturned: true,
        idCardReturned: false,
        clientHandoverDone: true,
        financeNoDues: true
      },
      fnfDueDate: '2026-12-16', // 45 days after last working day
      fnfAmount: 95925,
      fnfPaid: false
    }
  ]);

  // Modal States
  const [selectedExit, setSelectedExit] = useState(null);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [letterType, setLetterType] = useState('relieving'); // 'relieving' | 'experience'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllEmployees({ limit: 100 });
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setEmployees(list);
    } catch (err) {
      console.error('Failed to load employees for exit management:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered Resignations
  const filteredRecords = useMemo(() => {
    return resignationRecords.filter((rec) => {
      const matchesSearch =
        !searchQuery.trim() ||
        rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'under_notice' && rec.status === 'under_notice') ||
        (selectedStatusFilter === 'cleared' && rec.status === 'clearance_ready') ||
        (selectedStatusFilter === 'fnf_pending' && !rec.fnfPaid);

      return matchesSearch && matchesStatus;
    });
  }, [resignationRecords, searchQuery, selectedStatusFilter]);

  // Toggle Clearance Item
  const handleToggleClearance = (key) => {
    if (!selectedExit) return;
    setSelectedExit((prev) => ({
      ...prev,
      clearance: {
        ...prev.clearance,
        [key]: !prev.clearance[key]
      }
    }));
  };

  // Save Clearance Update
  const handleSaveClearance = () => {
    setResignationRecords((prev) =>
      prev.map((r) => (r.id === selectedExit.id ? selectedExit : r))
    );
    showToast('Asset & No-Dues clearance status updated successfully!');
    setIsClearanceModalOpen(false);
  };

  // Mark FNF Processed
  const handleMarkFNFPaid = (recId) => {
    setResignationRecords((prev) =>
      prev.map((r) => (r.id === recId ? { ...r, fnfPaid: true, status: 'fnf_processed' } : r))
    );
    showToast('Full & Final Settlement (FNF) marked as disbursed!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center shrink-0">
              <UserMinus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Resignation, Notice Period &amp; Exit Clearance
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Enforcing <strong>2-Month Notice Period</strong>, Asset &amp; Dues Handover, <strong>45-Day FNF Settlement</strong>, and Relieving Letters
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Policy Section 9 &bull; Section 11 &bull; Section 12</span>
          </span>
        </div>
      </div>

      {/* ── 4 Executive KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Under Notice */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Under 2-Month Notice</span>
            <div className="text-2xl font-black text-amber-700 mt-1">
              {resignationRecords.filter(r => r.status === 'under_notice').length}
            </div>
            <span className="text-[11px] text-amber-800 font-semibold mt-0.5 block">Active notice period</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Clearance Ready */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Assets &amp; Dues Clearance</span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {resignationRecords.filter(r => Object.values(r.clearance).every(Boolean)).length}
            </div>
            <span className="text-[11px] text-blue-800 font-semibold mt-0.5 block">NOC completed</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        {/* FNF Pending (45 Days) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">FNF Settlement Due</span>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {resignationRecords.filter(r => !r.fnfPaid).length}
            </div>
            <span className="text-[11px] text-rose-800 font-semibold mt-0.5 block">Within 45 days window</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Letters Issued */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Relieving Letters</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {resignationRecords.filter(r => r.status === 'fnf_processed').length}
            </div>
            <span className="text-[11px] text-emerald-800 font-semibold mt-0.5 block">Officially closed exits</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search resignation records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Resignation Records</option>
            <option value="under_notice">Under 2-Month Notice</option>
            <option value="cleared">Assets &amp; Dues Cleared</option>
            <option value="fnf_pending">FNF Pending Payout</option>
          </select>
        </div>
      </div>

      {/* ── Resignation & Exit Records Table ─────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-5">Employee</th>
                <th className="py-3.5 px-4">Resignation Date</th>
                <th className="py-3.5 px-4">2-Month Notice Period</th>
                <th className="py-3.5 px-4">Clearance Status</th>
                <th className="py-3.5 px-4">45-Day FNF Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.map((rec) => {
                const allClear = Object.values(rec.clearance).every(Boolean);

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee */}
                    <td className="py-3.5 px-5">
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">{rec.employeeName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {rec.employeeCode} &bull; {rec.designation}
                        </span>
                      </div>
                    </td>

                    {/* Resignation Date */}
                    <td className="py-3.5 px-4 font-mono">
                      <span className="font-semibold text-slate-900 block">{rec.resignationDate}</span>
                      <span className="text-[10px] text-slate-400 italic line-clamp-1">{rec.reason}</span>
                    </td>

                    {/* Notice Period */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700">LWD: {rec.lastWorkingDay}</span>
                          <span className="font-bold text-amber-700">2 Months Notice</span>
                        </div>
                        {rec.leavesTakenInNotice > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 block">
                            &bull; {rec.leavesTakenInNotice}d leave taken &rarr; notice extended
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Clearance */}
                    <td className="py-3.5 px-4">
                      {allClear ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" /> All Dues Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Handover Incomplete
                        </span>
                      )}
                    </td>

                    {/* 45-Day FNF */}
                    <td className="py-3.5 px-4 font-mono">
                      {rec.fnfPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3" /> FNF Settled
                        </span>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-900 block">Due: {rec.fnfDueDate}</span>
                          <span className="text-[10px] text-rose-600 font-semibold">₹{rec.fnfAmount.toLocaleString('en-IN')} pending</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExit(rec);
                          setIsClearanceModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                        title="Update Clearance Checklist"
                      >
                        Clearance
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExit(rec);
                          setLetterType('relieving');
                          setIsLetterModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
                        title="Generate Relieving & Experience Letter"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Letters</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ASSET & NO-DUES CLEARANCE MODAL ──────────────────────────────── */}
      {isClearanceModalOpen && selectedExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsClearanceModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Exit Clearance &amp; Asset Handover
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedExit.employeeName} ({selectedExit.employeeCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClearanceModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-800">1. Laptop, Charger &amp; IT Hardware Returned</span>
                <input
                  type="checkbox"
                  checked={selectedExit.clearance.laptopReturned}
                  onChange={() => handleToggleClearance('laptopReturned')}
                  className="w-4 h-4 accent-[#8B1D2C] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-800">2. Company I-Card &amp; Access Keys Handed Over</span>
                <input
                  type="checkbox"
                  checked={selectedExit.clearance.idCardReturned}
                  onChange={() => handleToggleClearance('idCardReturned')}
                  className="w-4 h-4 accent-[#8B1D2C] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-800">3. Project Code Repositories &amp; Client Handover Done</span>
                <input
                  type="checkbox"
                  checked={selectedExit.clearance.clientHandoverDone}
                  onChange={() => handleToggleClearance('clientHandoverDone')}
                  className="w-4 h-4 accent-[#8B1D2C] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-800">4. Finance No-Dues Certificate (NOC) Cleared</span>
                <input
                  type="checkbox"
                  checked={selectedExit.clearance.financeNoDues}
                  onChange={() => handleToggleClearance('financeNoDues')}
                  className="w-4 h-4 accent-[#8B1D2C] cursor-pointer"
                />
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              <strong>Policy Reminder (Section 11):</strong> Salary, relieving letter, and experience letter will be issued ONLY after completion of the notice period, returning all company assets, and clearing all dues.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearanceModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-500 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClearance}
                className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer"
              >
                Save Clearance Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RELIEVING & EXPERIENCE LETTER GENERATOR MODAL ────────────────── */}
      {isLetterModalOpen && selectedExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white">
          <div className="fixed inset-0 print:hidden" onClick={() => setIsLetterModalOpen(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:border-none print:rounded-none">
            
            {/* Header (Hidden in Print) */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700 shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-rose-400" />
                <div>
                  <span className="text-sm font-bold block">Official Exit Documentation</span>
                  <span className="text-[11px] text-slate-300">
                    Gupta Tech Web Official Letterhead &bull; Nikita Gupta, CEO Sign-off
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Letter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLetterModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letterhead & Body */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-8 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible text-xs leading-relaxed">
              
              {/* Company Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white p-1.5 border border-slate-200 flex items-center justify-center shrink-0">
                    <img src="/logo.png" alt="Gupta Tech Web" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Gupta Tech Web</h1>
                    <p className="text-xs font-medium text-slate-600">
                      410 Shagun Tower, Vijay Nagar, Indore, Madhya Pradesh – 452010
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Phone: 7400554294 &bull; Mail: info@guptatechweb.com &bull; Website: guptatechweb.com
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#8B1D2C]/10 text-[#8B1D2C]">
                    Official Certificate
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Letter Title */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-black text-slate-900 tracking-wide uppercase underline underline-offset-4">
                  Relieving &amp; Service Experience Letter
                </h2>
                <p className="text-[11px] font-mono text-slate-500">Ref: GTW/HR/REL/{selectedExit.employeeCode}/2026</p>
              </div>

              {/* Letter Body */}
              <div className="space-y-4 text-xs text-slate-800 leading-relaxed">
                <p>
                  <strong>To Whom It May Concern,</strong>
                </p>

                <p>
                  This is to certify that <strong>{selectedExit.employeeName}</strong> (Employee Code: <strong>{selectedExit.employeeCode}</strong>) was employed with <strong>Gupta Tech Web</strong> as <strong>{selectedExit.designation}</strong> in our <strong>{selectedExit.department}</strong> department from <strong>15th January 2024</strong> to <strong>{selectedExit.lastWorkingDay}</strong>.
                </p>

                <p>
                  Consequent to the acceptance of resignation submitted on <strong>{selectedExit.resignationDate}</strong>, {selectedExit.employeeName} has satisfactorily completed the mandatory <strong>2-Month Notice Period</strong> in accordance with Gupta Tech Web HR Policy regulations. All assigned company assets, intellectual properties, and financial dues have been duly returned and cleared.
                </p>

                <p>
                  {selectedExit.employeeName} stands officially relieved from all operational and employment duties at Gupta Tech Web effective from the close of business hours on <strong>{selectedExit.lastWorkingDay}</strong>.
                </p>

                <p>
                  During their tenure, we found {selectedExit.employeeName} to be dedicated, punctual, and professional in their conduct. We thank them for their contributions and wish them every success in their future career endeavors.
                </p>
              </div>

              {/* CEO Signature Block */}
              <div className="pt-12 flex justify-between items-end border-t border-slate-200">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">For Gupta Tech Web,</p>
                  <div className="h-12 flex items-center font-serif italic text-lg text-slate-700">
                    Nikita Gupta
                  </div>
                  <p className="font-black text-slate-900">Nikita Gupta</p>
                  <p className="text-[11px] text-slate-500 font-medium">Chief Executive Officer (CEO)</p>
                  <p className="text-[10px] text-slate-400 font-mono">410 Shagun Tower, Indore, MP</p>
                </div>

                <div className="text-right">
                  <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase text-center p-2">
                    Official Corporate Seal
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HRExitManagementView;
