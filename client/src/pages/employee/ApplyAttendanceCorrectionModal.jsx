import React, { useState, useEffect } from 'react';
import { X, Clock, AlertCircle, CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { createAttendanceCorrection } from '../../services/employeeService';

export const ApplyAttendanceCorrectionModal = ({
  isOpen,
  onClose,
  initialRecord = null,
  onSuccess
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(todayStr);
  const [punchType, setPunchType] = useState('Check In Time');
  const [originalTime, setOriginalTime] = useState('');
  const [requestedTime, setRequestedTime] = useState('10:00 AM');
  const [reason, setReason] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pre-fill fields when modal opens or initialRecord changes
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setSuccessMessage('');

    if (initialRecord) {
      if (initialRecord.date) {
        // If date is formatted or ISO
        const rawDate = String(initialRecord.date);
        if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          setDate(rawDate);
        } else {
          const parsed = new Date(initialRecord.date);
          if (!isNaN(parsed.getTime())) {
            setDate(parsed.toISOString().split('T')[0]);
          } else {
            setDate(todayStr);
          }
        }
      } else {
        setDate(todayStr);
      }

      setOriginalTime(initialRecord.in && initialRecord.in !== '--:--' ? initialRecord.in : '');
      setRequestedTime('10:00 AM');
      setPunchType('Check In Time');
      setReason('');
    } else {
      setDate(todayStr);
      setOriginalTime('');
      setRequestedTime('10:00 AM');
      setPunchType('Check In Time');
      setReason('');
    }
  }, [isOpen, initialRecord, todayStr]);

  // Lock body scroll and handle Escape key
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!date) {
      setError('Please select a valid attendance date.');
      return;
    }

    if (!requestedTime || !requestedTime.trim()) {
      setError('Please enter the requested corrected time (e.g., 10:00 AM).');
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason || trimmedReason.length < 5) {
      setError('Please provide a specific reason of at least 5 characters for this correction.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        attendanceId: initialRecord?.id || undefined,
        date,
        punchType,
        originalTime: originalTime.trim() || 'Not Logged',
        requestedTime: requestedTime.trim(),
        reason: trimmedReason
      };

      await createAttendanceCorrection(payload);
      setSuccessMessage('Attendance correction request submitted successfully to HR!');

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit attendance correction:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Failed to submit correction request. Please verify inputs and try again.';
      setError(msg);
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

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Request Attendance Correction</h2>
              <p className="text-xs text-slate-500">Submit punch timing adjustment for HR approval</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Policy Tip */}
        <div className="my-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
          <Clock className="w-3.5 h-3.5 text-[#8B1D2C] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-800">Shift Notice: </span>
            Standard shift starts at 10:00 AM (15-min grace up to 10:15 AM). Use this form if biometric/web punch was delayed or missed due to on-duty work or technical glitch.
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Attendance Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Attendance Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                max={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-[#8B1D2C] focus:ring-1 focus:ring-[#8B1D2C] transition-all bg-white"
              />
            </div>
          </div>

          {/* Punch Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Correction Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={punchType}
              onChange={(e) => setPunchType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#8B1D2C] focus:ring-1 focus:ring-[#8B1D2C] transition-all bg-white cursor-pointer"
            >
              <option value="Check In Time">Check In Time (Morning Punch)</option>
              <option value="Check Out Time">Check Out Time (Evening Punch)</option>
              <option value="Break Time">Break Time (Lunch / Tea Adjustment)</option>
            </select>
          </div>

          {/* Timing Grid: Recorded vs Requested */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Recorded Time in System
              </label>
              <input
                type="text"
                placeholder="e.g. 10:45 AM or Not Logged"
                value={originalTime}
                onChange={(e) => setOriginalTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8B1D2C] focus:ring-1 focus:ring-[#8B1D2C] transition-all bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Leave blank if missed punch</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Requested Correct Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 10:00 AM"
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8B1D2C] focus:ring-1 focus:ring-[#8B1D2C] transition-all bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Actual time you arrived/left</span>
            </div>
          </div>

          {/* Reason / Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Correction <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              maxLength={1000}
              placeholder="Explain why the punch was late or missed (e.g., Client meeting at Noida branch, network outage, biometric failure)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8B1D2C] focus:ring-1 focus:ring-[#8B1D2C] transition-all resize-none bg-white"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>Minimum 5 characters</span>
              <span>{reason.length}/1000 characters</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? 'Submitting...' : 'Submit Request to HR'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyAttendanceCorrectionModal;
