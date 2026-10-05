import React, { useState } from 'react';
import { X, Calendar, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export const ApplyLeaveModal = ({ isOpen, onClose, onSubmitLeave }) => {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [fromDate, setFromDate] = useState('2026-08-15');
  const [toDate, setToDate] = useState('2026-08-15');
  const [numberOfDays, setNumberOfDays] = useState('1');
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState('First Half');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for the leave request.');
      return;
    }

    const calculatedDays = isHalfDay ? '0.5' : numberOfDays;

    onSubmitLeave({
      id: `LV-${Date.now().toString().slice(-4)}`,
      leaveType,
      fromDate,
      toDate,
      days: calculatedDays,
      duration: isHalfDay ? `0.5 Day (${halfDaySession})` : `${calculatedDays} ${Number(calculatedDays) > 1 ? 'Days' : 'Day'}`,
      reason,
      appliedOn: 'Today',
      status: 'Pending',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
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

        {/* Leave Form */}
        <form onSubmit={handleSubmit} className="space-y-4 my-5">
          {/* Leave Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Leave Category <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Casual Leave', 'Sick Leave', 'Privilege Leave'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLeaveType(type)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    leaveType === type
                      ? 'bg-[#8B1D2C] text-white border-[#8B1D2C] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
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
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/30 transition-all cursor-pointer"
            >
              Submit Leave Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeaveModal;
