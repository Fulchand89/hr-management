import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Shield,
  Calendar,
  DollarSign,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Users,
  IdCard,
  UserPlus
} from 'lucide-react';
import {
  createEmployee,
  updateEmployee,
  getEmployeeById,
  getDepartments,
  getDesignations
} from '../../services/hrService';

export const HRAddEmployeeView = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(isEdit || id);

  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'job' | 'security'
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeCode: '',
    phone: '',
    gender: 'male',
    dob: '',
    department: 'Engineering',
    departmentId: '',
    designation: 'Software Engineer',
    designationId: '',
    role: 'employee',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: '',
    status: 'active',
    password: isEditMode ? '' : 'Employee@123'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch employee details in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchEmpData = async () => {
      setLoadingEmployee(true);
      try {
        const res = await getEmployeeById(id);
        const emp = res?.data || res;
        if (emp) {
          setFormData({
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            email: emp.email || '',
            employeeCode: emp.employeeCode || '',
            phone: emp.phone || '',
            gender: emp.gender || 'male',
            dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
            department: emp.departmentDetails?.name || emp.department || 'Engineering',
            departmentId: emp.departmentId || '',
            designation: emp.designationDetails?.title || emp.designation || 'Software Engineer',
            designationId: emp.designationId || '',
            role: emp.role || 'employee',
            joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
            salary: emp.salary != null ? String(emp.salary) : '',
            status: emp.status || 'active',
            password: ''
          });
        }
      } catch (err) {
        console.error('Failed to load employee for editing:', err);
        setErrorMessage('Failed to load employee details for editing.');
      } finally {
        setLoadingEmployee(false);
      }
    };

    fetchEmpData();
  }, [isEditMode, id]);

  // Fetch departments & designations for select options
  useEffect(() => {
    const fetchLookups = async () => {
      setLoadingLookups(true);
      try {
        const [deptRes, desigRes] = await Promise.allSettled([
          getDepartments(),
          getDesignations()
        ]);

        if (deptRes.status === 'fulfilled') {
          const dList = Array.isArray(deptRes.value?.data)
            ? deptRes.value.data
            : (Array.isArray(deptRes.value) ? deptRes.value : []);
          setDepartments(dList);
          if (dList.length > 0 && !formData.departmentId) {
            setFormData((prev) => ({
              ...prev,
              departmentId: dList[0].id,
              department: dList[0].name
            }));
          }
        }

        if (desigRes.status === 'fulfilled') {
          const dgList = Array.isArray(desigRes.value?.data)
            ? desigRes.value.data
            : (Array.isArray(desigRes.value) ? desigRes.value : []);
          setDesignations(dgList);
          if (dgList.length > 0 && !formData.designationId) {
            setFormData((prev) => ({
              ...prev,
              designationId: dgList[0].id,
              designation: dgList[0].title
            }));
          }
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDepartmentChange = (e) => {
    const selectedDeptId = e.target.value;
    const selectedDept = departments.find((d) => d.id === selectedDeptId);
    setFormData((prev) => ({
      ...prev,
      departmentId: selectedDeptId,
      department: selectedDept ? selectedDept.name : prev.department
    }));
  };

  const handleDesignationChange = (e) => {
    const selectedDesigId = e.target.value;
    const selectedDesig = designations.find((d) => d.id === selectedDesigId);
    setFormData((prev) => ({
      ...prev,
      designationId: selectedDesigId,
      designation: selectedDesig ? selectedDesig.title : prev.designation
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
      setErrorMessage('First name is required and must be at least 2 characters.');
      setActiveTab('personal');
      return false;
    }
    if (!formData.lastName.trim() || formData.lastName.trim().length < 2) {
      setErrorMessage('Last name is required and must be at least 2 characters.');
      setActiveTab('personal');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setErrorMessage('Please provide a valid corporate or personal email address.');
      setActiveTab('personal');
      return false;
    }
    if (!isEditMode && (!formData.password || formData.password.length < 8)) {
      setErrorMessage('Initial password must be at least 8 characters long.');
      setActiveTab('security');
      return false;
    }
    if (isEditMode && formData.password && formData.password.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      setActiveTab('security');
      return false;
    }
    if (formData.dob) {
      const birth = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      if (age < 18) {
        setErrorMessage('Employee must be at least 18 years of age.');
        setActiveTab('personal');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const updatePayload = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          gender: formData.gender,
          department: formData.department || 'General',
          designation: formData.designation || 'Staff',
          role: formData.role || 'employee',
          status: formData.status || 'active'
        };

        if (formData.employeeCode.trim()) updatePayload.employeeCode = formData.employeeCode.trim().toUpperCase();
        if (formData.phone.trim()) updatePayload.phone = formData.phone.trim();
        if (formData.dob) updatePayload.dob = formData.dob;
        if (formData.joiningDate) updatePayload.joiningDate = formData.joiningDate;
        if (formData.salary) updatePayload.salary = parseFloat(formData.salary);
        if (formData.departmentId) updatePayload.departmentId = formData.departmentId;
        if (formData.designationId) updatePayload.designationId = formData.designationId;

        await updateEmployee(id, updatePayload);
        setSuccessMessage('Employee profile updated successfully!');
      } else {
        const createPayload = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password || 'Employee@123',
          gender: formData.gender,
          department: formData.department || 'General',
          designation: formData.designation || 'Staff',
          role: formData.role || 'employee',
          status: formData.status || 'active'
        };

        if (formData.employeeCode.trim()) createPayload.employeeCode = formData.employeeCode.trim().toUpperCase();
        if (formData.phone.trim()) createPayload.phone = formData.phone.trim();
        if (formData.dob) createPayload.dob = formData.dob;
        if (formData.joiningDate) createPayload.joiningDate = formData.joiningDate;
        if (formData.salary) createPayload.salary = parseFloat(formData.salary);
        if (formData.departmentId) createPayload.departmentId = formData.departmentId;
        if (formData.designationId) createPayload.designationId = formData.designationId;

        await createEmployee(createPayload);
        setSuccessMessage('Employee registered and onboarded successfully!');
      }

      setTimeout(() => {
        navigate('/hr/employees');
      }, 1200);
    } catch (err) {
      console.error('Employee form submission failed:', err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to save employee. Please verify required fields and try again.';
      setErrorMessage(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans text-slate-800">
      {/* Top Breadcrumb & Back Navigation */}
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
                {isEditMode ? 'Edit Employee Profile' : 'Onboard New Employee'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C]">
                {isEditMode ? 'Edit Profile' : 'New Registration'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {isEditMode
                ? 'Update personnel details, departmental assignment, and profile data'
                : 'Create employee account, configure department assignment, and set initial access'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/hr/employees')}
          className="text-xs font-bold text-slate-600 hover:text-[#8B1D2C] px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors self-start sm:self-auto cursor-pointer"
        >
          Cancel & Return
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage} Redirecting to Employee Directory...</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-[#8B1D2C] text-xs font-semibold animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Main Form Container / Loading Skeleton */}
      {loadingEmployee ? (
        <div className="p-16 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading employee profile details for editing...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Step Tabs Header */}
        <div className="border-b border-slate-100 bg-slate-50/60 p-2 sm:p-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-[#8B1D2C] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>1. Personal & Contact</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('job')}
            className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'job'
                ? 'bg-[#8B1D2C] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>2. Organization & Job</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#8B1D2C] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>3. Account Credentials</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#8B1D2C]" />
                  Personal Information
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Basic identifying details and primary communication information
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    First Name <span className="text-[#8B1D2C]">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul"
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Last Name <span className="text-[#8B1D2C]">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Sharma"
                    required
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email Address <span className="text-[#8B1D2C]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="rahul.sharma@company.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Date of Birth (Minimum 18 Years)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('job')}
                  className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all shadow-md shadow-[#8B1D2C]/20 cursor-pointer"
                >
                  Continue to Organization & Job →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATION & ROLE */}
          {activeTab === 'job' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#8B1D2C]" />
                  Organizational Placement & Hierarchy
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Corporate designation, departmental affiliation, and compensation
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Employee Code / ID
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      name="employeeCode"
                      value={formData.employeeCode}
                      onChange={handleChange}
                      placeholder="e.g. EMP-0042 (Auto-generated if empty)"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm uppercase font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Leave blank to automatically allocate next available sequence
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Portal Security Role <span className="text-[#8B1D2C]">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer capitalize font-semibold"
                  >
                    <option value="employee">Employee (Standard Access)</option>
                    <option value="manager">Manager (Team Approval Privileges)</option>
                    <option value="hr">HR Personnel (Workforce Admin)</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Department <span className="text-[#8B1D2C]">*</span>
                  </label>
                  {departments.length > 0 ? (
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleDepartmentChange}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      placeholder="e.g. Engineering, Sales, Finance"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Designation / Title <span className="text-[#8B1D2C]">*</span>
                  </label>
                  {designations.length > 0 ? (
                    <select
                      name="designationId"
                      value={formData.designationId}
                      onChange={handleDesignationChange}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
                    >
                      <option value="">Select Designation</option>
                      {designations.map((desig) => (
                        <option key={desig.id} value={desig.id}>
                          {desig.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Annual CTC (₹ / $)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="number"
                      step="0.01"
                      name="salary"
                      value={formData.salary}
                      onChange={handleChange}
                      placeholder="e.g. 750000"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  </div>
                  {formData.salary && Number(formData.salary) > 0 && (
                    <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">
                      ≈ ₹{Math.round(Number(formData.salary) / 12).toLocaleString()} / mo (Standard breakdown auto-configured)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Initial Employment Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors capitalize cursor-pointer font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="notice_period">Notice Period</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  ← Back to Personal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all shadow-md shadow-[#8B1D2C]/20 cursor-pointer"
                >
                  Continue to Credentials →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CREDENTIALS */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#8B1D2C]" />
                  Corporate Account Credentials
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Initial portal login password and automated onboarding setup
                </p>
              </div>

              <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-[#8B1D2C] text-xs leading-relaxed space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-sm text-[#8B1D2C]">
                  <Sparkles className="w-4 h-4" />
                  Auto-provisioned Access
                </p>
                <p className="text-slate-600">
                  The employee can log in using their registered corporate email address and this initial password. Upon first authentication, they will be prompted to customize their security credentials.
                </p>
              </div>

              <div className="max-w-md">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isEditMode ? 'Update Password (Optional)' : (
                    <>Initial Password <span className="text-[#8B1D2C]">*</span></>
                  )}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isEditMode ? 'Leave blank to preserve current password' : 'Min 8 characters (e.g. Employee@123)'}
                    required={!isEditMode}
                    className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isEditMode
                    ? 'Leave empty to preserve the employee existing password.'
                    : 'Must be at least 8 characters long with letters and numbers'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('job')}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  ← Back to Job Details
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/hr/employees')}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 disabled:opacity-50 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isEditMode ? 'Saving Changes...' : 'Creating Employee...'}</span>
                      </>
                    ) : (
                      <>
                        {isEditMode ? <CheckCircle2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        <span>{isEditMode ? 'Save & Update Employee' : 'Confirm & Register Employee'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
      )}
    </div>
  );
};

export default HRAddEmployeeView;
