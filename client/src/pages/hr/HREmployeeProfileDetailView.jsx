import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
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
  Layers,
  MapPin,
  ExternalLink,
  ShieldCheck,
  FileText,
  Check,
  X,
  CreditCard,
  UploadCloud
} from 'lucide-react';
import {
  getEmployeeById,
  getEmployeeDocuments,
  verifyEmployeeDocument,
  updateEmployee,
  uploadEmployeeDocumentForUser
} from '../../services/hrService';
import { ProfileSkeleton } from '../../components/common/Skeleton';

export const HREmployeeProfileDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Bank Account Edit Modal State (HR Management)
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: '', bankAccountNumber: '', bankIfsc: '' });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenBankModal = () => {
    setBankForm({
      bankName: profile?.bankName || '',
      bankAccountNumber: profile?.bankAccountNumber || '',
      bankIfsc: profile?.bankIfsc || ''
    });
    setBankError('');
    setIsBankModalOpen(true);
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    setBankError('');
    setBankLoading(true);
    try {
      await updateEmployee(profile.id, {
        bankName: bankForm.bankName.trim(),
        bankAccountNumber: bankForm.bankAccountNumber.trim(),
        bankIfsc: bankForm.bankIfsc.trim().toUpperCase()
      });

      setProfile((prev) => ({
        ...prev,
        bankName: bankForm.bankName.trim(),
        bankAccountNumber: bankForm.bankAccountNumber.trim(),
        bankIfsc: bankForm.bankIfsc.trim().toUpperCase()
      }));

      setIsBankModalOpen(false);
    } catch (err) {
      const errorMsg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        'Failed to update bank details';
      setBankError(errorMsg);
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const [resProfile, resDocs] = await Promise.all([
          getEmployeeById(id),
          getEmployeeDocuments(id).catch(() => [])
        ]);
        const data = resProfile?.data || resProfile;
        setProfile(data);
        const docsList = Array.isArray(resDocs?.data) ? resDocs.data : (Array.isArray(resDocs) ? resDocs : []);
        setDocuments(docsList);
      } catch (err) {
        console.error('Failed to load employee 360 profile:', err);
        setErrorMessage(
          err?.response?.data?.message || 'Failed to fetch employee details. Please check connection.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  const fileUploadRef = useRef(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const handleUploadNewDoc = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const title = file.name.replace(/\.[^/.]+$/, '');
      formData.append('title', title);
      formData.append('documentType', 'id_proof');
      await uploadEmployeeDocumentForUser(id, formData);
      const resDocs = await getEmployeeDocuments(id);
      const docsList = Array.isArray(resDocs?.data) ? resDocs.data : (Array.isArray(resDocs) ? resDocs : []);
      setDocuments(docsList);
      showToast(`Document "${title}" uploaded & verified!`);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
      if (fileUploadRef.current) fileUploadRef.current.value = '';
    }
  };

  const handleVerifyDoc = async (docId) => {
    try {
      await verifyEmployeeDocument(docId, { status: 'verified', remarks: 'Verified by HR' });
      const resDocs = await getEmployeeDocuments(id);
      const docsList = Array.isArray(resDocs?.data) ? resDocs.data : (Array.isArray(resDocs) ? resDocs : []);
      setDocuments(docsList);
      showToast('Document marked as Verified successfully!');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update document status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active Workforce',
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

  const earningsSum = profile?.salaryStructure
    ? (Number(profile.salaryStructure.basicSalary || 0) +
       Number(profile.salaryStructure.hra || 0) +
       Number(profile.salaryStructure.specialAllowance || 0))
    : 0;

  const monthlySalary =
    profile?.salary ||
    (earningsSum > 0 ? earningsSum : null) ||
    (profile?.salaryStructure?.ctc ? Math.round(Number(profile.salaryStructure.ctc) / 12) : null) ||
    profile?.salaryStructure?.netSalary ||
    null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans text-slate-800">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/employees')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-[#8B1D2C] transition-colors cursor-pointer group"
            title="Back to Employees"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {isLoading ? 'Employee Profile' : `${profile?.firstName || ''} ${profile?.lastName || ''}`}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C]">
                360° Profile
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Comprehensive personnel directory record, organizational placement, and compensation
            </p>
          </div>
        </div>

        {/* Action Shortcuts */}
        {!isLoading && profile && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => navigate(`/hr/employees/${profile.id}/edit`)}
              className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 hover:border-rose-300 hover:text-[#8B1D2C] text-slate-700 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Profile
            </button>

            <button
              type="button"
              onClick={() => navigate(`/hr/employees/${profile.id}/salary`)}
              className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 hover:border-emerald-300 hover:text-emerald-700 text-slate-700 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              Salary Structure
            </button>

            <button
              type="button"
              onClick={() => navigate(`/hr/employees/${profile.id}/status`)}
              className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 hover:border-amber-300 hover:text-amber-600 text-slate-700 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Change Status
            </button>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && <ProfileSkeleton />}

      {/* Error Alert */}
      {!isLoading && errorMessage && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-[#8B1D2C] text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Details Container */}
      {!isLoading && profile && (
        <div className="space-y-6">
          {/* Top Hero Banner */}
          <div className="p-6 bg-gradient-to-br from-slate-50 via-rose-50/20 to-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B1D2C] to-[#5C101B] text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-[#8B1D2C]/20 border border-rose-900/10">
                {profile.firstName?.[0]}
                {profile.lastName?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.cls}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                    {statusBadge.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-mono">
                  <span className="font-bold text-slate-800">{profile.employeeCode || 'N/A'}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-600 capitalize">{profile.role || 'employee'}</span>
                  <span>•</span>
                  <span>Joined on {profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monthly Salary</span>
                <span className="text-base font-bold text-slate-900 font-mono block">
                  {monthlySalary ? `₹${Number(monthlySalary).toLocaleString()}` : 'Not set'}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Mini-Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Department</span>
              <span className="text-sm font-bold text-slate-800 mt-1 block truncate">
                {profile.departmentDetails?.name || profile.department || 'General'}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Designation</span>
              <span className="text-sm font-bold text-slate-800 mt-1 block truncate">
                {profile.designationDetails?.title || profile.designation || 'Staff'}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Reporting Manager</span>
              <span className="text-sm font-bold text-slate-800 mt-1 block truncate">
                {profile.manager ? `${profile.manager.firstName} ${profile.manager.lastName}` : 'Top Leadership'}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Assigned Branch</span>
              <span className="text-sm font-bold text-slate-800 mt-1 block truncate">
                {profile.branchDetails?.name || 'Main Office'}
              </span>
            </div>
          </div>

          {/* Grid Layout: Contact & Personal Info + Org Hierarchy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact & Personal Information */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#8B1D2C]" />
                Personal & Contact Details
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Official Email
                  </span>
                  <span className="font-bold text-slate-800 select-all">{profile.email}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                  </span>
                  <span className="font-bold text-slate-800">{profile.phone || 'Not Provided'}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Birth
                  </span>
                  <span className="font-bold text-slate-800">
                    {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400" /> Gender
                  </span>
                  <span className="font-bold text-slate-800 capitalize">{profile.gender || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Organizational Placement */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-[#8B1D2C]" />
                Corporate Structure & Security
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Reporting Line</span>
                  <span className="font-bold text-slate-800">
                    {profile.manager
                      ? `${profile.manager.firstName} ${profile.manager.lastName} (${profile.manager.employeeCode || 'Manager'})`
                      : 'Executive Level'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Department Code</span>
                  <span className="font-bold text-slate-800">
                    {profile.departmentDetails?.code || 'GEN'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">System Role</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {profile.roleDetails?.displayName || profile.role || 'Employee'}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Account ID</span>
                  <span className="font-mono text-slate-500 text-[11px] truncate max-w-[200px]">{profile.id}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Salary */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#8B1D2C]" />
                Monthly Salary
              </h3>
              <button
                type="button"
                onClick={() => navigate(`/hr/employees/${profile.id}/salary`)}
                className="text-xs font-bold text-[#8B1D2C] hover:text-[#731724] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Revise / Configure Salary</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 block">Monthly Salary</span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono mt-1 block">
                  {monthlySalary ? (
                    <>
                      ₹{Number(monthlySalary).toLocaleString()}
                      <span className="text-xs font-normal text-slate-500 font-sans ml-1.5">/ month</span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-slate-400 font-sans">Not configured</span>
                  )}
                </span>
              </div>
              {monthlySalary ? (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full">
                  Active
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/hr/employees/${profile.id}/salary`)}
                  className="px-4 py-2 bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Configure Salary
                </button>
              )}
            </div>
          </div>

          {/* Salary Bank Account & Disbursement Details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#8B1D2C]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Salary Bank Account & Disbursement Details
                </h3>
              </div>
              <button
                type="button"
                onClick={handleOpenBankModal}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-[#8B1D2C] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Bank Details</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Bank Name
                </span>
                <span className="text-sm font-bold text-slate-900 block">
                  {profile.bankName || 'Not Provided'}
                </span>
                <span className="text-[10px] text-slate-400">Direct Deposit Institution</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Account Number
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono block">
                  {profile.bankAccountNumber ? (
                    profile.bankAccountNumber.length >= 4 
                      ? `•••• •••• ${profile.bankAccountNumber.slice(-4)} (${profile.bankAccountNumber})` 
                      : profile.bankAccountNumber
                  ) : (
                    'Not Provided'
                  )}
                </span>
                <span className="text-[10px] text-slate-400">Primary Salary Credit Account</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  IFSC Code
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono tracking-wider block">
                  {profile.bankIfsc || 'Not Provided'}
                </span>
                <span className="text-[10px] text-slate-400">Branch Routing Code</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>HR &amp; Employees can both update these details. Any change is strictly logged with real-time audit notifications.</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payroll Ready</span>
            </div>
          </div>

          {/* KYC & Compliance Documents Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8B1D2C]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  KYC &amp; Submitted Documents ({documents.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileUploadRef}
                  onChange={handleUploadNewDoc}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingDoc}
                  onClick={() => fileUploadRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#8B1D2C] border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  {isUploadingDoc ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploadingDoc ? 'Uploading...' : 'Upload Document'}</span>
                </button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-400">
                <FileText className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <span>No KYC documents uploaded by this employee yet.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                {documents.map((doc) => {
                  const isVerified = doc.verificationStatus === 'verified';

                  return (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-white hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{doc.title}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                            {doc.documentType?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          {doc.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              <span>View File</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          <span>&bull;</span>
                          <span>Uploaded: {new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                        {doc.remarks && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5">
                            Note: {doc.remarks}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleVerifyDoc(doc.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* EDIT BANK DETAILS MODAL (HR) */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-[#8B1D2C]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Update Employee Bank Account</h3>
                  <p className="text-xs text-slate-500">Edit payroll disbursement details for {profile?.firstName} {profile?.lastName}</p>
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

            <form onSubmit={handleSaveBankDetails} className="space-y-3.5 text-xs">
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

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                <strong>Audit Note:</strong> Updating this record will be logged with your HR credentials and timestamped for regulatory and payroll tracking.
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

export default HREmployeeProfileDetailView;
