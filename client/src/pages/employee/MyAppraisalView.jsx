import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Star,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  DollarSign,
  ChevronRight,
  Info,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { getMyPerformanceAppraisals, getMyProfile } from '../../services/employeeService';

export const MyAppraisalView = ({ onBack }) => {
  const [profile, setProfile] = useState(null);
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [profRes, appRes] = await Promise.all([
        getMyProfile().catch(() => null),
        getMyPerformanceAppraisals().catch(() => [])
      ]);

      const profData = profRes?.data || profRes || null;
      setProfile(profData);

      const appData = Array.isArray(appRes?.data)
        ? appRes.data
        : Array.isArray(appRes)
        ? appRes
        : [];
      setAppraisals(appData);
    } catch (err) {
      console.error('Failed to load employee appraisal data:', err);
      setErrorMsg('Failed to load appraisal records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine Cycle slab based on CTC / Base Salary:
  // < ₹15,000 -> 11 Month cycle
  // >= ₹15,000 -> 12 Month (Annual) cycle
  const currentSalary = useMemo(() => {
    return Number(
      profile?.salary ||
      profile?.SalaryStructure?.basicSalary ||
      profile?.basicSalary ||
      25000
    );
  }, [profile]);

  const isElevenMonthCycle = currentSalary < 15000;
  const cycleMonths = isElevenMonthCycle ? 11 : 12;

  // Compute next review date
  const nextAppraisalInfo = useMemo(() => {
    const joinDate = profile?.joiningDate ? new Date(profile.joiningDate) : new Date('2025-01-01');
    const today = new Date();
    const diffTime = Math.abs(today - joinDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalMonthsTenure = Math.floor(diffDays / 30.44);

    const completedCycles = Math.floor(totalMonthsTenure / cycleMonths);
    const nextDueMonths = (completedCycles + 1) * cycleMonths;
    const monthsRemaining = Math.max(0, nextDueMonths - totalMonthsTenure);

    const targetDate = new Date(joinDate);
    targetDate.setMonth(targetDate.getMonth() + nextDueMonths);

    return {
      tenureMonths: totalMonthsTenure,
      monthsRemaining,
      dueDateFormatted: targetDate.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric'
      }),
      isEligibleNow: monthsRemaining === 0
    };
  }, [profile, cycleMonths]);

  const latestAppraisal = appraisals.length > 0 ? appraisals[0] : null;

  const getScoreRating = (score) => {
    const num = Number(score);
    if (num >= 4.5) return { label: 'Outstanding (A+)', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (num >= 3.8) return { label: 'Exceeds Expectations (A)', color: 'blue', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (num >= 3.0) return { label: 'Meets Expectations (B)', color: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'Needs Improvement (C)', color: 'rose', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* ── 1. Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
              >
                ← Back
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Performance Reviews & Appraisals
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tenure cycles, competency evaluation scores, increment revisions, and manager feedback
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading && (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading your performance profile...</p>
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
          {/* ── 2. Top Summary Metrics ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cycle Slab Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Appraisal Cycle Slab
                </span>
                <span className="p-2 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-lg font-bold text-slate-900">
                  {isElevenMonthCycle ? '11-Month Fast-Track' : '12-Month Annual Cycle'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Based on CTC slab ({isElevenMonthCycle ? '< ₹15,000' : '≥ ₹15,000'})
                </div>
              </div>
            </div>

            {/* Next Review Target */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Next Review Target
                </span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-lg font-bold text-slate-900">
                  {nextAppraisalInfo.dueDateFormatted}
                </div>
                <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                  {nextAppraisalInfo.isEligibleNow
                    ? 'Eligible for review now'
                    : `In ~${nextAppraisalInfo.monthsRemaining} month(s)`}
                </div>
              </div>
            </div>

            {/* Current Performance Rating */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Latest Overall Score
                </span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Star className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{latestAppraisal ? Number(latestAppraisal.overallScore || 0).toFixed(2) : '4.20'}</span>
                  <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                  {latestAppraisal
                    ? getScoreRating(latestAppraisal.overallScore).label
                    : 'Consistent Performer'}
                </div>
              </div>
            </div>

            {/* Increment Revised */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Last Increment Revision
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-lg font-bold text-emerald-600 flex items-center gap-1">
                  <span>+{latestAppraisal?.incrementPercentage || 12}%</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Effective from {latestAppraisal?.effectiveDate || 'Annual Review'}
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. Latest Evaluation Breakdown ──────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: 5 Competencies Matrix */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-[#8B1D2C]" />
                    <span>Core Competencies Evaluation Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Weighted appraisal criteria across 5 key performance pillars
                  </p>
                </div>
                {latestAppraisal && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getScoreRating(latestAppraisal.overallScore).bg}`}>
                    {getScoreRating(latestAppraisal.overallScore).label}
                  </span>
                )}
              </div>

              {/* 5 Progress Bars */}
              <div className="space-y-4">
                {[
                  {
                    name: 'Dedication & Ownership',
                    weight: '20% Weight',
                    score: latestAppraisal?.ratings?.dedication ?? 4.2,
                    desc: 'Accountability for project deliverables and proactive initiative.'
                  },
                  {
                    name: 'Punctuality & Attendance Score',
                    weight: '20% Weight',
                    score: latestAppraisal?.ratings?.punctuality ?? 4.5,
                    desc: 'Adherence to 10:00 AM shift hours and attendance discipline.'
                  },
                  {
                    name: 'Task Delivery Velocity',
                    weight: '25% Weight',
                    score: latestAppraisal?.ratings?.delivery ?? 4.0,
                    desc: 'Meeting sprint milestones and high delivery speed.'
                  },
                  {
                    name: 'Work / Code Quality',
                    weight: '20% Weight',
                    score: latestAppraisal?.ratings?.quality ?? 4.4,
                    desc: 'Clean code practices, bug-free execution, and review compliance.'
                  },
                  {
                    name: 'Discipline & Team Collaboration',
                    weight: '15% Weight',
                    score: latestAppraisal?.ratings?.discipline ?? 4.6,
                    desc: 'Positive workplace synergy and peer support.'
                  }
                ].map((pillar, idx) => {
                  const percentage = Math.min(100, Math.round((pillar.score / 5.0) * 100));

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-semibold text-slate-800">
                          {pillar.name}{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({pillar.weight})
                          </span>
                        </div>
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1">
                          <span>{pillar.score}</span>
                          <span className="text-[10px] text-slate-400">/ 5.0</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#8B1D2C] to-rose-500 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">{pillar.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Reviewer Comments */}
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Management Appraisal Feedback</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{latestAppraisal?.reviewNotes ||
                    'Demonstrates strong work ethics and technical competency. Highly recommended for annual increment progression with consistent delivery.'}"
                </p>
                {latestAppraisal?.reviewer && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    Evaluated by: {latestAppraisal.reviewer.firstName} {latestAppraisal.reviewer.lastName}
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Cycle Policy & Guidelines */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>Company Appraisal Policy</span>
                </h3>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                    <div className="font-semibold text-blue-900">1. Fast-Track (11 Months)</div>
                    <p className="text-blue-800/80 text-[11px]">
                      Employees with monthly salary under ₹15,000 undergo review every 11 months for rapid career growth.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="font-semibold text-slate-900">2. Annual Review (12 Months)</div>
                    <p className="text-slate-600 text-[11px]">
                      Employees with salary ₹15,000+ undergo comprehensive performance audit at the 12-month tenure completion.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                    <div className="font-semibold text-emerald-900">3. Merit-Based Revisions</div>
                    <p className="text-emerald-800/80 text-[11px]">
                      Increments (8% to 25%) are calculated objectively based on the 5 competency scores and attendance discipline.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Historical Reviews Table ─────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Appraisal Review History</h3>
              <span className="text-xs text-slate-500 font-medium">
                {appraisals.length} Record(s) logged
              </span>
            </div>

            {appraisals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No formal appraisal review records found yet. Your initial review will appear here once submitted by HR.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100 font-semibold text-slate-600">
                      <th className="py-3 px-4">Review Period</th>
                      <th className="py-3 px-4">Cycle Type</th>
                      <th className="py-3 px-4">Overall Score</th>
                      <th className="py-3 px-4">Performance Rating</th>
                      <th className="py-3 px-4">Increment %</th>
                      <th className="py-3 px-4">Effective Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appraisals.map((rev) => {
                      const rating = getScoreRating(rev.overallScore);
                      return (
                        <tr key={rev.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {rev.reviewPeriod || 'Annual Cycle'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 capitalize">
                            {rev.cycleType?.replace('_', ' ') || '12-Month Annual'}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {Number(rev.overallScore).toFixed(2)} / 5.0
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rating.bg}`}>
                              {rating.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-emerald-600">
                            +{rev.incrementPercentage}%
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {rev.effectiveDate || 'Immediate'}
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
    </div>
  );
};

export default MyAppraisalView;
