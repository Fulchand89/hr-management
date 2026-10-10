import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Gift,
  Plus,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Briefcase,
  Phone,
  Mail,
  FileText,
  DollarSign,
  ChevronRight,
  RefreshCw,
  Loader2,
  Info,
  Download
} from 'lucide-react';
import { getMyReferrals } from '../../services/employeeService';
import SubmitReferralModal from './SubmitReferralModal';

export const MyReferralsView = ({ onBack }) => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getMyReferrals();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setReferrals(list);
    } catch (err) {
      console.error('Failed to load employee referrals:', err);
      setErrorMsg('Failed to load candidate referrals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = referrals.length;
    const joinedCount = referrals.filter(
      (r) => r.status === 'joined' || r.status === 'probation_active' || r.status === 'eligible' || r.status === 'disbursed'
    ).length;

    const disbursedAmount = referrals
      .filter((r) => r.payoutStatus === 'paid' || r.status === 'disbursed')
      .reduce((sum, r) => sum + Number(r.bonusAmount || 0), 0);

    const pendingPayoutAmount = referrals
      .filter((r) => (r.payoutStatus === 'eligible' || r.status === 'eligible') && r.payoutStatus !== 'paid')
      .reduce((sum, r) => sum + Number(r.bonusAmount || 0), 0);

    return {
      totalCount,
      joinedCount,
      disbursedAmount,
      pendingPayoutAmount
    };
  }, [referrals]);

  // Status Badge Helper
  const getStatusBadge = (status, payoutStatus) => {
    if (payoutStatus === 'paid' || status === 'disbursed') {
      return {
        label: 'Reward Disbursed',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    }
    if (payoutStatus === 'eligible' || status === 'eligible') {
      return {
        label: 'Bonus Eligible (Ready for Payout)',
        bg: 'bg-teal-50 text-teal-700 border-teal-200',
        dot: 'bg-teal-500'
      };
    }
    if (status === 'joined' || status === 'probation_active') {
      return {
        label: 'Joined (In 90-Day Probation)',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500'
      };
    }
    if (status === 'interviewing') {
      return {
        label: 'Interview Ongoing',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500'
      };
    }
    if (status === 'rejected') {
      return {
        label: 'Not Selected',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500'
      };
    }
    return {
      label: 'Submitted (HR Screening)',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500'
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* Toast Notification */}
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
              Candidate Referrals & Rewards
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Refer exceptional colleagues, monitor hiring status, and earn spot bonuses after 90-day retention
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadReferrals}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Refer a Candidate</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading your candidate referrals...</p>
        </div>
      )}

      {!loading && errorMsg && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      {!loading && !errorMsg && (
        <>
          {/* ── 2. Top Metric Cards ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Referrals
                </span>
                <span className="p-2 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-slate-900">{metrics.totalCount}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Candidates submitted</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Hired / Onboarded
                </span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-blue-600">{metrics.joinedCount}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Joined workforce</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Rewards Disbursed
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Gift className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-emerald-600">
                  ₹{metrics.disbursedAmount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Credited to salary account</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Eligible for Payout
                </span>
                <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-teal-600">
                  ₹{metrics.pendingPayoutAmount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Approved for next payroll</div>
              </div>
            </div>
          </div>

          {/* ── 3. Policy & Reward Slabs Banner ────────────────────────────── */}
          <div className="bg-gradient-to-r from-slate-900 to-[#4A0E17] rounded-2xl p-5 text-white shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold tracking-tight">
                  Official Gupta Tech Web Employee Referral Reward Policy
                </h3>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-amber-300 font-semibold self-start sm:self-auto">
                Mandatory 90-Day Retention
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              Earn generous referral incentives when your recommended candidates join and complete their 90-day (3 months) probation period with satisfactory attendance and performance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-300 uppercase font-semibold">1 – 3 Years Experience</div>
                  <div className="text-base font-bold text-white mt-0.5">₹1,500 Bonus</div>
                </div>
                <Gift className="w-5 h-5 text-amber-400 opacity-80" />
              </div>

              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-300 uppercase font-semibold">3 – 5 Years Experience</div>
                  <div className="text-base font-bold text-white mt-0.5">₹3,000 Bonus</div>
                </div>
                <Gift className="w-5 h-5 text-amber-400 opacity-80" />
              </div>

              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-300 uppercase font-semibold">5+ Years Experience</div>
                  <div className="text-base font-bold text-white mt-0.5">₹5,000 Bonus</div>
                </div>
                <Gift className="w-5 h-5 text-amber-400 opacity-80" />
              </div>
            </div>
          </div>

          {/* ── 4. Referrals Pipeline Table ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Your Candidate Referrals</h3>
                <p className="text-xs text-slate-500">Live recruitment and bonus verification status</p>
              </div>

              <span className="text-xs text-slate-500 font-semibold">
                {referrals.length} Candidate(s)
              </span>
            </div>

            {referrals.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mx-auto">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">No Referrals Submitted Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Help your peers join Gupta Tech Web and earn bonus rewards! Click "Refer a Candidate" to get started.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Refer Your First Candidate</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 font-semibold text-slate-600">
                      <th className="py-3 px-4">Candidate Details</th>
                      <th className="py-3 px-4">Position & Exp</th>
                      <th className="py-3 px-4">Referral Date</th>
                      <th className="py-3 px-4">Hiring Status</th>
                      <th className="py-3 px-4">90-Day Target Date</th>
                      <th className="py-3 px-4 text-right">Referral Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {referrals.map((ref) => {
                      const badge = getStatusBadge(ref.status, ref.payoutStatus);
                      const targetDate = ref.probationCompletionDate
                        ? new Date(ref.probationCompletionDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '--';

                      return (
                        <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Candidate Info */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 leading-tight">
                              {ref.candidateName}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {ref.candidateEmail} &bull; {ref.candidatePhone}
                            </div>
                          </td>

                          {/* Role & Experience */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{ref.role}</div>
                            <div className="text-[11px] text-slate-500">
                              {ref.experienceYears} Year(s) Exp
                            </div>
                          </td>

                          {/* Referral Date */}
                          <td className="py-3 px-4 text-slate-600">
                            {new Date(ref.createdAt || Date.now()).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>

                          {/* 90-Day Target */}
                          <td className="py-3 px-4 text-slate-600 font-mono">
                            {targetDate}
                          </td>

                          {/* Bonus Amount */}
                          <td className="py-3 px-4 text-right">
                            <div className="font-mono font-bold text-emerald-600 text-sm">
                              ₹{Number(ref.bonusAmount || 1500).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              {ref.payoutStatus || 'Pending'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Candidate Referral Modal */}
      <SubmitReferralModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={() => {
          showToast('Candidate referral submitted successfully to HR!');
          loadReferrals();
        }}
      />
    </div>
  );
};

export default MyReferralsView;
