import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { getLeaveTypes, applyLeave } from '../../services/hrService';

export const HRApplyLeaveModal = ({ isOpen, onClose, onSubmitLeave }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState('First Half');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fetch available leave categories
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    const fetchTypes = async () => {
      try {
        const res = await getLeaveTypes();
        const types = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setLeaveTypes(types);
        if (types.length > 0) {
          setSelectedTypeId(types[0].id);
        }
      } catch {
        setLeaveTypes([]);
        setSelectedTypeId('');
        setError('Failed to load leave categories from server. Please try again.');
      }
    };
    fetchTypes();
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate days
  const calculateDays = () => {
    if (isHalfDay) return 0.5;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = end - start;
    if (diffTime < 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const calculatedDays = calculateDays();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedTypeId) {
      setError('Please select a leave category.');
      return;
    }

    if (!fromDate) {
      setError('Please select a valid start date.');
      return;
    }

    if (!isHalfDay && !toDate) {
      setError('Please select a valid end date.');
      return;
    }

    if (new Date(fromDate) > new Date(toDate) && !isHalfDay) {
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

    setIsLoading(true);
    try {
      const payload = {
        leaveTypeId: selectedTypeId,
        startDate: fromDate,
        endDate: isHalfDay ? fromDate : toDate,
        totalDays: calculatedDays,
        reason: isHalfDay ? `${trimmedReason} (${halfDaySession})` : trimmedReason
      };

      const res = await applyLeave(payload);
      if (onSubmitLeave) onSubmitLeave(res.data);
      onClose();
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        setError(apiErrors.map((e) => e.message).join(' | '));
      } else {
        const msg = err?.response?.data?.message || err.message || 'Failed to submit leave application';
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Apply for Leave</h2>
              <p className="text-xs text-slate-500">Submit a leave request for managerial approval</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Leave Form */}
        <form onSubmit={handleSubmit} className="space-y-4 my-5">
          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            {leaveTypes.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                No leave categories found. Please reload or contact your HR administrator.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {leaveTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setSelectedTypeId(type.id);
                      setError('');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      selectedTypeId === type.id
                        ? 'bg-[#8B1D2C] text-white border-[#8B1D2C] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Half Day Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-800">Half Day Request</span>
              <p className="text-[11px] text-slate-500">Apply for morning or afternoon session only</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isHalfDay}
                onChange={(e) => setIsHalfDay(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8B1D2C]" />
            </label>
          </div>

          {isHalfDay && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-150">
              {['First Half (09:00 - 01:30)', 'Second Half (01:30 - 06:00)'].map((session) => (
                <button
                  key={session}
                  type="button"
                  onClick={() => setHalfDaySession(session)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-center cursor-pointer ${
                    halfDaySession === session
                      ? 'bg-rose-50 text-[#8B1D2C] border-[#8B1D2C] font-bold'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {session}
                </button>
              ))}
            </div>
          )}

          {/* Date Pickers Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                From Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                To Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                disabled={isHalfDay}
                value={isHalfDay ? fromDate : toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
              />
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-600">
              Total Duration:{' '}
              <span className="font-mono text-[#8B1D2C]">
                {calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}
              </span>
            </span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason for Absence <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide details about your leave request..."
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || leaveTypes.length === 0 || !selectedTypeId}
              className="px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/30 transition-all cursor-pointer flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                'Submit Leave Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRApplyLeaveModal;
