import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Calendar,
  UserCheck,
  ShieldCheck,
  Eye,
  X
} from 'lucide-react';

import { getMyAttendanceCorrections } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import { SkeletonTable } from '../../components/common/Skeleton';

export const EmployeeAttendanceCorrectionView = ({ onBack }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();

  // Search, filter & list states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [isLoading, setIsLoading] = useState(true);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [selectedCorrectionDetail, setSelectedCorrectionDetail] = useState(null);

  // Redirect to dedicated new request route if action=new or new=1 in URL
  useEffect(() => {
    const action = searchParams.get('action');
    const isNew = searchParams.get('new');
    if (action === 'new' || isNew === '1' || isNew === 'true') {
      navigate('/employee/attendance-correction/new', { replace: true });
    }
  }, [searchParams, navigate]);

  // Load correction requests from API
  const loadCorrections = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMyAttendanceCorrections();
      const records = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : Array.isArray(res?.data?.records)
        ? res.data.records
        : [];

      const formatted = records.map((r) => {
        const d = new Date(r.date);
        const dateFormatted = !isNaN(d.getTime())
          ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : r.date || '--';

        const dayName = !isNaN(d.getTime())
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : '';

        const submittedAt = r.createdAt
          ? new Date(r.createdAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Recently';

        let category = r.punchType || 'Check In Time';
        if (category === 'check_in') category = 'Check In Time';
        if (category === 'check_out') category = 'Check Out Time';
        if (category === 'break') category = 'Break Time';

        const reviewerName = r.reviewer
          ? `${r.reviewer.firstName || ''} ${r.reviewer.lastName || ''}`.trim()
          : null;

        return {
          id: r.id,
          attendanceId: r.attendanceId,
          date: dateFormatted,
          rawDate: r.date,
          dayName,
          punchType: category,
          originalTime: r.originalTime || 'Not Logged',
          requestedTime: r.requestedTime || '--',
          reason: r.reason || 'Punch timing correction requested.',
          status: (r.status || 'pending').toLowerCase(),
          actionReason: r.actionReason || null,
          reviewer: reviewerName,
          submittedAt
        };
      });

      setCorrectionRequests(formatted);
    } catch (err) {
      console.error('Failed to load my attendance corrections:', err);
      setCorrectionRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadCorrections();
  }, [token, loadCorrections]);

  // Dynamic KPI counts
  const counts = useMemo(
    () => ({
      all: correctionRequests.length,
      pending: correctionRequests.filter((r) => r.status === 'pending').length,
      approved: correctionRequests.filter((r) => r.status === 'approved').length,
      rejected: correctionRequests.filter((r) => r.status === 'rejected').length
    }),
    [correctionRequests]
  );

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return correctionRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDate = r.date.toLowerCase().includes(q) || r.dayName.toLowerCase().includes(q);
        const matchesType = r.punchType.toLowerCase().includes(q);
        const matchesReason = r.reason.toLowerCase().includes(q);
        const matchesAction = r.actionReason ? r.actionReason.toLowerCase().includes(q) : false;
        const matchesStatus = r.status.toLowerCase().includes(q);
        if (!matchesDate && !matchesType && !matchesReason && !matchesAction && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [correctionRequests, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* ── 1. Page Header & Actions ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Attendance Corrections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track timing regularizations, missed clock-ins & HR approval decisions
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (onBack) onBack();
              else navigate('/employee/my-attendance');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Attendance</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/employee/attendance-correction/new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Request Correction</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Summary Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Requests */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-2xl p-4 border shadow-2xs transition-all cursor-pointer ${
            statusFilter === 'all' ? 'border-[#8B1D2C] ring-2 ring-[#8B1D2C]/10' : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Requests</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {String(counts.all).padStart(2, '0')}
            </span>
            <span className="text-xs text-slate-400 font-medium">All submissions</span>
          </div>
        </div>

        {/* Pending Review */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`bg-white rounded-2xl p-4 border shadow-2xs transition-all cursor-pointer ${
            statusFilter === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Pending Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-mono">
              {String(counts.pending).padStart(2, '0')}
            </span>
            <span className="text-xs text-amber-600 font-medium">Awaiting HR</span>
          </div>
        </div>

        {/* Approved by HR */}
        <div
          onClick={() => setStatusFilter('approved')}
          className={`bg-white rounded-2xl p-4 border shadow-2xs transition-all cursor-pointer ${
            statusFilter === 'approved' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Approved</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {String(counts.approved).padStart(2, '0')}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Regularized</span>
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setStatusFilter('rejected')}
          className={`bg-white rounded-2xl p-4 border shadow-2xs transition-all cursor-pointer ${
            statusFilter === 'rejected' ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Rejected</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 font-mono">
              {String(counts.rejected).padStart(2, '0')}
            </span>
            <span className="text-xs text-rose-600 font-medium">Declined</span>
          </div>
        </div>
      </div>

      {/* ── 3. Requests Table Card ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Filter Controls Row */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'approved', label: 'Approved', count: counts.approved },
              { id: 'rejected', label: 'Rejected', count: counts.rejected }
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#8B1D2C] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search date, type, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8B1D2C] transition-all bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={loadCorrections}
              disabled={isLoading}
              title="Refresh requests"
              className="p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#8B1D2C]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Requests Table Content */}
        {isLoading ? (
          <SkeletonTable rows={5} cols={7} hasHeader={false} />
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mx-auto mb-3 border border-rose-100">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Attendance Correction Requests</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4 leading-relaxed">
              {searchQuery || statusFilter !== 'all'
                ? 'No requests match your selected filters. Try clearing filters.'
                : 'Need to adjust a missed punch? Submit a correction request for HR review.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/employee/attendance-correction/new')}
              className="px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit Correction</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full min-w-[650px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 whitespace-nowrap">Attendance Date</th>
                  <th className="py-3 px-4 whitespace-nowrap">Category</th>
                  <th className="py-3 px-4 whitespace-nowrap">Time Adjustment</th>
                  <th className="py-3 px-4 whitespace-nowrap">Reason</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap">HR Feedback</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Attendance Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.date}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-5">
                        {req.dayName} &bull; {req.submittedAt}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200/60 inline-flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-[#8B1D2C]" />
                        {req.punchType}
                      </span>
                    </td>

                    {/* Time Adjustment */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-slate-500 text-xs">{req.originalTime}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-xs">
                          {req.requestedTime}
                        </span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 font-medium truncate" title={req.reason}>
                        {req.reason}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          req.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : req.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            req.status === 'approved'
                              ? 'bg-emerald-500'
                              : req.status === 'rejected'
                              ? 'bg-rose-500'
                              : 'bg-amber-500 animate-pulse'
                          }`}
                        />
                        {req.status === 'approved'
                          ? 'Approved'
                          : req.status === 'rejected'
                          ? 'Rejected'
                          : 'Pending Review'}
                      </span>
                    </td>

                    {/* HR Feedback */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {req.actionReason ? (
                        <div>
                          <p className="text-slate-800 font-medium truncate" title={req.actionReason}>
                            {req.actionReason}
                          </p>
                          {req.reviewer && (
                            <span className="text-[10px] text-slate-400 block">By {req.reviewer}</span>
                          )}
                        </div>
                      ) : req.status === 'pending' ? (
                        <span className="text-slate-400 italic text-[11px]">Under HR Review</span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedCorrectionDetail(req)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200/80 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. Detail Modal ─────────────────────────────────────────── */}
      {selectedCorrectionDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCorrectionDetail(null)}
          />

          <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Correction Request Details</h3>
                  <p className="text-[11px] text-slate-400">Request #{selectedCorrectionDetail.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCorrectionDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Pill Card */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                selectedCorrectionDetail.status === 'approved'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                  : selectedCorrectionDetail.status === 'rejected'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                  : 'bg-amber-50/80 border-amber-200 text-amber-800'
              }`}
            >
              <div>
                <span className="text-[10px] font-semibold block uppercase">Status</span>
                <span className="text-xs font-bold capitalize">
                  {selectedCorrectionDetail.status === 'approved'
                    ? 'Approved by HR'
                    : selectedCorrectionDetail.status === 'rejected'
                    ? 'Rejected by HR'
                    : 'Pending HR Review'}
                </span>
              </div>
              <div className="text-right text-[11px]">
                <span className="text-slate-500 block">Submitted On</span>
                <span className="font-semibold text-slate-800">{selectedCorrectionDetail.submittedAt}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Date</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{selectedCorrectionDetail.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{selectedCorrectionDetail.punchType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Recorded Time</span>
                <span className="font-mono font-semibold text-slate-700 mt-0.5 block">
                  {selectedCorrectionDetail.originalTime}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Requested Time</span>
                <span className="font-mono font-bold text-emerald-700 mt-0.5 block">
                  {selectedCorrectionDetail.requestedTime}
                </span>
              </div>
            </div>

            {/* Employee Reason */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Reason Submitted</span>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed">
                {selectedCorrectionDetail.reason}
              </div>
            </div>

            {/* HR Decision & Feedback */}
            {selectedCorrectionDetail.actionReason && (
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">HR Feedback</span>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                  <div className="flex items-center gap-1 font-bold mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8B1D2C]" />
                    <span>Review Remark</span>
                  </div>
                  <p>{selectedCorrectionDetail.actionReason}</p>
                  {selectedCorrectionDetail.reviewer && (
                    <span className="block mt-1.5 text-[10px] text-amber-700 font-semibold">
                      Reviewed by: {selectedCorrectionDetail.reviewer}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedCorrectionDetail(null)}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAttendanceCorrectionView;
