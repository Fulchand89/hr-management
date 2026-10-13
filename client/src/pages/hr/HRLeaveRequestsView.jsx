import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  CalendarDays,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  Users,
  Briefcase
} from 'lucide-react';

import { getAdminLeaveRequests } from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';

export const HRLeaveRequestsView = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [applicantTypeFilter, setApplicantTypeFilter] = useState('all'); // 'all' | 'staff' | 'hr'
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

        const applicantRole = (r.applicant?.role || '').toLowerCase();
        const applicantDept = r.applicant?.department?.name || r.applicant?.department || 'General';
        const isHRApplicant = applicantRole === 'hr' || applicantDept.toLowerCase().includes('human resources') || applicantDept.toLowerCase().includes('hr');
        const roleLabel = isHRApplicant ? 'HR' : (applicantRole === 'admin' ? 'Admin' : 'Staff');

        return {
          id: r.id,
          userId: r.userId,
          employeeName: applicantName,
          role: applicantRole,
          roleLabel,
          isHRApplicant,
          employeeId: r.applicant?.employeeCode || `EMP-${r.userId || 'N/A'}`,
          designation: r.applicant?.designation?.name || r.applicant?.designation || (isHRApplicant ? 'HR Specialist' : 'Staff'),
          department: applicantDept,
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

  const counts = useMemo(() => {
    const total = leaveRequests.length;
    return {
      all: total,
      pending: leaveRequests.filter((r) => r.status === 'pending').length,
      approved: leaveRequests.filter((r) => r.status === 'approved').length,
      rejected: leaveRequests.filter((r) => r.status === 'rejected').length,
      staff: leaveRequests.filter((r) => !r.isHRApplicant).length,
      hr: leaveRequests.filter((r) => r.isHRApplicant).length
    };
  }, [leaveRequests]);

  const filteredList = useMemo(() => {
    return leaveRequests.filter((r) => {
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchApplicantType =
        applicantTypeFilter === 'all'
          ? true
          : applicantTypeFilter === 'hr'
          ? r.isHRApplicant
          : !r.isHRApplicant;

      const matchSearch =
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.roleLabel.toLowerCase().includes(searchQuery.toLowerCase());

      return matchStatus && matchApplicantType && matchSearch;
    });
  }, [leaveRequests, statusFilter, applicantTypeFilter, searchQuery]);

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* Top Header & Link to Personal Leaves */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Leave Applications & Approvals</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C] border border-[#8B1D2C]/20">
              Staff + HR Personnel Requests
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review and take action on leave requests from both staff members and HR colleagues across the organization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/hr/leaves')}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        >
          <CalendarDays className="w-4 h-4 text-[#8B1D2C]" />
          <span>My Personal Leaves &rarr;</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div
          onClick={() => {
            setStatusFilter('all');
            setApplicantTypeFilter('all');
          }}
          className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-2xs hover:border-slate-300 ${
            statusFilter === 'all' && applicantTypeFilter === 'all'
              ? 'border-[#8B1D2C] ring-2 ring-[#8B1D2C]/15'
              : 'border-slate-200/80'
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
            <span>Staff: {counts.staff}</span>
            <span>&bull;</span>
            <span>HR: {counts.hr}</span>
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
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending approval decision
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

      {/* Toolbar with Applicant Filter + Status Filter + Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee, ID, role, or category..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
            />
          </div>

          {/* Applicant Role Selector (All vs Staff vs HR) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl overflow-x-auto shrink-0">
            {[
              { id: 'all', label: 'All Personnel', count: counts.all },
              { id: 'staff', label: 'Staff Requests', count: counts.staff },
              { id: 'hr', label: 'HR Personnel', count: counts.hr }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setApplicantTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  applicantTypeFilter === t.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{t.label}</span>
                <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 text-slate-700">
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
            {['all', 'pending', 'approved', 'rejected'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#8B1D2C] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                {st} ({counts[st]})
              </button>
            ))}
          </div>
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
                  <td colSpan="6" className="py-10 text-center text-slate-400 font-medium text-xs">
                    No leave requests found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                            req.isHRApplicant
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-[#8B1D2C]'
                          }`}
                        >
                          {req.avatarInitial}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 block text-xs group-hover:text-[#8B1D2C] transition-colors">
                              {req.employeeName}
                            </span>
                            {req.isHRApplicant ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                HR
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                Staff
                              </span>
                            )}
                            {req.userId && user?.id && req.userId === user.id && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                Self
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {req.employeeId} &bull; {req.designation} &bull; {req.department}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRLeaveRequestsView;
