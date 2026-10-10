import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Building2,
  FileText,
  UserMinus,
  RefreshCw,
  Loader2,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  FileCheck,
  Undo2,
  Laptop,
  Wallet,
  UserCheck,
  Lock
} from 'lucide-react';
import { getMyResignation, withdrawResignation } from '../../services/employeeService';
import ApplyResignationModal from './ApplyResignationModal';

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
      const data = res?.data || res || null;
      setResignation(data);
    } catch (err) {
      console.error('Failed to load my resignation:', err);
      // If 404 or no active resignation, it's normal
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
    if (!window.confirm('Are you sure you want to withdraw your resignation request? This will restore your active employment status.')) {
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

  // Status Badge Helper
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
          label: 'Notice Submitted (Pending Review)',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500 animate-pulse'
        };
    }
  };

  const statusBadge = resignation ? getStatusBadge(resignation.status) : null;

  // Timeline / F&F calculations
  const exitDates = useMemo(() => {
    if (!resignation) return null;
    const submitDate = new Date(resignation.resignationDate || resignation.createdAt);
    const lwd = new Date(
      resignation.approvedLastWorkingDay ||
      resignation.requestedLastWorkingDay ||
      resignation.resignationDate
    );

    const today = new Date();
    const diffToLwd = Math.ceil((lwd - today) / (1000 * 60 * 60 * 24));

    const fnfTarget = new Date(lwd);
    fnfTarget.setDate(fnfTarget.getDate() + 45);

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
      daysRemaining: Math.max(0, diffToLwd),
      hasLwdPassed: diffToLwd <= 0
    };
  }, [resignation]);

  const canWithdraw =
    resignation &&
    (resignation.status === 'submitted' || resignation.status === 'under_review');

  const clearances = resignation?.clearances || [];

  const deptIcons = {
    it: Laptop,
    finance: Wallet,
    hr: UserCheck,
    admin: Lock,
    manager: ShieldCheck
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
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
            60-Day mandatory notice tracking, multi-department clearances, and full & final settlement (F&F)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadResignation}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {(!resignation || resignation.status === 'withdrawn' || resignation.status === 'rejected') && (
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Apply for Resignation</span>
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Checking active exit records...</p>
        </div>
      )}

      {!loading && errorMsg && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      {/* Case A: No Active Resignation */}
      {!loading && !errorMsg && (!resignation || resignation.status === 'withdrawn' || resignation.status === 'rejected') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8 text-center space-y-4 max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Active Employment in Good Standing
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              You do not have any pending or active resignation requests. Your employment status is fully active. If you intend to tender your resignation, please review company notice period guidelines below.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Submit Resignation Notice</span>
            </button>
          </div>
        </div>
      )}

      {/* Case B: Active Resignation Record */}
      {!loading && !errorMsg && resignation && resignation.status !== 'withdrawn' && resignation.status !== 'rejected' && (
        <>
          {/* ── 2. Active Status & Notice Slabs ───────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <LogOut className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Active Resignation Notice Lifecycle
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reference ID: #{resignation.id.slice(0, 8).toUpperCase()} • Submitted on {exitDates?.submitFormatted}
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

            {/* 4 Cards: Submission, LWD, Days Left, F&F Target */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Notice Duration</div>
                <div className="text-base font-bold text-slate-900 mt-1 font-mono">
                  {resignation.noticePeriodDays || 60} Days Mandatory
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Company Standard Notice
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Last Working Day (LWD)</div>
                <div className="text-base font-bold text-slate-900 mt-1">
                  {exitDates?.lwdFormatted}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {resignation.approvedLastWorkingDay ? 'Approved by HR' : 'Requested date'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Notice Remaining</div>
                <div className="text-base font-bold text-rose-600 mt-1 font-mono">
                  {exitDates?.hasLwdPassed ? 'Completed' : `${exitDates?.daysRemaining} Day(s) Left`}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Sprint handover ongoing
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <div className="text-[10px] uppercase font-bold text-emerald-700">F&F Settlement Due</div>
                <div className="text-base font-bold text-emerald-900 mt-1">
                  {exitDates?.fnfFormatted}
                </div>
                <div className="text-[11px] text-emerald-700/80 mt-0.5">
                  Standard 45-day payout cycle
                </div>
              </div>
            </div>

            {/* Employee Comments */}
            {resignation.comments && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span className="font-bold text-slate-800">Your Transition Note: </span>
                <span>{resignation.comments}</span>
              </div>
            )}
          </div>

          {/* ── 3. Department Clearance Matrix ────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Department Clearance & Handover Status</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All 5 departments must provide digital clearance prior to final settlement disbursement
                </p>
              </div>

              <span className="text-xs font-bold text-slate-700">
                {clearances.filter((c) => c.status === 'cleared').length} of {clearances.length || 5} Cleared
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                { deptKey: 'it', name: 'IT Infrastructure & Assets', desc: 'Laptop return, credentials, VPN revoke' },
                { deptKey: 'finance', name: 'Finance & Accounts', desc: 'Salary balance, loan/advance recovery, PF check' },
                { deptKey: 'hr', name: 'Human Resources Formalities', desc: 'Exit interview, NDA verification, certificates' },
                { deptKey: 'admin', name: 'Administration & Facility', desc: 'ID card, access token, locker key handover' },
                { deptKey: 'manager', name: 'Reporting Manager Handover', desc: 'Code repository transfer, sprint KT signoff' }
              ].map((item, idx) => {
                const IconComponent = deptIcons[item.deptKey] || ShieldCheck;
                const rec = clearances.find((c) => c.department?.toLowerCase() === item.deptKey);
                const isCleared = rec?.status === 'cleared';

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isCleared
                        ? 'bg-emerald-50/50 border-emerald-200/80'
                        : 'bg-slate-50/60 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            isCleared
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
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

                    <p className="text-[11px] text-slate-500 mt-2">{item.desc}</p>

                    {rec?.remarks && (
                      <div className="mt-2 text-[10px] font-mono text-slate-600 bg-white/70 p-1.5 rounded border border-slate-200">
                        Note: {rec.remarks}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── 4. Standard Offboarding Regulations & FAQ ──────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-slate-700" />
          <span>Exit & Offboarding Policy Regulations</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900">1. Notice Period Compliance</div>
            <p className="text-[11px]">
              Every employee is bound by the 60-day notice period requirement. Resignations submitted without serving full notice will require explicit buy-out approval or waiver from Management.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900">2. Knowledge Transfer (KT)</div>
            <p className="text-[11px]">
              Complete project code repositories, documentation, and client handover files must be delivered to the designated colleague before the final clearance sign-off.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-slate-900">3. F&F & Document Issuance</div>
            <p className="text-[11px]">
              Full & Final settlement proceeds, along with your official Experience Certificate and Relieving Letter, are disbursed within 45 days of the validated Last Working Day.
            </p>
          </div>
        </div>
      </div>

      {/* Resignation Application Modal */}
      <ApplyResignationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          showToast('Resignation notice successfully submitted to HR.');
          loadResignation();
        }}
      />
    </div>
  );
};

export default MyResignationView;
