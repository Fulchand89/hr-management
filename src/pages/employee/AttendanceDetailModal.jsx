import React from 'react';
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

export const AttendanceDetailModal = ({ isOpen, onClose, selectedDate = '12 Aug 2026' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Day Audit</h2>
              <p className="text-xs text-slate-500">{selectedDate} &bull; Regular Shift (9am - 6pm)</p>
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
        <div className="my-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-800">Status: Present (On-Time)</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-900 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200">
            Total: 08h 02m
          </span>
        </div>

        {/* Timestamps Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block">First Punch In</span>
            <span className="text-base font-black font-mono text-slate-900 mt-0.5 block">09:12 AM</span>
            <span className="text-[10px] text-emerald-600 font-medium">Within Grace Period</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block">Final Punch Out</span>
            <span className="text-base font-black font-mono text-slate-900 mt-0.5 block">05:47 PM</span>
            <span className="text-[10px] text-slate-500">Regular Departure</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block">Break Started</span>
            <span className="text-base font-black font-mono text-amber-700 mt-0.5 block">01:15 PM</span>
            <span className="text-[10px] text-slate-500">Lunch Break</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 block">Break Ended</span>
            <span className="text-base font-black font-mono text-amber-700 mt-0.5 block">01:50 PM</span>
            <span className="text-[10px] text-slate-500">35 mins duration</span>
          </div>
        </div>

        {/* Technical Verification Info */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs text-slate-600 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Punch Location
            </span>
            <span className="font-semibold text-slate-700">HQ Building 4, Floor 3 (Office)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-blue-500" /> Device & IP
            </span>
            <span className="font-semibold text-slate-700 font-mono">192.168.1.104 &bull; Chrome / macOS</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> HR Verification
            </span>
            <span className="font-semibold text-emerald-700">Auto-Verified by Biometric Gateway</span>
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
