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
import {
  getAllEmployees,
  getAllResignations,
  updateResignationStatus,
  updateClearanceStatus
} from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';

export const HRExitManagementView = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [resignationList, setResignationList] = useState([]);

  // Modals state
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
      const [empRes, resignRes] = await Promise.all([
        getAllEmployees({ limit: 100 }).catch(() => ({ data: [] })),
        getAllResignations().catch(() => ({ data: [] }))
      ]);

      const empData = Array.isArray(empRes?.data) ? empRes.data : (Array.isArray(empRes) ? empRes : []);
      setEmployees(empData);

      const resignData = Array.isArray(resignRes?.data) ? resignRes.data : (Array.isArray(resignRes) ? resignRes : []);
      setResignationList(resignData);
    } catch (err) {
      console.error('Failed to load exit management data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Formatted records
  const formattedRecords = useMemo(() => {
    return resignationList.map((raw) => {
      const emp = raw.employee || {};
      const lwd = raw.approvedLastWorkingDay || raw.requestedLastWorkingDay || raw.resignationDate;
      const fnfDate = new Date(lwd);
      fnfDate.setDate(fnfDate.getDate() + 45);
      const fnfDueDate = fnfDate.toISOString().split('T')[0];

      const clearances = raw.clearances || [];
      const clearanceMap = {
        it: clearances.find((c) => c.department === 'it')?.status === 'cleared',
        finance: clearances.find((c) => c.department === 'finance')?.status === 'cleared',
        hr: clearances.find((c) => c.department === 'hr')?.status === 'cleared',
        admin: clearances.find((c) => c.department === 'admin')?.status === 'cleared',
        manager: clearances.find((c) => c.department === 'manager')?.status === 'cleared'
      };

      return {
        id: raw.id,
        raw,
        employeeCode: emp.employeeId || 'EMP-01',
        employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee',
        designation: emp.designationDetails?.title || 'Staff',
        department: emp.departmentDetails?.name || 'Operations',
        resignationDate: raw.resignationDate,
        lastWorkingDay: lwd,
        reason: raw.reason,
        status: raw.status, // 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed'
        clearances,
        clearance: clearanceMap,
        fnfDueDate,
        fnfAmount: Number(raw.settlementAmount || 0),
        fnfPaid: raw.status === 'completed'
      };
    });
  }, [resignationList]);

  // Filtered Resignations
  const filteredRecords = useMemo(() => {
    return formattedRecords.filter((rec) => {
      const matchesSearch =
        !searchQuery.trim() ||
        rec.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'pending' && (rec.status === 'pending' || rec.status === 'under_review')) ||
        (selectedStatusFilter === 'approved' && rec.status === 'approved') ||
        (selectedStatusFilter === 'cleared' && Object.values(rec.clearance).every(Boolean)) ||
        (selectedStatusFilter === 'fnf_pending' && !rec.fnfPaid);

      return matchesSearch && matchesStatus;
    });
  }, [formattedRecords, searchQuery, selectedStatusFilter]);

  // Approve Resignation
  const handleApproveResignation = async (recId, lastWorkingDay) => {
    setIsSubmitting(true);
    try {
      await updateResignationStatus(recId, {
        status: 'approved',
        approvedLastWorkingDay: lastWorkingDay
      });
      showToast('Resignation request approved. Notice period initiated.');
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to approve resignation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject Resignation
  const handleRejectResignation = async (recId) => {
    const reason = prompt('Please enter reason for rejection:');
    if (!reason) return;
    setIsSubmitting(true);
    try {
      await updateResignationStatus(recId, {
        status: 'rejected',
        rejectionReason: reason
      });
      showToast('Resignation request marked as rejected.');
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to reject resignation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Clearance in modal
  const handleToggleClearanceDept = async (dept) => {
    if (!selectedExit) return;
    const clearanceItem = selectedExit.clearances.find((c) => c.department === dept);
    if (!clearanceItem) return;

    const nextStatus = clearanceItem.status === 'cleared' ? 'pending' : 'cleared';
    setIsSubmitting(true);
    try {
      await updateClearanceStatus(selectedExit.id, clearanceItem.id, {
        status: nextStatus,
        remarks: nextStatus === 'cleared' ? 'Cleared by HR Admin' : null
      });
      showToast(`Department ${dept.toUpperCase()} clearance marked as ${nextStatus}!`);
      await loadData();
      // Update selectedExit local state
      setSelectedExit((prev) => ({
        ...prev,
        clearances: prev.clearances.map((c) =>
          c.id === clearanceItem.id ? { ...c, status: nextStatus } : c
        ),
        clearance: {
          ...prev.clearance,
          [dept]: nextStatus === 'cleared'
        }
      }));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update clearance');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark FNF Processed
  const handleMarkFNFPaid = async (recId, amount = 0) => {
    setIsSubmitting(true);
    try {
      await updateResignationStatus(recId, {
        status: 'completed',
        settlementAmount: amount
      });
      showToast('Full & Final Settlement (FNF) finalized and marked as completed!');
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to mark FNF paid');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            <LogOut className="w-3.5 h-3.5" />
            <span>Gupta Tech Web Exit Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Exit &amp; Resignation Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Live database tracker for employee resignations, 2-month notice periods, multi-department asset clearances, and 45-day Full &amp; Final (FNF) settlements.
          </p>
        </div>

        {/* Quick Stat Pill */}
        <div className="flex items-center gap-3">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Under Processing</span>
              <span className="text-lg font-black">{formattedRecords.filter(r => r.status !== 'completed' && r.status !== 'rejected').length} Requests</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Completed Exits</span>
              <span className="text-lg font-black">{formattedRecords.filter(r => r.status === 'completed').length} Employees</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Policy Reference Card ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Calendar className="w-4 h-4 text-rose-600" />
            <span>Notice Period Policy</span>
          </div>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Standard notice period is <strong>60 days (2 months)</strong> from formal resignation submission. Unapproved leaves extend the notice.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Asset &amp; No-Dues Clearance</span>
          </div>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Clearance required from IT, Finance, HR, Admin, and Reporting Manager before exit letters and FNF release.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>FNF 45-Day Settlement</span>
          </div>
          <p className="text-slate-500 leading-relaxed text-[11px]">
            Final settlement is processed and credited within <strong>45 days</strong> following the approved Last Working Day.
          </p>
        </div>
      </div>

      {/* ── Filters & Search ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Resignation Records</option>
            <option value="pending">Pending HR Review</option>
            <option value="approved">Approved &amp; Under Notice</option>
            <option value="cleared">Assets &amp; Dues Cleared</option>
            <option value="fnf_pending">FNF Pending Payout</option>
          </select>
        </div>
      </div>

      {/* ── Resignation & Exit Records Table ─────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B1D2C]" />
            <span className="text-xs font-semibold">Loading resignation records from database...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <LogOut className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No resignation records matching the selected criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">Resignation Date</th>
                  <th className="py-3.5 px-4">Notice Period &amp; LWD</th>
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
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="font-semibold text-slate-700">LWD: {rec.lastWorkingDay}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.status === 'approved' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              rec.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              rec.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {rec.status.toUpperCase()}
                            </span>
                          </div>
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
                            <span className="text-[10px] text-rose-600 font-semibold">
                              {rec.fnfAmount > 0 ? `₹${rec.fnfAmount.toLocaleString('en-IN')}` : 'Calculating...'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right space-x-2">
                        {rec.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveResignation(rec.id, rec.lastWorkingDay)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectResignation(rec.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExit(rec);
                            setIsClearanceModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                        >
                          Clearance
                        </button>

                        {!rec.fnfPaid && allClear && (
                          <button
                            type="button"
                            onClick={() => handleMarkFNFPaid(rec.id, rec.fnfAmount || 95000)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-all cursor-pointer"
                          >
                            Mark FNF Paid
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExit(rec);
                            setLetterType('relieving');
                            setIsLetterModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1"
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
        )}
      </div>

      {/* ── ASSET & NO-DUES CLEARANCE MODAL ──────────────────────────────── */}
      {isClearanceModalOpen && selectedExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsClearanceModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Departmental Exit Clearance</h3>
                <p className="text-xs text-slate-500">
                  {selectedExit.employeeName} ({selectedExit.employeeCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClearanceModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              {[
                { dept: 'it', title: 'IT & Hardware Assets', desc: 'Laptop, chargers, monitors, security tokens' },
                { dept: 'admin', title: 'Admin & Facilities', desc: 'ID access card, drawer keys, biometric revoking' },
                { dept: 'finance', title: 'Finance & Accounts', desc: 'No pending salary advances, travel claims settled' },
                { dept: 'manager', title: 'Manager Knowledge Handover', desc: 'Project documentation, codebase, client access transfer' },
                { dept: 'hr', title: 'HR & Personnel Exit', desc: 'Exit interview completed, insurance policy deactivation' }
              ].map(({ dept, title, desc }) => {
                const isCleared = selectedExit.clearance[dept];

                return (
                  <div
                    key={dept}
                    onClick={() => handleToggleClearanceDept(dept)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                      isCleared
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-xs font-bold block ${isCleared ? 'text-emerald-900' : 'text-slate-900'}`}>
                        {title}
                      </span>
                      <span className="text-[11px] text-slate-500 leading-tight block">{desc}</span>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        isCleared
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearanceModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LETTERS MODAL ────────────────────────────────────────────────── */}
      {isLetterModalOpen && selectedExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsLetterModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {letterType === 'relieving' ? 'Relieving Certificate' : 'Service & Experience Letter'}
                </h3>
                <p className="text-xs text-slate-500">
                  Formal exit document for {selectedExit.employeeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLetterModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Letter Preview Frame */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-serif leading-relaxed text-slate-800 space-y-4 max-h-96 overflow-y-auto">
              <div className="text-center border-b border-slate-200 pb-3">
                <span className="font-sans font-black text-sm tracking-wide text-slate-900 block">
                  GUPTA TECH WEB WORKFORCE SOLUTIONS
                </span>
                <span className="font-sans text-[10px] text-slate-500">
                  Noida Sector 62 • support@guptatechweb.com • HR Operations
                </span>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-500">
                Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>

              <div>
                <p className="font-bold font-sans text-xs">TO WHOMSOEVER IT MAY CONCERN</p>
              </div>

              <p>
                This is to certify that <strong>{selectedExit.employeeName}</strong> (Employee ID: {selectedExit.employeeCode}) was employed with Gupta Tech Web as <strong>{selectedExit.designation}</strong> in the {selectedExit.department} department.
              </p>

              <p>
                Their formal resignation has been accepted by the management and they were relieved of their duties at the close of working hours on <strong>{selectedExit.lastWorkingDay}</strong> after completing the handover and notice obligations.
              </p>

              <p>
                During their tenure, we found them to be diligent, dedicated, and professional. All company property, assets, and liabilities have been settled in full.
              </p>

              <p>We wish them all the best in their future professional endeavors.</p>

              <div className="pt-6 font-sans text-xs">
                <p className="font-bold text-slate-900">For Gupta Tech Web Solutions</p>
                <p className="text-slate-500 text-[11px]">Authorized Signatory • Human Resources</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLetterType(letterType === 'relieving' ? 'experience' : 'relieving')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Switch to {letterType === 'relieving' ? 'Experience Letter' : 'Relieving Certificate'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Letter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRExitManagementView;
