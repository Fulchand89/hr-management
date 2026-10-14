import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  CreditCard,
  Lock,
  Edit2,
  X,
  AlertCircle,
  Loader2,
  Camera,
  CheckCircle2,
  CalendarDays,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  getMyProfile,
  updateMyProfile,
  changePassword as apiChangePassword,
  uploadAvatar as apiUploadAvatar,
  getLeaveBalance
} from '../../services/employeeService';
import { ProfileSkeleton } from '../../components/common/Skeleton';

export const ProfileView = ({ onBack, onLogout }) => {
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
    accountNo: '',
    ifsc: '',
    avatar: null,
    leaves: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    bankAccountNumber: '',
    bankIfsc: ''
  });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: 'Family'
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
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
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Employee';
        const rawJoin = u.joiningDate || u.createdAt;
        const joinDate = rawJoin
          ? new Date(rawJoin).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Not Specified';

        const dobFormatted = u.dob
          ? new Date(u.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Not Provided';

        // Format Leave Balances
        let formattedLeaves = [];
        const bData = resBalances?.data ?? resBalances;
        const bList = Array.isArray(bData?.balances) ? bData.balances : (Array.isArray(bData) ? bData : []);
        if (bList.length > 0) {
          formattedLeaves = bList.map((b) => ({
            name: b.leaveType?.name || 'Leave',
            code: b.leaveType?.code || 'LV',
            remaining: Number(b.remaining) || 0,
            allocated: Number(b.allocated) || 0,
            used: Number(b.used) || 0
          }));
        }

        const deptName = u.departmentDetails?.name || u.department || 'General';
        const desigTitle = u.designationDetails?.title || u.designation || 'Staff';
        const locName = u.branchDetails
          ? `${u.branchDetails.name}${u.branchDetails.city ? ', ' + u.branchDetails.city : ''}`
          : (u.location || 'Main Office');

        const rawAcc = u.bankAccountNumber || '';
        const maskedAcc = rawAcc.length >= 4 ? `•••• •••• ${rawAcc.slice(-4)}` : (rawAcc || 'Not Provided');

        setProfile({
          name: fullName,
          empId: u.employeeCode || '--',
          email: u.email || '',
          phone: u.phone || 'Not Provided',
          dob: dobFormatted,
          gender: u.gender ? u.gender.charAt(0).toUpperCase() + u.gender.slice(1) : 'Not Specified',
          role: u.role === 'hr' ? 'HR Manager' : u.role === 'admin' ? 'Administrator' : 'Employee',
          department: deptName,
          designation: desigTitle,
          joiningDate: joinDate,
          status: u.status === 'active' ? 'Active' : (u.status || 'Active'),
          avatar: u.avatar || null,
          manager: u.manager || null,
          location: locName,
          address: u.address || 'Not Provided',
          emergencyContactName: u.emergencyContactName || 'Not Provided',
          emergencyContactPhone: u.emergencyContactPhone || 'Not Provided',
          emergencyContactRelation: u.emergencyContactRelation || 'Family',
          bankName: u.bankName || 'Not Provided',
          accountNo: maskedAcc,
          rawAccountNo: rawAcc,
          ifsc: u.bankIfsc || 'Not Provided',
          leaves: formattedLeaves
        });

        setEditForm({
          phone: u.phone || '',
          address: u.address || '',
          emergencyContactName: u.emergencyContactName || '',
          emergencyContactPhone: u.emergencyContactPhone || '',
          emergencyContactRelation: u.emergencyContactRelation || 'Family'
        });
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

    try {
      await updateMyProfile(editForm);
      setProfile((prev) => ({
        ...prev,
        phone: editForm.phone || 'Not Provided',
        address: editForm.address || 'Not Provided',
        emergencyContactName: editForm.emergencyContactName || 'Not Provided',
        emergencyContactPhone: editForm.emergencyContactPhone || 'Not Provided',
        emergencyContactRelation: editForm.emergencyContactRelation || 'Family'
      }));
      setIsEditModalOpen(false);
      showToast('Contact details updated successfully!');
    } catch (err) {
      setEditError(err?.response?.data?.message || 'Failed to update contact details');
    } finally {
      setEditLoading(false);
    }
  };

  const handleUpdateBankDetails = async (e) => {
    e.preventDefault();
    setBankLoading(true);
    setBankError('');

    if (!bankForm.bankName.trim()) {
      setBankError('Bank Name is required.');
      setBankLoading(false);
      return;
    }
    if (!bankForm.bankAccountNumber.trim() || bankForm.bankAccountNumber.trim().length < 8) {
      setBankError('Bank account number must be at least 8 digits.');
      setBankLoading(false);
      return;
    }
    if (!bankForm.bankIfsc.trim() || bankForm.bankIfsc.trim().length < 6) {
      setBankError('Please enter a valid IFSC code.');
      setBankLoading(false);
      return;
    }

    try {
      await updateMyProfile({
        bankName: bankForm.bankName.trim(),
        bankAccountNumber: bankForm.bankAccountNumber.trim(),
        bankIfsc: bankForm.bankIfsc.trim().toUpperCase()
      });

      const rawAcc = bankForm.bankAccountNumber.trim();
      const maskedAcc = rawAcc.length >= 4 ? `•••• •••• ${rawAcc.slice(-4)}` : rawAcc;

      setProfile((prev) => ({
        ...prev,
        bankName: bankForm.bankName.trim(),
        accountNo: maskedAcc,
        rawAccountNo: rawAcc,
        ifsc: bankForm.bankIfsc.trim().toUpperCase()
      }));

      setIsBankModalOpen(false);
      showToast('Salary bank details updated successfully! HR has received real-time notification.');
    } catch (err) {
      setBankError(err?.response?.data?.message || 'Failed to update bank details');
    } finally {
      setBankLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters');
      return;
    }

    setPwdLoading(true);
    try {
      await apiChangePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordModalOpen(false);
      showToast('Password changed successfully!');
    } catch (err) {
      setPwdError(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo size must be less than 5 MB');
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
        showToast('Profile photo updated successfully!');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (isLoading || !profile) {
    return <ProfileSkeleton />;
  }

  const apiBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
    : 'http://localhost:5000';
  const resolvedAvatar = profile.avatar
    ? (profile.avatar.startsWith('http') ? profile.avatar : `${apiBase}${profile.avatar.startsWith('/') ? '' : '/'}${profile.avatar}`)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack || (() => navigate('/employee/dashboard'))}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">My Profile</h1>
            <p className="text-xs text-slate-500">View personal information, job records, and credentials</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-[#8B1D2C]" />
            <span>Edit Contact</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative group shrink-0">
          {resolvedAvatar ? (
            <img
              src={resolvedAvatar}
              alt={profile.name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-rose-50 shadow-md bg-slate-100"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl ring-4 ring-rose-50 shadow-md bg-gradient-to-br from-[#8B1D2C] to-[#5C101B] text-white flex items-center justify-center font-black text-2xl select-none">
              {profile.name
                ? profile.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                : 'EM'}
            </div>
          )}

          {/* Camera Upload Button */}
          <label
            title="Upload Profile Picture"
            className="absolute inset-0 bg-black/50 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
          >
            {avatarUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <>
                <Camera className="w-5 h-5 mb-0.5" />
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

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-[#8B1D2C] border border-rose-100">
                {profile.role}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                {profile.empId}
              </span>
            </div>
          </div>

          <p className="text-xs font-medium text-slate-500">
            {profile.designation} &bull; {profile.department}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {profile.email}
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {profile.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {profile.location}
            </span>
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Employment Details */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Employment Details</h3>
              <p className="text-[11px] text-slate-400">Official company record</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-slate-400 font-medium">Department</span>
              <span className="font-bold text-slate-800">{profile.department}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-slate-400 font-medium">Designation</span>
              <span className="font-bold text-slate-800">{profile.designation}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-slate-400 font-medium">Joining Date</span>
              <span className="font-bold text-slate-800">{profile.joiningDate}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-slate-400 font-medium">Work Location</span>
              <span className="font-bold text-slate-800">{profile.location}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-slate-400 font-medium">Status</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                {profile.status}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Personal & Emergency Contact */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Personal & Emergency Contact</h3>
                <p className="text-[11px] text-slate-400">Private reachability info</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs font-bold text-[#8B1D2C] hover:underline cursor-pointer"
            >
              Edit
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-slate-400 font-medium">Date of Birth</span>
              <span className="font-bold text-slate-800">{profile.dob}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-slate-400 font-medium">Gender</span>
              <span className="font-bold text-slate-800">{profile.gender}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100">
              <span className="text-slate-400 font-medium">Address</span>
              <span className="font-bold text-slate-800 text-right truncate max-w-[200px]">
                {profile.address}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-100/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-rose-800 uppercase">Emergency Contact</span>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  {profile.emergencyContactRelation}
                </span>
              </div>
              <p className="font-bold text-slate-900 text-xs">
                {profile.emergencyContactName} &bull; <span className="font-mono text-slate-600">{profile.emergencyContactPhone}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Leave Quota Balances */}
      {profile.leaves.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">My Leave Quotas</h3>
                <p className="text-[11px] text-slate-400">Available allocations for current year</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#8B1D2C]">Year {new Date().getFullYear()}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {profile.leaves.map((l, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs gap-1">
                  <span className="font-bold text-slate-800 truncate" title={l.name}>{l.name}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                    {l.code}
                  </span>
                </div>
                <div className="flex items-baseline gap-1 pt-1">
                  <span className="text-xl font-black text-[#8B1D2C]">{l.remaining}</span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">/ {l.allocated} days left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Bank Information */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Salary Bank Account</h3>
              <p className="text-[11px] text-slate-400">Account on file for monthly salary credits</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setBankForm({
                bankName: profile.bankName === 'Not Provided' ? '' : profile.bankName,
                bankAccountNumber: profile.rawAccountNo || '',
                bankIfsc: profile.ifsc === 'Not Provided' ? '' : profile.ifsc
              });
              setBankError('');
              setIsBankModalOpen(true);
            }}
            className="text-xs font-bold text-[#8B1D2C] hover:underline cursor-pointer flex items-center gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Bank Details</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Bank Name</span>
            <span className="font-bold text-slate-900">{profile.bankName}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">Account Number</span>
            <span className="font-bold font-mono text-slate-900">{profile.accountNo}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-slate-400 font-medium block mb-1">IFSC Code</span>
            <span className="font-bold font-mono text-slate-900">{profile.ifsc}</span>
          </div>
        </div>
      </div>

      {/* EDIT CONTACT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Contact Information</h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Street, City, Pincode"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Emergency Name</label>
                  <input
                    type="text"
                    value={editForm.emergencyContactName}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })}
                    placeholder="Contact person"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Relation</label>
                  <select
                    value={editForm.emergencyContactRelation}
                    onChange={(e) => setEditForm({ ...editForm, emergencyContactRelation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  >
                    <option value="Family">Family Member</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Emergency Phone</label>
                <input
                  type="tel"
                  value={editForm.emergencyContactPhone}
                  onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })}
                  placeholder="Emergency contact phone"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Change Password</h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pwdError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPwd ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">New Password (Min 8 chars)</label>
                <div className="relative">
                  <input
                    type={showNewPwd ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPwd ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 pr-9 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BANK DETAILS MODAL */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-[#8B1D2C]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Update Salary Bank Account</h3>
                  <p className="text-xs text-slate-500">Changes will immediately alert HR administration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bankError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bankError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateBankDetails} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Bank, State Bank of India"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full bank account number"
                  value={bankForm.bankAccountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, bankAccountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC0001234"
                  value={bankForm.bankIfsc}
                  onChange={(e) => setBankForm({ ...bankForm, bankIfsc: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <strong>Note:</strong> Editing your bank credentials will trigger an immediate real-time alert to all active HRs with your updated details to ensure accurate payroll disbursement.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankLoading}
                  className="px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {bankLoading ? 'Saving...' : 'Save Bank Details'}
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
