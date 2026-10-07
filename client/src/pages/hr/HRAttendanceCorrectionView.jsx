import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  User,
  MoreVertical,
  ArrowRight,
  ShieldCheck,
  Building2,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
  ChevronRight
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

  // Modal / Detail state
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Live Requests List from backend
  const [correctionRequests, setCorrectionRequests] = useState([]);

  const loadCorrections = async () => {
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
  };

  useEffect(() => {
    if (!token) return;
    loadCorrections();
  }, [token, user?.role]);

  // Counts
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
      const matchesSearch =
        item.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.correctionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.date.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [correctionRequests, statusFilter, searchQuery]);

  const handleApprove = async (id) => {
    try {
      await actionAttendanceCorrection(id, { status: 'approved' });
      showToast('Attendance correction request approved successfully!');
      setSelectedItem(null);
      loadCorrections();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    try {
      await actionAttendanceCorrection(id, { status: 'rejected' });
      showToast('Attendance correction request rejected.');
      setSelectedItem(null);
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


      {/* 4 Stat Overview Cards matching Employee Layout */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-2xs hover:border-slate-300 ${statusFilter === 'all' ? 'border-[#8B1D2C] ring-2 ring-[#8B1D2C]/15' : 'border-slate-200/80'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Adjustments</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{counts.all}</span>
            <span className="text-xs text-slate-400 font-medium">Logged</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center gap-1">
            All timestamp requests
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('pending')}
          className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-2xs hover:border-amber-300 ${statusFilter === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/80'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Awaiting Action</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{counts.pending}</span>
            <span className="text-xs text-amber-700 font-medium">Needs Review</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending HR decision
          </div>
        </div>

        {/* Approved */}
        <div
          onClick={() => setStatusFilter('approved')}
          className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-2xs hover:border-emerald-300 ${statusFilter === 'approved' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200/80'
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
            <TrendingUp className="w-3 h-3" /> Synced to attendance roster
          </div>
        </div>

        {/* Declined */}
        <div
          onClick={() => setStatusFilter('rejected')}
          className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-2xs hover:border-rose-300 ${statusFilter === 'rejected' ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200/80'
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
            Disapproved requests
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, ID or punch type..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer whitespace-nowrap ${statusFilter === st
                  ? 'bg-[#8B1D2C] text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              {st} ({counts[st]})
            </button>
          ))}
        </div>
      </div>

      {/* Main Desktop Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            No attendance correction requests match your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Punch Type</th>
                  <th className="py-3.5 px-4">Recorded &bull; Requested Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Employee Profile */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {item.avatarInitial}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs group-hover:text-[#8B1D2C] transition-colors">
                            {item.employeeName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {item.employeeId} &bull; {item.designation}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {item.date}
                    </td>

                    {/* Correction Type */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {item.correctionType}
                      </span>
                    </td>

                    {/* Recorded vs Requested */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="line-through text-slate-400">{item.originalTime}</span>
                        <span className="text-slate-300">&rarr;</span>
                        <span className="font-bold text-[#8B1D2C]">{item.requestedTime}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {item.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pending
                        </span>
                      )}
                      {item.status === 'approved' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Approved
                        </span>
                      )}
                      {item.status === 'rejected' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                          <X className="w-3 h-3 text-rose-600" />
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/hr/attendance-correction/${item.id}`)}
                          title="View Details"
                          className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {item.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(item.id)}
                              title="Approve Request"
                              className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(item.id)}
                              title="Reject Request"
                              className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
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

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedItem(null)}
          />

          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Correction Request #{selectedItem.id}</h3>
                  <p className="text-xs text-slate-400">Submitted {selectedItem.requestedAt}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Card */}
            <div className="flex items-center gap-3.5 my-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-11 h-11 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0">
                {selectedItem.avatarInitial}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedItem.employeeName}</h4>
                <p className="text-xs text-slate-500 font-medium">{selectedItem.designation} &bull; {selectedItem.employeeId}</p>
              </div>
            </div>

            {/* Spec Table */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Date of Incident</span>
                <span className="font-bold text-slate-800">{selectedItem.date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Adjustment Type</span>
                <span className="font-bold text-slate-800">{selectedItem.correctionType}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">System Recorded Time</span>
                <span className="font-mono text-slate-500 line-through">{selectedItem.originalTime}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Employee Requested Time</span>
                <span className="font-mono font-bold text-[#8B1D2C]">{selectedItem.requestedTime}</span>
              </div>
              <div className="py-2">
                <span className="text-slate-400 block mb-1">Employee Explanation:</span>
                <p className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 font-medium leading-relaxed border border-slate-100">
                  "{selectedItem.reason}"
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedItem.status === 'pending' ? (
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleReject(selectedItem.id)}
                  className="px-5 py-2.5 rounded-xl border border-[#8B1D2C] text-[#8B1D2C] hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Reject Adjustment
                </button>
                <button
                  type="button"
                  onClick={() => handleApprove(selectedItem.id)}
                  className="px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/25 transition-all cursor-pointer"
                >
                  Approve Adjustment
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-400 font-semibold">
                  This request has already been{' '}
                  <strong className={selectedItem.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'}>
                    {selectedItem.status}
                  </strong>.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAttendanceCorrectionView;
