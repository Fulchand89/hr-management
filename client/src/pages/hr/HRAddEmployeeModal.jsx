import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Shield,
  Calendar,
  DollarSign,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { createEmployee, updateEmployee, getDepartments, getDesignations } from '../../services/hrService';

export const HRAddEmployeeModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialData = null
}) => {
  const isEdit = Boolean(initialData);

  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'job' | 'security'
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

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
    password: 'Employee@123'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Populate initial data on edit or reset on create
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage('');
    setActiveTab('personal');

    if (initialData) {
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        employeeCode: initialData.employeeCode || '',
        phone: initialData.phone || '',
        gender: initialData.gender || 'male',
        dob: initialData.dob ? initialData.dob.split('T')[0] : '',
        department: initialData.department || initialData.departmentDetails?.name || 'Engineering',
        departmentId: initialData.departmentId || '',
        designation: initialData.designation || initialData.designationDetails?.title || 'Software Engineer',
        designationId: initialData.designationId || '',
        role: initialData.role || 'employee',
        joiningDate: initialData.joiningDate ? initialData.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0],
        salary: initialData.salary !== undefined && initialData.salary !== null ? String(initialData.salary) : '',
        status: initialData.status || 'active',
        password: ''
      });
    } else {
      setFormData({
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
        password: 'Employee@123'
      });
    }
  }, [isOpen, initialData]);

  // Fetch departments & designations for select options
  useEffect(() => {
    if (!isOpen) return;

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
        }

        if (desigRes.status === 'fulfilled') {
          const dgList = Array.isArray(desigRes.value?.data)
            ? desigRes.value.data
            : (Array.isArray(desigRes.value) ? desigRes.value : []);
          setDesignations(dgList);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, [isOpen]);

  if (!isOpen) return null;

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
    if (!isEdit && (!formData.password || formData.password.length < 8)) {
      setErrorMessage('Initial password must be at least 8 characters long.');
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

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isEdit) {
        const updatePayload = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          gender: formData.gender,
          department: formData.department,
          designation: formData.designation,
          role: formData.role,
          status: formData.status
        };

        if (formData.employeeCode.trim()) updatePayload.employeeCode = formData.employeeCode.trim().toUpperCase();
        if (formData.dob) updatePayload.dob = formData.dob;
        if (formData.joiningDate) updatePayload.joiningDate = formData.joiningDate;
        if (formData.salary) updatePayload.salary = parseFloat(formData.salary);
        if (formData.departmentId) updatePayload.departmentId = formData.departmentId;
        if (formData.designationId) updatePayload.designationId = formData.designationId;

        const res = await updateEmployee(initialData.id, updatePayload);
        onSuccess(res?.data || res, 'Employee profile updated successfully!');
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

        const res = await createEmployee(createPayload);
        onSuccess(res?.data || res, 'New employee created and onboarded successfully!');
      }
      onClose();
    } catch (err) {
      console.error('Employee submit failed:', err);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header matching WorkPulse brand */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#8B1D2C]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? 'Edit Employee Profile' : 'Onboard New Employee'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isEdit
                  ? `Update personal and employment details for ${formData.firstName} ${formData.lastName}`
                  : 'Register a new employee with corporate credentials and organization role'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/50 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'personal'
                ? 'bg-[#8B1D2C] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Personal Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('job')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'job'
                ? 'bg-[#8B1D2C] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Organization & Role
          </button>
          {!isEdit && (
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-[#8B1D2C] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Credentials
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-[#8B1D2C] text-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name <span className="text-[#8B1D2C]">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="e.g. John"
                    required
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Name <span className="text-[#8B1D2C]">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="e.g. Doe"
                    required
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-[#8B1D2C]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john.doe@company.com"
                      required
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Date of Birth (Min 18 yrs)
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATION & ROLE */}
          {activeTab === 'job' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employee Code / ID
                  </label>
                  <input
                    type="text"
                    name="employeeCode"
                    value={formData.employeeCode}
                    onChange={handleChange}
                    placeholder={isEdit ? 'EMP-0001' : 'Auto-generated if empty'}
                    className="w-full px-3.5 py-2 text-sm uppercase bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Format: 3-20 uppercase alphanumeric (e.g. EMP-001)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Portal Role <span className="text-[#8B1D2C]">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR Specialist / Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  {departments.length > 0 ? (
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleDepartmentChange}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
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
                      placeholder="e.g. Engineering, Sales, HR"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Designation / Title
                  </label>
                  {designations.length > 0 ? (
                    <select
                      name="designationId"
                      value={formData.designationId}
                      onChange={handleDesignationChange}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
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
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Annual Salary (₹ / $)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="e.g. 750000"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Employment Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors capitalize cursor-pointer font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="notice_period">Notice Period</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CREDENTIALS (NEW ONLY) */}
          {!isEdit && activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl text-[#8B1D2C] text-xs leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#8B1D2C]" />
                  Auto-generated Account & Welcome Email
                </p>
                A welcome email with login instructions and this initial password will be prepared for the employee. The employee can reset their password upon first login.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Password <span className="text-[#8B1D2C]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    required
                    className="w-full pl-9 pr-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Default recommended: Employee@123
                </span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex gap-2">
              {activeTab !== 'personal' && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'security') setActiveTab('job');
                    else if (activeTab === 'job') setActiveTab('personal');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Previous
                </button>
              )}
              {activeTab === 'personal' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('job')}
                  className="px-4 py-2 text-xs font-bold text-[#8B1D2C] hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  Next: Organization & Role →
                </button>
              )}
              {!isEdit && activeTab === 'job' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="px-4 py-2 text-xs font-bold text-[#8B1D2C] hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  Next: Credentials →
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-[#8B1D2C] hover:bg-[#731724] text-white rounded-2xl shadow-md shadow-[#8B1D2C]/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEdit ? 'Save Changes' : 'Confirm & Register'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRAddEmployeeModal;
