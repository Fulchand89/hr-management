import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Calendar,
  DollarSign,
  Shield,
  Clock,
  Edit,
  ShieldAlert,
  Loader2,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Wallet,
  TrendingUp,
  Percent
} from 'lucide-react';
import { getEmployeeById } from '../../services/hrService';

export const HREmployeeDetailModal = ({
  isOpen,
  onClose,
  employeeId,
  onEdit,
  onChangeStatus,
  onManageSalary
}) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fetch full 360 profile on open
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const res = await getEmployeeById(employeeId);
        const data = res?.data || res;
        setProfile(data);
      } catch (err) {
        console.error('Failed to load employee 360 profile:', err);
        setErrorMessage(
          err?.response?.data?.message || 'Failed to fetch employee details.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [isOpen, employeeId]);

  if (!isOpen) return null;

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
          label: 'On Probation',
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

  const statusBadge = getStatusBadge(profile?.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95 duration-200 font-sans text-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#8B1D2C] font-bold text-base">
              {profile ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}` : 'EM'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Employee 360° Profile
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Detailed organizational record and contact information
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
            <p className="text-xs font-semibold text-slate-500">Loading employee profile details...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="m-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-[#8B1D2C] text-xs font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loaded Profile Content */}
        {!isLoading && profile && (
          <div className="p-6 space-y-6">
            {/* Top Profile Card */}
            <div className="p-5 bg-gradient-to-br from-slate-50 to-rose-50/40 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B1D2C] to-[#5C101B] text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-[#8B1D2C]/20">
                  {profile.firstName?.[0]}
                  {profile.lastName?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-slate-900">
                      {profile.firstName} {profile.lastName}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.cls}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                    <span className="font-bold text-slate-800">
                      {profile.employeeCode || 'N/A'}
                    </span>
                    <span>•</span>
                    <span className="capitalize font-semibold text-slate-600">{profile.role || 'Employee'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onEdit) onEdit(profile);
                  }}
                  className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 hover:border-rose-300 hover:text-[#8B1D2C] text-slate-700 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onChangeStatus) onChangeStatus(profile);
                  }}
                  className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 hover:border-amber-300 hover:text-amber-600 text-slate-700 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Status
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onManageSalary) onManageSalary(profile);
                  }}
                  className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-700 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Salary
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Department</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                  {profile.departmentDetails?.name || profile.department || 'General'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Designation</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                  {profile.designationDetails?.title || profile.designation || 'Staff'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Joining Date</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                  {profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Annual CTC</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                  {profile.salary ? `₹${Number(profile.salary).toLocaleString()}` : 'Confidential'}
                </span>
              </div>
            </div>

            {/* Details Section 1: Contact & Personal Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#8B1D2C]" />
                Contact & Identity Details
              </h4>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 divide-y divide-slate-100 shadow-2xs">
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-2 font-medium">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Official Email
                  </span>
                  <span className="font-bold text-slate-800 select-all">
                    {profile.email}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-2 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone Number
                  </span>
                  <span className="font-bold text-slate-800">
                    {profile.phone || 'Not Provided'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-2 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Date of Birth
                  </span>
                  <span className="font-bold text-slate-800">
                    {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-2 font-medium">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    Gender
                  </span>
                  <span className="font-bold text-slate-800 capitalize">
                    {profile.gender || 'Not Specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Section 2: Organizational Hierarchy */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-[#8B1D2C]" />
                Organization & Reporting
              </h4>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 divide-y divide-slate-100 shadow-2xs">
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Reporting Manager</span>
                  <span className="font-bold text-slate-800">
                    {profile.manager
                      ? `${profile.manager.firstName} ${profile.manager.lastName} (${profile.manager.employeeCode})`
                      : 'None / Top Management'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Assigned Branch</span>
                  <span className="font-bold text-slate-800">
                    {profile.branchDetails?.name || 'Headquarters'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">System Role</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {profile.roleDetails?.displayName || profile.role || 'Employee'}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Section 3: Compensation & Salary Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-[#8B1D2C]" />
                  Compensation & Salary Structure
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onManageSalary) onManageSalary(profile);
                  }}
                  className="text-[11px] font-bold text-[#8B1D2C] hover:underline cursor-pointer"
                >
                  Configure / Revise
                </button>
              </div>

              {profile.salaryStructure ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Annual Cost to Company (CTC)</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      ₹{Number(profile.salaryStructure.ctc).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                        Monthly Earnings
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Basic Salary:</span>
                        <span className="font-semibold text-slate-800">₹{Number(profile.salaryStructure.basicSalary || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>HRA:</span>
                        <span className="font-semibold text-slate-800">₹{Number(profile.salaryStructure.hra || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Special Allowance:</span>
                        <span className="font-semibold text-slate-800">₹{Number(profile.salaryStructure.specialAllowance || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                      <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
                        <Percent className="w-3 h-3 text-rose-600" />
                        Monthly Deductions
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>PF (12%):</span>
                        <span className="font-semibold text-slate-800">₹{Number(profile.salaryStructure.pfDeduction || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>ESIC:</span>
                        <span className="font-semibold text-slate-800">₹{Number(profile.salaryStructure.esiDeduction || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>TDS / Tax:</span>
                        <span className="font-semibold text-slate-800">₹{Number(profile.salaryStructure.taxDeduction || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-900">Net Take-Home Salary:</span>
                    <span className="text-sm font-bold text-emerald-900 font-mono">
                      ₹{Number(profile.salaryStructure.netSalary || 0).toLocaleString()} / month
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-600 block">
                      Annual CTC: <strong className="text-slate-900">{profile.salary ? `₹${Number(profile.salary).toLocaleString()}` : 'Not set'}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Detailed component breakdown is not configured yet.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onManageSalary) onManageSalary(profile);
                    }}
                    className="px-3 py-1.5 bg-[#8B1D2C] text-white font-bold rounded-lg shadow-xs hover:bg-[#731724] transition-colors cursor-pointer"
                  >
                    Set Structure
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Account created on {new Date(profile.createdAt).toLocaleDateString()}</span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HREmployeeDetailModal;
