import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Upload,
  Calendar,
  Lock,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Sparkles,
  Info,
  Loader2,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { createPolicy } from '../../services/policyService';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

const CATEGORIES = [
  { id: 'attendance_shifts', label: 'Attendance & Work Hours' },
  { id: 'leave_holidays', label: 'Leave Policy & Deductions' },
  { id: 'salary_appraisal', label: 'Salary & Appraisals' },
  { id: 'exit_notice_period', label: 'Notice Period & Exit' },
  { id: 'joining_documents', label: 'Joining Documents' },
  { id: 'code_of_conduct', label: 'Code of Conduct & Etiquette' },
  { id: 'project_management', label: 'Project Management & Referral' },
  { id: 'recreation_fun', label: 'Fun Friday & Recreation' },
  { id: 'general', label: 'General Corporate Guidelines' }
];

export const HRAddPolicyView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    policyCode: '',
    category: 'attendance_shifts',
    currentVersion: '1.0',
    effectiveDate: new Date().toISOString().split('T')[0],
    isMandatory: true,
    targetAudience: 'all',
    targetDepartmentId: '',
    summary: '',
    content: '',
    status: 'published'
  });

  const [departments, setDepartments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Fetch departments for target selector
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

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      setFileError('File size exceeds 15 MB limit.');
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx|xls|xlsx)$/i)) {
      setFileError('Only PDF, Word (DOC/DOCX), and Excel (XLS/XLSX) files are allowed.');
      return;
    }

    setSelectedFile(file);
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

  const handleSubmit = async (statusOverride) => {
    if (!formData.title.trim()) {
      alert('Please enter a Policy Title.');
      return;
    }
    if (!formData.summary.trim()) {
      alert('Please provide an Executive Summary.');
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
      data.append('summary', formData.summary.trim());
      data.append('content', formData.content.trim() || formData.summary.trim());
      data.append('status', statusOverride || formData.status);

      if (selectedFile) {
        data.append('attachment', selectedFile);
      }

      await createPolicy(data);
      alert('Policy successfully created and added to the official registry!');
      navigate('/hr/policies');
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to create policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans">
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
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
              <span className="text-xs text-slate-500">New Policy</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Create Policy Clause
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPreviewOpen ? 'Hide Preview' : 'Preview'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Publish Policy</span>
          </button>
        </div>
      </div>

      {/* ── Main Form Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Core Content Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Basic Information */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Policy Identification</h3>
                <p className="text-[11px] text-slate-500">Provide official title, policy code, and classification category</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Policy Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Workplace Information Security & Intellectual Property Policy"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                />
              </div>

              {/* Policy Code & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Policy Code <span className="text-slate-400 font-normal">(Leave blank to auto-generate)</span>
                  </label>
                  <input
                    type="text"
                    name="policyCode"
                    value={formData.policyCode}
                    onChange={handleChange}
                    placeholder="e.g. POL-GTW-09"
                    className="w-full uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Executive Summary <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="summary"
                  rows={3}
                  required
                  value={formData.summary}
                  onChange={handleChange}
                  placeholder="Provide a concise 2-3 line overview explaining the core objective and employee obligation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Full Policy Body Content */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Policy Clauses & Regulations</h3>
                  <p className="text-[11px] text-slate-500">Full detailed legal text, sub-sections, disciplinary rules & escalation ladders</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                name="content"
                rows={12}
                value={formData.content}
                onChange={handleChange}
                placeholder="Enter complete policy clauses, numbered sub-sections, penalties, procedures, and official notices here (Markdown format supported)...&#10;&#10;### 1. Scope & Applicability&#10;- This policy applies to all permanent, contract, and probationary employees...&#10;&#10;### 2. Operational Rules&#10;1. All personnel must strictly adhere to...&#10;&#10;### 3. Non-Compliance Penalties&#10;- Failure to comply results in..."
                className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 italic">
                Tip: Use markdown syntax like ### for Headings, - for bullet points, and **bold** for emphasized rules.
              </p>
            </div>
          </div>

          {/* Card 3: Document File Attachment */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Official Document Attachment</h3>
                  <p className="text-[11px] text-slate-500">Upload signed corporate PDF, SOP manual, or form template (Max 15 MB)</p>
                </div>
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-[#8B1D2C] bg-rose-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
              onClick={() => document.getElementById('policy-file-input').click()}
            >
              <input
                id="policy-file-input"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => handleFile(e.target.files[0])}
              />

              <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 text-[#8B1D2C] flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>

              <p className="text-xs font-bold text-slate-800">
                Click to browse or drag and drop official policy PDF / Document
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported formats: PDF, Word (DOCX/DOC), Excel (XLSX) up to 15 MB
              </p>
            </div>

            {fileError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {selectedFile && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-emerald-950">{selectedFile.name}</div>
                    <div className="text-[11px] text-emerald-700">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready to upload
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Governance Settings & Target Audience */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5 text-xs">
            <h3 className="font-black text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#8B1D2C]" /> Governance & Scope
            </h3>

            {/* Version & Effective Date */}
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Version Number</label>
                <input
                  type="text"
                  name="currentVersion"
                  value={formData.currentVersion}
                  onChange={handleChange}
                  placeholder="1.0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Effective Date</label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
                <select
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                >
                  <option value="all">All Company Personnel</option>
                  <option value="employees_only">Regular Employees Only</option>
                  <option value="probationers">Probationary Staff Only</option>
                  <option value="management">Management & Team Leads</option>
                </select>
              </div>

              {/* Target Department */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Scoping</label>
                <select
                  name="targetDepartmentId"
                  value={formData.targetDepartmentId}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">All Departments (Company-wide)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mandatory Sign-off Toggle */}
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
                    <span className="font-bold text-slate-800 block">Mandatory Sign-off Required</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                      Enforces digital "I Agree" acceptance tracking across employee portals.
                    </span>
                  </div>
                </label>
              </div>

              {/* Status */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status: 'published' }))}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                      formData.status === 'published'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status: 'draft' }))}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                      formData.status === 'draft'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Draft
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Info Box */}
          <div className="bg-gradient-to-br from-rose-50 to-orange-50/40 rounded-3xl p-5 border border-rose-100 text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#8B1D2C]">
              <Sparkles className="w-4 h-4" />
              <span>Official Protocol Reminder</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Per Gupta Tech Web corporate governance, every newly published policy clause automatically updates employee sign-off requirements. If marked mandatory, employees will be notified immediately upon publishing.
            </p>
          </div>
        </div>

      </div>

      {/* ── Live Preview Slide-Over Modal ─────────────────────────────────── */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B1D2C]">
                Policy Preview: {formData.policyCode || 'POL-GTW-DRAFT'}
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-black text-slate-900">{formData.title || 'Untitled Policy'}</h2>
              <div className="text-xs text-slate-500 font-semibold">
                Version {formData.currentVersion} &bull; Effective: {formData.effectiveDate} &bull; {formData.category}
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
                {formData.summary || 'No summary provided.'}
              </div>
              <div className="pt-2 text-xs font-mono whitespace-pre-wrap text-slate-800 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
                {formData.content || formData.summary || 'No detailed content provided yet.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRAddPolicyView;
