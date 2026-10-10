import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  ShieldCheck,
  Award,
  Sparkles,
  ChevronRight,
  Eye,
  EyeOff,
  Edit3,
  Loader2,
  Check,
  X,
  Building2,
  DollarSign,
  ArrowUpRight,
  Star,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import { getAllEmployees, updateEmployeeSalary, createAppraisalReview, getAllAppraisals } from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';

export const HRAppraisalManagementView = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('all'); // 'all' | '11_month' | 'annual'
  const [selectedStatus, setSelectedStatus] = useState('all'); // 'all' | 'due' | 'upcoming' | 'completed'
  const [showSalaries, setShowSalaries] = useState(true);

  // Review Modal State
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Evaluation Form
  const [ratings, setRatings] = useState({
    dedication: 4,
    punctuality: 4,
    delivery: 4,
    quality: 4,
    discipline: 5
  });
  const [incrementPercent, setIncrementPercent] = useState(15);
  const [reviewNotes, setReviewNotes] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Load Employees
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllEmployees({ limit: 100 });
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setEmployees(list.filter(e => e.status !== 'terminated'));
    } catch (err) {
      console.error('Failed to load employees for appraisal:', err);
      showToast('Failed to load employee appraisal records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Compute Appraisal Cycle & Due Date for each employee
  // Policy Rule:
  // - Salary < ₹15,000 -> 11 months cycle
  // - Salary >= ₹15,000 -> 12 months (Annual) cycle
  const enrichedEmployees = useMemo(() => {
    const today = new Date();

    return employees.map((emp) => {
      const currentSalary = Number(emp.salary || emp.SalaryStructure?.basicSalary || 25000);
      const isElevenMonthCycle = currentSalary < 15000;
      const cycleMonths = isElevenMonthCycle ? 11 : 12;

      // Joining date calculation
      const joinDate = emp.joiningDate ? new Date(emp.joiningDate) : new Date('2025-01-01');
      const diffTime = Math.abs(today - joinDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const totalMonthsTenure = Math.floor(diffDays / 30.44);

      // Next appraisal due date calculation
      const cyclesCompleted = Math.max(1, Math.floor(totalMonthsTenure / cycleMonths));
      const nextDueMonths = cyclesCompleted * cycleMonths;
      const nextDueDate = new Date(joinDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + nextDueMonths);

      const daysUntilDue = Math.ceil((nextDueDate - today) / (1000 * 60 * 60 * 24));

      let status = 'upcoming';
      if (daysUntilDue <= 0) {
        status = 'due'; // Due now or overdue
      } else if (daysUntilDue <= 30) {
        status = 'due_soon';
      }

      return {
        ...emp,
        currentSalary,
        isElevenMonthCycle,
        cycleMonths,
        cycleType: isElevenMonthCycle ? '11_month' : 'annual',
        totalMonthsTenure,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        daysUntilDue,
        appraisalStatus: status
      };
    });
  }, [employees]);

  // Filtered List
  const filteredEmployees = useMemo(() => {
    return enrichedEmployees.filter((emp) => {
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeCode || ''}`.toLowerCase();
      const matchesSearch = !searchQuery.trim() || fullName.includes(searchQuery.trim().toLowerCase());
      
      const matchesCycle = selectedCycle === 'all' || emp.cycleType === selectedCycle;

      const matchesStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'due' && (emp.appraisalStatus === 'due' || emp.appraisalStatus === 'due_soon')) ||
        (selectedStatus === 'upcoming' && emp.appraisalStatus === 'upcoming') ||
        (selectedStatus === 'completed' && emp.appraisalStatus === 'completed');

      return matchesSearch && matchesCycle && matchesStatus;
    });
  }, [enrichedEmployees, searchQuery, selectedCycle, selectedStatus]);

  // Executive KPI Metrics
  const totalEmployees = enrichedEmployees.length;
  const dueNowCount = enrichedEmployees.filter(e => e.appraisalStatus === 'due').length;
  const dueSoonCount = enrichedEmployees.filter(e => e.appraisalStatus === 'due_soon').length;
  const elevenMonthCycleCount = enrichedEmployees.filter(e => e.isElevenMonthCycle).length;
  const annualCycleCount = enrichedEmployees.filter(e => !e.isElevenMonthCycle).length;

  // Open Review Modal
  const handleOpenReview = (emp) => {
    setSelectedEmp(emp);
    setRatings({
      dedication: 4,
      punctuality: 4,
      delivery: 4,
      quality: 4,
      discipline: 5
    });
    setIncrementPercent(emp.isElevenMonthCycle ? 20 : 15);
    setReviewNotes('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setIsReviewModalOpen(true);
  };

  // Submit Appraisal
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;

    setIsSubmitting(true);
    try {
      const currentSalary = selectedEmp.currentSalary;
      const incrementAmount = Math.round((currentSalary * incrementPercent) / 100);
      const newSalary = currentSalary + incrementAmount;

      // Persist full review in backend appraisal_reviews table and apply increment
      await createAppraisalReview({
        userId: selectedEmp.id,
        cycleName: selectedEmp.isElevenMonthCycle ? '11-Month Appraisal Cycle' : 'Annual Performance Review',
        reviewPeriodStart: selectedEmp.joiningDate || new Date().toISOString().split('T')[0],
        reviewPeriodEnd: new Date().toISOString().split('T')[0],
        technicalScore: ratings.delivery,
        productivityScore: ratings.quality,
        teamworkScore: ratings.dedication,
        leadershipScore: ratings.discipline,
        newSalary: newSalary * 12,
        hikePercentage: incrementPercent,
        comments: reviewNotes,
        effectiveDate,
        applyToSalary: true
      });

      showToast(`Appraisal completed! New salary ₹${newSalary.toLocaleString('en-IN')} updated for ${selectedEmp.firstName}`);
      setIsReviewModalOpen(false);
      await fetchEmployees();
    } catch (err) {
      console.error('Appraisal submission failed:', err);
      alert(err?.response?.data?.message || 'Failed to submit appraisal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Overall Score Calculation (out of 5)
  const averageScore = useMemo(() => {
    const sum = Object.values(ratings).reduce((a, b) => a + b, 0);
    return (sum / Object.keys(ratings).length).toFixed(1);
  }, [ratings]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Appraisal & Performance Cycle Tracker
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Enforcing official policy appraisal cycles: <strong>11 Months</strong> (&lt; ₹15,000) &amp; <strong>Annual (12m)</strong> (&ge; ₹15,000)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSalaries(!showSalaries)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="Toggle salary confidentiality mask"
          >
            {showSalaries ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-[#8B1D2C]" />}
            <span>{showSalaries ? 'Mask Salaries' : 'Show Salaries'}</span>
          </button>
        </div>
      </div>

      {/* ── 4 Executive KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tracked */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tracked</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalEmployees}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Active workforce</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Due Now */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Appraisal Due Now</span>
            <div className="text-2xl font-black text-rose-600 mt-1">{dueNowCount}</div>
            <span className="text-[11px] text-rose-700 font-semibold mt-0.5 block">Cycle elapsed</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* 11-Month Grade */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">11-Month Grade</span>
            <div className="text-2xl font-black text-amber-700 mt-1">{elevenMonthCycleCount}</div>
            <span className="text-[11px] text-amber-800 font-semibold mt-0.5 block">Earning &lt; ₹15,000</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Annual Grade */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Annual Grade</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{annualCycleCount}</div>
            <span className="text-[11px] text-emerald-800 font-semibold mt-0.5 block">Earning &ge; ₹15,000</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
          />
        </div>

        {/* Cycle & Status Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Appraisal Cycles</option>
            <option value="11_month">11-Month Cycle (&lt; ₹15k)</option>
            <option value="annual">Annual Cycle (&ge; ₹15k)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Timelines</option>
            <option value="due">Due / Overdue</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
      </div>

      {/* ── Employee Appraisal Grid / Table ─────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
            <span className="text-xs text-slate-400 font-bold">Auditing employee appraisal milestones...</span>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <TrendingUp className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No Employee Appraisal Records Found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or cycle filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">Tenure &amp; Joined</th>
                  <th className="py-3.5 px-4">Monthly Salary</th>
                  <th className="py-3.5 px-4">Policy Cycle</th>
                  <th className="py-3.5 px-4">Next Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredEmployees.map((emp) => {
                  const isDue = emp.appraisalStatus === 'due';
                  const isDueSoon = emp.appraisalStatus === 'due_soon';

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Employee Info */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#8B1D2C] font-black text-xs flex items-center justify-center shrink-0 border border-slate-200">
                            {emp.avatar ? (
                              <img src={emp.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              `${emp.firstName?.[0] || 'E'}${emp.lastName?.[0] || ''}`
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {emp.employeeCode || emp.designation || 'Staff'} &bull; {emp.department || 'Operations'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Tenure */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="font-semibold block">{emp.totalMonthsTenure} Months</span>
                        <span className="text-[11px] text-slate-400">Joined: {emp.joiningDate || '2025-01-01'}</span>
                      </td>

                      {/* Salary (Masked/Unmasked) */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {showSalaries ? (
                          <span className="text-slate-900">₹{emp.currentSalary.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-slate-400">₹ &bull;&bull;,&bull;&bull;&bull;</span>
                        )}
                        <span className="text-[10px] text-slate-400 block font-normal">Confidential</span>
                      </td>

                      {/* Policy Cycle */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            emp.isElevenMonthCycle
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {emp.isElevenMonthCycle ? '11 Months Cycle (< ₹15k)' : 'Annual Cycle (≥ ₹15k)'}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-semibold text-slate-900 block">{emp.nextDueDate}</span>
                        <span className={`text-[10px] font-bold ${isDue ? 'text-rose-600' : isDueSoon ? 'text-amber-600' : 'text-slate-400'}`}>
                          {isDue ? `Overdue by ${Math.abs(emp.daysUntilDue)}d` : isDueSoon ? `Due in ${emp.daysUntilDue}d` : `In ${emp.daysUntilDue}d`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isDue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3" /> Due Now
                          </span>
                        ) : isDueSoon ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Due This Month
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                            <Check className="w-3 h-3" /> On Track
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(emp)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-[0.98] inline-flex items-center gap-1.5"
                        >
                          <Star className="w-3 h-3" />
                          <span>Appraise &amp; Revise</span>
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

      {/* ── APPRAISAL & SALARY REVISION MODAL ────────────────────────────── */}
      {isReviewModalOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsReviewModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 p-1 border border-white/20 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold">
                    Conduct Performance Appraisal &amp; Increment
                  </h2>
                  <p className="text-[11px] text-slate-300">
                    {selectedEmp.firstName} {selectedEmp.lastName} &bull; {selectedEmp.employeeCode || 'EMP'} ({selectedEmp.isElevenMonthCycle ? '11-Month Cycle' : 'Annual Cycle'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitReview} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
              
              {/* Employee Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-slate-400 block font-bold uppercase">Current Compensation</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    ₹{selectedEmp.currentSalary.toLocaleString('en-IN')} / month
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Tenure: {selectedEmp.totalMonthsTenure} Months &bull; Policy Grade: {selectedEmp.isElevenMonthCycle ? '< ₹15,000' : '≥ ₹15,000'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-bold uppercase">Evaluation Rating</span>
                  <div className="text-lg font-black text-amber-600 flex items-center justify-end gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{averageScore} / 5.0</span>
                  </div>
                </div>
              </div>

              {/* 5 Official Evaluation Criteria */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Official Performance Evaluation Parameters (Section 4 &amp; 6)
                </h3>
                
                <div className="space-y-2.5">
                  {[
                    { key: 'dedication', label: '1. Dedication & Commitment' },
                    { key: 'punctuality', label: '2. Punctuality & Shift Adherence (10:00 AM – 7:00 PM)' },
                    { key: 'delivery', label: '3. Timely Delivery & Deadlines (Trello/PMT Tools)' },
                    { key: 'quality', label: '4. Quality of Work & Code Standards' },
                    { key: 'discipline', label: '5. Office Decorum & Policy Compliance' }
                  ].map((crit) => (
                    <div key={crit.key} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                      <span className="font-semibold text-slate-800">{crit.label}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((val) => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => setRatings(prev => ({ ...prev, [crit.key]: val }))}
                            className={`w-7 h-7 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                              ratings[crit.key] >= val
                                ? 'bg-amber-400 text-amber-950 shadow-xs'
                                : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proposed Increment Slider & New Salary Calculation */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Proposed Salary Increment</span>
                  <span className="font-mono text-sm font-black text-emerald-800">{incrementPercent}% Hike</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={incrementPercent}
                  onChange={(e) => setIncrementPercent(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/80">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Increment Amount</span>
                    <span className="font-mono text-xs font-bold text-emerald-700">
                      +₹{Math.round((selectedEmp.currentSalary * incrementPercent) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Revised New Monthly CTC</span>
                    <span className="font-mono text-sm font-black text-slate-900">
                      ₹{Math.round(selectedEmp.currentSalary * (1 + incrementPercent / 100)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Effective Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-900 text-xs block mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-900 text-xs block mb-1">Confidential Review Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Promoted to Senior role, consistent performance"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Salary...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve &amp; Update Salary Structure</span>
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
