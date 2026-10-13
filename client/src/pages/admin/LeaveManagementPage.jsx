import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import { getAdminLeaveRequests, actionLeaveRequest } from '../../services/hrService';

export const LeaveManagementPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [actionType, setActionType] = useState(null); // 'approved' | 'rejected'
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real leave requests from backend API
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAdminLeaveRequests();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setRequests(
        list.map((r) => ({
          id: r.id,
          employeeName: `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.trim() || r.employee?.email || 'Employee',
          employeeCode: r.employee?.employeeCode || 'EMP',
          avatar: r.employee?.avatar || '',
          department: r.employee?.departmentDetails?.name || 'General',
          leaveType: r.leaveType?.name || r.type || 'Leave',
          startDate: r.startDate ? r.startDate.split('T')[0] : '',
          endDate: r.endDate ? r.endDate.split('T')[0] : '',
          totalDays: parseFloat(r.totalDays || 1),
          reason: r.reason || '',
          status: (r.status || 'pending').toLowerCase(),
          appliedOn: r.createdAt ? r.createdAt.split('T')[0] : ''
        }))
      );
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (selectedRequest && actionType) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || 'unset';
      };
    }
  }, [selectedRequest, actionType]);

  const handleAction = async (status) => {
    if (!selectedRequest) return;
    try {
      await actionLeaveRequest(selectedRequest.id, {
        status: status.toUpperCase(),
        remarks: actionReason
      });
      loadRequests();
    } catch (err) {
      console.error('Failed to action leave:', err);
    }
    setSelectedRequest(null);
    setActionType(null);
    setActionReason('');
  };


  const filteredRequests = requests.filter((r) => {
    const matchesFilter = activeFilter === 'all' ? true : r.status === activeFilter;
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.leaveType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-indigo-600" />
            Leave & Time-Off Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review, approve, and track employee leave applications across departments.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{requests.length}</div>
            <div className="text-xs text-slate-500">Total Applications</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <div className="text-xs text-slate-500">Pending Review</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
            <div className="text-xs text-slate-500">Approved</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600">{rejectedCount}</div>
            <div className="text-xs text-slate-500">Rejected</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'pending', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeFilter === tab
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee or leave..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Leave Type</th>
                <th className="py-3.5 px-4">Date Range</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No leave applications found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {req.avatar ? (
                          <img
                            src={req.avatar}
                            alt={req.employeeName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs ring-1 ring-slate-200 shrink-0">
                            {(req.employeeName?.[0] || 'E').toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div className="font-semibold text-slate-900">{req.employeeName}</div>
                          <div className="text-[11px] text-slate-400">{req.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{req.department}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-medium text-[11px]">
                        {req.leaveType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {req.startDate} &rarr; {req.endDate}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {req.totalDays} Day{req.totalDays > 1 ? 's' : ''}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          req.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : req.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('approved');
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 cursor-pointer"
                            title="Approve Leave"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType('rejected');
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Reject Leave"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Actioned</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">
              {actionType === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
            </h3>
            <p className="text-xs text-slate-500">
              Employee: <b>{selectedRequest.employeeName}</b> ({selectedRequest.employeeCode})<br />
              Duration: <b>{selectedRequest.startDate}</b> to <b>{selectedRequest.endDate}</b> ({selectedRequest.totalDays} Days)
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Remarks (Optional):
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Add remark or instructions..."
                rows="3"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(actionType)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white ${
                  actionType === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagementPage;
