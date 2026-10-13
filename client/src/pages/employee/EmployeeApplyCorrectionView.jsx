import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  Coffee,
  Loader2,
  Send,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

import {
  createAttendanceCorrection,
  getTodayAttendance,
  getMyAttendanceHistory
} from '../../services/employeeService';

// Format timestamp or date to 12-hour AM/PM string
const formatTime12h = (dateInput) => {
  if (!dateInput) return '--:--';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const STANDARD_BREAK_SLOTS = [
  'Lunch Break (01:00 PM - 02:00 PM)',
  'Morning Tea Break (11:30 AM - 11:45 AM)',
  'Evening Tea Break (04:30 PM - 04:45 PM)',
  'Custom / Other Break'
];

export const EmployeeApplyCorrectionView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const queryDate = searchParams.get('date');
  const queryType = searchParams.get('type');

  // Form States
  const [date, setDate] = useState(queryDate || location.state?.date || todayStr);
  const [punchType, setPunchType] = useState(
    queryType === 'check_out'
      ? 'Check Out Time'
      : queryType === 'break'
      ? 'Break Time'
      : 'Check In Time'
  );
  const [breakSlot, setBreakSlot] = useState(STANDARD_BREAK_SLOTS[0]);
  const [originalTime, setOriginalTime] = useState('');
  const [requestedTime, setRequestedTime] = useState('10:00 AM');
  const [reason, setReason] = useState('');

  // Lookup state
  const [dayRecord, setDayRecord] = useState(null);
  const [isFetchingLog, setIsFetchingLog] = useState(false);

  // Submission feedback
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Parse recorded breaks from timeline
  const detectedBreaks = useMemo(() => {
    const timeline = dayRecord?.timeline || [];
    if (!Array.isArray(timeline) || timeline.length === 0) return [];

    const breaksList = [];
    let activeBreak = null;

    timeline.forEach((item, idx) => {
      const label = (item.label || '').toLowerCase();
      if (label.includes('break start') || item.status === 'break') {
        activeBreak = {
          id: `break-${idx}`,
          label: `Break ${breaksList.length + 1}`,
          start: item.time || formatTime12h(item.timestamp),
          reason: item.reason || 'Break',
          end: null
        };
      } else if (label.includes('break end') && activeBreak) {
        activeBreak.end = item.time || formatTime12h(item.timestamp);
        breaksList.push(activeBreak);
        activeBreak = null;
      }
    });

    if (activeBreak) {
      activeBreak.end = 'In Progress';
      breaksList.push(activeBreak);
    }

    return breaksList;
  }, [dayRecord]);

  // Fetch verified attendance record for the selected date
  const fetchAttendanceForDate = useCallback(
    async (targetDate) => {
      if (!targetDate) return;
      setIsFetchingLog(true);
      setError('');
      try {
        if (targetDate === todayStr) {
          const res = await getTodayAttendance();
          const data = res?.data || res;
          if (data && (data.clockIn || data.clockInFormatted || data.status)) {
            setDayRecord({
              id: data.id || data.attendanceId,
              date: targetDate,
              clockInFormatted: data.clockInFormatted || (data.clockIn ? formatTime12h(data.clockIn) : null),
              clockOutFormatted: data.clockOutFormatted || (data.clockOut ? formatTime12h(data.clockOut) : null),
              timeline: data.timeline || [],
              status: data.status,
              totalBreakMinutes: data.breakSeconds ? Math.round(data.breakSeconds / 60) : 0
            });
            return;
          }
        }

        const historyRes = await getMyAttendanceHistory(null, null, {
          startDate: targetDate,
          endDate: targetDate
        });

        const records = historyRes?.data?.records || historyRes?.records || [];
        const match = records.find((r) => r.date === targetDate) || records[0] || null;

        if (match) {
          setDayRecord({
            id: match.id,
            date: targetDate,
            clockInFormatted: match.clockInFormatted || (match.clockIn ? formatTime12h(match.clockIn) : null),
            clockOutFormatted: match.clockOutFormatted || (match.clockOut ? formatTime12h(match.clockOut) : null),
            timeline: match.timeline || [],
            status: match.status,
            totalBreakMinutes: match.totalBreakMinutes || 0
          });
        } else {
          setDayRecord(null);
        }
      } catch {
        setDayRecord(null);
      } finally {
        setIsFetchingLog(false);
      }
    },
    [todayStr]
  );

  useEffect(() => {
    fetchAttendanceForDate(date);
  }, [date, fetchAttendanceForDate]);

  // Auto-fill originalTime & set sensible requestedTime default
  useEffect(() => {
    if (punchType === 'Check In Time') {
      const recorded = dayRecord?.clockInFormatted || (dayRecord?.in && dayRecord.in !== '--:--' ? dayRecord.in : null);
      setOriginalTime(recorded && recorded !== '--:--' ? recorded : 'Not Logged');
      setRequestedTime((prev) => (prev && prev !== '07:00 PM' && prev !== '01:00 PM - 02:00 PM' ? prev : '10:00 AM'));
    } else if (punchType === 'Check Out Time') {
      const recorded = dayRecord?.clockOutFormatted || (dayRecord?.out && dayRecord.out !== '--:--' ? dayRecord.out : null);
      setOriginalTime(recorded && recorded !== '--:--' ? recorded : 'Not Logged');
      setRequestedTime((prev) => (prev && prev !== '10:00 AM' && prev !== '01:00 PM - 02:00 PM' ? prev : '07:00 PM'));
    } else if (punchType === 'Break Time') {
      const matchedBreak = detectedBreaks.find(
        (b) => breakSlot.includes(b.start) || breakSlot.includes(b.label)
      );

      if (matchedBreak) {
        setOriginalTime(`${matchedBreak.start} - ${matchedBreak.end || 'In Progress'}`);
      } else if (dayRecord?.totalBreakMinutes && dayRecord.totalBreakMinutes > 0) {
        setOriginalTime(`${dayRecord.totalBreakMinutes} mins logged`);
      } else {
        setOriginalTime('Not Logged');
      }

      setRequestedTime((prev) => (prev && prev !== '10:00 AM' && prev !== '07:00 PM' ? prev : '01:00 PM - 02:00 PM'));
    }
  }, [punchType, breakSlot, dayRecord, detectedBreaks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!date) {
      setError('Please select an attendance date.');
      return;
    }

    if (!requestedTime || !requestedTime.trim()) {
      setError('Please enter the requested time.');
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason || trimmedReason.length < 5) {
      setError('Please provide a reason of at least 5 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const finalReason =
        punchType === 'Break Time' && breakSlot
          ? `[Break Slot: ${breakSlot}] ${trimmedReason}`
          : trimmedReason;

      const payload = {
        attendanceId: dayRecord?.id || undefined,
        date,
        punchType,
        originalTime: originalTime.trim() || 'Not Logged',
        requestedTime: requestedTime.trim(),
        reason: finalReason
      };

      await createAttendanceCorrection(payload);
      setSuccessMessage('Correction request submitted successfully to HR!');

      setTimeout(() => {
        navigate('/employee/attendance-correction');
      }, 1000);
    } catch (err) {
      console.error('Failed to submit attendance correction:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Failed to submit correction request. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5">
      {/* Top Simple Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Request Attendance Correction</h1>
          <p className="text-xs text-slate-500 mt-0.5">Submit timing adjustment for HR approval</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/employee/attendance-correction')}
          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Attendance Date */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Attendance Date <span className="text-rose-500">*</span>
              </label>
              {isFetchingLog && (
                <span className="text-[11px] text-amber-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching log...
                </span>
              )}
            </div>

            <input
              type="date"
              required
              max={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-[#8B1D2C] focus:ring-1 focus:ring-[#8B1D2C] transition-all bg-white"
            />

            {/* Quick status indicator for selected date */}
            {dayRecord && (
              <div className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-2">
                <span className="font-semibold text-slate-700">System Log:</span>
                <span className="capitalize text-slate-700 font-medium">
                  {dayRecord.status || 'Recorded'}
                </span>
                <span>&bull;</span>
                <span>In: {dayRecord.clockInFormatted || '--:--'}</span>
                <span>&bull;</span>
                <span>Out: {dayRecord.clockOutFormatted || '--:--'}</span>
              </div>
            )}
          </div>

          {/* Correction Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Correction Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Check In Time', label: 'Check In Time' },
                { id: 'Check Out Time', label: 'Check Out Time' },
                { id: 'Break Time', label: 'Break Time' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPunchType(cat.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer border ${
                    punchType === cat.id
                      ? 'bg-[#8B1D2C] text-white border-[#8B1D2C] shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Break Slot Selection - Only visible for Break Time */}
          {punchType === 'Break Time' && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-[#8B1D2C]" />
                Select Break Slot to Correct <span className="text-rose-500">*</span>
              </label>

              <select
                value={breakSlot}
                onChange={(e) => setBreakSlot(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs font-medium text-slate-800 bg-white focus:outline-hidden focus:border-[#8B1D2C] cursor-pointer"
              >
                {detectedBreaks.length > 0 && (
                  <optgroup label="Logged Breaks on This Date">
                    {detectedBreaks.map((b) => (
                      <option
                        key={b.id}
                        value={`${b.label}: ${b.start} - ${b.end || 'In Progress'} (${b.reason})`}
                      >
                        {b.label}: {b.start} - {b.end || 'In Progress'} ({b.reason})
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="Standard Break Slots">
                  {STANDARD_BREAK_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}

          {/* Timing Grid: Recorded Time (Locked) vs Requested Correct Time (Editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Recorded in System - Locked & Auto-filled */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Recorded in System
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" /> Auto-filled
                </span>
              </div>
              <input
                type="text"
                readOnly
                disabled
                value={originalTime || 'Not Logged'}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-mono font-bold cursor-not-allowed select-none"
                title="Auto-filled from system attendance logs"
              />
            </div>

            {/* Requested Correct Time - Editable */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-900">
                  Requested Correct Time <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-[#8B1D2C] font-semibold">Editable</span>
              </div>
              <input
                type="text"
                required
                placeholder={
                  punchType === 'Check In Time'
                    ? '10:00 AM'
                    : punchType === 'Check Out Time'
                    ? '07:00 PM'
                    : '01:00 PM - 02:00 PM'
                }
                value={requestedTime}
                onChange={(e) => setRequestedTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#8B1D2C] focus:ring-1 focus:ring-[#8B1D2C] transition-all bg-white"
              />
            </div>
          </div>

          {/* Reason for Correction */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Reason for Correction <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              maxLength={1000}
              placeholder="Explain why punch was late, missed, or incorrect..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8B1D2C] focus:ring-1 focus:ring-[#8B1D2C] transition-all resize-none bg-white"
            />
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>Minimum 5 characters</span>
              <span>{reason.length}/1000</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => navigate('/employee/attendance-correction')}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || isFetchingLog}
              className="px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isLoading ? 'Submitting...' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeApplyCorrectionView;
