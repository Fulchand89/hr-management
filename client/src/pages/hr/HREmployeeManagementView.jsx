import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Eye,
  Edit,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Building,
  Briefcase,
  Calendar,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  Wallet,
  EyeOff,
  DollarSign
} from 'lucide-react';
import { getAllEmployees, getDepartments } from '../../services/hrService';
import HRAddEmployeeModal from './HRAddEmployeeModal';
import HREmployeeDetailModal from './HREmployeeDetailModal';
import HRChangeEmployeeStatusModal from './HRChangeEmployeeStatusModal';
import HRManageSalaryModal from './HRManageSalaryModal';

export const HREmployeeManagementView = () => {
  const navigate = useNavigate();

  // Data state
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEmployeeIdForDetail, setSelectedEmployeeIdForDetail] = useState(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedEmployeeForStatus, setSelectedEmployeeForStatus] = useState(null);

  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState(null);
  const [showSalaries, setShowSalaries] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Fetch departments for filter dropdown
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await getDepartments();
        const dList = Array.isArray(res?.data)
          ? res.data
          : (Array.isArray(res) ? res : []);
        setDepartments(dList);
      } catch {
        // Silently handle
      }
    };
    fetchDepts();
  }, []);

  // Fetch employees list
  const fetchEmployees = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      try {
        const params = {
          page,
          limit,
          sortBy: 'createdAt',
          order: 'DESC'
        };

        if (search.trim()) params.search = search.trim();
        if (statusFilter !== 'all') params.status = statusFilter;
        if (roleFilter !== 'all') params.role = roleFilter;
        if (departmentFilter !== 'all') {
          if (departmentFilter.length === 36) {
            params.departmentId = departmentFilter;
          } else {
            params.department = departmentFilter;
          }
        }

        const res = await getAllEmployees(params);
        const dataRows = Array.isArray(res?.data)
          ? res.data
          : (Array.isArray(res) ? res : (res?.rows || []));
        const meta = res?.meta || {};

        setEmployees(dataRows);
        setTotalCount(meta.total !== undefined ? meta.total : dataRows.length);
      } catch (err) {
        console.error('Failed to fetch employees list:', err);
        setError(
          err?.response?.data?.message ||
          'Failed to load employees. Please check your network or try again.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, search, statusFilter, departmentFilter, roleFilter]
  );

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Status Badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'probation':
        return {
          label: 'Probation',
          cls: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'notice_period':
        return {
          label: 'Notice Period',
          cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500'
        };
      case 'suspended':
        return {
          label: 'Suspended',
          cls: 'bg-rose-50 text-[#8B1D2C] border-rose-200',
          dot: 'bg-[#8B1D2C]'
        };
      case 'terminated':
        return {
          label: 'Terminated',
          cls: 'bg-slate-800 text-white border-slate-700',
          dot: 'bg-slate-400'
        };
      case 'resigned':
        return {
          label: 'Resigned',
          cls: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500'
        };
      default:
        return {
          label: status || 'Inactive',
          cls: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400'
        };
    }
  };

  // Role Badge styling helper
  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'hr':
        return 'bg-rose-50 text-[#8B1D2C] border-rose-200';
      case 'manager':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  // Quick KPI Counts
  const activeCount = employees.filter((e) => e.status === 'active').length;
  const probationCount = employees.filter((e) => e.status === 'probation').length;
  const suspendedOrTerminatedCount = employees.filter((e) =>
    ['suspended', 'terminated', 'resigned'].includes(e.status)
  ).length;

  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-slate-800">
      {/* Toast Notification Banner */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-lg border flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-top-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
              : 'bg-rose-50 text-[#8B1D2C] border-rose-200 shadow-rose-500/10'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#8B1D2C] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Primary Action matching brand theme */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B1D2C] to-[#5C101B] flex items-center justify-center text-white shadow-md shadow-[#8B1D2C]/20">
              <Users className="w-5 h-5 text-rose-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Employee Directory & Management
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  Directory
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Centralized workforce database, lifecycle statuses, and profile administration
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchEmployees(true)}
            disabled={refreshing || loading}
            className="p-2.5 text-slate-600 hover:text-[#8B1D2C] bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#8B1D2C]' : ''}`}
            />
          </button>

          <button
            type="button"
            onClick={() => navigate('/hr/employees/add')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Employee</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Personnel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Personnel
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {totalCount}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Registered across org
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#8B1D2C]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Active Workforce */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
              Active Workforce
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {activeCount}
            </span>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block font-medium">
              Fully active staff
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* On Probation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
              On Probation
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {probationCount}
            </span>
            <span className="text-[11px] text-amber-600/80 mt-0.5 block font-medium">
              Evaluation phase
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Exits & Suspended */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#8B1D2C] uppercase tracking-wider block">
              Exits & Suspended
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {suspendedOrTerminatedCount}
            </span>
            <span className="text-[11px] text-[#8B1D2C]/80 mt-0.5 block font-medium">
              Restricted / Concluded
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#8B1D2C]">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search employee by name, email, or employee code..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="notice_period">Notice Period</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
              <option value="resigned">Resigned</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>

            {/* Privacy: Toggle Salaries */}
            <button
              type="button"
              onClick={() => setShowSalaries(!showSalaries)}
              className="px-3.5 py-2.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={showSalaries ? 'Mask Salaries' : 'Show Salaries'}
            >
              {showSalaries ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
              <span>{showSalaries ? 'Hide CTC' : 'Show CTC'}</span>
            </button>

            {/* Reset Filters CTA */}
            {(search || statusFilter !== 'all' || departmentFilter !== 'all' || roleFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setDepartmentFilter('all');
                  setRoleFilter('all');
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-bold text-[#8B1D2C] hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-[#8B1D2C] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Employee Profile</th>
                <th className="py-3.5 px-4">Emp ID</th>
                <th className="py-3.5 px-4">Department & Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Annual CTC</th>
                <th className="py-3.5 px-4">Joining Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                // Skeleton loading rows
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="w-28 h-3.5 bg-slate-200 rounded" />
                          <div className="w-40 h-2.5 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-3 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-24 h-3 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-16 h-5 bg-slate-200 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-20 h-3 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-20 h-3 bg-slate-200 rounded" />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="w-16 h-6 bg-slate-200 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : employees.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#8B1D2C] mx-auto mb-3">
                      <Users className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">
                      No employees match your search criteria
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Try adjusting filters or search keywords, or onboard a new employee to get started.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                        setDepartmentFilter('all');
                        setRoleFilter('all');
                      }}
                      className="mt-4 px-4 py-2 text-xs font-bold text-[#8B1D2C] bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                // Employee Rows
                employees.map((emp) => {
                  const statusInfo = getStatusBadge(emp.status);
                  const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
                  const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {emp.avatarUrl ? (
                            <img
                              src={emp.avatarUrl}
                              alt={fullName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B1D2C] to-[#5C101B] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                              {initials}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-900 block hover:text-[#8B1D2C] transition-colors cursor-pointer"
                              onClick={() => navigate(`/hr/employees/${emp.id}`)}
                            >
                              {fullName}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                              {emp.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Employee Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {emp.employeeCode || '—'}
                      </td>

                      {/* Department & Designation */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {emp.departmentDetails?.name || emp.department || 'General'}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {emp.designationDetails?.title || emp.designation || 'Staff'} •{' '}
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded font-semibold text-[10px] uppercase border ${getRoleBadge(
                              emp.role
                            )}`}
                          >
                            {emp.role || 'employee'}
                          </span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.cls}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}
                          />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Annual CTC / Compensation */}
                      <td className="py-3.5 px-4 font-mono font-medium">
                        {showSalaries ? (
                          emp.salary && Number(emp.salary) > 0 ? (
                            <div>
                              <span className="font-bold text-slate-900 block text-xs">
                                ₹{Number(emp.salary).toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans block font-normal">
                                ≈ ₹{Math.round(Number(emp.salary) / 12).toLocaleString()} / mo
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => navigate(`/hr/employees/${emp.id}/salary`)}
                              className="text-[11px] text-[#8B1D2C] hover:underline font-sans font-semibold cursor-pointer"
                            >
                              + Set Salary
                            </button>
                          )
                        ) : (
                          <span className="text-slate-400 font-bold tracking-widest text-xs select-none">
                            ••••••
                          </span>
                        )}
                      </td>

                      {/* Joining Date */}
                      <td className="py-3.5 px-4 text-slate-600 text-[11px] font-medium">
                        {emp.joiningDate
                          ? new Date(emp.joiningDate).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : '—'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View 360 Profile */}
                          <button
                            type="button"
                            onClick={() => navigate(`/hr/employees/${emp.id}`)}
                            className="p-1.5 text-slate-500 hover:text-[#8B1D2C] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => navigate(`/hr/employees/${emp.id}/edit`)}
                            className="p-1.5 text-slate-500 hover:text-[#8B1D2C] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Employee"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Manage Salary */}
                          <button
                            type="button"
                            onClick={() => navigate(`/hr/employees/${emp.id}/salary`)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Manage Salary & Structure"
                          >
                            <Wallet className="w-4 h-4" />
                          </button>

                          {/* Change Status */}
                          <button
                            type="button"
                            onClick={() => navigate(`/hr/employees/${emp.id}/status`)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Change Employment Status"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {!loading && employees.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {(page - 1) * limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(page * limit, totalCount)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{totalCount}</span> employees
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold text-slate-700 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              <span className="px-3 py-1 font-bold text-slate-800">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold text-slate-700 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Employee Modal */}
      <HRAddEmployeeModal
        isOpen={isAddEditModalOpen}
        initialData={selectedEmployeeForEdit}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setSelectedEmployeeForEdit(null);
        }}
        onSuccess={(savedData, msg) => {
          showToast(msg || 'Employee saved successfully!');
          fetchEmployees();
        }}
      />

      {/* View 360° Profile Modal */}
      <HREmployeeDetailModal
        isOpen={isDetailModalOpen}
        employeeId={selectedEmployeeIdForDetail}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedEmployeeIdForDetail(null);
        }}
        onEdit={(emp) => {
          setSelectedEmployeeForEdit(emp);
          setIsAddEditModalOpen(true);
        }}
        onChangeStatus={(emp) => {
          setSelectedEmployeeForStatus(emp);
          setIsStatusModalOpen(true);
        }}
        onManageSalary={(emp) => {
          setSelectedEmployeeForSalary(emp);
          setIsSalaryModalOpen(true);
        }}
      />

      {/* Change Employment Status Modal */}
      <HRChangeEmployeeStatusModal
        isOpen={isStatusModalOpen}
        employee={selectedEmployeeForStatus}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedEmployeeForStatus(null);
        }}
        onSuccess={(updatedData, msg) => {
          showToast(msg || 'Status updated successfully!');
          fetchEmployees();
        }}
      />

      {/* Manage Salary & Compensation Modal */}
      <HRManageSalaryModal
        isOpen={isSalaryModalOpen}
        employee={selectedEmployeeForSalary}
        onClose={() => {
          setIsSalaryModalOpen(false);
          setSelectedEmployeeForSalary(null);
        }}
        onSuccess={(updatedData, msg) => {
          showToast(msg || 'Salary structure saved successfully!');
          fetchEmployees();
        }}
      />
    </div>
  );
};

export default HREmployeeManagementView;
