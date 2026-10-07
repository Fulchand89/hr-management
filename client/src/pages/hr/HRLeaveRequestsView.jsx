import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Calendar,
  CalendarDays,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  Eye,
  ChevronRight,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

import { getAdminLeaveRequests } from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';

export const HRLeaveRequestsView = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const [leaveRequests, setLeaveRequests] = useState([]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminLeaveRequests();
      const records = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const formatted = records.map((r) => {
        const applicantName = r.applicant
          ? `${r.applicant.firstName} ${r.applicant.lastName || ''}`.trim()
          : 'Employee';
        const durationStr = `${r.totalDays || 1} ${parseFloat(r.totalDays) === 1 ? 'Day' : 'Days'}`;
        const leaveDurationStr = r.isHalfDay ? (r.halfDayType || 'Half Day') : 'Full Day';
        const appDate = r.createdAt
          ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Recently';

        return {
          id: r.id,
          employeeName: applicantName,
          employeeId: r.applicant?.employeeCode || `EMP-${r.userId || 'N/A'}`,
          designation: r.applicant?.designation?.name || r.applicant?.designation || 'Staff',
          department: r.applicant?.department?.name || r.applicant?.department || 'General',
          avatarInitial: applicantName.charAt(0).toUpperCase(),
          leaveType: r.leaveType?.name || 'Leave',
          leaveCode: r.leaveType?.code || 'LV',
          fromDate: r.startDate,
          toDate: r.endDate,
          duration: durationStr,
          leaveDuration: leaveDurationStr,
          reason: r.reason || '',
          status: (r.status || 'pending').toLowerCase(),
          appliedAt: appDate
        };
      });
      setLeaveRequests(formatted);
    } catch {
      setLeaveRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadRequests();
  }, [token, user?.role]);

  const counts = useMemo(() => ({
    all: leaveRequests.length,
    pending: leaveRequests.filter((r) => r.status === 'pending').length,
    approved: leaveRequests.filter((r) => r.status === 'approved').length,
    rejected: leaveRequests.filter((r) => r.status === 'rejected').length
  }), [leaveRequests]);

  const filteredList = useMemo(() => {
    return leaveRequests.filter((r) => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [leaveRequests, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 w-full font-sans pb-12">

      {/* KPI Cards */}
      {/* 4 Stat Overview Cards matching Employee Layout */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-2xs hover:border-slate-300 ${
            statusFilter === 'all' ? 'border-[#8B1D2C] ring-2 ring-[#8B1D2C]/15' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Applications</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{counts.all}</span>
            <span className="text-xs text-slate-400 font-medium">Logged</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            All recorded leaves
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-2xs hover:border-amber-300 ${
            statusFilter === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Awaiting Sanction</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{counts.pending}</span>
            <span className="text-xs text-amber-700 font-medium">Needs Action</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending HR decision
          </div>
        </div>

        {/* Approved */}
        <div
          onClick={() => setStatusFilter('approved')}
          className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-2xs hover:border-emerald-300 ${
            statusFilter === 'approved' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sanctioned</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{counts.approved}</span>
            <span className="text-xs text-emerald-600 font-medium">Approved</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Quota deducted
          </div>
        </div>

        {/* Declined */}
        <div
          onClick={() => setStatusFilter('rejected')}
          className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-2xs hover:border-rose-300 ${
            statusFilter === 'rejected' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Declined</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{counts.rejected}</span>
            <span className="text-xs text-rose-600 font-medium">Rejected</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-rose-700 flex items-center gap-1">
            Rejected with remarks
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by employee or category..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-[#8B1D2C] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {st} ({counts[st]})
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-5">Applicant</th>
                <th className="py-3.5 px-4">Leave Category</th>
                <th className="py-3.5 px-4">Date Range & Duration</th>
                <th className="py-3.5 px-4">Reason Summary</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium text-xs">
                    No leave requests found matching selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-rose-200/70 text-[#8B1D2C] font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                        {req.avatarInitial}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs group-hover:text-[#8B1D2C] transition-colors">
                          {req.employeeName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {req.employeeId} &bull; {req.designation}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px]">
                      {req.leaveType}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono">
                    <span className="font-bold text-slate-900 block text-xs">
                      {req.duration} ({req.leaveDuration})
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {req.fromDate} &rarr; {req.toDate}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <span className="text-slate-600 truncate block text-[11px]" title={req.reason}>
                      "{req.reason}"
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    {req.status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200 inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Approved
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                        <X className="w-3 h-3 text-rose-600" />
                        Rejected
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/hr/leave-requests/${req.id}`)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-[#8B1D2C] text-slate-700 hover:text-white border border-slate-200 hover:border-[#8B1D2C] font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>Review Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRLeaveRequestsView;
