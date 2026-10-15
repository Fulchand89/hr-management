import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Star,
  Check,
  X,
  Loader2,
  Calendar,
  Users
} from 'lucide-react';
import {
  getAllEmployees,
  createAppraisalReview,
  getAllAppraisals
} from '../../services/hrService';
import { SkeletonTable } from '../../components/common/Skeleton';

export const HRAppraisalManagementView = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [appraisalsList, setAppraisalsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('all'); // 'all' | '11_month' | 'annual'
  const [toastMessage, setToastMessage] = useState('');

  // Review Modal State
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [overallScore, setOverallScore] = useState(4);
  const [incrementPercent, setIncrementPercent] = useState(15);
  const [reviewNotes, setReviewNotes] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes, appRes] = await Promise.all([
        getAllEmployees({ limit: 100 }),
        getAllAppraisals().catch(() => ({ data: [] }))
      ]);

      const empList = Array.isArray(empRes?.data)
        ? empRes.data
        : (Array.isArray(empRes) ? empRes : []);
      setEmployees(empList.filter((e) => e.status !== 'terminated'));

      const appData = Array.isArray(appRes?.data)
        ? appRes.data
        : (Array.isArray(appRes) ? appRes : []);
      setAppraisalsList(appData);
    } catch (err) {
      console.error('Failed to load appraisal data:', err);
      showToast('Failed to load records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute appraisal cycle & next due date for each employee
  // Policy: Salary < ₹15,000 -> 11 months, Salary >= ₹15,000 -> 12 months (Annual)
  const enrichedEmployees = useMemo(() => {
    const today = new Date();

    return employees.map((emp) => {
      const currentSalary = Number(
        emp.salary ||
        emp.salaryStructure?.netSalary ||
        emp.salaryStructure?.basicSalary ||
        0
      );

      const isElevenMonthCycle = currentSalary > 0 && currentSalary < 15000;
      const cycleMonths = isElevenMonthCycle ? 11 : 12;

      // Calculate months tenure from actual database joiningDate
      const joinDate = emp.joiningDate ? new Date(emp.joiningDate) : null;
      let totalMonthsTenure = 0;
      if (joinDate && !isNaN(joinDate.getTime())) {
        const diffTime = Math.max(0, today - joinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalMonthsTenure = Math.floor(diffDays / 30.44);
      }

      // Check if employee has an appraisal recorded in appraisalsList
      const empAppraisals = appraisalsList.filter((a) => a.userId === emp.id);
      const latestAppraisal = empAppraisals.length > 0 ? empAppraisals[0] : null;

      const isDue = totalMonthsTenure >= cycleMonths && !latestAppraisal;

      return {
        ...emp,
        currentSalary,
        isElevenMonthCycle,
        cycleType: isElevenMonthCycle ? '11_month' : 'annual',
        cycleLabel: isElevenMonthCycle ? '11 Months (< ₹15k)' : 'Annual (≥ ₹15k)',
        totalMonthsTenure,
        isDue,
        latestAppraisal
      };
    });
  }, [employees, appraisalsList]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return enrichedEmployees.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeCode || ''}`.toLowerCase();
      const matchesSearch = !q || fullName.includes(q);
      const matchesCycle = selectedCycle === 'all' || emp.cycleType === selectedCycle;
      return matchesSearch && matchesCycle;
    });
  }, [enrichedEmployees, searchQuery, selectedCycle]);

  // Open review modal
  const handleOpenReview = (emp) => {
    setSelectedEmp(emp);
    setOverallScore(4);
    setIncrementPercent(emp.isElevenMonthCycle ? 20 : 15);
    setReviewNotes('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setIsReviewModalOpen(true);
  };

  // Submit appraisal review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;

    setIsSubmitting(true);
    try {
      const currentSalary = selectedEmp.currentSalary;
      const incrementAmount = Math.round((currentSalary * incrementPercent) / 100);
      const newSalary = currentSalary + incrementAmount;

      await createAppraisalReview({
        userId: selectedEmp.id,
        cycleName: selectedEmp.isElevenMonthCycle ? '11-Month Appraisal Cycle' : 'Annual Performance Review',
        reviewPeriodStart: selectedEmp.joiningDate || new Date().toISOString().split('T')[0],
        reviewPeriodEnd: new Date().toISOString().split('T')[0],
        technicalScore: overallScore,
        productivityScore: overallScore,
        teamworkScore: overallScore,
        leadershipScore: overallScore,
        previousSalary: currentSalary,
        newSalary: newSalary, // Monthly salary
        hikePercentage: incrementPercent,
        comments: reviewNotes.trim() || 'Performance appraisal successfully approved.',
        effectiveDate,
        applyToSalary: true
      });

      showToast(`Appraisal completed for ${selectedEmp.firstName}! Salary revised to ₹${newSalary.toLocaleString('en-IN')}`);
      setIsReviewModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to submit appraisal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalEmployees = enrichedEmployees.length;
  const dueCount = enrichedEmployees.filter((e) => e.isDue).length;
  const reviewedCount = enrichedEmployees.filter((e) => Boolean(e.latestAppraisal)).length;

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
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Performance &amp; Appraisals</h1>
            <p className="text-xs text-slate-500">Conduct employee performance reviews and assign salary increments</p>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{totalEmployees} Staff</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{dueCount} Due for Review</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{reviewedCount} Appraised</span>
          </div>
        </div>
      </div>

      {/* Search & Cycle Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Appraisal Cycles</option>
            <option value="11_month">11-Month Fast-Track (&lt; ₹15,000)</option>
            <option value="annual">Annual Cycle (≥ ₹15,000)</option>
          </select>
        </div>
      </div>

      {/* Employees Appraisal Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <SkeletonTable rows={5} cols={6} hasHeader={false} />
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-1">
            <p className="text-xs font-semibold">No employees found matching the filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5 whitespace-nowrap">Employee</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Tenure</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Current Salary</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Policy Cycle</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Appraisal Status</th>
                  <th className="py-3.5 px-5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const hasAppraisal = Boolean(emp.latestAppraisal);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Employee */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] font-bold flex items-center justify-center shrink-0">
                            {emp.firstName?.[0] || 'E'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {emp.firstName} {emp.lastName || ''}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {emp.employeeCode || '--'} &bull; {emp.department || 'Operations'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tenure */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {emp.totalMonthsTenure} Months
                      </td>

                      {/* Current Salary */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{emp.currentSalary.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">/ mo</span>
                      </td>

                      {/* Policy Cycle */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                            emp.isElevenMonthCycle
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {emp.cycleLabel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {hasAppraisal ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            <Check className="w-3 h-3" /> Appraised (+{emp.latestAppraisal.hikePercentage || 0}%)
                          </span>
                        ) : emp.isDue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                            <Clock className="w-3 h-3" /> Due for Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 whitespace-nowrap">
                            On Track
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(emp)}
                          className="px-3 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <Star className="w-3 h-3 fill-white" />
                          <span>{hasAppraisal ? 'Re-Appraise' : 'Conduct Review'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── APPRAISAL REVIEW MODAL ─────────────────────────────── */}
      {isReviewModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Conduct Performance Appraisal</h3>
                <p className="text-xs text-slate-500">
                  {selectedEmp.firstName} {selectedEmp.lastName} ({selectedEmp.employeeCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              {/* Current Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Salary</span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    ₹{selectedEmp.currentSalary.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Appraisal Policy</span>
                  <span className="text-xs font-bold text-slate-700">
                    {selectedEmp.cycleLabel}
                  </span>
                </div>
              </div>

              {/* Rating (1 to 5 Stars) */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Performance Rating (1 to 5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallScore(star)}
                      className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                        overallScore >= star
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${overallScore >= star ? 'fill-amber-400 text-amber-400' : ''}`} />
                      <span>{star}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Proposed Salary Increment (%) */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Proposed Hike Percentage</span>
                  <span className="font-bold font-mono text-sm text-emerald-800">+{incrementPercent}%</span>
                </div>

                {/* Quick percentage buttons */}
                <div className="flex gap-2">
                  {[10, 15, 20, 25, 30].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setIncrementPercent(pct)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        incrementPercent === pct
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                {/* Live calculation */}
                <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">New Revised Salary:</span>
                  <span className="font-bold font-mono text-emerald-900 text-sm">
                    ₹{Math.round(selectedEmp.currentSalary * (1 + incrementPercent / 100)).toLocaleString('en-IN')} / yr
                  </span>
                </div>
              </div>

              {/* Effective Date & Notes */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Effective Date</label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Feedback &amp; Remarks for Employee</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Excellent technical performance, promoted to Senior Lead role."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve &amp; Update Salary</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAppraisalManagementView;
