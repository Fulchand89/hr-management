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
  ShieldAlert,
  Building2,
  FileText,
  CalendarDays,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  Award,
  Printer,
  Mail,
  Loader2,
  BadgeCheck
} from 'lucide-react';

import {
  getLeaveRequestById,
  actionLeaveRequest
} from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';

export const HRLeaveRequestDetailView = ({ request: propRequest, onBack }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // Initial leave detail from props or null
  const [request, setRequest] = useState(propRequest || null);

  const loadLeaveDetail = async () => {
    if (!id && !propRequest) {
      navigate('/hr/leave-requests', { replace: true });
      return;
    }

    if (!id && propRequest) {
      setRequest(propRequest);
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

        const actionDate = r.actionedAt
          ? new Date(r.actionedAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : null;

        const revName = r.reviewer
          ? `${r.reviewer.firstName} ${r.reviewer.lastName || ''}`.trim()
          : null;

        setRequest({
          id: r.id,
          userId: r.userId,
          employeeName: applicantName,
          employeeEmail: r.applicant?.email || '',
          employeeId: r.applicant?.employeeCode || `EMP-${r.userId || 'N/A'}`,
          designation: r.applicant?.designation?.name || r.applicant?.designation || 'Staff',
          department: r.applicant?.department?.name || r.applicant?.department || 'General',
          managerName: r.applicant?.reportingManager
            ? `${r.applicant.reportingManager.firstName} ${r.applicant.reportingManager.lastName || ''}`.trim()
            : 'HR Department',
          avatar: r.applicant?.avatar || null,
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
          balances: Array.isArray(r.applicantBalances) ? r.applicantBalances : [],
          reviewerName: revName,
          actionedAt: actionDate,
          actionReason: r.actionReason || null
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
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await actionLeaveRequest(id || request.id, { status: 'approved' });
      setRequest((prev) => (prev ? { 
        ...prev, 
        status: 'Approved',
        reviewerName: `${user?.firstName || 'HR'} ${user?.lastName || ''}`.trim(),
        actionedAt: 'Just now'
      } : null));
      showToast('Leave request sanctioned successfully! Notified employee and manager.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to sanction leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      setRejectError('Please state a reason for rejecting this leave request');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    setRejectError('');
    try {
      await actionLeaveRequest(id || request.id, { 
        status: 'rejected', 
        actionReason: rejectReason.trim(),
        rejectionReason: rejectReason.trim()
      });
      setRequest((prev) => (prev ? { 
        ...prev, 
        status: 'Rejected',
        reviewerName: `${user?.firstName || 'HR'} ${user?.lastName || ''}`.trim(),
        actionedAt: 'Just now',
        actionReason: rejectReason.trim()
      } : null));
      setIsRejectModalOpen(false);
      setRejectReason('');
      showToast('Leave request marked as rejected.');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reject leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/hr/leave-requests');
    }
  };

  // Resolve dynamic avatar
  const apiBase = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '') 
    : 'http://localhost:5000';
  const resolvedAvatar = request?.avatar
    ? (request.avatar.startsWith('http') ? request.avatar : `${apiBase}${request.avatar.startsWith('/') ? '' : '/'}${request.avatar}`)
    : null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mx-auto shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Retrieving Application File</h3>
          <p className="text-xs text-slate-400 mt-0.5">Fetching employee leave quota & audit history...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-extrabold text-slate-900">Leave Application Record Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          The requested leave record may have expired, been withdrawn by the employee, or the ID is invalid.
        </p>
        <button
          type="button"
          onClick={handleGoBack}
          className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Return to Applications Roster</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGoBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-base">Leave Application Review</span>
              <span className="font-mono text-xs text-slate-400 font-bold">#{request.id}</span>
            </div>
            <p className="text-[11px] text-slate-400">Review time-off requests, verify quotas & approve</p>
          </div>
        </div>

        {/* Right Status Pill & Print */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            title="Print Application Summary"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print</span>
          </button>

          {request.status.toLowerCase() === 'pending' && (
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Review
            </span>
          )}
          {request.status.toLowerCase() === 'approved' && (
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Approved
            </span>
          )}
          {request.status.toLowerCase() === 'rejected' && (
            <span className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold shadow-2xs flex items-center gap-1.5">
              <X className="w-3.5 h-3.5 text-rose-600" />
              Rejected
            </span>
          )}
        </div>
      </div>

      {/* Main 2-Column Responsive Web Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Applicant Details & Application Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Identity Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Applicant Information
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                Active Staff
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                {resolvedAvatar ? (
                  <img
                    src={resolvedAvatar}
                    alt={request.employeeName}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-xs border border-slate-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-rose-100 text-[#8B1D2C] font-black text-2xl flex items-center justify-center shrink-0 shadow-xs border border-rose-200/60">
                    {request.avatarInitial}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {request.employeeName}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                    <span className="font-mono font-bold text-slate-700">{request.employeeId}</span>
                    <span>&bull;</span>
                    <span>{request.designation}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span>{request.department}</span>
                    {request.employeeEmail && (
                      <>
                        <span>&bull;</span>
                        <a 
                          href={`mailto:${request.employeeEmail}`}
                          className="text-[#8B1D2C] hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          <span>{request.employeeEmail}</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-1 sm:text-right">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Reporting Manager</span>
                <span className="font-bold text-slate-800 block">{request.managerName}</span>
                <span className="text-[11px] text-slate-400 block font-mono">Submitted: {request.appliedAt}</span>
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
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    Requested Time-Off Parameters
                  </h3>
                  <p className="text-[11px] text-slate-400">Dates, schedule and applicant justifications</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                {request.leaveType} ({request.leaveCode})
              </span>
            </div>

            {/* Parameter Rows Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Start Date</span>
                <span className="font-bold text-slate-900 text-sm mt-1 block font-mono">{request.fromDate}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">End Date</span>
                <span className="font-bold text-slate-900 text-sm mt-1 block font-mono">{request.toDate}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100">
                <span className="text-rose-700 font-bold uppercase tracking-wider text-[10px] block">Total Duration</span>
                <span className="font-extrabold text-[#8B1D2C] text-sm mt-1 block">{request.duration}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">Session Type</span>
                <span className="font-bold text-slate-900 text-sm mt-1 block">{request.leaveDuration}</span>
              </div>
            </div>

            {/* Reason Block */}
            <div className="pt-1">
              <span className="text-slate-500 font-bold text-xs block mb-2">
                Applicant's Stated Reason:
              </span>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <p className="font-medium text-slate-800 text-sm leading-relaxed">
                  "{request.reason || 'No specific note provided'}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Quota Balance & Decision Card */}
        <div className="space-y-6">
          {/* Employee Quota Balance Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Annual Leave Balances</span>
                <span className="text-[10px] text-slate-400 font-medium">Real-time quota tracking</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active Year
              </span>
            </div>

            <div className="space-y-3">
              {request.balances && request.balances.length > 0 ? (
                request.balances.map((item, idx) => {
                  const pct = Math.min(100, Math.max(0, Math.round(((item.remaining || 0) / (item.total || 1)) * 100)));
                  const isCurrentType = item.name.toLowerCase() === request.leaveType.toLowerCase() || item.code === request.leaveCode;
                  return (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-2xl border text-xs transition-all ${
                        isCurrentType 
                          ? 'bg-rose-50/50 border-rose-200 ring-1 ring-[#8B1D2C]/20' 
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          {isCurrentType && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <span className={`font-black ${isCurrentType ? 'text-[#8B1D2C]' : 'text-slate-700'}`}>
                          {item.remaining || 0} / {item.total || 0} Days
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
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

            <p className="text-[11px] text-slate-400 text-center pt-1 leading-relaxed">
              Approving automatically deducts {request.duration} from the employee's {request.leaveType} balance.
            </p>
          </div>

          {/* Action Decision Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Managerial Decision
            </h3>

            {request.userId && user?.id && request.userId === user.id && user?.role !== 'admin' ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center space-y-1.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 mx-auto" />
                <p className="font-bold">Self-Application Detected</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Conflict of Interest Guard: You cannot sanction or decline your own leave request. This application must be actioned by a System Administrator.
                </p>
              </div>
            ) : request.status.toLowerCase() === 'pending' ? (
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Sanction & Approve Leave</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRejectError('');
                    setIsRejectModalOpen(true);
                  }}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-300 text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 active:scale-[0.99] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  <span>Decline / Reject Application</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Application Status
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    request.status.toLowerCase() === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {request.status}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-slate-600">
                  {request.reviewerName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Actioned By:</span>
                      <span className="font-bold text-slate-800">{request.reviewerName}</span>
                    </div>
                  )}
                  {request.actionedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Date & Time:</span>
                      <span className="font-mono text-slate-700">{request.actionedAt}</span>
                    </div>
                  )}
                </div>

                {request.actionReason && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Decision Note / Remarks:
                    </span>
                    <p className="text-xs bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 italic">
                      "{request.actionReason}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Decline Leave Request</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Please specify a constructive reason for rejection. This remark will be added to the employee's notification and leave audit history.
            </p>

            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (rejectError) setRejectError('');
              }}
              placeholder="e.g. Critical release scheduled during this period, high overlapping absences on the team..."
              className="w-full p-3.5 text-xs border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] resize-none"
            />

            {rejectError && (
              <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{rejectError}</span>
              </p>
            )}

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRLeaveRequestDetailView;
