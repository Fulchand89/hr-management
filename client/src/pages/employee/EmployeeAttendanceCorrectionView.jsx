import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Calendar,
  UserCheck,
  ShieldCheck,
  MessageSquare,
  Eye,
  X,
  FileClock,
  ChevronRight
} from 'lucide-react';

import { getMyAttendanceCorrections } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';

export const EmployeeAttendanceCorrectionView = ({ onBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();

  // Search, filter & list states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [dateFilter, setDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [correctionRequests, setCorrectionRequests] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  // Modals
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
      // Status filter
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // Date filter
      if (dateFilter && r.rawDate && !r.rawDate.startsWith(dateFilter)) return false;

      // Text search
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
  }, [correctionRequests, statusFilter, dateFilter, searchQuery]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#5C101B] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-[#8B1D2C] opacity-30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-48 -mb-10 w-48 h-48 rounded-full bg-amber-500 opacity-20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-rose-200 backdrop-blur-xs flex items-center gap-1.5">
                <FileClock className="w-3.5 h-3.5" />
                Regularization & Corrections
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                HR Approval Workflow
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Attendance Correction Requests
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Submit punch timing adjustments for missed clock-ins, on-duty visits, or technical errors and track real-time HR approval status.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => {
                if (onBack) onBack();
                else navigate('/employee/my-attendance');
              }}
              className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Attendance</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/employee/attendance-correction/new')}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/40 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Request Correction</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-2xl p-5 border shadow-2xs hover:border-slate-300 transition-all cursor-pointer ${
            statusFilter === 'all' ? 'border-[#8B1D2C] ring-2 ring-[#8B1D2C]/10' : 'border-slate-200/80'
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
            <span className="text-xs text-slate-400 font-medium">All applications</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            <span>Overall submissions</span>
          </div>
        </div>

        {/* Pending HR Review */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`bg-white rounded-2xl p-5 border shadow-2xs hover:border-amber-300 transition-all cursor-pointer ${
            statusFilter === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Pending Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4 animate-spin-slow" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 font-mono">
              {String(counts.pending).padStart(2, '0')}
            </span>
            <span className="text-xs text-amber-600 font-medium">Awaiting HR</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-amber-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Under evaluation</span>
          </div>
        </div>

        {/* Approved by HR */}
        <div
          onClick={() => setStatusFilter('approved')}
          className={`bg-white rounded-2xl p-5 border shadow-2xs hover:border-emerald-300 transition-all cursor-pointer ${
            statusFilter === 'approved' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Approved by HR</span>
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
          <div className="mt-2 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            <span>Attendance adjusted</span>
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setStatusFilter('rejected')}
          className={`bg-white rounded-2xl p-5 border shadow-2xs hover:border-rose-300 transition-all cursor-pointer ${
            statusFilter === 'rejected' ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Rejected Requests</span>
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
          <div className="mt-2 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Check HR remarks</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
        {/* Filter Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-slate-50 rounded-2xl border border-slate-200/80 w-fit">
            {[
              { id: 'all', label: 'All Requests', count: counts.all },
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
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Date Filter & Refresh */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search date, punch, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8B1D2C] focus:ring-1 focus:ring-[#8B1D2C] transition-all bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date month/year selector */}
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-[#8B1D2C] bg-white cursor-pointer"
              title="Filter by Month"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 text-xs"
                title="Clear Month Filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Reload Button */}
            <button
              type="button"
              onClick={loadCorrections}
              disabled={isLoading}
              title="Refresh requests"
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#8B1D2C]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Requests Table */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#8B1D2C]" />
            <span className="font-semibold">Loading your attendance corrections...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <CalendarClock className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Attendance Correction Requests</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-5 leading-relaxed">
              {searchQuery || statusFilter !== 'all' || dateFilter
                ? 'No requests match your selected filters. Try clearing filters to see your full history.'
                : 'Need to adjust a missed punch or delayed attendance? Submit a correction request for HR review.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/employee/attendance-correction/new')}
              className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Submit New Correction Request</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Attendance Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Time Adjustment</th>
                  <th className="py-3 px-4">Reason Given</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4">HR Feedback</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Attendance Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.date}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-5.5">
                        {req.dayName} &bull; {req.submittedAt}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 inline-flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#8B1D2C]" />
                        {req.punchType}
                      </span>
                    </td>

                    {/* Time Adjustment */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500 text-xs">{req.originalTime}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
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
                            <span className="text-[10px] text-slate-400">By {req.reviewer}</span>
                          )}
                        </div>
                      ) : req.status === 'pending' ? (
                        <span className="text-slate-400 italic text-[11px]">Under HR Review</span>
                      ) : (
                        <span className="text-slate-400">--</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedCorrectionDetail(req)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-slate-600 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
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

      {/* Detail Drawer Modal */}
      {selectedCorrectionDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCorrectionDetail(null)}
          />

          <div className="relative bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Attendance Correction Details</h3>
                  <p className="text-xs text-slate-500">Request ID #{selectedCorrectionDetail.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCorrectionDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Pill Card */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                selectedCorrectionDetail.status === 'approved'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                  : selectedCorrectionDetail.status === 'rejected'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                  : 'bg-amber-50/80 border-amber-200 text-amber-800'
              }`}
            >
              <div>
                <span className="text-xs font-semibold block">Application Status</span>
                <span className="text-sm font-black capitalize">
                  {selectedCorrectionDetail.status === 'approved'
                    ? 'Approved by HR'
                    : selectedCorrectionDetail.status === 'rejected'
                    ? 'Rejected by HR'
                    : 'Pending HR Review'}
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="text-slate-500 block">Submitted On</span>
                <span className="font-semibold text-slate-800">{selectedCorrectionDetail.submittedAt}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Attendance Date</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{selectedCorrectionDetail.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Category</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{selectedCorrectionDetail.punchType}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Recorded Time</span>
                <span className="font-mono font-semibold text-slate-700 mt-0.5 block">
                  {selectedCorrectionDetail.originalTime}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Requested Correction</span>
                <span className="font-mono font-bold text-emerald-700 mt-0.5 block">
                  {selectedCorrectionDetail.requestedTime}
                </span>
              </div>
            </div>

            {/* Employee Reason */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1.5">Submitted Reason</span>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed">
                {selectedCorrectionDetail.reason}
              </div>
            </div>

            {/* HR Decision & Feedback */}
            {selectedCorrectionDetail.actionReason && (
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5">HR Official Feedback</span>
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8B1D2C]" />
                    <span>Review Remark</span>
                  </div>
                  <p>{selectedCorrectionDetail.actionReason}</p>
                  {selectedCorrectionDetail.reviewer && (
                    <span className="block mt-2 text-[11px] text-amber-700 font-semibold">
                      Action Taken By: {selectedCorrectionDetail.reviewer}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCorrectionDetail(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
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
