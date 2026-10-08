import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Calendar,
  FileText,
  UserCheck
} from 'lucide-react';
import { changeEmployeeStatus } from '../../services/hrService';

export const HRChangeEmployeeStatusModal = ({
  isOpen,
  onClose,
  onSuccess,
  employee = null
}) => {
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Set default state when employee changes
  useEffect(() => {
    if (!isOpen || !employee) return;
    setSelectedStatus(employee.status || 'active');
    setReason('');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setErrorMessage('');
  }, [isOpen, employee]);

  if (!isOpen || !employee) return null;

  const isCriticalStatus = ['suspended', 'terminated', 'resigned'].includes(
    selectedStatus
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isCriticalStatus && (!reason.trim() || reason.trim().length < 5)) {
      setErrorMessage(
        'A descriptive reason (at least 5 characters) is required when setting status to Suspended, Terminated, or Resigned.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        status: selectedStatus,
        reason: reason.trim() || undefined,
        effectiveDate: effectiveDate || undefined
      };

      const res = await changeEmployeeStatus(employee.id, payload);
      onSuccess(
        res?.data || res,
        `Employee status updated to ${selectedStatus.toUpperCase()} successfully!`
      );
      onClose();
    } catch (err) {
      console.error('Status change error:', err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to change employee status.';
      setErrorMessage(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'probation':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'notice_period':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'suspended':
        return 'bg-rose-50 text-[#8B1D2C] border-rose-200';
      case 'terminated':
        return 'bg-slate-800 text-white border-slate-700';
      case 'resigned':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95 duration-200 font-sans text-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#8B1D2C]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Change Employment Status
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Manage lifecycle state for {employee.firstName} {employee.lastName} ({employee.employeeCode || 'N/A'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-[#8B1D2C] text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current vs Target Preview */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block mb-1 font-medium">Current Status:</span>
              <span
                className={`inline-block px-2.5 py-1 rounded-full font-bold border capitalize ${getStatusBadgeColor(
                  employee.status
                )}`}
              >
                {employee.status || 'Active'}
              </span>
            </div>
            <div className="text-slate-400 font-bold">➔</div>
            <div>
              <span className="text-slate-500 block mb-1 font-medium">Target Status:</span>
              <span
                className={`inline-block px-2.5 py-1 rounded-full font-bold border capitalize ${getStatusBadgeColor(
                  selectedStatus
                )}`}
              >
                {selectedStatus}
              </span>
            </div>
          </div>

          {/* Critical Status Warning */}
          {isCriticalStatus && (
            <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-[#8B1D2C] text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#8B1D2C]" />
              <div>
                <p className="font-bold">Sensitive Action Warning</p>
                Setting status to{' '}
                <strong className="capitalize">{selectedStatus}</strong> will limit
                or revoke this employee's portal access and record an official audit trail.
              </div>
            </div>
          )}

          {/* Select Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select New Status <span className="text-[#8B1D2C]">*</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors capitalize font-semibold cursor-pointer text-slate-800"
            >
              <option value="active">Active (Full Access & Normal Work)</option>
              <option value="probation">Probation (Under Evaluation)</option>
              <option value="notice_period">Notice Period (Serving Resignation)</option>
              <option value="suspended">Suspended (Access Temporarily Revoked)</option>
              <option value="terminated">Terminated (Employment Concluded)</option>
              <option value="resigned">Resigned (Voluntary Departure)</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Effective Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
              />
            </div>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reason / Justification Notes{' '}
              {isCriticalStatus && <span className="text-[#8B1D2C]">* (Min 5 chars)</span>}
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder={
                  isCriticalStatus
                    ? 'Enter mandatory explanation (e.g. Contract ended, disciplinary review, probation evaluation complete...)'
                    : 'Optional reason or administrative notes for this transition...'
                }
                required={isCriticalStatus}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
              />
            </div>
            {isCriticalStatus && (
              <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                {reason.trim().length}/500 characters (min 5 required)
              </span>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-xs font-bold rounded-2xl shadow-md text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98] ${
                isCriticalStatus
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  : 'bg-[#8B1D2C] hover:bg-[#731724] shadow-[#8B1D2C]/20'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Confirm Status Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRChangeEmployeeStatusModal;
