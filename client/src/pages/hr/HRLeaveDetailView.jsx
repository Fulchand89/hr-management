import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarDays,
  FileText,
  ShieldCheck,
  Printer,
  Plus,
  Loader2,
  Share2,
  Check
} from 'lucide-react';
import { getLeaveRequestById, cancelLeave as apiCancelLeave } from '../../services/hrService';
import { PageSkeleton } from '../../components/common/Skeleton';

export const HRLeaveDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isEmployeePortal = location.pathname.startsWith('/employee');
  const leavesHomeRoute = isEmployeePortal ? '/employee/leaves' : '/hr/leaves';
  const applyRoute = isEmployeePortal ? '/employee/leaves/apply' : '/hr/leaves/apply';

  // Initial leave from router state if available
  const [leave, setLeave] = useState(() => {
    const stateLeave = location.state?.leave;
    if (stateLeave && String(stateLeave.id) === String(id)) {
      return stateLeave;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(!leave);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Fetch full leave details from server
  const loadLeaveData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await getLeaveRequestById(id);
      const data = res?.data ?? res ?? null;
      if (data) {
        // Standardize structure
        const formatted = {
          id: data.id,
          leaveType: data.leaveType?.name || 'Leave',
          leaveTypeCode: data.leaveType?.code || 'LV',
          fromDate: data.startDate,
          toDate: data.endDate,
          days: data.totalDays,
          duration: `${data.totalDays} ${Number(data.totalDays) > 1 ? 'Days' : 'Day'}`,
          reason: data.reason,
          status: data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : 'Pending',
          appliedOn: data.createdAt
            ? new Date(data.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Recently',
          appliedAtFull: data.createdAt
            ? new Date(data.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
            : null,
          applicantName: data.applicant
            ? `${data.applicant.firstName || ''} ${data.applicant.lastName || ''}`.trim() || data.applicant.email
            : 'You',
          applicantEmail: data.applicant?.email,
          applicantDepartment: data.applicant?.department,
          approverName: data.reviewer
            ? `${data.reviewer.firstName || ''} ${data.reviewer.lastName || ''}`.trim() || data.reviewer.email
            : null,
          actionReason: data.actionReason || data.rejectionReason,
          balances: Array.isArray(data.applicantBalances) ? data.applicantBalances : []
        };
        setLeave(formatted);
      } else {
        setErrorMsg('Leave request could not be found.');
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to load leave application details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadLeaveData();
  }, [loadLeaveData]);

  // Handle Cancel Leave
  const handleCancel = async () => {
    if (!leave?.id) return;
    if (!window.confirm('Are you sure you want to cancel this leave application?')) {
      return;
    }

    setIsCancelling(true);
    try {
      await apiCancelLeave(leave.id);
      setToastMsg('Leave application cancelled successfully.');
      setLeave((prev) => (prev ? { ...prev, status: 'Cancelled' } : null));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to cancel leave application');
    } finally {
      setIsCancelling(false);
    }
  };

  const statusLower = (leave?.status || '').toLowerCase();

  const getStatusBadge = (st) => {
    switch (st) {
      case 'approved':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'Approved'
        };
      case 'rejected':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          icon: XCircle,
          label: 'Rejected'
        };
      case 'cancelled':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: AlertCircle,
          label: 'Cancelled'
        };
      default:
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          icon: Clock,
          label: 'Pending Review'
        };
    }
  };

  const badge = getStatusBadge(statusLower);
  const StatusIcon = badge.icon;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="h-10 w-40 bg-slate-100 rounded-xl animate-pulse" />
        <PageSkeleton />
      </div>
    );
  }

  if (errorMsg || !leave) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <button
          type="button"
          onClick={() => navigate(leavesHomeRoute)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to My Leaves</span>
        </button>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Leave Application Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {errorMsg || 'The requested leave application ID does not exist or has been removed.'}
          </p>
          <button
            type="button"
            onClick={() => navigate(leavesHomeRoute)}
            className="mt-3 px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs"
          >
            Return to My Leaves
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(leavesHomeRoute)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to My Leaves</span>
          </button>

          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
            REF #{String(leave.id).slice(0, 8).toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(applyRoute)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply Another Leave</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Leave Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        {/* Status Header Banner */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${badge.bg}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-2xs">
              <StatusIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight">Status: {badge.label}</span>
                <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                {statusLower === 'approved'
                  ? 'Sanctioned by Reporting Authority'
                  : statusLower === 'rejected'
                  ? (leave.actionReason || 'Application declined by Reporting Authority')
                  : statusLower === 'cancelled'
                  ? 'Application was cancelled by applicant'
                  : 'Pending supervisor review and approval'}
              </p>
            </div>
          </div>

          {statusLower === 'pending' && (
            <button
              type="button"
              disabled={isCancelling}
              onClick={handleCancel}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Application'}
            </button>
          )}
        </div>

        {/* Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/70">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Leave Category
            </span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 block">
              {leave.leaveType}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Code: {leave.leaveTypeCode || 'LV'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Duration
            </span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 block">
              {leave.duration || `${leave.days} Days`}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Total Business Days
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Date Range
            </span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 font-mono block">
              {leave.fromDate} &rarr; {leave.toDate}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Effective Period
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Submitted Date
            </span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 block">
              {leave.appliedOn}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {leave.appliedAtFull || 'Recorded'}
            </span>
          </div>
        </div>

        {/* Reason for Leave */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Reason Provided
          </label>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium">
            "{leave.reason || 'No specific remarks entered.'}"
          </div>
        </div>

        {/* Rejection / Review Remarks (if rejected or reviewed) */}
        {leave.actionReason && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Reviewer Remarks / Reason:
            </span>
            <p className="pl-5.5 font-medium">{leave.actionReason}</p>
          </div>
        )}

        {/* Approval Timeline Workflow */}
        <div className="p-5 rounded-2xl border border-slate-200/80 space-y-4">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Application & Approval Workflow
          </span>

          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800">
                  Step 1: Submitted by {leave.applicantName || 'Applicant'}
                </span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Applied on {leave.appliedAtFull || leave.appliedOn}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold ${
                  statusLower === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : statusLower === 'rejected'
                    ? 'bg-rose-100 text-rose-700'
                    : statusLower === 'cancelled'
                    ? 'bg-slate-200 text-slate-600'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                2
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800">
                  Step 2: Manager & HR Review &bull; {badge.label}
                </span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {statusLower === 'approved'
                    ? `Sanctioned by ${leave.approverName || 'Reporting Authority'}`
                    : statusLower === 'rejected'
                    ? `Declined by ${leave.approverName || 'Reporting Authority'}`
                    : statusLower === 'cancelled'
                    ? 'Application cancelled before final action'
                    : 'Awaiting review and action from supervisor'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            For leave extensions or changes, please submit a separate request or contact HR.
          </p>

          <button
            type="button"
            onClick={() => navigate(leavesHomeRoute)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Back to All Leaves
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRLeaveDetailView;
