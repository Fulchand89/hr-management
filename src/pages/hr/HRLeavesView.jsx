import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import HRApplyLeaveModal from './HRApplyLeaveModal';
import HRLeaveDetailModal from './HRLeaveDetailModal';
import {
  getMyLeaves,
  getLeaveBalance,
  cancelLeave as apiCancelLeave
} from '../../services/hrService';

export const HRLeavesView = ({ onBack }) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Real leaves and balances from API
  const [leavesList, setLeavesList] = useState([]);
  const [balances, setBalances] = useState([]);
  const [isBalancesLoading, setIsBalancesLoading] = useState(true);

  // Fetch balances
  const loadBalances = useCallback(async () => {
    setIsBalancesLoading(true);
    try {
      const res = await getLeaveBalance();
      const data = res?.data ?? res ?? {};
      const balanceList = Array.isArray(data?.balances)
        ? data.balances
        : (Array.isArray(data) ? data : []);
      setBalances(balanceList);
    } catch {
      setBalances([]);
    } finally {
      setIsBalancesLoading(false);
    }
  }, []);

  // Fetch requests
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const params = {
        page: currentPage,
        limit: 10
      };
      if (activeFilter !== 'All') {
        params.status = activeFilter.toLowerCase();
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await getMyLeaves(params);
      const data = res?.data ?? res ?? {};
      const requestsList = Array.isArray(data?.requests)
        ? data.requests
        : (Array.isArray(data) ? data : null);

      if (requestsList !== null) {
        const formatted = requestsList.map((r) => ({
          id: r.id,
          leaveType: r.leaveType?.name || 'Leave',
          fromDate: r.startDate,
          toDate: r.endDate,
          days: r.totalDays,
          duration: `${r.totalDays} ${r.totalDays > 1 ? 'Days' : 'Day'}`,
          reason: r.reason,
          appliedOn: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently',
          status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending'
        }));
        setLeavesList(formatted);
        const meta = res?.meta || data?.meta || {};
        setTotalPages(meta.totalPages || 1);
        setTotalCount(meta.total !== undefined ? meta.total : formatted.length);
      } else {
        setLeavesList([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch {
      setLeavesList([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, currentPage, searchQuery]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) {
      return;
    }
    try {
      await apiCancelLeave(leaveId);
      await loadRequests();
      await loadBalances();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to cancel leave');
    }
  };

  // Search filtering client-side
  const filteredLeaves = leavesList.filter((l) => {
    const matchesSearch =
      l.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleOpenDetail = (leave) => {
    setSelectedLeave(leave);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/30 transition-all cursor-pointer active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* 3 Leave Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balances.length > 0 ? (
          balances.map((b) => {
            const total = Number(b.allocated) || 12;
            const remaining = Number(b.remaining) || 0;
            const used = Number(b.used) || 0;
            const pct = Math.round((remaining / total) * 100);
            return (
              <div key={b.leaveTypeId || b.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {b.leaveType?.name || 'Leave'} ({b.leaveType?.code || 'LV'})
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-[#8B1D2C]">
                    Annual
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {String(remaining).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">/ {total} days left</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-[#8B1D2C] rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
                  <span>{used} days consumed</span>
                  <span>{pct}% available</span>
                </div>
              </div>
            );
          })
        ) : isBalancesLoading ? (
          [1, 2, 3].map((idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-1/2 mb-3" />
              <div className="h-2 bg-slate-100 rounded w-full" />
            </div>
          ))
        ) : (
          <div className="col-span-1 sm:col-span-3 bg-white rounded-2xl p-8 border border-slate-200/80 shadow-2xs text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Leave Quotas Allocated</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Leave balance quotas have not been configured for your account yet. Please contact your HR administrator.
            </p>
          </div>
        )}
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
            {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => {
              const isActive = activeFilter === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveFilter(tab);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by reason or type..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
            />
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="overflow-x-auto pt-2">
          {isLoading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-slate-500 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-[#8B1D2C]" />
              <span>Loading leave records...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Leave Type</th>
                  <th className="py-3 px-4">Date Range</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                      No leave requests found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{leave.leaveType}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {String(leave.id).slice(0, 8)}...
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {leave.fromDate} &rarr; {leave.toDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {leave.duration || `${leave.days} Day`}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{leave.reason}</td>
                      <td className="py-3 px-4 text-slate-400">{leave.appliedOn || 'Recently'}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            leave.status === 'Approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : leave.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              leave.status === 'Approved'
                                ? 'bg-emerald-500'
                                : leave.status === 'Rejected'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {leave.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(leave)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#8B1D2C] hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            View Details
                          </button>
                          {leave.status.toLowerCase() === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleCancelLeave(leave.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {filteredLeaves.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing page <span className="font-bold text-slate-800 font-mono">{currentPage}</span> of{' '}
              <span className="font-bold text-slate-800 font-mono">{totalPages}</span> (Total{' '}
              <span className="font-bold text-slate-800 font-mono">{totalCount}</span> requests)
            </p>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  currentPage === 1
                    ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#8B1D2C] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  currentPage === totalPages
                    ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      <HRApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmitLeave={async () => {
          setIsApplyModalOpen(false);
          await loadRequests();
          await loadBalances();
        }}
      />

      {/* Leave Detail Modal */}
      <HRLeaveDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        leave={selectedLeave}
        onCancelLeave={handleCancelLeave}
      />
    </div>
  );
};

export default HRLeavesView;
