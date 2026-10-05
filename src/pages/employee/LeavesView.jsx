import React, { useState } from 'react';
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
} from 'lucide-react';
import ApplyLeaveModal from './ApplyLeaveModal';
import LeaveDetailModal from './LeaveDetailModal';

export const LeavesView = ({
  leaves = [],
  onApplyLeave,
  onCancelLeave,
  onBack,
}) => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter leaves
  const filteredLeaves = leaves.filter((l) => {
    const matchesFilter =
      activeFilter === 'All' ? true : l.status.toLowerCase() === activeFilter.toLowerCase();
    const matchesSearch =
      l.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeaves = filteredLeaves.slice(startIndex, endIndex);

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
        {/* Casual Leave */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Casual Leave (CL)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-[#8B1D2C]">
              Annual
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">08</span>
            <span className="text-xs text-slate-400 font-semibold">/ 12 days left</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[#8B1D2C] rounded-full" style={{ width: '66%' }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
            <span>4 days consumed</span>
            <span>66% available</span>
          </div>
        </div>

        {/* Sick Leave */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Sick Leave (SL)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
              Medical
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">04</span>
            <span className="text-xs text-slate-400 font-semibold">/ 06 days left</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '66%' }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
            <span>2 days consumed</span>
            <span>66% available</span>
          </div>
        </div>

        {/* Privilege Leave */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Privilege / Earned (PL)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
              Earned
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">10</span>
            <span className="text-xs text-slate-400 font-semibold">/ 15 days left</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '66%' }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-medium">
            <span>5 days consumed</span>
            <span>66% available</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto">
            {['All', 'Pending', 'Approved', 'Rejected'].map((tab) => {
              const count =
                tab === 'All'
                  ? leaves.length
                  : leaves.filter((l) => l.status.toLowerCase() === tab.toLowerCase()).length;
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
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-[#8B1D2C] text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
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
                currentLeaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{leave.leaveType}</div>
                      <div className="text-[10px] text-slate-400">ID: {leave.id}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {leave.fromDate} &rarr; {leave.toDate}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {leave.duration || `${leave.days} Day`}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{leave.reason}</td>
                    <td className="py-3 px-4 text-slate-400">{leave.appliedOn || '12 Aug 2026'}</td>
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
                        {leave.status === 'Pending' && onCancelLeave && (
                          <button
                            type="button"
                            onClick={() => onCancelLeave(leave.id)}
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
        </div>

        {/* Pagination Controls */}
        {filteredLeaves.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-800 font-mono">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800 font-mono">
                {Math.min(endIndex, filteredLeaves.length)}
              </span>{' '}
              of <span className="font-bold text-slate-800 font-mono">{filteredLeaves.length}</span> requests
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
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmitLeave={(newLeave) => {
          onApplyLeave(newLeave);
          setIsApplyModalOpen(false);
        }}
      />

      {/* Leave Detail Modal */}
      <LeaveDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        leave={selectedLeave}
        onCancelLeave={onCancelLeave}
      />
    </div>
  );
};

export default LeavesView;
