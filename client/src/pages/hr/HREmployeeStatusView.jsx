import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Calendar,
  FileText,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { getEmployeeById, changeEmployeeStatus } from '../../services/hrService';

export const HREmployeeStatusView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedStatus, setSelectedStatus] = useState('active');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchEmp = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const res = await getEmployeeById(id);
        const data = res?.data || res;
        setEmployee(data);
        setSelectedStatus(data.status || 'active');
      } catch (err) {
        console.error('Failed to load employee for status:', err);
        setErrorMessage('Failed to load employee details. Please check network connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmp();
  }, [id]);

  const isCriticalStatus = ['suspended', 'terminated', 'resigned'].includes(
    selectedStatus
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (employee && employee.status === selectedStatus) {
      setErrorMessage(`Employee is already in '${selectedStatus.toUpperCase()}' status.`);
      return;
    }

    if (isCriticalStatus && (!reason.trim() || reason.trim().length < 5)) {
      setErrorMessage(
        'A descriptive reason (at least 5 characters) is required when transitioning to Suspended, Terminated, or Resigned.'
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

      await changeEmployeeStatus(id, payload);
      setSuccessMessage(`Employee status updated to ${selectedStatus.toUpperCase()} successfully!`);

      setTimeout(() => {
        navigate('/hr/employees');
      }, 1200);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return {
          title: 'Active Workforce',
          desc: 'Full operational access and attendance tracking active.',
          cls: 'border-emerald-200 bg-emerald-50 text-emerald-800'
        };
      case 'probation':
        return {
          title: 'On Probation',
          desc: 'Under evaluation period with periodic assessments.',
          cls: 'border-amber-200 bg-amber-50 text-amber-800'
        };
      case 'notice_period':
        return {
          title: 'Serving Notice Period',
          desc: 'Initiated resignation or handover process prior to separation.',
          cls: 'border-indigo-200 bg-indigo-50 text-indigo-800'
        };
      case 'suspended':
        return {
          title: 'Suspended (Temporary Freeze)',
          desc: 'All active portal login sessions immediately revoked pending inquiry.',
          cls: 'border-rose-200 bg-rose-50 text-[#8B1D2C]'
        };
      case 'terminated':
        return {
          title: 'Terminated (Permanent Exit)',
          desc: 'Employment ended. Access permanently blocked.',
          cls: 'border-slate-300 bg-slate-800 text-white'
        };
      case 'resigned':
        return {
          title: 'Voluntary Resignation',
          desc: 'Concluded tenure formally with completed clearance.',
          cls: 'border-purple-200 bg-purple-50 text-purple-800'
        };
      default:
        return {
          title: 'Inactive',
          desc: 'Account dormant or awaiting activation.',
          cls: 'border-slate-200 bg-slate-100 text-slate-700'
        };
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/employees')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-[#8B1D2C] transition-colors cursor-pointer group"
            title="Back to Employees"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Change Employment Status
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Lifecycle Action
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Update employment condition with mandatory compliance audit logging
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/hr/employees')}
          className="text-xs font-bold text-slate-600 hover:text-[#8B1D2C] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
        >
          Cancel & Return
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="p-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading employee status profile...</p>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage} Redirecting to Employee Directory...</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-[#8B1D2C] text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!loading && employee && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Employee Info Header */}
          <div className="p-5 bg-gradient-to-r from-slate-50 to-amber-50/20 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B1D2C] to-[#5C101B] text-white flex items-center justify-center font-bold text-base shadow-xs">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {employee.employeeCode || 'EMP-ID'} • {employee.departmentDetails?.name || employee.department || 'General'} • {employee.email}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Status</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800 mt-1 inline-block">
                {employee.status || 'Active'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Status Selection Cards */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Select Target Status <span className="text-[#8B1D2C]">*</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'active', label: 'Active', desc: 'Standard working staff with active login.' },
                  { id: 'probation', label: 'Probation', desc: 'Evaluation phase prior to confirmation.' },
                  { id: 'notice_period', label: 'Notice Period', desc: 'Handover & resignation in progress.' },
                  { id: 'suspended', label: 'Suspended', desc: 'Access blocked temporarily.' },
                  { id: 'terminated', label: 'Terminated', desc: 'Employment terminated.' },
                  { id: 'resigned', label: 'Resigned', desc: 'Voluntary exit completed.' }
                ].map((s) => {
                  const isSelected = selectedStatus === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedStatus(s.id)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#8B1D2C] bg-rose-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-[#8B1D2C]' : 'text-slate-800'}`}>
                          {s.label}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#8B1D2C] bg-[#8B1D2C]' : 'border-slate-300'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Critical Status Warning Banner */}
            {isCriticalStatus && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-[#8B1D2C] text-xs animate-in fade-in duration-150">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Important Security Action</span>
                  <p className="text-slate-700 leading-relaxed">
                    Setting the employee to <strong>{selectedStatus.toUpperCase()}</strong> will immediately terminate any active portal login sessions and token authentication.
                  </p>
                </div>
              </div>
            )}

            {/* Effective Date & Reason Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Effective Transition Date <span className="text-[#8B1D2C]">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Audit Reason / Justification Notes {isCriticalStatus && <span className="text-[#8B1D2C]">* (Min 5 chars)</span>}
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Provide official organizational rationale for this status update..."
                required={isCriticalStatus}
                className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors resize-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                This explanation will be permanently recorded in the immutable compliance Activity Log.
              </span>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/hr/employees')}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Status...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Confirm & Change Status</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HREmployeeStatusView;
