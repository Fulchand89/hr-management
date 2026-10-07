import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Building2,
  FileText,
  CalendarDays,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';

import {
  getLeaveRequestById,
  actionLeaveRequest
} from '../../services/hrService';

export const HRLeaveRequestDetailView = ({ request: propRequest, onBack }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Initial leave detail from props or null
  const [request, setRequest] = useState(propRequest || null);

  const loadLeaveDetail = async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await getLeaveRequestById(id);
      const r = res?.data ?? res ?? null;
      if (r) {
        const applicantName = r.applicant
          ? `${r.applicant.firstName} ${r.applicant.lastName || ''}`.trim()
          : 'Employee';
        const durationStr = `${r.totalDays || 1} ${parseFloat(r.totalDays) === 1 ? 'Day' : 'Days'}`;
        const leaveDurationStr = r.isHalfDay ? (r.halfDayType || 'Half Day') : 'Full Day';
        const appDate = r.createdAt
          ? new Date(r.createdAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Recently';

        setRequest({
          id: r.id,
          employeeName: applicantName,
          employeeId: r.applicant?.employeeCode || `EMP-${r.userId || 'N/A'}`,
          designation: r.applicant?.designation?.name || r.applicant?.designation || 'Staff',
          department: r.applicant?.department?.name || r.applicant?.department || 'General',
          managerName: r.applicant?.reportingManager
            ? `${r.applicant.reportingManager.firstName} ${r.applicant.reportingManager.lastName || ''}`.trim()
            : 'HR Department',
          avatarInitial: applicantName.charAt(0).toUpperCase(),
          leaveType: r.leaveType?.name || 'Leave',
          leaveCode: r.leaveType?.code || 'LV',
          fromDate: r.startDate,
          toDate: r.endDate,
          duration: durationStr,
          leaveDuration: leaveDurationStr,
          reason: r.reason || '',
          status: (r.status || 'pending').charAt(0).toUpperCase() + (r.status || 'pending').slice(1),
          appliedAt: appDate,
          balances: r.applicantBalances || null
        });
      } else {
        setRequest(null);
      }
    } catch {
      setRequest(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveDetail();
  }, [id]);

  const handleApprove = async () => {
    try {
      await actionLeaveRequest(id || request.id, { status: 'approved' });
      setRequest((prev) => (prev ? { ...prev, status: 'Approved' } : null));
      showToast('Leave request sanctioned successfully! Notified employee and manager.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to sanction leave request');
    }
  };

  const handleRejectConfirm = async () => {
    try {
      await actionLeaveRequest(id || request.id, { status: 'rejected', rejectionReason: rejectReason });
      setRequest((prev) => (prev ? { ...prev, status: 'Rejected' } : null));
      setIsRejectModalOpen(false);
      showToast('Leave request marked as rejected.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reject leave request');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/hr/leave-requests');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center space-y-3">
        <Clock className="w-8 h-8 text-[#8B1D2C] animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Loading leave application details from server...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Leave Application Not Found</h2>
        <p className="text-xs text-slate-500">The requested leave application record does not exist or has been removed.</p>
        <button
          type="button"
          onClick={handleGoBack}
          className="px-4 py-2 rounded-xl bg-[#8B1D2C] text-white text-xs font-bold hover:bg-[#731724] cursor-pointer"
        >
          &larr; Back to Applications Roster
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Back Action Bar */}
      <div className="flex items-center justify-between gap-4 pb-1">
        <button
          type="button"
          onClick={handleGoBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Applications</span>
        </button>

        {/* Status Pill */}
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-slate-400 font-bold hidden sm:inline">#{request.id}</span>
          {request.status.toLowerCase() === 'pending' && (
            <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Review
            </span>
          )}
          {request.status.toLowerCase() === 'approved' && (
            <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Approved
            </span>
          )}
          {request.status.toLowerCase() === 'rejected' && (
            <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold shadow-2xs flex items-center gap-1.5">
              <X className="w-3.5 h-3.5 text-rose-600" />
              Rejected
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Responsive Web Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Applicant Details & Application Data */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Identity Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Applicant Profile
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active Employee
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-200/70 text-[#8B1D2C] font-black text-2xl flex items-center justify-center shrink-0 shadow-xs">
                  {request.avatarInitial}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {request.employeeName}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                    <span className="font-mono font-bold text-slate-700">{request.employeeId}</span>
                    <span>&bull;</span>
                    <span>{request.designation}</span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {request.department}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1 sm:text-right">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Reporting Manager</span>
                <span className="font-bold text-slate-800 block">{request.managerName}</span>
                <span className="text-[11px] text-slate-400 block">Applied {request.appliedAt}</span>
              </div>
            </div>
          </div>

          {/* Leave Request Specification Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Requested Time-Off Parameters
                </h3>
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                {request.leaveType} ({request.leaveCode})
              </span>
            </div>

            {/* Parameter Rows Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Start Date</span>
                <span className="font-black text-slate-900 text-base mt-1 block font-mono">{request.fromDate}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">End Date</span>
                <span className="font-black text-slate-900 text-base mt-1 block font-mono">{request.toDate}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Total Duration</span>
                <span className="font-black text-[#8B1D2C] text-base mt-1 block">{request.duration}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Session Type</span>
                <span className="font-black text-slate-900 text-base mt-1 block">{request.leaveDuration}</span>
              </div>
            </div>

            {/* Reason Block */}
            <div className="pt-2">
              <span className="text-slate-500 font-bold text-xs block mb-2">
                Reason Stated by Applicant:
              </span>
              <div className="p-4 rounded-2xl bg-rose-50/30 border border-rose-100/80">
                <p className="font-bold text-slate-900 text-sm leading-relaxed">
                  "{request.reason}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Quota Balance & Actions Card */}
        <div className="space-y-6">
          {/* Employee Quota Balance Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">Current Leave Balances</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Quota Verified
              </span>
            </div>

            <div className="space-y-3">
              {request.balances && Object.entries(request.balances).length > 0 ? (
                Object.entries(request.balances).map(([key, item]) => {
                  const pct = Math.round(((item.remaining || 0) / (item.total || 1)) * 100);
                  return (
                    <div key={key} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{item.name}</span>
                        <span className="font-black text-[#8B1D2C]">
                          {item.remaining || 0} / {item.total || 0} Days
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-[#8B1D2C] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs">
                  Applicant quota will be adjusted on approval.
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-2">
              Approving will automatically deduct {request.duration} from {request.leaveType}.
            </p>
          </div>

          {/* Action Decision Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Managerial Decision
            </h3>

            {request.status.toLowerCase() === 'pending' ? (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Sanction & Approve Leave</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="w-full py-3.5 px-4 rounded-2xl border border-[#8B1D2C] text-[#8B1D2C] hover:bg-rose-50 active:scale-[0.99] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>Decline / Reject Application</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                <span className="text-xs text-slate-500 font-medium block">
                  Application marked as{' '}
                  <strong className={request.status.toLowerCase() === 'approved' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    {request.status}
                  </strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsRejectModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Decline Leave Request</h3>
            <p className="text-xs text-slate-400 mb-4">Please specify a constructive reason for rejection</p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Critical sprint release scheduled, overlap with key team deadlines..."
              className="w-full p-3.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] resize-none"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRLeaveRequestDetailView;
