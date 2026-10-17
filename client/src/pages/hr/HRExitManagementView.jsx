import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';
import {
  getAllResignations,
  updateResignationStatus
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

    const handleLiveUpdate = () => {
      loadData();
    };

    window.addEventListener('app:resignation_submitted', handleLiveUpdate);
    window.addEventListener('app:notification', handleLiveUpdate);

    return () => {
      window.removeEventListener('app:resignation_submitted', handleLiveUpdate);
      window.removeEventListener('app:notification', handleLiveUpdate);
    };
  }, [loadData]);

  // Formatted records
  const formattedRecords = useMemo(() => {
    return resignationList.map((raw) => {
      const emp = raw.employee || {};
      const lwd = raw.approvedLastWorkingDay || raw.requestedLastWorkingDay || raw.resignationDate;

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

  // Approve Resignation -> Directly marks as Completed
  const handleApproveResignation = async (recId, lastWorkingDay) => {
    setIsSubmitting(true);
    try {
      await updateResignationStatus(recId, {
        status: 'completed',
        approvedLastWorkingDay: lastWorkingDay
      });
      showToast('Resignation approved and exit marked as completed.');
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





  const pendingCount = formattedRecords.filter((r) => r.status === 'pending').length;
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
            <p className="text-xs text-slate-500">Track employee resignations, notice periods, and exits</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingCount} Pending</span>
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
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec) => {
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>





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
