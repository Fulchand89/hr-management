import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Info,
  ShieldCheck,
  Send,
  Pencil,
  Settings2
} from 'lucide-react';
import { getLeaveTypes, getLeaveBalance, applyLeave } from '../../services/hrService';
import HRManageLeaveTypesModal from './HRManageLeaveTypesModal';

export const HRApplyLeaveView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEmployeePortal = location.pathname.startsWith('/employee');
  const leavesHomeRoute = isEmployeePortal ? '/employee/leaves' : '/hr/leaves';

  const todayStr = new Date().toISOString().split('T')[0];

  // States
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState('First Half');
  const [reason, setReason] = useState('');

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State for HR Quota Management
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [editTargetTypeId, setEditTargetTypeId] = useState(null);

  // Fetch initial types and balances
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    setError('');
    try {
      const [typesRes, balancesRes] = await Promise.allSettled([
        getLeaveTypes(),
        getLeaveBalance()
      ]);

      if (typesRes.status === 'fulfilled') {
        const rawTypes = Array.isArray(typesRes.value?.data)
          ? typesRes.value.data
          : (Array.isArray(typesRes.value) ? typesRes.value : []);
        
        const seen = new Set();
        const uniqueTypes = rawTypes.filter((t) => {
          const key = t.id || t.code || t.name;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setLeaveTypes(uniqueTypes);
        if (uniqueTypes.length > 0) {
          setSelectedTypeId((prev) => prev || uniqueTypes[0].id);
        }
      }

      if (balancesRes.status === 'fulfilled') {
        const bData = balancesRes.value?.data ?? balancesRes.value ?? {};
        const rawBalances = Array.isArray(bData?.balances)
          ? bData.balances
          : (Array.isArray(bData) ? bData : []);
        
        const seen = new Set();
        const uniqueBalances = rawBalances.filter((b) => {
          const key = b.leaveTypeId || b.leaveType?.code || b.leaveType?.name || b.id;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setBalances(uniqueBalances);
        if (uniqueBalances.length > 0) {
          const firstId = uniqueBalances[0].leaveTypeId || uniqueBalances[0].id;
          setSelectedTypeId((prev) => prev || firstId);
        }
      }
    } catch {
      setError('Failed to load leave configuration. Please try again.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate requested duration
  const calculatedDays = useMemo(() => {
    if (isHalfDay) return 0.5;
    if (!fromDate || !toDate) return 0;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [fromDate, toDate, isHalfDay]);

  // Find remaining balance for the currently selected type
  const selectedBalance = useMemo(() => {
    if (!selectedTypeId) return null;
    return balances.find((b) => String(b.leaveTypeId || b.id) === String(selectedTypeId));
  }, [balances, selectedTypeId]);

  // Find selected leave type details
  const selectedType = useMemo(() => {
    if (!selectedTypeId) return null;
    return (
      leaveTypes.find((t) => String(t.id) === String(selectedTypeId)) ||
      balances.find((b) => String(b.leaveTypeId || b.id) === String(selectedTypeId))?.leaveType ||
      null
    );
  }, [leaveTypes, selectedTypeId, balances]);

  const remainingDays = selectedBalance ? Number(selectedBalance.remaining) || 0 : null;

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!selectedTypeId) {
      setError('Please select a leave category.');
      return;
    }

    if (!fromDate) {
      setError('Please specify a valid start date.');
      return;
    }

    if (!isHalfDay && !toDate) {
      setError('Please specify a valid end date.');
      return;
    }

    if (!isHalfDay && new Date(fromDate) > new Date(toDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      setError('Please provide a reason of at least 3 characters.');
      return;
    }

    if (calculatedDays < 0.5) {
      setError('Leave duration must be at least 0.5 days.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        leaveTypeId: selectedTypeId,
        startDate: fromDate,
        endDate: isHalfDay ? fromDate : toDate,
        totalDays: calculatedDays,
        reason: isHalfDay ? `${trimmedReason} (${halfDaySession})` : trimmedReason
      };

      const res = await applyLeave(payload);
      const newLeave = res?.data ?? res ?? {};

      setSuccessMsg('Leave application submitted successfully! Redirecting...');
      setTimeout(() => {
        if (newLeave?.id) {
          navigate(`${leavesHomeRoute}/${newLeave.id}`, { replace: true });
        } else {
          navigate(leavesHomeRoute, { replace: true });
        }
      }, 1200);
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        setError(apiErrors.map((e) => e.message).join(' | '));
      } else {
        const msg = err?.response?.data?.message || err.message || 'Failed to submit leave application';
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Back Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(leavesHomeRoute)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to My Leaves</span>
        </button>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#8B1D2C]/10 text-[#8B1D2C] border border-[#8B1D2C]/20">
          Personal Leave Application
        </span>
      </div>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Apply for Leave</h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit your leave application for supervisor approval. Your leave quotas will be automatically checked.
        </p>
      </div>

      {/* Available Balance Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Your Available Quota Balances
            </span>
            <span className="text-[11px] text-slate-400">&bull; Click a card to select</span>
          </div>
          {!isEmployeePortal && (
            <button
              type="button"
              onClick={() => {
                setEditTargetTypeId(null);
                setIsManageModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#8B1D2C]/10 text-slate-700 hover:text-[#8B1D2C] text-xs font-bold transition-all border border-slate-200 hover:border-[#8B1D2C]/30 cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <Pencil className="w-3.5 h-3.5 text-[#8B1D2C]" />
              <span>Edit Leave Names & Quotas</span>
            </button>
          )}
        </div>

        {isLoadingData ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : balances.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {balances.map((b) => {
              const typeId = b.leaveTypeId || b.id;
              const isSelected = String(typeId) === String(selectedTypeId);
              const remaining = Number(b.remaining) || 0;
              const total = Number(b.allocated) || 12;

              return (
                <button
                  key={typeId}
                  type="button"
                  onClick={() => {
                    setSelectedTypeId(typeId);
                    setError('');
                  }}
                  className={`group relative text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#8B1D2C] bg-[#8B1D2C]/5 ring-2 ring-[#8B1D2C]/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-700 truncate">
                      {b.leaveType?.name || 'Leave'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        isSelected ? 'bg-[#8B1D2C] text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {b.leaveType?.code || 'LV'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900">{remaining}</span>
                    <span className="text-[11px] text-slate-400 font-medium">/ {total} left</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            Standard leave policies apply for your employment profile.
          </div>
        )}
      </div>

      {/* Main Application Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Leave Request Details
          </h3>

          {/* Leave Category (Autofilled from Quota Balance selection above) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Leave Category <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                Autofilled from selection above
              </span>
            </div>
            <input
              type="text"
              readOnly
              value={
                selectedType
                  ? `${selectedType.name} (${selectedType.code}) ${selectedType.isPaid ? '• Paid' : '• Unpaid'}`
                  : 'Click a leave quota card above to select'
              }
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 cursor-default select-none focus:outline-none"
            />
          </div>

          {/* Half Day Checkbox */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="halfDayCheck"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="w-4 h-4 text-[#8B1D2C] rounded border-slate-300 focus:ring-[#8B1D2C] cursor-pointer"
              />
              <label htmlFor="halfDayCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                Apply for Half-Day Only (0.5 Day)
              </label>
            </div>

            {isHalfDay && (
              <div className="flex items-center gap-2 pl-7 sm:pl-0">
                <span className="text-xs text-slate-500 font-medium">Session:</span>
                <div className="flex items-center gap-2">
                  {['First Half', 'Second Half'].map((session) => (
                    <button
                      key={session}
                      type="button"
                      onClick={() => setHalfDaySession(session)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        halfDaySession === session
                          ? 'bg-[#8B1D2C] text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {session}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {isHalfDay ? 'Leave Date' : 'From Date'} <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    if (isHalfDay || new Date(e.target.value) > new Date(toDate)) {
                      setToDate(e.target.value);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>
            </div>

            {!isHalfDay && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  To Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Duration Summary Pill */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-amber-900">
                Calculated Duration:
              </span>
            </div>
            <div className="text-xs font-black text-amber-950 font-mono">
              {calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}
              {isHalfDay && ` (${halfDaySession})`}
            </div>
          </div>

          {/* Quota Exceeded Warning */}
          {remainingDays !== null && calculatedDays > remainingDays && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Quota Notice:</strong> You are requesting {calculatedDays} days, but only {remainingDays} days remain in your balance. Unpaid leave or special authorization may be applied upon approval.
              </span>
            </div>
          )}

          {/* Reason Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Leave <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a clear and concise reason for your leave application..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] resize-none"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
              <span>Minimum 3 characters required</span>
              <span>{reason.trim().length} characters</span>
            </div>
          </div>
        </div>

        {/* Submit and Cancel Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(leavesHomeRoute)}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || calculatedDays <= 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Application...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Leave Application</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Leave Quota & Category Management Modal */}
      <HRManageLeaveTypesModal
        isOpen={isManageModalOpen}
        onClose={() => {
          setIsManageModalOpen(false);
          setEditTargetTypeId(null);
        }}
        onUpdated={fetchData}
        initialEditTypeId={editTargetTypeId}
      />
    </div>
  );
};

export default HRApplyLeaveView;
