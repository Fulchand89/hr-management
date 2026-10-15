import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ChevronLeft,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { getMyPerformanceAppraisals, getMyProfile } from '../../services/employeeService';
import { PageSkeleton } from '../../components/common/Skeleton';

export const MyAppraisalView = ({ onBack }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      navigate('/employee/dashboard');
    }
  };

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
      profile?.salaryStructure?.netSalary ||
      profile?.salaryStructure?.basicSalary ||
      0
    );
  }, [profile]);

  const isElevenMonthCycle = currentSalary > 0 && currentSalary < 15000;
  const cycleMonths = isElevenMonthCycle ? 11 : 12;

  // Next appraisal schedule calculation
  const nextAppraisalInfo = useMemo(() => {
    const joinDate = profile?.joiningDate ? new Date(profile.joiningDate) : null;
    const today = new Date();
    let totalMonthsTenure = 0;
    if (joinDate && !isNaN(joinDate.getTime())) {
      const diffTime = Math.max(0, today - joinDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalMonthsTenure = Math.floor(diffDays / 30.44);
    }

    const completedCycles = Math.floor(totalMonthsTenure / cycleMonths);
    const nextDueMonths = (completedCycles + 1) * cycleMonths;
    const monthsRemaining = Math.max(0, nextDueMonths - totalMonthsTenure);

    let dueDateFormatted = 'Pending joining date';
    if (joinDate && !isNaN(joinDate.getTime())) {
      const targetDate = new Date(joinDate);
      targetDate.setMonth(targetDate.getMonth() + nextDueMonths);
      dueDateFormatted = targetDate.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric'
      });
    }

    return {
      tenureMonths: totalMonthsTenure,
      monthsRemaining,
      dueDateFormatted,
      isEligibleNow: totalMonthsTenure > 0 && monthsRemaining === 0
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

  const computeHikePercent = useCallback((appraisal) => {
    if (!appraisal) return 0;
    const direct = Number(appraisal.hikePercentage || appraisal.incrementPercentage || 0);
    if (direct > 0) return direct;
    const prev = Number(appraisal.previousSalary || 0);
    const next = Number(appraisal.newSalary || 0);
    if (prev > 0 && next > prev) {
      return parseFloat((((next - prev) / prev) * 100).toFixed(1));
    }
    return 0;
  }, []);

  if (loading) {
    return <PageSkeleton statsCount={4} tableRows={3} className="max-w-5xl" />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Performance &amp; Appraisals
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your appraisal evaluation, rating, salary increments, and HR feedback
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Active Appraisal Status Card (Celebration) ────────────────── */}
      {latestAppraisal ? (
        <div className="bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/20 rounded-3xl p-6 sm:p-7 border border-emerald-200/80 shadow-md space-y-6 relative overflow-hidden">
          {/* Top Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Appraisal Approved &amp; Completed
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {latestAppraisal.cycleName || 'Annual Performance Review'}
                </h2>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Effective Date</span>
              <span className="text-xs font-bold text-slate-800 font-mono">
                {latestAppraisal.effectiveDate || latestAppraisal.createdAt?.split('T')[0] || 'Current Cycle'}
              </span>
            </div>
          </div>

          {/* 4 Primary Highlight Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Overall Rating */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Overall Rating
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400 self-center" />
                <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                  {Number(latestAppraisal.overallScore || 0).toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ 5.0</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 mt-1 block">
                {getScoreRating(latestAppraisal.overallScore).label}
              </span>
            </div>

            {/* Hike Percentage */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Salary Increment
              </span>
              <div className="mt-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                  +{computeHikePercent(latestAppraisal)}%
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-1 block">
                Salary Revised &amp; Active
              </span>
            </div>

            {/* Revised Monthly Salary */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Revised Monthly Salary
              </span>
              <div className="mt-1">
                <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                  ₹{Number(latestAppraisal.newSalary || currentSalary).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">/ month</span>
              </div>
              {Number(latestAppraisal.previousSalary || 0) > 0 && (
                <span className="text-[10px] text-slate-400 line-through mt-0.5 block">
                  Was ₹{Number(latestAppraisal.previousSalary).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Review Tenure */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                Policy Cycle
              </span>
              <div className="mt-1 font-bold text-slate-800 text-sm">
                {isElevenMonthCycle ? '11-Month Fast Track' : '12-Month Annual'}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Next in ~{cycleMonths} months
              </span>
            </div>
          </div>

          {/* HR Feedback / Comments */}
          {(latestAppraisal.comments || latestAppraisal.feedbackStrengths || latestAppraisal.reviewNotes) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/60 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Manager &amp; HR Feedback Remarks</span>
                {latestAppraisal.reviewer && (
                  <span className="text-slate-400 font-normal ml-auto text-[11px]">
                    Evaluated by {latestAppraisal.reviewer.firstName} {latestAppraisal.reviewer.lastName || ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic pt-1 pl-6">
                "{latestAppraisal.comments || latestAppraisal.feedbackStrengths || latestAppraisal.reviewNotes}"
              </p>
            </div>
          )}

          {/* 4 Competency Score Breakdown */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Competency Evaluation Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Technical Skills</span>
                <div className="text-base font-bold text-slate-900 font-mono mt-1">
                  {Number(latestAppraisal.technicalScore || latestAppraisal.overallScore || 0).toFixed(1)} <span className="text-slate-400 text-xs">/ 5.0</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Productivity &amp; Output</span>
                <div className="text-base font-bold text-slate-900 font-mono mt-1">
                  {Number(latestAppraisal.productivityScore || latestAppraisal.overallScore || 0).toFixed(1)} <span className="text-slate-400 text-xs">/ 5.0</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Team Collaboration</span>
                <div className="text-base font-bold text-slate-900 font-mono mt-1">
                  {Number(latestAppraisal.teamworkScore || latestAppraisal.overallScore || 0).toFixed(1)} <span className="text-slate-400 text-xs">/ 5.0</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Ownership &amp; Leadership</span>
                <div className="text-base font-bold text-slate-900 font-mono mt-1">
                  {Number(latestAppraisal.leadershipScore || latestAppraisal.overallScore || 0).toFixed(1)} <span className="text-slate-400 text-xs">/ 5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty / Pending Review State */
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-2xs text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Performance Appraisal Pending
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your performance appraisal review is scheduled upon completing your tenure cycle.
              Once your review is conducted by HR, your rating, increment percentage, revised salary, and feedback will be displayed here.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 text-xs text-slate-700">
            <span className="font-semibold">Review Cycle:</span>
            <span className="font-bold text-[#8B1D2C]">
              {isElevenMonthCycle ? '11-Month Fast Track (< ₹15,000)' : '12-Month Annual Cycle (≥ ₹15,000)'}
            </span>
            <span className="text-slate-400">&bull;</span>
            <span className="font-semibold">Target:</span>
            <span className="font-mono font-bold text-slate-800">{nextAppraisalInfo.dueDateFormatted}</span>
          </div>
        </div>
      )}

      {/* ── Appraisal History Table (If appraisals exist) ───────────────── */}
      {appraisals.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Appraisal History ({appraisals.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Past performance reviews, ratings, and salary revision records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap">Review Cycle</th>
                  <th className="py-3 px-4 whitespace-nowrap">Overall Score</th>
                  <th className="py-3 px-4 whitespace-nowrap">Performance Rating</th>
                  <th className="py-3 px-4 whitespace-nowrap">Hike %</th>
                  <th className="py-3 px-4 whitespace-nowrap">Revised Monthly Salary</th>
                  <th className="py-3 px-4 whitespace-nowrap">Effective Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appraisals.map((rev) => {
                  const rating = getScoreRating(rev.overallScore);
                  const hike = computeHikePercent(rev);

                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {rev.cycleName || 'Annual Review'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {Number(rev.overallScore || 0).toFixed(1)} / 5.0
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${rating.bg}`}>
                          {rating.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {hike > 0 ? `+${hike}%` : '--'}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {rev.newSalary ? `₹${Number(rev.newSalary).toLocaleString('en-IN')}` : '--'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono whitespace-nowrap">
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
