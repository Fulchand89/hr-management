import React from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export const LeaveDetailModal = ({ isOpen, onClose, leave, onCancelLeave }) => {
  if (!isOpen || !leave) return null;

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
              <h2 className="text-base font-bold text-slate-900">Leave Request Details</h2>
              <p className="text-xs text-slate-500">Ref: #{leave.id ? String(leave.id).slice(0, 8).toUpperCase() : '--'}</p>
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

        {/* Status Card */}
        <div
          className={`my-4 p-4 rounded-2xl border flex items-center justify-between ${
            leave.status === 'Approved'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
              : leave.status === 'Rejected'
              ? 'bg-rose-50 border-rose-100 text-rose-800'
              : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {leave.status === 'Approved' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : leave.status === 'Rejected' ? (
              <XCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600" />
            )}
            <div>
              <div className="text-xs font-bold">Request Status: {leave.status}</div>
              <div className="text-[11px] opacity-80">
                {leave.status === 'Approved'
                  ? 'Sanctioned by Reporting Manager'
                  : leave.status === 'Rejected'
                  ? (leave.rejectionReason || 'Request declined by Manager')
                  : (leave.approverName ? `Awaiting review by ${leave.approverName}` : 'Awaiting review by Reporting Manager')}
              </div>
            </div>
          </div>
        </div>

        {/* Information Table */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs text-slate-600 my-4">
          <div className="flex justify-between">
            <span className="text-slate-400">Leave Category</span>
            <span className="font-bold text-slate-800">{leave.leaveType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Duration</span>
            <span className="font-bold text-slate-800">{leave.duration || `${leave.days} Days`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Date Range</span>
            <span className="font-semibold text-slate-800 font-mono">
              {leave.fromDate} &rarr; {leave.toDate}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Submitted On</span>
            <span className="font-semibold text-slate-700">{leave.appliedOn || leave.createdAt || '--'}</span>
          </div>
          <div className="pt-2 border-t border-slate-200/80">
            <span className="text-slate-400 block mb-1">Reason Provided:</span>
            <p className="font-medium text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
              "{leave.reason}"
            </p>
          </div>
        </div>

        {/* Approval Flow Timeline */}
        <div className="p-4 rounded-2xl border border-slate-100 space-y-3 mb-5">
          <span className="text-xs font-bold text-slate-800 block">Approval Workflow</span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Step 1: Submitted by {leave.employeeName || 'Applicant'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                leave.status === 'Approved' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white'
              }`}>
                2
              </span>
              <span>Step 2: Manager Review ({leave.approverName || 'Reporting Manager'}) &bull; {leave.status}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {leave.status === 'Pending' && onCancelLeave && (
            <button
              type="button"
              onClick={() => {
                onCancelLeave(leave.id);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel Leave Request
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveDetailModal;
