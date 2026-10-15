import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  UserPlus,
  CreditCard,
  FileCheck,
  FileText,
  UploadCloud,
  Trash2,
  Paperclip,
  ExternalLink,
  File,
  Plus,
  Check
} from 'lucide-react';
import {
  createEmployee,
  updateEmployee,
  getEmployeeById,
  getDepartments,
  getDesignations,
  getEmployeeDocuments,
  uploadEmployeeDocumentForUser,
  deleteEmployeeDocument
} from '../../services/hrService';

// Pre-defined KYC document categories with human-readable labels and default titles
const DOCUMENT_CATEGORIES = [
  { value: 'id_proof', label: 'National ID / Aadhaar Card', defaultTitle: 'Aadhaar Card (National ID)' },
  { value: 'tax_doc', label: 'PAN Card / Tax Document', defaultTitle: 'PAN Card (Tax Identification)' },
  { value: 'other', label: 'Bank Passbook / Cancelled Cheque', defaultTitle: 'Bank Passbook / Cancelled Cheque' },
  { value: 'address_proof', label: 'Address Proof (Utility/Voter/Passport)', defaultTitle: 'Address Proof (Voter/Passport/Utility)' },
  { value: 'education', label: 'Education Degree / Marksheets', defaultTitle: 'Highest Qualification Degree / Marksheet' },
  { value: 'experience', label: 'Experience / Relieving Letter / Payslip', defaultTitle: 'Previous Company Relieving / Experience Letter' },
  { value: 'resume', label: 'Resume / Curriculum Vitae', defaultTitle: 'Updated Resume / Curriculum Vitae' },
  { value: 'offer_letter', label: 'Signed Offer / Appointment Letter', defaultTitle: 'Signed Company Offer / Appointment Letter' }
];

// Module-level memory cache to preserve state across route transitions
let draftFormData = null;
let draftKycDocs = null;

// Tab normalization & slug mapping
const normalizeTab = (rawTab) => {
  if (!rawTab) return 'personal';
  const t = String(rawTab).toLowerCase().trim();
  if (t === 'job' || t === 'organization' || t === 'org' || t === 'organization-job' || t === '2') {
    return 'job';
  }
  if (t === 'credentials' || t === 'security' || t === 'account' || t === 'account-credentials' || t === 'password' || t === '3') {
    return 'security';
  }
  if (t === 'kyc' || t === 'documents' || t === 'doc' || t === 'kyc-documents' || t === 'compliance' || t === '4') {
    return 'kyc';
  }
  return 'personal';
};

const tabToSlug = {
  personal: 'personal',
  job: 'job',
  security: 'credentials',
  kyc: 'kyc'
};

