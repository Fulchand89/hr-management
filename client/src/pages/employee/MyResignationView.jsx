import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Undo2,
  Laptop,
  Wallet,
  UserCheck,
  Lock,
  XCircle,
  Building2,
  ArrowRight
} from 'lucide-react';
import { getMyResignation, withdrawResignation } from '../../services/employeeService';
import ApplyResignationModal from './ApplyResignationModal';
import { PageSkeleton } from '../../components/common/Skeleton';

export const MyResignationView = ({ onBack }) => {
  const [resignation, setResignation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadResignation = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getMyResignation();
      const data =
        res?.data && res.data.data !== undefined
          ? res.data.data
          : (res?.data !== undefined ? res.data : (res || null));
      setResignation(data);
    } catch (err) {
      console.error('Failed to load my resignation:', err);
      if (err?.response?.status !== 404) {
        setErrorMsg('Failed to load exit details.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResignation();
  }, [loadResignation]);

  const handleWithdraw = async () => {
    if (!resignation?.id) return;
    if (!window.confirm('Are you sure you want to withdraw your resignation request? Your employment status will remain active.')) {
      return;
    }

    setIsWithdrawing(true);
    try {
      await withdrawResignation(resignation.id);
      showToast('Resignation request successfully withdrawn.');
      await loadResignation();
    } catch (err) {
      console.error('Failed to withdraw resignation:', err);
      alert(err?.response?.data?.message || 'Failed to withdraw resignation.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'clearances_in_progress':
        return {
          label: 'Notice Approved (In Progress)',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500'
        };
      case 'cleared':
        return {
          label: 'All Clearances Complete',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'settled':
      case 'completed':
        return {
          label: 'F&F Settled (Completed)',
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          dot: 'bg-teal-500'
        };
      case 'withdrawn':
        return {
          label: 'Withdrawn',
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400'
        };
      case 'rejected':
        return {
          label: 'Declined by Management',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500'
        };
      default:
        return {
          label: 'Submitted (Pending HR Review)',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500 animate-pulse'
        };
    }
  };

  const isRejected = Boolean(resignation && resignation.id && resignation.status === 'rejected');
  const isWithdrawn = Boolean(resignation && resignation.id && resignation.status === 'withdrawn');
  const isPending = Boolean(
    resignation &&
    resignation.id &&
    ['pending', 'submitted', 'under_review'].includes(resignation.status)
  );
  const isApproved = Boolean(
    resignation &&
    resignation.id &&
    ['approved', 'clearances_in_progress', 'cleared', 'settled', 'completed'].includes(resignation.status)
  );
  const hasActiveResignation = isPending || isApproved;
  const statusBadge = resignation?.status ? getStatusBadge(resignation.status) : null;

  const exitDates = useMemo(() => {
    if (!resignation || !resignation.id) return null;
    const submitDate = new Date(resignation.resignationDate || resignation.createdAt || new Date());
    const lwd = new Date(
      resignation.approvedLastWorkingDay ||
      resignation.requestedLastWorkingDay ||
      resignation.resignationDate ||
      new Date()
    );

    const today = new Date();
    const diffToLwd = Math.ceil((lwd - today) / (1000 * 60 * 60 * 24));

    const fnfTarget = new Date(lwd);
    fnfTarget.setDate(fnfTarget.getDate() + 45);

    const reviewedDate = resignation.reviewedAt ? new Date(resignation.reviewedAt) : null;
    const reviewedFormatted = reviewedDate
      ? reviewedDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      : null;

    return {
      submitFormatted: submitDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      lwdFormatted: lwd.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      fnfFormatted: fnfTarget.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }),
      reviewedFormatted,
      daysRemaining: Math.max(0, diffToLwd),
      hasLwdPassed: diffToLwd <= 0
    };
  }, [resignation]);

  const canWithdraw = Boolean(
    hasActiveResignation &&
    ['pending', 'submitted', 'under_review'].includes(resignation.status)
  );

  const clearances = resignation?.clearances || [];
  const clearedCount = clearances.filter((c) => c.status === 'cleared').length;
  const totalClearances = clearances.length || 5;
  const progressPercent = Math.round((clearedCount / totalClearances) * 100);

  const deptList = [
    { key: 'it', name: 'IT & Hardware Assets', icon: Laptop, defaultDesc: 'Laptop, accessories & access revocation' },
    { key: 'finance', name: 'Finance & Accounts', icon: Wallet, defaultDesc: 'Salary dues, expense claims & PF balance' },
    { key: 'hr', name: 'Human Resources', icon: UserCheck, defaultDesc: 'Exit interview, NDA verification & certificates' },
    { key: 'admin', name: 'Admin & Facilities', icon: Lock, defaultDesc: 'ID card & access permissions return' },
    { key: 'manager', name: 'Reporting Manager', icon: ShieldCheck, defaultDesc: 'Knowledge transfer (KT) & sprint handover' }
  ];

  if (loading) {
    return <PageSkeleton statsCount={3} tableRows={4} className="max-w-6xl" />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                ← Back
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Resignation & Exit Clearance
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track notice period, department clearances, and full & final (F&F) settlement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadResignation}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {!hasActiveResignation && (
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Apply for Resignation</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-16 flex flex-col items-center justify-center gap-2.5 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Checking resignation records...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-center flex items-center justify-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Case 1: Rejected Resignation ──────────────────────────────── */}
      {!loading && !errorMsg && isRejected && (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-2xs overflow-hidden">
          <div className="p-5 bg-rose-50/50 border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
                <XCircle className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Resignation Request Declined</h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                    Rejected
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your resignation request was reviewed and declined by HR / Management.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Submit New Request</span>
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* HR Reason */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                HR Remarks / Reason for Decline:
              </div>
              <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap">
                {resignation.rejectionReason || 'No specific remarks entered by HR.'}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                {resignation.reviewer && (
                  <span>
                    Reviewed by: <strong className="text-slate-600">{resignation.reviewer.firstName} {resignation.reviewer.lastName || ''}</strong>
                  </span>
                )}
                {exitDates?.reviewedFormatted && (
                  <span>Reviewed on: <strong className="text-slate-600">{exitDates.reviewedFormatted}</strong></span>
                )}
                <span>Ref: #{resignation.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>

            {/* Submitted Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400">Date Applied</span>
                <div className="font-semibold text-slate-800 mt-0.5">{exitDates?.submitFormatted || 'N/A'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400">Requested Last Working Day</span>
                <div className="font-semibold text-slate-800 mt-0.5">{exitDates?.lwdFormatted || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Case 2: Withdrawn Resignation ─────────────────────────────── */}
      {!loading && !errorMsg && isWithdrawn && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 text-center space-y-3 max-w-lg mx-auto my-6">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
            <Undo2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Resignation Notice Withdrawn</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              You withdrew your resignation request submitted on {exitDates?.submitFormatted || 'N/A'}. Your employment remains fully active.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Submit Resignation</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Case 3: No Resignation (Active Employment) ────────────────── */}
      {!loading && !errorMsg && !hasActiveResignation && !isRejected && !isWithdrawn && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 text-center space-y-3 max-w-lg mx-auto my-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active Employment Status</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              You are currently an active employee in good standing. No resignation or exit process is active.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Apply for Resignation</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Case 4: Active Resignation Lifecycle ───────────────────────── */}
      {!loading && !errorMsg && hasActiveResignation && (
        <div className="space-y-5">
          {/* Status Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <LogOut className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Exit Clearance Lifecycle
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ref #{resignation?.id?.slice(0, 8)?.toUpperCase()} • Submitted {exitDates?.submitFormatted || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge?.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${statusBadge?.dot}`} />
                  {statusBadge?.label}
                </span>

                {canWithdraw && (
                  <button
                    type="button"
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isWithdrawing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Undo2 className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Withdraw</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4 Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Notice Period</div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {resignation.noticePeriodDays || 60} Days
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Mandatory Duration</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Last Working Day</div>
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {exitDates?.lwdFormatted}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {resignation.approvedLastWorkingDay ? 'Approved by HR' : 'Requested date'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Notice Remaining</div>
                <div className="text-sm font-bold text-rose-600 mt-1">
                  {exitDates?.hasLwdPassed ? 'Notice Complete' : `${exitDates?.daysRemaining} Day(s) Left`}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Handover timeline</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <div className="text-[10px] uppercase font-bold text-emerald-700">F&F Settlement Target</div>
                <div className="text-sm font-bold text-emerald-900 mt-1">
                  {exitDates?.fnfFormatted}
                </div>
                <div className="text-[10px] text-emerald-700/80 mt-0.5">Within 45 days of LWD</div>
              </div>
            </div>

            {/* Employee's Submitted Note */}
            {(resignation.reason || resignation.comments) && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-0.5">
                <div className="font-bold text-slate-800">
                  Reason: <span className="font-medium text-slate-700">{resignation.reason}</span>
                </div>
                {resignation.comments && (
                  <p className="text-slate-500 italic">"{resignation.comments}"</p>
                )}
              </div>
            )}
          </div>

          {/* Department Clearances Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Department Clearances</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clearances required from each department for final settlement processing
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-xs font-bold text-slate-700">
                  {clearedCount} of {totalClearances} Cleared
                </div>
                <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Clearances Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {deptList.map((item, idx) => {
                const IconComponent = item.icon;
                const rec = clearances.find((c) => c.department?.toLowerCase() === item.key);
                const isCleared = rec?.status === 'cleared';

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCleared
                        ? 'bg-emerald-50/40 border-emerald-200/80'
                        : 'bg-slate-50/60 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            isCleared
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200/80 text-slate-600'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </span>
                        <div className="text-xs font-bold text-slate-800">{item.name}</div>
                      </div>

                      {isCleared ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 mt-2">{item.defaultDesc}</p>

                    {rec?.remarks && (
                      <div className="mt-2 text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                        Remarks: {rec.remarks}
                      </div>
                    )}

                    {isCleared && rec?.clearedByUser && (
                      <div className="mt-1 text-[10px] text-emerald-700">
                        Signed off by: {rec.clearedByUser.firstName} {rec.clearedByUser.lastName || ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Resignation Application Modal */}
      <ApplyResignationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          showToast('Resignation request successfully submitted to HR.');
          loadResignation();
        }}
      />
    </div>
  );
};

export default MyResignationView;
