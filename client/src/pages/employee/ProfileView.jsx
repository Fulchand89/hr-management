import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  MapPin,
  ShieldCheck,
  CreditCard,
  LogOut,
  CalendarDays,
  BadgeCheck,
  CheckCircle2,
  Camera,
  Lock,
  Edit2,
  X,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Heart,
  Sparkles,
  Wallet
} from 'lucide-react';
import {
  getMyProfile,
  updateMyProfile,
  changePassword as apiChangePassword,
  uploadAvatar as apiUploadAvatar,
  getLeaveBalance
} from '../../services/employeeService';

export const ProfileView = ({ onLogout }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: '',
    empId: '',
    phone: '',
    email: '',
    role: '',
    department: '',
    designation: '',
    joiningDate: '',
    location: '',
    status: 'Active',
    manager: null,
    dob: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    bankName: '',
    accountNoRaw: '',
    accountNo: '',
    ifsc: '',
    avatar: null,
    leaves: {}
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'work' | 'personal' | 'leaves' | 'financial'

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showFullAccountNo, setShowFullAccountNo] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Edit profile state
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');
  const [editEmergencyRelation, setEditEmergencyRelation] = useState('Family');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text || text === 'Not Provided' || text === '--') return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resProfile, resBalances] = await Promise.all([
        getMyProfile().catch(() => null),
        getLeaveBalance().catch(() => null)
      ]);

      if (resProfile?.data || resProfile) {
        const u = resProfile?.data ?? resProfile;
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User';
        const rawDate = u.joiningDate || u.createdAt;
        const joinDateFormatted = rawDate
          ? new Date(rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Not Specified';

        const dobFormatted = u.dob
          ? new Date(u.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Not Provided';

        // Format Leave Balances
        let balancesObj = {};
        const bData = resBalances?.data ?? resBalances;
        const bList = Array.isArray(bData?.balances) ? bData.balances : (Array.isArray(bData) ? bData : []);
        if (bList.length > 0) {
          bList.forEach((b) => {
            const typeName = b.leaveType?.name || 'Leave';
            const key = typeName.toLowerCase();
            balancesObj[key] = {
              name: typeName,
              code: b.leaveType?.code || 'LV',
              left: Number(b.remaining) || 0,
              total: Number(b.allocated) || 0,
              used: Number(b.used) || 0
            };
          });
        }

        const deptName = u.departmentDetails?.name || u.department || 'Not Assigned';
        const desigTitle = u.designationDetails?.title || u.designation || 'Not Assigned';
        const locName = u.branchDetails
          ? `${u.branchDetails.name}${u.branchDetails.city ? ', ' + u.branchDetails.city : ''}`
          : (u.location || 'Not Assigned');

        const roleFormatted = u.role
          ? (u.role === 'hr' ? 'HR Manager' : u.role === 'admin' ? 'Administrator' : 'Employee')
          : 'Employee';

        const rawAcc = u.bankAccountNumber || '';
        const maskedAcc = rawAcc.length >= 4 ? `•••• •••• ${rawAcc.slice(-4)}` : (rawAcc || 'Not Provided');

        setProfile({
          name: fullName,
          empId: u.employeeCode || '--',
          email: u.email || '',
          phone: u.phone || 'Not Provided',
          dob: dobFormatted,
          gender: u.gender ? u.gender.charAt(0).toUpperCase() + u.gender.slice(1) : 'Not Specified',
          role: roleFormatted,
          department: deptName,
          designation: desigTitle,
          joiningDate: joinDateFormatted,
          status: u.status === 'active' ? 'Active' : (u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : 'Active'),
          avatar: u.avatar || null,
          manager: u.manager || null,
          location: locName,
          address: u.address || 'Not Provided',
          emergencyContactName: u.emergencyContactName || 'Not Provided',
          emergencyContactPhone: u.emergencyContactPhone || 'Not Provided',
          emergencyContactRelation: u.emergencyContactRelation || 'Not Specified',
          bankName: u.bankName || 'Not Provided',
          accountNoRaw: rawAcc,
          accountNo: maskedAcc,
          ifsc: u.bankIfsc || 'Not Provided',
          leaves: balancesObj
        });

        // Set edit states
        setEditPhone(u.phone || '');
        setEditAddress(u.address || '');
        setEditEmergencyName(u.emergencyContactName || '');
        setEditEmergencyPhone(u.emergencyContactPhone || '');
        setEditEmergencyRelation(u.emergencyContactRelation || 'Family');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');
    try {
      await updateMyProfile({
        phone: editPhone,
        address: editAddress,
        emergencyContactName: editEmergencyName,
        emergencyContactPhone: editEmergencyPhone,
        emergencyContactRelation: editEmergencyRelation
      });
      setEditSuccess('Profile contact details updated successfully!');
      setProfile((prev) => ({
        ...prev,
        phone: editPhone || 'Not Provided',
        address: editAddress || 'Not Provided',
        emergencyContactName: editEmergencyName || 'Not Provided',
        emergencyContactPhone: editEmergencyPhone || 'Not Provided',
        emergencyContactRelation: editEmergencyRelation || 'Not Specified'
      }));
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditSuccess('');
      }, 1000);
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters long.');
      return;
    }

    setPwdLoading(true);
    try {
      await apiChangePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      setPwdSuccess('Password updated successfully! Next login requires the new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPwdSuccess('');
      }, 1200);
    } catch (err) {
      setPwdError(err?.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Avatar file size must be less than 5 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarUploading(true);
    try {
      const res = await apiUploadAvatar(formData);
      const data = res?.data ?? res ?? {};
      const newAvatar = data?.avatar || data?.avatarUrl;
      if (newAvatar) {
        setProfile((prev) => ({ ...prev, avatar: newAvatar }));
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to upload profile photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Resolve avatar URL
  const apiBase = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '') 
    : 'http://localhost:5000';
  const resolvedAvatar = profile.avatar
    ? (profile.avatar.startsWith('http') ? profile.avatar : `${apiBase}${profile.avatar.startsWith('/') ? '' : '/'}${profile.avatar}`)
    : null;

  // Manager details formatting
  const managerDisplayName = profile.manager
    ? `${profile.manager.firstName || ''} ${profile.manager.lastName || ''}`.trim()
    : 'Not Assigned';
  const managerDesignation = profile.manager?.designation || 'Reporting Manager';
  const managerEmail = profile.manager?.email || '';

  // Tabs configuration
  const tabs = [
    { id: 'all', label: 'All Information', icon: Sparkles },
    { id: 'work', label: 'Work Details', icon: Briefcase },
    { id: 'personal', label: 'Personal & Contact', icon: User },
    { id: 'leaves', label: 'Leave Quotas', icon: CalendarDays },
    { id: 'financial', label: 'Bank Details', icon: CreditCard }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto font-sans animate-pulse">
        {/* Skeleton Hero */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="h-32 sm:h-40 bg-slate-200" />
          <div className="p-6 sm:p-8 pt-0 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 -mt-14 mb-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-300 ring-4 ring-white" />
              <div className="space-y-2 flex-1">
                <div className="h-6 w-48 bg-slate-200 rounded-lg" />
                <div className="h-4 w-72 bg-slate-100 rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 h-64 border border-slate-200" />
            <div className="bg-white rounded-3xl p-6 h-48 border border-slate-200" />
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 h-56 border border-slate-200" />
            <div className="bg-white rounded-3xl p-6 h-56 border border-slate-200" />
          </div>
        </div>
      </div>
    );
  }

  const renderLeaveQuotas = () => (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Leave Quota Balances</h3>
            <p className="text-[11px] text-slate-400">Available annual allocations</p>
          </div>
        </div>
        <span className="text-xs font-bold text-[#8B1D2C]">Year {new Date().getFullYear()}</span>
      </div>

      <div className="space-y-3">
        {Object.keys(profile.leaves).length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No leave quotas allocated yet.
          </div>
        ) : (
          Object.entries(profile.leaves).map(([key, val]) => {
            const left = val.left ?? 0;
            const total = val.total ?? 0;
            const used = val.used ?? Math.max(0, total - left);
            const pct = total > 0 ? Math.round((left / total) * 100) : 0;
            return (
              <div key={key} className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      {val.code || 'LV'}
                    </span>
                    <span className="font-bold text-slate-800 capitalize">
                      {val.name || key}
                    </span>
                  </div>
                  <span className="font-black text-[#8B1D2C] text-sm">
                    {left} <span className="text-xs font-normal text-slate-500">/ {total}d</span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-200 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B1D2C] to-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(total > 0 ? 5 : 0, pct))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                  <span>{used} days consumed</span>
                  <span>{pct}% balance remaining</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderBankDetails = () => (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Bank Details</h3>
            <p className="text-[11px] text-slate-400">Direct salary deposit account</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Encrypted
        </span>
      </div>

      <div className="space-y-2.5 text-xs text-slate-600">
        {/* Salary Bank */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
          <span className="text-slate-400 font-medium">Salary Bank</span>
          <span className="font-bold text-slate-900">{profile.bankName}</span>
        </div>

        {/* Account Number with Mask/Unmask & Copy */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
          <span className="text-slate-400 font-medium">Account Number</span>
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-slate-900">
              {showFullAccountNo ? profile.accountNoRaw || profile.accountNo : profile.accountNo}
            </span>
            {profile.accountNoRaw && (
              <button
                type="button"
                onClick={() => setShowFullAccountNo(!showFullAccountNo)}
                title={showFullAccountNo ? 'Mask Account' : 'Show Full Account'}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showFullAccountNo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleCopy(profile.accountNoRaw || profile.accountNo, 'accNo')}
              title="Copy Account Number"
              className="text-slate-400 hover:text-[#8B1D2C] transition-colors cursor-pointer"
            >
              {copiedKey === 'accNo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* IFSC Code with Copy */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
          <span className="text-slate-400 font-medium">IFSC Code</span>
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono text-slate-900">{profile.ifsc}</span>
            <button
              type="button"
              onClick={() => handleCopy(profile.ifsc, 'ifsc')}
              title="Copy IFSC"
              className="text-slate-400 hover:text-[#8B1D2C] transition-colors cursor-pointer"
            >
              {copiedKey === 'ifsc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Link to Salary & Payslips View */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => navigate('/employee/salary')}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 text-[#8B1D2C] border border-rose-200/80 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99]"
        >
          <Wallet className="w-4 h-4" />
          <span>View Salary Structure & Payslips &rarr;</span>
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-400 text-center pt-1">
        Bank records and salary grades are managed strictly by HR & Finance. Contact payroll for modifications.
      </p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-10">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP PROFILE HERO CARD
      ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Cover Header Banner */}
        <div className="relative h-32 sm:h-44 bg-gradient-to-r from-slate-950 via-slate-900 to-[#7A1523] overflow-hidden">
          {/* Subtle Decorative Pattern & Glow */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Banner Badges */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur-md text-white/90 border border-white/15 flex items-center gap-1.5 shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-rose-300" />
                {profile.department}
              </span>
              <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-[11px] font-medium bg-black/20 backdrop-blur-md text-white/80 border border-white/10 items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-300" />
                {profile.location}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadProfile}
                title="Refresh Profile"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all cursor-pointer border border-white/15"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition-all cursor-pointer border border-rose-400/30 backdrop-blur-md shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14 sm:-mt-16 mb-4">
            {/* Left: Avatar + Identity */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Avatar with Status & Upload */}
              <div className="relative shrink-0 group self-start">
                {resolvedAvatar ? (
                  <img
                    src={resolvedAvatar}
                    alt={profile.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-xl bg-slate-100"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-white shadow-xl bg-gradient-to-br from-[#8B1D2C] to-[#5C101B] text-white flex items-center justify-center font-black text-3xl tracking-wider select-none">
                    {profile.name
                      ? profile.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'EM'}
                  </div>
                )}

                {/* Active Indicator Pulse */}
                <div
                  title="Active Status"
                  className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-3 border-white rounded-full flex items-center justify-center shadow-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                {/* Camera Hover Upload Action */}
                <label
                  title="Change Profile Photo"
                  className="absolute inset-0 bg-black/50 backdrop-blur-2xs rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-200"
                >
                  {avatarUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">Upload</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={avatarUploading}
                    onChange={handleAvatarChange}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Name, Designation & Badges */}
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {profile.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {profile.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(profile.empId, 'empId')}
                    title="Click to copy Employee ID"
                    className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>{profile.empId}</span>
                    {copiedKey === 'empId' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                  <span className="text-slate-800 font-bold">{profile.designation}</span> &bull; {profile.department}
                </p>

                {/* Email Chip with Copy */}
                <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
                  <button
                    type="button"
                    onClick={() => handleCopy(profile.email, 'email')}
                    className="text-slate-600 hover:text-[#8B1D2C] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.email}</span>
                    {copiedKey === 'email' && <span className="text-[10px] text-emerald-600 font-bold ml-1">Copied!</span>}
                  </button>
                  <span className="text-slate-300">&bull;</span>
                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Joined {profile.joiningDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 transition-all shadow-xs hover:border-slate-300 cursor-pointer active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#8B1D2C]" />
                Edit Contact
              </button>

              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all shadow-sm shadow-[#8B1D2C]/20 cursor-pointer active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                Change Password
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-100 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-[#8B1D2C] flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">System Role</span>
                <span className="font-bold text-slate-800 truncate block">{profile.role}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Manager</span>
                <span className="font-bold text-slate-800 truncate block">{managerDisplayName}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Branch</span>
                <span className="font-bold text-slate-800 truncate block">{profile.location}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Joining Date</span>
                <span className="font-bold text-slate-800 truncate block">{profile.joiningDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. TAB NAVIGATION BAR
      ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN CONTENT GRID (ORGANIZED BY SECTION TABS)
      ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Official Employment & Work Policy */}
          {(activeTab === 'all' || activeTab === 'work') && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Employment & Organizational Record</h2>
                    <p className="text-[11px] text-slate-400 font-medium">Core company details and reporting hierarchy</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Verified HR Record
                </span>
              </div>

              {/* Information Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Official Name</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">{profile.name}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#8B1D2C] shrink-0 shadow-2xs">
                    <BadgeCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Employee ID</span>
                    <span className="font-bold font-mono text-slate-900 text-sm mt-0.5 block">{profile.empId}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Department</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.department}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Designation</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.designation}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date of Joining</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.joiningDate}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Assigned Worksite</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">{profile.location}</span>
                  </div>
                </div>
              </div>

              {/* Reporting Manager Highlight Card */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#8B1D2C] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {profile.manager?.firstName ? profile.manager.firstName[0] : 'M'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800/80 block">Reporting Manager</span>
                    <h4 className="font-bold text-slate-900 text-sm">{managerDisplayName}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{managerDesignation}</p>
                  </div>
                </div>

                {managerEmail && (
                  <a
                    href={`mailto:${managerEmail}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-rose-200 shadow-2xs self-start sm:self-center transition-colors cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#8B1D2C]" />
                    <span>Contact Manager</span>
                  </a>
                )}
              </div>
            </div>
          )}



          {/* Section: Personal & Emergency Contact */}
          {(activeTab === 'all' || activeTab === 'personal') && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Personal & Contact Profile</h2>
                    <p className="text-[11px] text-slate-400 font-medium">Private demographic and emergency contacts</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs font-bold text-[#8B1D2C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Edit Info
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Primary Phone</span>
                    <span className="font-bold font-mono text-slate-900 text-sm mt-0.5 block">{profile.phone}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Corporate Email</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">{profile.email}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.dob}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gender</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.gender}</span>
                  </div>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Residential Address</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{profile.address}</span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Sub-Card */}
              <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-[#8B1D2C] flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Emergency Contact</span>
                    {profile.emergencyContactRelation && profile.emergencyContactRelation !== 'Not Specified' && (
                      <span className="text-[11px] font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded-full">
                        {profile.emergencyContactRelation}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                    <span className="font-bold text-slate-900 text-sm">{profile.emergencyContactName}</span>
                    <span className="font-mono text-slate-600 font-medium text-xs">
                      {profile.emergencyContactPhone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Section: Annual Leave Quota Balances (When Leaves Tab is Selected) */}
          {activeTab === 'leaves' && renderLeaveQuotas()}

          {/* Section: Bank Details (When Bank Details Tab is Selected) */}
          {activeTab === 'financial' && renderBankDetails()}
        </div>

        {/* Right Column (1 Col): Shown in All Information view */}
        {activeTab === 'all' && (
          <div className="space-y-6">
            {renderLeaveQuotas()}
            {renderBankDetails()}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. EDIT CONTACT MODAL
      ────────────────────────────────────────────────────────────── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Contact Information</h3>
                  <p className="text-xs text-slate-400">Update your phone, address and emergency contacts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Feedback */}
            {editError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {editSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{editSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 my-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Residential Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="House / Flat No., Street, City, Pincode"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Emergency Contact Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={editEmergencyName}
                      onChange={(e) => setEditEmergencyName(e.target.value)}
                      placeholder="Contact person name"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Relationship
                  </label>
                  <select
                    value={editEmergencyRelation}
                    onChange={(e) => setEditEmergencyRelation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Family">Family Member</option>
                    <option value="Friend">Friend / Relative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Emergency Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="tel"
                    value={editEmergencyPhone}
                    onChange={(e) => setEditEmergencyPhone(e.target.value)}
                    placeholder="Emergency reachable phone"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. CHANGE PASSWORD MODAL
      ────────────────────────────────────────────────────────────── */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsPasswordModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Change Account Password</h3>
                  <p className="text-xs text-slate-400">Keep your account secure with regular updates</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error & Success Feedback */}
            {pwdError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 my-5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements helper */}
              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${newPassword.length >= 8 ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>At least 8 characters long</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className={`w-3.5 h-3.5 ${newPassword && newPassword === confirmPassword ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Both passwords match</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={pwdLoading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
