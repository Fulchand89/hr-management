import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Award,
  Star,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Loader2,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { getMyPerformanceAppraisals, getMyProfile } from '../../services/employeeService';

export const MyAppraisalView = () => {
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
      console.error('Failed to load appraisal data:', err);
      setErrorMsg('Failed to load appraisal records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Determine tenure cycle based on salary slab (< 15k: 11M, >= 15k: 12M)
  const currentSalary = useMemo(() => {
    return Number(
      profile?.salary ||
      profile?.salaryStructure?.ctc ||
      25000
    );
  }, [profile]);

  const isElevenMonthCycle = currentSalary < 15000;
  const cycleMonths = isElevenMonthCycle ? 11 : 12;

  // Compute next review date
  const nextAppraisalInfo = useMemo(() => {
    const joinDate = profile?.joiningDate ? new Date(profile.joiningDate) : new Date();
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
    const num = Number(score || 0);
    if (num >= 4.5) return { label: 'Outstanding (A+)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (num >= 3.8) return { label: 'Exceeds Expectations (A)', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (num >= 3.0) return { label: 'Meets Expectations (B)', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (num > 0) return { label: 'Needs Improvement (C)', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    return { label: 'Pending Review', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-xl border border-slate-200 max-w-4xl mx-auto my-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
        <p className="text-xs font-semibold text-slate-500">Loading performance records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Performance &amp; Appraisals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Your performance review cycles, competency evaluation ratings, and increment history
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── 3 Summary Metrics ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cycle Slab */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Review Cycle</span>
          <span className="text-base sm:text-lg font-bold text-slate-900 mt-1 block">
            {isElevenMonthCycle ? '11-Month Fast-Track' : '12-Month Annual Cycle'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {isElevenMonthCycle ? 'Standard for salary under ₹15,000' : 'Standard annual review'}
          </span>
        </div>

        {/* Next Review Target */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Next Review Due</span>
          <span className="text-base sm:text-lg font-bold text-slate-900 mt-1 block">
            {nextAppraisalInfo.dueDateFormatted}
          </span>
          <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
            {nextAppraisalInfo.isEligibleNow
              ? 'Eligible for review now'
              : `In ~${nextAppraisalInfo.monthsRemaining} month(s)`}
          </span>
        </div>

        {/* Latest Overall Rating */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Latest Performance Rating</span>
          {latestAppraisal ? (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                {Number(latestAppraisal.overallScore || 0).toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              <span
                className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  getScoreRating(latestAppraisal.overallScore).bg
                }`}
              >
                {getScoreRating(latestAppraisal.overallScore).label}
              </span>
            </div>
          ) : (
            <span className="text-base sm:text-lg font-bold text-slate-400 mt-1 block">
              Pending First Review
            </span>
          )}
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {latestAppraisal
              ? `Hike: +${latestAppraisal.hikePercentage || latestAppraisal.incrementPercentage || 0}%`
              : 'Conducted at tenure completion'}
          </span>
        </div>
      </div>

      {/* ── Latest Review Breakdown (If exists) ─────────────────────────── */}
      {latestAppraisal ? (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Latest Evaluation Breakdown ({latestAppraisal.cycleName || 'Annual Review'})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluation conducted on {latestAppraisal.effectiveDate || latestAppraisal.createdAt?.split('T')[0] || 'Recent cycle'}
              </p>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border self-start sm:self-auto ${
                getScoreRating(latestAppraisal.overallScore).bg
              }`}
            >
              Overall: {Number(latestAppraisal.overallScore || 0).toFixed(1)} / 5.0
            </span>
          </div>

          {/* 4 Core Competency Scores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Technical Score
              </span>
              <div className="font-mono text-base font-bold text-slate-900 mt-1">
                {Number(latestAppraisal.technicalScore || 0).toFixed(1)} <span className="text-slate-400 text-xs">/ 5.0</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Productivity Score
              </span>
              <div className="font-mono text-base font-bold text-slate-900 mt-1">
                {Number(latestAppraisal.productivityScore || 0).toFixed(1)} <span className="text-slate-400 text-xs">/ 5.0</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Teamwork &amp; Collab
              </span>
              <div className="font-mono text-base font-bold text-slate-900 mt-1">
                {Number(latestAppraisal.teamworkScore || 0).toFixed(1)} <span className="text-slate-400 text-xs">/ 5.0</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Leadership Score
              </span>
              <div className="font-mono text-base font-bold text-slate-900 mt-1">
                {Number(latestAppraisal.leadershipScore || 0).toFixed(1)} <span className="text-slate-400 text-xs">/ 5.0</span>
              </div>
            </div>
          </div>

          {/* Reviewer Feedback / Comments */}
          {(latestAppraisal.feedbackStrengths || latestAppraisal.comments || latestAppraisal.reviewNotes) && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
              <span className="font-bold text-slate-800 block">Manager / HR Feedback:</span>
              <p className="text-slate-600 leading-relaxed italic">
                "{latestAppraisal.feedbackStrengths || latestAppraisal.comments || latestAppraisal.reviewNotes}"
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl p-10 border border-slate-200 shadow-2xs text-center space-y-3">
          <Award className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-sm font-bold text-slate-800">No Appraisals Logged Yet</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your performance review will be conducted by your manager or HR upon completion of your review tenure cycle. Once completed, your competency scores, feedback, and salary revisions will appear here.
          </p>
        </div>
      )}

      {/* ── Appraisal History Table (If multiple records) ───────────────── */}
      {appraisals.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              Appraisal History ({appraisals.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Past performance evaluations and salary revisions
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Cycle</th>
                  <th className="py-2.5 px-4">Overall Score</th>
                  <th className="py-2.5 px-4">Rating</th>
                  <th className="py-2.5 px-4">Salary Revision</th>
                  <th className="py-2.5 px-4">Effective Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appraisals.map((rev) => {
                  const rating = getScoreRating(rev.overallScore);
                  const hike = Number(rev.hikePercentage || rev.incrementPercentage || 0);

                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {rev.cycleName || 'Annual Review'}
                      </td>

                      <td className="py-3 px-4 font-mono font-medium text-slate-800">
                        {Number(rev.overallScore || 0).toFixed(1)} / 5.0
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${rating.bg}`}>
                          {rating.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {hike > 0 ? (
                          <span className="font-semibold text-emerald-700">+{hike}%</span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {rev.effectiveDate || rev.createdAt?.split('T')[0] || '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppraisalView;
