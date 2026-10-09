import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Building2,
  Calendar,
  Sparkles,
  Loader2,
  Download,
  FolderOpen,
  Info
} from 'lucide-react';
import { createPolicy } from '../../services/policyService';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

const DOCUMENT_CATEGORIES = [
  { id: 'general', label: 'Company Master Handbook & Policies' },
  { id: 'attendance_shifts', label: 'Shift Timings & Attendance SOP' },
  { id: 'leave_holidays', label: 'Leave Rules & Absence Circular' },
  { id: 'salary_appraisal', label: 'Salary Structure & Compensation Manual' },
  { id: 'exit_notice_period', label: 'Resignation, Notice & FNF Protocol' },
  { id: 'joining_documents', label: 'Joining Checklist & Verification Forms' },
  { id: 'code_of_conduct', label: 'Code of Conduct & NDA Agreement' },
  { id: 'project_management', label: 'Project Delivery & Referral Guidelines' },
  { id: 'recreation_fun', label: 'Recreation & Engagement Circular' }
];

export const HRUploadPolicyDocumentView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    policyCode: '',
    category: 'general',
    currentVersion: '1.0',
    effectiveDate: new Date().toISOString().split('T')[0],
    isMandatory: true,
    targetAudience: 'all',
    targetDepartmentId: '',
    summary: '',
    status: 'published'
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await apiClient.get('/departments');
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        setDepartments(list);
      } catch (err) {
        console.warn('Could not load departments list:', err.message);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFile = (file) => {
    setFileError('');
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setFileError('File size exceeds 20 MB limit.');
      return;
    }

    const validExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;
    if (!validExtensions.test(file.name)) {
      setFileError('Please upload a valid PDF, Word document, or Excel spreadsheet.');
      return;
    }

    setSelectedFile(file);

    // If title is empty, prefill with file base name
    if (!formData.title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setFormData((prev) => ({
        ...prev,
        title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
      }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setFileError('Please select or drop an official document file to upload.');
      return;
    }

    if (!formData.title.trim()) {
      alert('Please enter a Document Title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      if (formData.policyCode.trim()) {
        data.append('policyCode', formData.policyCode.trim().toUpperCase());
      }
      data.append('category', formData.category);
      data.append('currentVersion', formData.currentVersion);
      data.append('effectiveDate', formData.effectiveDate);
      data.append('isMandatory', formData.isMandatory);
      data.append('targetAudience', formData.targetAudience);
      if (formData.targetDepartmentId) {
        data.append('targetDepartmentId', formData.targetDepartmentId);
      }
      data.append(
        'summary',
        formData.summary.trim() || `Official document: ${formData.title.trim()}`
      );
      data.append(
        'content',
        `# ${formData.title.trim()}\n\nOfficial document file attached: **${selectedFile.name}**\n\n${formData.summary.trim()}`
      );
      data.append('status', formData.status);
      data.append('attachment', selectedFile);

      await createPolicy(data);
      alert('Document successfully uploaded and published to the workforce platform!');
      navigate('/hr/policies');
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans">
      {/* ── Top Header Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/policies')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Back to Policies"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8B1D2C]">
                Policies & SOPs
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500">Document Upload</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Upload Policy Document / SOP
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/hr/policies')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 self-start sm:self-auto cursor-pointer"
        >
          Cancel & Return
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Main Dropzone Upload Card ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center font-bold text-xs">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Select Document File</h3>
              <p className="text-[11px] text-slate-500">Drag and drop or browse the official document file (PDF, Word, or Excel up to 20 MB)</p>
            </div>
          </div>

          {/* Interactive Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('upload-document-file-input').click()}
            className={`p-8 sm:p-10 border-2 border-dashed rounded-3xl text-center transition-all cursor-pointer ${
              dragActive
                ? 'border-[#8B1D2C] bg-rose-50/60 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 hover:border-[#8B1D2C] bg-slate-50/60'
            }`}
          >
            <input
              id="upload-document-file-input"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <FileCheck className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{selectedFile.name}</h4>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; File ready for distribution
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Choose Different File
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white text-[#8B1D2C] border border-slate-200 shadow-xs flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">
                    Drag and drop official PDF / Word document here
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Or click anywhere in this area to browse from your computer
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                  <span>Supports: PDF, DOCX, XLSX</span>
                  <span>&bull;</span>
                  <span>Max Limit: 20 MB</span>
                </div>
              </div>
            )}
          </div>

          {fileError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}
        </div>

        {/* ── Document Metadata Details ───────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-5 text-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Document Registry Details</h3>
              <p className="text-[11px] text-slate-500">Provide title, classification, version number, and department targeting</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Document Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Gupta Tech Web Employee Handbook 2026 - Master Copy"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
              />
            </div>

            {/* Document Code */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Document / Policy Code <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="policyCode"
                value={formData.policyCode}
                onChange={handleChange}
                placeholder="e.g. DOC-GTW-01"
                className="w-full font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Document Category <span className="text-rose-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Version */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Version Identifier</label>
              <input
                type="text"
                name="currentVersion"
                value={formData.currentVersion}
                onChange={handleChange}
                placeholder="v1.0"
                className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
              />
            </div>

            {/* Effective Date */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Effective Release Date</label>
              <input
                type="date"
                name="effectiveDate"
                value={formData.effectiveDate}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Department Scope</label>
              <select
                name="targetDepartmentId"
                value={formData.targetDepartmentId}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
              >
                <option value="">All Departments (Entire Organization)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Audience */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
              <select
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
              >
                <option value="all">All Workforce Personnel</option>
                <option value="employees_only">Confirmed Employees Only</option>
                <option value="probationers">Probationary Staff Only</option>
                <option value="management">Leadership & Project Managers</option>
              </select>
            </div>

            {/* Brief Description */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Document Description & Release Notes
              </label>
              <textarea
                name="summary"
                rows={3}
                value={formData.summary}
                onChange={handleChange}
                placeholder="Briefly state what this document covers, why it was issued, and who must read it..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors leading-relaxed"
              />
            </div>
          </div>

          {/* Mandatory Checkbox */}
          <div className="pt-3 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isMandatory"
                checked={formData.isMandatory}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 rounded text-[#8B1D2C] focus:ring-[#8B1D2C]/20 accent-[#8B1D2C]"
              />
              <div>
                <span className="font-bold text-slate-800 block">
                  Mandatory Reading & Digital Acknowledgment Required
                </span>
                <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                  Employees will see an action badge requiring them to read and sign this document upon login.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* ── Submit Action Bar ───────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8B1D2C]" />
            <span>Document will be encrypted and indexed in company database.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/hr/policies')}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Document...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload & Distribute Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default HRUploadPolicyDocumentView;
