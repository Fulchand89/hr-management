import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  ShieldCheck,
  Building2,
  ArrowRight
} from 'lucide-react';
import {
  getAttendanceCorrectionById,
  actionAttendanceCorrection
} from '../../services/hrService';

export const HRAttendanceCorrectionDetailView = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Correction record state (null until loaded from API)
  const [request, setRequest] = useState(null);

  const loadDetail = async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await getAttendanceCorrectionById(id);
      const r = res?.data ?? res ?? null;
      if (r) {
        const applicantName = r.applicant
          ? `${r.applicant.firstName} ${r.applicant.lastName || ''}`.trim()
          : 'Employee';
        let reqType = 'Check In Time';
        if (r.punchType === 'check_out') reqType = 'Check Out Time';
        else if (r.punchType === 'break') reqType = 'Break Time';

        const d = new Date(r.date);
        const dateFormatted = !isNaN(d.getTime())
          ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : r.date;

        setRequest({
          id: r.id,
          employeeName: applicantName,
          employeeId: r.applicant?.employeeCode || `EMP-${r.userId || 'N/A'}`,
          designation: r.applicant?.designation?.name || r.applicant?.designation || 'Staff',
          department: r.applicant?.department?.name || r.applicant?.department || 'General',
          avatarInitial: applicantName.charAt(0).toUpperCase(),
          date: dateFormatted,
          requestType: reqType,
          originalTime: r.originalTime || '--:--',
          requestedTime: r.requestedTime || '--:--',
          reason: r.reason || 'No specific reason entered.',
          status: (r.status || 'pending').charAt(0).toUpperCase() + (r.status || 'pending').slice(1)
        });
      } else {
        setRequest(null);
      }
    } catch {
      setRequest(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleApprove = async () => {
    try {
      await actionAttendanceCorrection(id, { status: 'approved' });
      setRequest((prev) => (prev ? { ...prev, status: 'Approved' } : null));
      showToast(`Correction request #${id} has been Approved.`);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    try {
      await actionAttendanceCorrection(id, { status: 'rejected' });
      setRequest((prev) => (prev ? { ...prev, status: 'Rejected' } : null));
      showToast(`Correction request #${id} has been Rejected.`);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reject request');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
        <Clock className="w-8 h-8 text-[#8B1D2C] animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-semibold">Loading correction details from server...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Correction Request Not Found</h2>
        <p className="text-xs text-slate-500">The requested attendance correction record does not exist or has been removed.</p>
        <button
          type="button"
          onClick={() => navigate('/hr/attendance-correction')}
          className="px-4 py-2 rounded-xl bg-[#8B1D2C] text-white text-xs font-bold hover:bg-[#731724] cursor-pointer"
        >
          &larr; Back to Corrections Queue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header matching user screenshot */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/hr/attendance-correction')}
          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Correction Request Detail
          </h1>
          <p className="text-xs text-slate-500">Employee biometric timestamp adjustment application</p>
        </div>
      </div>

      {/* Employee Profile Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-rose-100 text-[#8B1D2C] flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            {request.avatarInitial}
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">{request.employeeName}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
              <span className="font-mono text-slate-600 font-bold">{request.employeeId}</span>
              <span>&bull;</span>
              <span>{request.designation}</span>
            </div>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            request.status === 'Approved'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : request.status === 'Rejected'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {request.status}
        </span>
      </div>

      {/* Main Request Specification Card matching user screenshot Screen 1 */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-6">
        <div className="space-y-4 text-xs divide-y divide-slate-100">
          {/* Date */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-slate-500">Date</span>
            <span className="font-bold text-slate-900 text-sm">{request.date}</span>
          </div>

          {/* Request Type */}
          <div className="flex items-center justify-between pt-4">
            <span className="font-semibold text-slate-500">Request Type</span>
            <span className="font-bold text-slate-900 text-sm">{request.requestType}</span>
          </div>

          {/* Original Time */}
          <div className="flex items-center justify-between pt-4">
            <span className="font-semibold text-slate-500">Original Time</span>
            <span className="font-mono font-bold text-slate-800 text-sm">
              {request.originalTime}
            </span>
          </div>

          {/* Requested Time */}
          <div className="flex items-center justify-between pt-4">
            <span className="font-semibold text-slate-500">Requested Time</span>
            <span className="font-mono font-black text-[#8B1D2C] text-sm">
              {request.requestedTime}
            </span>
          </div>

          {/* Reason */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pt-4">
            <span className="font-semibold text-slate-500 shrink-0">Reason</span>
            <div className="sm:max-w-xs text-right sm:text-right font-medium text-slate-800 text-xs leading-relaxed">
              {request.reason}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between pt-4">
            <span className="font-semibold text-slate-500">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                request.status === 'Approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : request.status === 'Rejected'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {request.status}
            </span>
          </div>
        </div>

        {/* Action Buttons matching user screenshot Screen 1 */}
        {request.status === 'Pending' ? (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReject}
              className="w-full py-3 px-4 rounded-2xl border-2 border-[#8B1D2C] text-[#8B1D2C] hover:bg-rose-50 font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" /> Reject
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="w-full py-3 px-4 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99]"
            >
              <Check className="w-4 h-4" /> Approve
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 font-medium border border-slate-100">
            This request has been marked as{' '}
            <strong className={request.status === 'Approved' ? 'text-emerald-700' : 'text-rose-700'}>
              {request.status}
            </strong>
            .
          </div>
        )}
      </div>
    </div>
  );
};

export default HRAttendanceCorrectionDetailView;