export const HRAddEmployeeView = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { id, tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(isEdit || id);

  const initialTab = normalizeTab(routeTab || searchParams.get('tab') || searchParams.get('step'));
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync activeTab when route param or search param changes
  useEffect(() => {
    const target = normalizeTab(routeTab || searchParams.get('tab') || searchParams.get('step'));
    if (target && target !== activeTab) {
      setActiveTab(target);
    }
  }, [routeTab, searchParams, activeTab]);

  const getTabPath = (targetTab) => {
    const slug = tabToSlug[targetTab] || targetTab;
    if (isEditMode && id) {
      return `/hr/employees/${id}/edit/${slug}`;
    }
    return `/hr/employees/add/${slug}`;
  };

  const handleTabChange = (targetTab) => {
    const norm = normalizeTab(targetTab);
    setActiveTab(norm);
    navigate(getTabPath(norm));
  };

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // KYC Documents State
  const [kycDocuments, setKycDocuments] = useState(() => {
    if (!isEditMode && Array.isArray(draftKycDocs) && draftKycDocs.length > 0) {
      return draftKycDocs;
    }
    return [];
  });
  const [newDocType, setNewDocType] = useState(DOCUMENT_CATEGORIES[0].value);
  const [newDocTitle, setNewDocTitle] = useState(DOCUMENT_CATEGORIES[0].defaultTitle);
  const [newDocFile, setNewDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(() => {
    if (!isEditMode && draftFormData) {
      return draftFormData;
    }
    return {
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
      bankName: '',
      bankAccountNumber: '',
      bankIfsc: '',
      password: isEditMode ? '' : 'Employee@123'
    };
  });

  // Preserve form draft across route transitions
  useEffect(() => {
    if (!isEditMode) {
      draftFormData = formData;
    }
  }, [formData, isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      draftKycDocs = kycDocuments;
    }
  }, [kycDocuments, isEditMode]);

  const handleCancelAndReturn = () => {
    draftFormData = null;
    draftKycDocs = null;
    navigate('/hr/employees');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch employee details and documents in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchEmpData = async () => {
      setLoadingEmployee(true);
      try {
        const [empRes, docsRes] = await Promise.allSettled([
          getEmployeeById(id),
          getEmployeeDocuments(id)
        ]);

        if (empRes.status === 'fulfilled') {
          const emp = empRes.value?.data || empRes.value;
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
              bankName: emp.bankName || '',
              bankAccountNumber: emp.bankAccountNumber || '',
              bankIfsc: emp.bankIfsc || '',
              password: ''
            });
          }
        }

        if (docsRes.status === 'fulfilled') {
          const dList = docsRes.value?.data || docsRes.value || [];
          setKycDocuments(Array.isArray(dList) ? dList : []);
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
      handleTabChange('personal');
      return false;
    }
    if (!formData.lastName.trim() || formData.lastName.trim().length < 2) {
      setErrorMessage('Last name is required and must be at least 2 characters.');
      handleTabChange('personal');
      return false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setErrorMessage('Please provide a valid corporate or personal email address.');
      handleTabChange('personal');
      return false;
    }
    if (!isEditMode && (!formData.password || formData.password.length < 8)) {
      setErrorMessage('Initial password must be at least 8 characters long.');
      handleTabChange('security');
      return false;
    }
    if (isEditMode && formData.password && formData.password.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      handleTabChange('security');
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
        handleTabChange('personal');
        return false;
      }
    }
    return true;
  };

  // Helper to find the next category in sequence (prioritizing unattached categories)
  const getNextCategory = (currentType, currentDocsList) => {
    const currentIndex = DOCUMENT_CATEGORIES.findIndex((c) => c.value === currentType);
    if (currentIndex === -1) return DOCUMENT_CATEGORIES[0];

    // Search for the next category that is not yet attached
    for (let i = 1; i <= DOCUMENT_CATEGORIES.length; i++) {
      const candidate = DOCUMENT_CATEGORIES[(currentIndex + i) % DOCUMENT_CATEGORIES.length];
      const isAttached = currentDocsList.some((d) => d.documentType === candidate.value);
      if (!isAttached) {
        return candidate;
      }
    }
    // If all are attached, advance sequentially to next index
    const nextIdx = (currentIndex + 1) % DOCUMENT_CATEGORIES.length;
    return DOCUMENT_CATEGORIES[nextIdx];
  };

  // When user changes category dropdown directly, auto-update the title and trigger file selection
  const handleCategoryChange = (selectedCatValue) => {
    setNewDocType(selectedCatValue);
    const cat = DOCUMENT_CATEGORIES.find((c) => c.value === selectedCatValue);
    const title = cat?.defaultTitle || '';
    if (cat) {
      setNewDocTitle(title);
    }
    if (newDocFile) {
      // If a file was already chosen, auto-upload / attach immediately
      autoUploadOrAttach(newDocFile, selectedCatValue, title);
    } else {
      // Prompt file picker dialog directly for the chosen category
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 50);
    }
  };

  // Auto-upload / attach immediately when a file is selected
  const autoUploadOrAttach = async (fileToUpload, typeToUse, titleToUse) => {
    if (!fileToUpload) return;

    if (fileToUpload.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit. Please upload a smaller file.');
      return;
    }

    const docType = typeToUse || newDocType;
    const catConfig = DOCUMENT_CATEGORIES.find((c) => c.value === docType);
    const finalTitle = (titleToUse || newDocTitle || catConfig?.defaultTitle || 'Document').trim();

    setErrorMessage('');

    if (isEditMode && id) {
      setUploadingDoc(true);
      try {
        const form = new FormData();
        form.append('file', fileToUpload);
        form.append('title', finalTitle);
        form.append('documentType', docType);

        const res = await uploadEmployeeDocumentForUser(id, form);
        const uploadedDoc = res?.data || res;
        const updatedDocs = [uploadedDoc, ...kycDocuments];
        setKycDocuments(updatedDocs);
        setNewDocFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Auto-select next category
        const nextCat = getNextCategory(docType, updatedDocs);
        if (nextCat) {
          setNewDocType(nextCat.value);
          setNewDocTitle(nextCat.defaultTitle);
          setSuccessMessage(`"${finalTitle}" uploaded! Auto-selected next category: "${nextCat.label}".`);
        } else {
          setSuccessMessage(`"${finalTitle}" uploaded successfully!`);
        }
        setTimeout(() => setSuccessMessage(''), 4000);
      } catch (err) {
        console.error('Failed to upload document:', err);
        setErrorMessage(
          err?.response?.data?.message || err?.message || 'Failed to upload KYC document.'
        );
      } finally {
        setUploadingDoc(false);
      }
    } else {
      const stagedDoc = {
        id: `staged-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: finalTitle,
        documentType: docType,
        file: fileToUpload,
        fileName: fileToUpload.name,
        fileSize: fileToUpload.size,
        mimeType: fileToUpload.type,
        isStaged: true,
        createdAt: new Date().toISOString()
      };

      const updatedDocs = [stagedDoc, ...kycDocuments];
      setKycDocuments(updatedDocs);
      setNewDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Auto-select next category
      const nextCat = getNextCategory(docType, updatedDocs);
      if (nextCat) {
        setNewDocType(nextCat.value);
        setNewDocTitle(nextCat.defaultTitle);
        setSuccessMessage(`"${finalTitle}" attached! Auto-selected next: "${nextCat.label}".`);
      } else {
        setSuccessMessage(`"${finalTitle}" attached!`);
      }
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 10MB limit. Please upload a smaller file.');
      return;
    }

    setNewDocFile(file);
    // Automatically upload / attach immediately upon file selection
    await autoUploadOrAttach(file, newDocType, newDocTitle);
  };

  const handleAttachDocument = async () => {
    if (!newDocFile) {
      setErrorMessage('Please choose a file to attach as KYC document.');
      return;
    }
    await autoUploadOrAttach(newDocFile, newDocType, newDocTitle);
  };

  const handleDeleteDocument = async (doc) => {
    if (doc.isStaged) {
      setKycDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      return;
    }

    if (window.confirm(`Are you sure you want to remove the document "${doc.title}"?`)) {
      try {
        await deleteEmployeeDocument(doc.id);
        setKycDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        setSuccessMessage(`Document "${doc.title}" deleted successfully.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        console.error('Failed to delete document:', err);
        setErrorMessage('Failed to delete document.');
      }
    }
  };

  const getDocumentUrl = (fileUrl) => {
    if (!fileUrl) return '#';
    if (fileUrl.startsWith('http')) return fileUrl;
    const envUrl = import.meta.env.VITE_API_URL;
    const baseUrl = envUrl ? envUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '') : '';
    return `${baseUrl}${fileUrl}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'id_proof':
        return { label: 'National ID / Aadhaar', color: 'bg-rose-50 text-[#8B1D2C] border-rose-200' };
      case 'tax_doc':
        return { label: 'Tax ID / PAN', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'address_proof':
        return { label: 'Address Proof', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'education':
        return { label: 'Education / Degree', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'experience':
        return { label: 'Work Experience', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'resume':
        return { label: 'Resume / CV', color: 'bg-slate-50 text-slate-700 border-slate-200' };
      case 'offer_letter':
        return { label: 'Offer Letter', color: 'bg-teal-50 text-teal-800 border-teal-200' };
      default:
        return { label: 'Bank / Other KYC', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    }
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
        if (formData.password && formData.password.trim()) updatePayload.password = formData.password.trim();
        if (formData.bankName && formData.bankName.trim()) updatePayload.bankName = formData.bankName.trim();
        if (formData.bankAccountNumber && formData.bankAccountNumber.trim()) updatePayload.bankAccountNumber = formData.bankAccountNumber.trim();
        if (formData.bankIfsc && formData.bankIfsc.trim()) updatePayload.bankIfsc = formData.bankIfsc.trim().toUpperCase();
        if (formData.address && formData.address.trim()) updatePayload.address = formData.address.trim();

        await updateEmployee(id, updatePayload);

        // Upload any staged KYC documents in edit mode
        const stagedDocs = kycDocuments.filter((d) => d.isStaged && d.file);
        if (stagedDocs.length > 0) {
          for (const doc of stagedDocs) {
            try {
              const form = new FormData();
              form.append('file', doc.file);
              form.append('title', doc.title);
              form.append('documentType', doc.documentType);
              await uploadEmployeeDocumentForUser(id, form);
            } catch (docErr) {
              console.error('Failed to upload staged doc:', doc.title, docErr);
            }
          }
        }

        setSuccessMessage('Employee profile and KYC documents updated successfully!');
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
        if (formData.bankName && formData.bankName.trim()) createPayload.bankName = formData.bankName.trim();
        if (formData.bankAccountNumber && formData.bankAccountNumber.trim()) createPayload.bankAccountNumber = formData.bankAccountNumber.trim();
        if (formData.bankIfsc && formData.bankIfsc.trim()) createPayload.bankIfsc = formData.bankIfsc.trim().toUpperCase();
        if (formData.address && formData.address.trim()) createPayload.address = formData.address.trim();

        const res = await createEmployee(createPayload);
        const newEmp = res?.data || res;
        const newEmpId = newEmp?.id || newEmp?.user?.id;

        // Upload staged KYC documents if any
        if (newEmpId && kycDocuments.length > 0) {
          const stagedDocs = kycDocuments.filter((d) => d.file);
          for (const doc of stagedDocs) {
            try {
              const form = new FormData();
              form.append('file', doc.file);
              form.append('title', doc.title);
              form.append('documentType', doc.documentType);
              await uploadEmployeeDocumentForUser(newEmpId, form);
            } catch (docErr) {
              console.error('Failed to upload KYC doc for new employee:', doc.title, docErr);
            }
          }
        }

        setSuccessMessage('Employee registered and KYC documents uploaded successfully!');
      }

      draftFormData = null;
      draftKycDocs = null;

      setTimeout(() => {
        navigate('/hr/employees');
      }, 1400);
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
            onClick={handleCancelAndReturn}
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
          onClick={handleCancelAndReturn}
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
              onClick={() => handleTabChange('personal')}
              className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'personal'
                  ? 'bg-[#8B1D2C] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
                }`}
            >
              <User className="w-4 h-4" />
              <span>1. Personal & Contact</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('job')}
              className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'job'
                  ? 'bg-[#8B1D2C] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
                }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>2. Organization & Job</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('security')}
              className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'security'
                  ? 'bg-[#8B1D2C] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
                }`}
            >
              <Lock className="w-4 h-4" />
              <span>3. Account Credentials</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('kyc')}
              className={`flex-1 min-w-[140px] px-4 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'kyc'
                  ? 'bg-[#8B1D2C] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
                }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>4. KYC Documents</span>
              {kycDocuments.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'kyc' ? 'bg-white/20 text-white' : 'bg-[#8B1D2C]/10 text-[#8B1D2C]'
                  }`}>
                  {kycDocuments.length}
                </span>
              )}
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
                    onClick={() => handleTabChange('job')}
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
                    onClick={() => handleTabChange('personal')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ← Back to Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('security')}
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
                    {isEditMode ? 'Corporate Security & Credential Management' : 'Auto-provisioned Access'}
                  </p>
                  <p className="text-slate-600">
                    {isEditMode ? (
                      <>
                        You can update both <strong>Email</strong> (in Personal Information) and <strong>Password</strong> here. If replacing an existing HR or staff member with a new person, update their email address and set a new password below.
                      </>
                    ) : (
                      'The employee can log in using their registered corporate email address and this initial password. Upon first authentication, they will be prompted to customize their security credentials.'
                    )}
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
                    onClick={() => handleTabChange('job')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ← Back to Job Details
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCancelAndReturn}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabChange('kyc')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all shadow-md shadow-[#8B1D2C]/20 cursor-pointer active:scale-[0.98]"
                    >
                      <span>Continue to KYC Documents</span>
                      <FileCheck className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: KYC & COMPLIANCE DOCUMENTS */}
            {activeTab === 'kyc' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header Info */}
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-[#8B1D2C]" />
                        Employee KYC & Compliance Documents
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Upload essential identification, address, banking, and academic verification documents
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                        Total Attached: <strong className="text-[#8B1D2C]">{kycDocuments.length}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upload & Attach New Document Card */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <UploadCloud className="w-4 h-4 text-[#8B1D2C]" />
                      Upload / Attach Document
                    </h4>
                    {uploadingDoc ? (
                      <span className="text-[11px] font-medium text-[#8B1D2C] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1.5 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading document...
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-500" /> Auto-upload & Next Category Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Document Title <span className="text-[#8B1D2C]">*</span>
                      </label>
                      <input
                        type="text"
                        value={newDocTitle}
                        onChange={(e) => setNewDocTitle(e.target.value)}
                        placeholder="e.g. Aadhaar Card Front & Back"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Document Category <span className="text-[#8B1D2C]">*</span>
                      </label>
                      <select
                        value={newDocType}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer font-medium"
                      >
                        {DOCUMENT_CATEGORIES.map((cat) => {
                          const isAlreadyAttached = kycDocuments.some((d) => d.documentType === cat.value);
                          return (
                            <option key={cat.value} value={cat.value}>
                              {cat.label} {isAlreadyAttached ? '✓' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingDoc}
                        className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white disabled:opacity-50 shadow-md shadow-[#8B1D2C]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                      >
                        {uploadingDoc ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Choose & Upload File</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* List of Attached Documents */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#8B1D2C]" />
                      Attached & Uploaded KYC Documents
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {kycDocuments.length} document{kycDocuments.length === 1 ? '' : 's'} in record
                    </span>
                  </div>

                  {kycDocuments.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-slate-50/50">
                      <div className="p-3 bg-white rounded-full border border-slate-200 text-slate-400 shadow-2xs">
                        <FileCheck className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">No KYC documents attached yet</p>
                        <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                          Select a Document Category or click 'Choose & Upload File' above. Files are automatically attached and the category auto-advances to the next document.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {kycDocuments.map((doc, idx) => {
                        const badge = getDocTypeBadge(doc.documentType);
                        return (
                          <div
                            key={doc.id || idx}
                            className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 shadow-2xs flex items-start justify-between gap-3 group transition-all"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[#8B1D2C] shrink-0 mt-0.5">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-slate-800 truncate" title={doc.title}>
                                  {doc.title}
                                </h5>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badge.color}`}>
                                    {badge.label}
                                  </span>
                                  {doc.fileSize && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      • {formatFileSize(doc.fileSize)}
                                    </span>
                                  )}
                                  {doc.isStaged ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                      Ready to save
                                    </span>
                                  ) : (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${doc.verificationStatus === 'verified'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : doc.verificationStatus === 'rejected'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : 'bg-blue-50 text-blue-700 border-blue-200'
                                      }`}>
                                      {doc.verificationStatus || 'Uploaded'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {doc.fileUrl && (
                                <a
                                  href={getDocumentUrl(doc.fileUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#8B1D2C] transition-colors"
                                  title="View Document"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleTabChange('security')}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ← Back to Credentials
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCancelAndReturn}
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
                          <span>{isEditMode ? 'Saving Changes...' : 'Registering Employee & Uploading Documents...'}</span>
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
