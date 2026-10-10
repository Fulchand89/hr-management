import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Calendar,
  FileText,
  Clock,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { submitResignation } from '../../services/employeeService';

export const ApplyResignationModal = ({ isOpen, onClose, onSuccess }) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Standard 60-day notice period calculation
  const defaultNoticeDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  }, []);

  const [formData, setFormData] = useState({
    reason: 'Career Growth & Better Opportunities',
    requestedLastWorkingDay: defaultNoticeDate,
    comments: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.reason.trim()) {
      setErrorMsg('Please select or specify a reason for resignation.');
      return;
    }

    if (!formData.requestedLastWorkingDay) {
      setErrorMsg('Please select your requested last working day.');
      return;
    }

    if (formData.requestedLastWorkingDay < todayStr) {
      setErrorMsg('Last working day cannot be in the past.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitResignation({
        reason: formData.reason,
        requestedLastWorkingDay: formData.requestedLastWorkingDay,
        comments: formData.comments
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to submit resignation:', err);
      setErrorMsg(err?.response?.data?.message || 'Failed to submit resignation request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Submit Resignation Notice
              </h2>
              <p className="text-xs text-slate-500">
                Initiate formal exit lifecycle and clearance process
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Policy Banner Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Mandatory 60-Day Notice Period Policy</span>
            </div>
            <p className="text-[11px] text-amber-700/90 leading-relaxed">
              As per company employment agreement, all personnel are required to serve a minimum of 60 days of notice period from the date of submission. Any early release request requires explicit HR and Department Head sanction.
            </p>
          </div>

          {/* Primary Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Primary Reason for Leaving *
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
            >
              <option value="Career Growth & Better Opportunities">Career Growth & Better Opportunities</option>
              <option value="Higher Education / Studies">Higher Education / Studies</option>
              <option value="Relocation / Family Commitments">Relocation / Family Commitments</option>
              <option value="Health / Personal Reasons">Health / Personal Reasons</option>
              <option value="Switching Industry / Freelancing">Switching Industry / Freelancing</option>
              <option value="Other">Other Reasons</option>
            </select>
          </div>

          {/* Requested Last Working Day */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Requested Last Working Day *
            </label>
            <div className="relative">
              <input
                type="date"
                min={todayStr}
                value={formData.requestedLastWorkingDay}
                onChange={(e) =>
                  setFormData({ ...formData, requestedLastWorkingDay: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Standard notice completion date is {defaultNoticeDate}.
            </p>
          </div>

          {/* Detailed Comments / Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Detailed Notes / Transition Remarks (Optional)
            </label>
            <textarea
              rows={4}
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              placeholder="Provide context regarding handover handover plans, current sprint tasks, or any special requests..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>Confirm & Submit Resignation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyResignationModal;
