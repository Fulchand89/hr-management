import React, { useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Coffee,
  ShieldCheck,
  Laptop,
} from 'lucide-react';

export const AttendanceDetailModal = ({ isOpen, onClose, selectedDate, record }) => {
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

  const displayDate = record?.date || selectedDate || 'Selected Date';
  const displayStatus = record?.status || 'Present';
  const displayTotal = record?.duration || '--';
  const punchInTime = record?.in || '--:--';
  const punchOutTime = record?.out || '--:--';
  const breakDuration = record?.break || '0m';
  const overtime = record?.overtime || '--';

  const isPresent = displayStatus === 'Present' || displayStatus === 'Late';
  const isAbsent = displayStatus === 'Absent';
  const isHalfDay = displayStatus === 'Half Day';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Day Audit</h2>
              <p className="text-xs text-slate-500">{displayDate}</p>
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

        {/* Status & Quick Summary Banner */}
        <div
          className={`my-5 p-4 rounded-2xl border flex items-center justify-between ${
            isPresent
              ? 'bg-emerald-50 border-emerald-100'
              : isAbsent
              ? 'bg-rose-50 border-rose-100'
              : isHalfDay
              ? 'bg-amber-50 border-amber-100'
              : 'bg-indigo-50 border-indigo-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPresent
                  ? 'bg-emerald-500'
                  : isAbsent
                  ? 'bg-rose-500'
                  : isHalfDay
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
            />
            <span
              className={`text-xs font-bold ${
                isPresent
                  ? 'text-emerald-800'
                  : isAbsent
                  ? 'text-rose-800'
                  : isHalfDay
                  ? 'text-amber-800'
                  : 'text-indigo-800'
              }`}
            >
              Status: {displayStatus}
            </span>
          </div>
          <span className="text-xs font-mono font-bold bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800">
            Total: {displayTotal}
          </span>
        </div>

        {/* Timestamps Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block">First Punch In</span>
            <span className="text-base font-black font-mono text-slate-900 mt-0.5 block">{punchInTime}</span>
            <span className="text-[10px] text-slate-500">{punchInTime !== '--:--' ? 'Recorded In' : 'No Clock-In'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block">Final Punch Out</span>
            <span className="text-base font-black font-mono text-slate-900 mt-0.5 block">{punchOutTime}</span>
            <span className="text-[10px] text-slate-500">{punchOutTime !== '--:--' ? 'Recorded Out' : 'No Clock-Out'}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Break</span>
            <span className="text-base font-black font-mono text-amber-700 mt-0.5 block">{breakDuration}</span>
            <span className="text-[10px] text-slate-500">Break Recorded</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block">Overtime</span>
            <span className="text-base font-black font-mono text-emerald-700 mt-0.5 block">{overtime}</span>
            <span className="text-[10px] text-slate-500">Beyond 8h Shift</span>
          </div>
        </div>

        {/* Technical Verification Info */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs text-slate-600 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Punch Method
            </span>
            <span className="font-semibold text-slate-700">Web Portal Punch</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-blue-500" /> Session Platform
            </span>
            <span className="font-semibold text-slate-700 font-mono">Verified Employee Session</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Attendance State
            </span>
            <span className="font-semibold text-emerald-700">System Logged Record</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
        >
          Close Detail View
        </button>
      </div>
    </div>
  );
};

export default AttendanceDetailModal;
