import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  Loader2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import {
  getAllResignations,
  updateResignationStatus,
  updateClearanceStatus
} from '../../services/hrService';
import { SkeletonTable } from '../../components/common/Skeleton';

export const HRExitManagementView = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [resignationList, setResignationList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [selectedExit, setSelectedExit] = useState(null);
  const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [letterType, setLetterType] = useState('relieving'); // 'relieving' | 'experience'
  const [rejectingRecordId, setRejectingRecordId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllResignations();
      const resignData = Array.isArray(res?.data?.data)
        ? res.data.data
        : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
      setResignationList(resignData);
    } catch (err) {
      console.error('Failed to load resignations:', err);
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
        employeeCode: emp.employeeCode || emp.employeeId || '--',
        employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || 'Employee',
        designation: emp.designationDetails?.title || 'Staff',
        department: emp.departmentDetails?.name || 'General',
        resignationDate: raw.resignationDate ? raw.resignationDate.split('T')[0] : '--',
        lastWorkingDay: lwd ? lwd.split('T')[0] : '--',
        reason: raw.reason || 'Not specified',
        status: raw.status || 'pending', // 'pending' | 'approved' | 'rejected' | 'completed'
        clearances,
        clearance: clearanceMap,
        fnfPaid: raw.status === 'completed'
      };
    });
  }, [resignationList]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return formattedRecords.filter((rec) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rec.employeeName.toLowerCase().includes(q) ||
        rec.employeeCode.toLowerCase().includes(q) ||
        rec.department.toLowerCase().includes(q);

      const matchesStatus =
        selectedStatusFilter === 'all' ||
        rec.status.toLowerCase() === selectedStatusFilter.toLowerCase();

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
      showToast('Resignation approved. Employee is now on notice period.');
      await loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to approve resignation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject Resignation
  const handleConfirmReject = async () => {
    if (!rejectingRecordId) return;
    setIsSubmitting(true);
    try {
      await updateResignationStatus(rejectingRecordId, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim() || 'Rejected by HR'
      });
      showToast('Resignation request rejected.');
      setRejectingRecordId(null);
      setRejectionReason('');
      await loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reject resignation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Department Clearance
  const handleToggleClearanceDept = async (dept) => {
    if (!selectedExit) return;
    const clearanceItem = selectedExit.clearances.find((c) => c.department === dept);
    if (!clearanceItem) return;

    const nextStatus = clearanceItem.status === 'cleared' ? 'pending' : 'cleared';
    setIsSubmitting(true);
    try {
      await updateClearanceStatus(selectedExit.id, clearanceItem.id, {
        status: nextStatus,
        remarks: nextStatus === 'cleared' ? 'Cleared by HR' : null
      });
      showToast(`${dept.toUpperCase()} clearance marked as ${nextStatus}!`);
      await loadData();

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
      showToast(err?.response?.data?.message || 'Failed to update clearance');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark Exit Completed (FNF Done)
  const handleMarkExitCompleted = async (recId) => {
    setIsSubmitting(true);
    try {
      await updateResignationStatus(recId, {
        status: 'completed'
      });
      showToast('Exit and settlement successfully completed!');
      await loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to complete exit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = formattedRecords.filter((r) => r.status === 'pending').length;
  const activeNoticeCount = formattedRecords.filter((r) => r.status === 'approved').length;
  const completedCount = formattedRecords.filter((r) => r.status === 'completed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/dashboard')}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Exit &amp; Resignation Management</h1>
            <p className="text-xs text-slate-500">Track employee resignations, notice periods, and clearances</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingCount} Pending</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-1.5">
            <span>{activeNoticeCount} Under Notice</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{completedCount} Completed</span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} cols={6} hasHeader={false} />
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-1">
            <p className="text-xs font-semibold">No resignation records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">Resignation Date</th>
                  <th className="py-3.5 px-4">Last Working Day</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Clearance</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => {
                  const allClear = Object.values(rec.clearance).every(Boolean);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Employee */}
                      <td className="py-3.5 px-5">
                        <div>
                          <span className="font-bold text-slate-900 block">{rec.employeeName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {rec.employeeCode} &bull; {rec.designation}
                          </span>
                        </div>
                      </td>

                      {/* Resignation Date */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{rec.resignationDate}</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[160px] block" title={rec.reason}>
                          {rec.reason}
                        </span>
                      </td>

                      {/* Last Working Day */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {rec.lastWorkingDay}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            rec.status === 'approved'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : rec.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : rec.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>

                      {/* Clearance */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedExit(rec);
                            setIsClearanceModalOpen(true);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-colors border ${
                            allClear
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {allClear ? '✓ All Cleared' : 'View Clearance'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right space-x-1.5">
                        {rec.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleApproveResignation(rec.id, rec.lastWorkingDay)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => setRejectingRecordId(rec.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {rec.status === 'approved' && allClear && (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleMarkExitCompleted(rec.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                          >
                            Complete Exit
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            navigate(`/hr/exit-management/${rec.id}/letter`, { state: { exitRecord: rec } });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Letter</span>
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

      {/* ── DEPARTMENTAL CLEARANCE MODAL ───────────────────────── */}
      {isClearanceModalOpen && selectedExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Departmental Exit Clearance</h3>
                <p className="text-xs text-slate-500">
                  {selectedExit.employeeName} ({selectedExit.employeeCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsClearanceModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Click on any department to toggle its clearance status:
            </p>

            <div className="space-y-2">
              {[
                { dept: 'it', title: 'IT & Hardware Assets', desc: 'Laptop, charger & account access' },
                { dept: 'admin', title: 'Admin & Facilities', desc: 'ID card & office keys' },
                { dept: 'finance', title: 'Finance & Accounts', desc: 'Dues & claims settled' },
                { dept: 'manager', title: 'Manager Handover', desc: 'Project documentation & tasks handover' },
                { dept: 'hr', title: 'HR Clearance', desc: 'Exit formalities & records' }
              ].map(({ dept, title, desc }) => {
                const isCleared = selectedExit.clearance[dept];

                return (
                  <div
                    key={dept}
                    onClick={() => handleToggleClearanceDept(dept)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isCleared
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <span className={`text-xs font-bold block ${isCleared ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {title}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{desc}</span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
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

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsClearanceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LETTERS MODAL ─────────────────────────────────────── */}
      {isLetterModalOpen && selectedExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {letterType === 'relieving' ? 'Relieving Letter' : 'Experience Letter'}
                </h3>
                <p className="text-xs text-slate-500">
                  Document preview for {selectedExit.employeeName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLetterModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Letter Content Preview */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-serif leading-relaxed text-slate-800 space-y-3 max-h-80 overflow-y-auto">
              <div className="text-right text-[11px] font-sans text-slate-500">
                Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>

              <p className="font-sans font-bold text-xs uppercase">To Whomsoever It May Concern</p>

              <p>
                This is to certify that <strong>{selectedExit.employeeName}</strong> (Employee Code: {selectedExit.employeeCode}) was employed with the company as <strong>{selectedExit.designation}</strong> in the {selectedExit.department} department.
              </p>

              <p>
                Their resignation has been formally accepted, and they were relieved of their duties on <strong>{selectedExit.lastWorkingDay}</strong> after fulfilling the handover requirements.
              </p>

              <p>
                During their tenure, their conduct and performance were found to be satisfactory. We wish them all the best in their future endeavors.
              </p>

              <div className="pt-4 font-sans text-xs">
                <p className="font-bold text-slate-900">Human Resources Department</p>
                <p className="text-slate-500 text-[10px]">Authorized Signatory</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLetterType(letterType === 'relieving' ? 'experience' : 'relieving')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Switch to {letterType === 'relieving' ? 'Experience Letter' : 'Relieving Letter'}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECTION REASON MODAL ─────────────────────────────── */}
      {rejectingRecordId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Reject Resignation</h3>
              <button
                type="button"
                onClick={() => {
                  setRejectingRecordId(null);
                  setRejectionReason('');
                }}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Reason for Rejection</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection remarks for the employee..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-xs text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRejectingRecordId(null);
                  setRejectionReason('');
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRExitManagementView;
