import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  Eye,
  RefreshCw
} from 'lucide-react';

import {
  getAdminAttendanceCorrections,
  actionAttendanceCorrection
} from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';

export const HRAttendanceCorrectionView = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Live Requests List from backend
  const [correctionRequests, setCorrectionRequests] = useState([]);

  const loadCorrections = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAdminAttendanceCorrections();
      const records = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const formatted = records.map((r) => {
        const applicantName = r.applicant
          ? `${r.applicant.firstName} ${r.applicant.lastName || ''}`.trim()
          : 'Employee';
        let correctionType = 'Check In Time';
        if (r.punchType === 'check_out') correctionType = 'Check Out Time';
        else if (r.punchType === 'break') correctionType = 'Break Time';
        else if (r.punchType) correctionType = r.punchType;

        const d = new Date(r.date);
        const dateFormatted = !isNaN(d.getTime())
          ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
          : r.date;

        const reqAt = r.createdAt
          ? new Date(r.createdAt).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Recently';

        return {
          id: r.id,
          employeeName: applicantName,
          employeeId: r.applicant?.employeeCode || `EMP-${r.userId || 'N/A'}`,
          designation: r.applicant?.designation?.name || r.applicant?.designation || 'Staff',
          department: r.applicant?.department?.name || r.applicant?.department || 'General',
          date: dateFormatted,
          correctionType: r.correctionType || correctionType,
          originalTime: r.originalTime || '--:--',
          requestedTime: r.requestedTime || '--:--',
          reason: r.reason || '',
          status: r.status || 'pending',
          avatarInitial: applicantName.charAt(0).toUpperCase(),
          requestedAt: reqAt
        };
      });
      setCorrectionRequests(formatted);
    } catch {
      setCorrectionRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadCorrections();
  }, [token, user?.role, loadCorrections]);

  // Dynamic Counts based on real data
  const counts = useMemo(() => ({
    all: correctionRequests.length,
    pending: correctionRequests.filter((r) => r.status === 'pending').length,
    approved: correctionRequests.filter((r) => r.status === 'approved').length,
    rejected: correctionRequests.filter((r) => r.status === 'rejected').length
  }), [correctionRequests]);

  // Filtered List
  const filteredList = useMemo(() => {
    return correctionRequests.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.employeeName.toLowerCase().includes(q) ||
        item.employeeId.toLowerCase().includes(q) ||
        item.correctionType.toLowerCase().includes(q) ||
        item.date.toLowerCase().includes(q) ||
        (item.reason && item.reason.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [correctionRequests, statusFilter, searchQuery]);

  const handleApprove = async (id) => {
    try {
      await actionAttendanceCorrection(id, { status: 'approved' });
      showToast('Attendance correction request approved successfully!');
      loadCorrections();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    try {
      await actionAttendanceCorrection(id, { status: 'rejected' });
      showToast('Attendance correction request rejected.');
      loadCorrections();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reject request');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-6 w-full font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Attendance Corrections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and sanction employee punch timing adjustment requests
          </p>
        </div>
        <button
          type="button"
          onClick={loadCorrections}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'all'
              ? 'border-[#8B1D2C] ring-2 ring-[#8B1D2C]/10'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Requests</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{counts.all}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">All recorded applications</p>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-500/10'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{counts.pending}</span>
            {counts.pending > 0 && (
              <span className="text-[11px] font-bold text-amber-600">Action Required</span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Awaiting HR decision</p>
        </div>

        {/* Approved */}
        <div
          onClick={() => setStatusFilter('approved')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'approved'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Approved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{counts.approved}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Synced with attendance</p>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setStatusFilter('rejected')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer shadow-2xs ${
            statusFilter === 'rejected'
              ? 'border-rose-500 ring-2 ring-rose-500/10'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Rejected</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{counts.rejected}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Declined applications</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, ID, punch type..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'pending', label: 'Pending', count: counts.pending },
            { key: 'approved', label: 'Approved', count: counts.approved },
            { key: 'rejected', label: 'Rejected', count: counts.rejected }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-[#8B1D2C] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 text-[#8B1D2C] animate-spin" />
            Loading attendance correction requests...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No correction requests found</p>
            <p className="text-slate-400">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or filter settings.'
                : 'No employee has submitted an attendance correction request.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Punch Type</th>
                  <th className="py-3 px-4">Adjustment</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] font-bold text-xs flex items-center justify-center shrink-0">
                          {item.avatarInitial}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">
                            {item.employeeName}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {item.employeeId} &bull; {item.designation}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {item.date}
                    </td>

                    {/* Punch Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {item.correctionType}
                      </span>
                    </td>

                    {/* Original -> Requested */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="line-through text-slate-400">{item.originalTime}</span>
                        <span className="text-slate-300">&rarr;</span>
                        <span className="font-bold text-[#8B1D2C]">{item.requestedTime}</span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 max-w-[220px] truncate text-slate-600" title={item.reason}>
                      {item.reason || <span className="text-slate-300 italic">No reason provided</span>}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.status === 'pending' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Approved
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                          <X className="w-3 h-3 text-rose-600" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/hr/attendance-correction/${item.id}`)}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {item.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(item.id)}
                              title="Approve Request"
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(item.id)}
                              title="Reject Request"
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRAttendanceCorrectionView;
