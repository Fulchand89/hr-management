import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Loader2,
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { getPolicyById, updatePolicy } from '../../services/policyService';
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

export const HREditPolicyView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [existingAttachment, setExistingAttachment] = useState(null);

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

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Load policy details and departments
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [policyRes, deptRes] = await Promise.all([
          getPolicyById(id),
          apiClient.get('/departments').catch(() => ({ data: [] }))
        ]);

        const p = policyRes?.data || policyRes;
        if (p) {
          setFormData({
            title: p.title || '',
            policyCode: p.policyCode || '',
            category: p.category || 'attendance_shifts',
            currentVersion: p.currentVersion || '1.0',
            effectiveDate: p.effectiveDate || new Date().toISOString().split('T')[0],
            isMandatory: p.isMandatory !== undefined ? p.isMandatory : true,
            targetAudience: p.targetAudience || 'all',
            targetDepartmentId: p.targetDepartmentId || '',
            summary: p.summary || '',
            content: p.content || '',
            status: p.status || 'published'
          });
          setExistingAttachment(p.attachmentUrl || null);
        }

        const deptList = Array.isArray(deptRes?.data?.data)
          ? deptRes.data.data
          : Array.isArray(deptRes?.data)
          ? deptRes.data
          : [];
        setDepartments(deptList);
      } catch (err) {
        alert('Failed to load policy details');
        navigate('/hr/policies');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, navigate]);

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

    const validExtensions = /\.(pdf|doc|docx|xls|xlsx)$/i;
    if (!validExtensions.test(file.name)) {
      setFileError('Please upload a valid PDF, Word document, or Excel spreadsheet.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.summary.trim()) {
      alert('Please fill out the Title and Summary.');
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
      data.append('status', formData.status);

      if (selectedFile) {
        data.append('attachment', selectedFile);
      }

      await updatePolicy(id, data);
      alert('Policy details updated successfully!');
      navigate('/hr/policies');
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-[#8B1D2C] animate-spin" />
        <span className="text-xs font-bold text-slate-500">Loading policy details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16 font-sans">
      {/* ── Top Header Navigation Bar ───────────────────────────────────── */}
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
              <span className="text-xs font-mono font-medium text-slate-500">{formData.policyCode}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Edit Policy Details
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => navigate('/hr/policies')}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* ── Main Form Grid ────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identification Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#8B1D2C]" /> Policy Specification
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Policy Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Policy Code</label>
                  <input
                    type="text"
                    name="policyCode"
                    value={formData.policyCode}
                    onChange={handleChange}
                    className="w-full uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Executive Summary</label>
                <textarea
                  name="summary"
                  rows={3}
                  required
                  value={formData.summary}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Clauses / Content Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#8B1D2C]" /> Full Policy Body / Regulations
            </h3>
            <textarea
              name="content"
              rows={12}
              value={formData.content}
              onChange={handleChange}
              className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors leading-relaxed"
            />
          </div>

          {/* Document File Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#8B1D2C]" /> Document File Attachment
            </h3>

            {/* Existing Attachment Badge */}
            {existingAttachment && !selectedFile && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Existing Document Attached</span>
                    <a
                      href={existingAttachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8B1D2C] hover:underline font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Download className="w-3 h-3" /> View / Download Current File
                    </a>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">To replace, upload a new file below</span>
              </div>
            )}

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('edit-policy-file').click()}
              className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-[#8B1D2C] bg-rose-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                id="edit-policy-file"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Click to replace or upload new official document</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PDF, Word, or Excel up to 20 MB</p>
            </div>

            {selectedFile && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  <div>
                    <span className="font-bold text-emerald-950 block">{selectedFile.name}</span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; New replacement file selected
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {fileError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                <AlertCircle className="w-4 h-4" />
                <span>{fileError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Meta & Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 text-xs">
            <h3 className="font-black text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#8B1D2C]" /> Version & Scope
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Version Number</label>
                <input
                  type="text"
                  name="currentVersion"
                  value={formData.currentVersion}
                  onChange={handleChange}
                  placeholder="1.1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Effective Date</label>
                <input
                  type="date"
                  name="effectiveDate"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Department Scope</label>
                <select
                  name="targetDepartmentId"
                  value={formData.targetDepartmentId}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audience</label>
                <select
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                >
                  <option value="all">All Personnel</option>
                  <option value="employees_only">Confirmed Employees Only</option>
                  <option value="probationers">Probationary Staff Only</option>
                  <option value="management">Management & Team Leads</option>
                </select>
              </div>

              {/* Mandatory Checkbox */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isMandatory"
                    checked={formData.isMandatory}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded text-[#8B1D2C] focus:ring-[#8B1D2C]/20 accent-[#8B1D2C]"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">Mandatory Sign-off</span>
                    <span className="text-[11px] text-slate-500 block">
                      Enforces digital acknowledgment across employee portals.
                    </span>
                  </div>
                </label>
              </div>

              {/* Status Selector */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 mb-1.5">Publication Status</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['published', 'draft', 'archived'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, status: st }))}
                      className={`py-1.5 px-2 rounded-xl font-bold text-xs capitalize border transition-colors cursor-pointer ${
                        formData.status === st
                          ? 'bg-[#8B1D2C] text-white border-[#8B1D2C] shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default HREditPolicyView;
