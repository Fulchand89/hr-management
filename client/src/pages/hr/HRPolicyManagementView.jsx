import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Upload,
  Edit3,
  Trash2,
  Eye,
  Send,
  Users,
  ShieldCheck,
  Lock,
  Calendar,
  X,
  Loader2,
  FileCheck,
  Building2,
  Check,
  ExternalLink,
  ChevronRight,
  Sparkles,
  BookOpen,
  Printer,
  FolderOpen
} from 'lucide-react';
import {
  getPolicies,
  createPolicy,
  updatePolicy,
  setPolicyStatus,
  deletePolicy,
  getPolicyCompliance,
  sendPolicyReminders
} from '../../services/policyService';
import CompanyHandbookModal from '../../components/common/CompanyHandbookModal';

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'attendance_shifts', label: 'Attendance & Work Hours' },
  { id: 'leave_holidays', label: 'Leave Policy' },
  { id: 'salary_appraisal', label: 'Salary & Appraisals' },
  { id: 'exit_notice_period', label: 'Notice Period & Exit' },
  { id: 'joining_documents', label: 'Joining Documents' },
  { id: 'code_of_conduct', label: 'Code of Conduct & Etiquette' },
  { id: 'project_management', label: 'Project Management & Referral' },
  { id: 'recreation_fun', label: 'Fun Friday & Recreation' },
  { id: 'general', label: 'General Guidelines' }
];

const CATEGORY_NAMES = {
  attendance_shifts: 'Attendance & Work Hours',
  leave_holidays: 'Leave Policy & Deductions',
  salary_appraisal: 'Salary & Appraisals',
  exit_notice_period: 'Notice Period & Exit',
  joining_documents: 'Joining Documents',
  code_of_conduct: 'Code of Conduct & Etiquette',
  project_management: 'Project Management & Referral',
  recreation_fun: 'Fun Friday & Recreation',
  general: 'General Guidelines'
};

export const HRPolicyManagementView = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('policies'); // 'policies' | 'documents'
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [compliancePolicyId, setCompliancePolicyId] = useState(null);
  const [complianceData, setComplianceData] = useState(null);
  const [isComplianceLoading, setIsComplianceLoading] = useState(false);
  const [complianceFilter, setComplianceFilter] = useState('all'); // 'all' | 'signed' | 'pending'
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [readingPolicy, setReadingPolicy] = useState(null);

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    policyCode: '',
    category: 'attendance_shifts',
    currentVersion: '1.0',
    effectiveDate: new Date().toISOString().split('T')[0],
    isMandatory: true,
    summary: '',
    content: '',
    status: 'published'
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadPolicies = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getPolicies(params);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setPolicies(list);
    } catch (err) {
      console.error('Failed to load policies:', err);
      showToast('Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  // Open Compliance Modal
  const handleOpenCompliance = async (policyId) => {
    setCompliancePolicyId(policyId);
    setIsComplianceLoading(true);
    try {
      const res = await getPolicyCompliance(policyId);
      setComplianceData(res?.data || res);
    } catch (err) {
      console.error('Failed to load compliance report:', err);
      showToast('Failed to load compliance report');
    } finally {
      setIsComplianceLoading(false);
    }
  };

  // Send Reminders
  const handleSendReminders = async (policyId) => {
    try {
      const res = await sendPolicyReminders(policyId);
      showToast(res?.message || 'Reminder alerts sent successfully');
      handleOpenCompliance(policyId);
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to send reminders');
    }
  };

  // Toggle Policy Status (Publish / Draft)
  const handleToggleStatus = async (policy) => {
    const nextStatus = policy.status === 'published' ? 'draft' : 'published';
    try {
      await setPolicyStatus(policy.id, nextStatus);
      showToast(`Policy marked as ${nextStatus}`);
      loadPolicies();
    } catch (err) {
      showToast('Failed to change status');
    }
  };

  // Delete Policy
  const handleDeletePolicy = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete policy: "${title}"?`)) return;
    try {
      await deletePolicy(id);
      showToast('Policy deleted successfully');
      loadPolicies();
    } catch (err) {
      showToast('Failed to delete policy');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (p) => {
    setEditingPolicy(p);
    setFormData({
      title: p.title || '',
      policyCode: p.policyCode || '',
      category: p.category || 'general',
      currentVersion: p.currentVersion || '1.0',
      effectiveDate: p.effectiveDate || new Date().toISOString().split('T')[0],
      isMandatory: p.isMandatory || false,
      summary: p.summary || '',
      content: p.content || '',
      status: p.status || 'published'
    });
    setSelectedFile(null);
    setIsCreateModalOpen(true);
  };

  // Handle Form Submit (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.summary.trim()) {
      alert('Please provide a Title and Summary');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      if (formData.policyCode) data.append('policyCode', formData.policyCode.trim());
      data.append('category', formData.category);
      data.append('currentVersion', formData.currentVersion);
      data.append('effectiveDate', formData.effectiveDate);
      data.append('isMandatory', formData.isMandatory);
      data.append('summary', formData.summary.trim());
      data.append('content', formData.content.trim());
      data.append('status', formData.status);
      if (selectedFile) {
        data.append('attachment', selectedFile);
      }

      if (editingPolicy) {
        await updatePolicy(editingPolicy.id, data);
        showToast('Policy updated successfully');
      } else {
        await createPolicy(data);
        showToast('Policy created and published successfully');
      }

      setIsCreateModalOpen(false);
      setEditingPolicy(null);
      loadPolicies();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to save policy');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived KPI computations
  const totalCount = policies.length;
  const publishedCount = policies.filter((p) => p.status === 'published').length;
  const mandatoryCount = policies.filter((p) => p.isMandatory).length;
  const uploadedDocs = policies.filter((p) => Boolean(p.attachmentUrl));

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Simple Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Policies & SOPs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage corporate policies, official SOPs, and employee digital sign-offs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsHandbookOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Open official corporate policy handbook"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-500" />
            <span>Handbook</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/hr/policies/upload')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Upload official policy PDF or SOP document"
          >
            <Upload className="w-3.5 h-3.5 text-[#8B1D2C]" />
            <span>Upload Document</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/hr/policies/add')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Add a new policy clause"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Policy</span>
          </button>
        </div>
      </div>

      {/* ── Simple Compact Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Policies</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{totalCount}</span>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 block">Published Active</span>
          <span className="text-xl font-bold text-emerald-950 font-mono mt-0.5 block">{publishedCount}</span>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-[#8B1D2C] block">Mandatory Sign-off</span>
          <span className="text-xl font-bold text-slate-900 font-mono mt-0.5 block">{mandatoryCount}</span>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 block">Attached Documents</span>
          <span className="text-xl font-bold text-blue-950 font-mono mt-0.5 block">{uploadedDocs.length}</span>
        </div>
      </div>

      {/* ── Tab Switcher & Search Bar ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'policies'
                ? 'bg-white shadow-2xs text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Policy Clauses ({policies.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-white shadow-2xs text-slate-900'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Documents ({uploadedDocs.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8B1D2C]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-hidden"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-hidden"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* ── Content Area: Tabbed Views ─────────────────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-7 h-7 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading company policies...</p>
        </div>
      ) : activeTab === 'documents' ? (
        /* ── Simple Uploaded Documents View ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Official Attachments & SOP Files ({uploadedDocs.length})</span>
            <button
              type="button"
              onClick={() => navigate('/hr/policies/upload')}
              className="text-xs text-[#8B1D2C] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>

          {uploadedDocs.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Documents Uploaded Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload official PDF documents, employee handbooks, or circulars to attach to company policies.
              </p>
              <button
                type="button"
                onClick={() => navigate('/hr/policies/upload')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload First Document</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedDocs.map((doc) => {
                const isPdf = doc.attachmentUrl?.toLowerCase().endsWith('.pdf');
                const fileType = isPdf ? 'PDF' : 'DOC';
                const fileName = doc.attachmentUrl?.split('/').pop() || `${doc.policyCode || 'Policy'}.pdf`;

                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {doc.policyCode}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-[#8B1D2C]">
                            {fileType}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              doc.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1" title={doc.title}>
                          {doc.title}
                        </h3>
                        <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                          {CATEGORY_NAMES[doc.category] || doc.category} &bull; v{doc.currentVersion}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-1 font-mono truncate" title={fileName}>
                        {fileName}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <a
                        href={doc.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenCompliance(doc.id)}
                          className="px-2 py-1 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          Sign-offs
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/hr/policies/edit/' + doc.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit / Replace File"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePolicy(doc.id, doc.title)}
                          className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : policies.length === 0 ? (
        /* ── Simple Empty State ── */
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">No Policies Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search filters or click "Add Policy" to add your first company regulation.
          </p>
          <button
            type="button"
            onClick={() => navigate('/hr/policies/add')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-semibold text-xs transition-colors cursor-pointer mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Policy</span>
          </button>
        </div>
      ) : (
        /* ── Simple Policy Cards Grid ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((p) => {
            const isPublished = p.status === 'published';

            return (
              <div
                key={p.id}
                className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {p.policyCode}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {p.isMandatory && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-[#8B1D2C]">
                          Mandatory
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                      {p.title}
                    </h3>
                    <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
                      {CATEGORY_NAMES[p.category] || p.category} &bull; v{p.currentVersion}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {p.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400">
                    {p.attachmentUrl ? (
                      <a
                        href={p.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                        title="Download attached official file"
                      >
                        <Download className="w-3 h-3" /> Doc
                      </a>
                    ) : (
                      <span>{p.effectiveDate}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setReadingPolicy(p)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCompliance(p.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      Sign-offs
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/hr/policies/edit/' + p.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Edit Policy"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePolicy(p.id, p.title)}
                      className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Policy"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ─────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {editingPolicy ? 'Edit Company Policy' : 'Create New Company Policy'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {editingPolicy ? 'Update policy clauses or document' : 'Define regulations and publish to employee handbook'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700 block">Policy Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Work Schedule, Attendance & Break Policy"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>

                {/* Policy Code */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Policy Code</label>
                  <input
                    type="text"
                    placeholder="e.g. POL-ATT-01 (Auto-generated if empty)"
                    value={formData.policyCode}
                    onChange={(e) => setFormData({ ...formData, policyCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-mono focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-hidden focus:border-[#8B1D2C]"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Version */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Version Number</label>
                  <input
                    type="text"
                    placeholder="1.0"
                    value={formData.currentVersion}
                    onChange={(e) => setFormData({ ...formData, currentVersion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-mono focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>

                {/* Effective Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Effective Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-[#8B1D2C]"
                  />
                </div>
              </div>

              {/* Mandatory Sign-off Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Mandatory Employee Sign-Off</span>
                  <span className="text-[11px] text-slate-400">
                    Requires every active employee to click "I Agree" to confirm compliance
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isMandatory}
                  onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                  className="w-4 h-4 accent-[#8B1D2C] cursor-pointer"
                />
              </div>

              {/* Summary */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Executive Summary (Preview Card) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="2-3 sentences summarizing key rules..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:outline-hidden focus:border-[#8B1D2C]"
                />
              </div>

              {/* Full Content */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Complete Policy Content / Clauses</label>
                <textarea
                  rows={6}
                  placeholder="Type policy clauses, timing details, penalties, and standard operating procedures..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-mono text-[11px] focus:outline-hidden focus:border-[#8B1D2C]"
                />
              </div>

              {/* PDF Document Upload */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Attach Official PDF Document</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">Supported: PDF, Word (Max 10MB)</span>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingPolicy ? 'Update Policy' : 'Publish Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── COMPLIANCE & SIGN-OFF AUDIT MODAL ──────────────────────────── */}
      {compliancePolicyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setCompliancePolicyId(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Employee Sign-off & Compliance Audit
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {complianceData?.policy?.policyCode} &bull; {complianceData?.policy?.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompliancePolicyId(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {isComplianceLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-[#8B1D2C]" />
                  <span className="text-slate-400">Compiling employee sign-off logs...</span>
                </div>
              ) : complianceData ? (
                <>
                  {/* Progress Strip */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-100 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">
                        {complianceData.summary.acknowledgedCount} of {complianceData.summary.totalEmployees} Employees Compliant
                      </span>
                      <span className="font-mono text-emerald-800">
                        {complianceData.summary.compliancePercentage}% Signed
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                        style={{ width: `${complianceData.summary.compliancePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Filter & Reminder Button */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setComplianceFilter('all')}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                          complianceFilter === 'all' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        All ({complianceData.summary.totalEmployees})
                      </button>
                      <button
                        type="button"
                        onClick={() => setComplianceFilter('signed')}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                          complianceFilter === 'signed' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-500'
                        }`}
                      >
                        Signed ({complianceData.summary.acknowledgedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setComplianceFilter('pending')}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                          complianceFilter === 'pending' ? 'bg-white shadow-2xs text-amber-800' : 'text-slate-500'
                        }`}
                      >
                        Pending ({complianceData.summary.pendingCount})
                      </button>
                    </div>

                    {complianceData.summary.pendingCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSendReminders(compliancePolicyId)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Reminders ({complianceData.summary.pendingCount})</span>
                      </button>
                    )}
                  </div>

                  {/* Employees Table */}
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                          <th className="py-2.5 px-4">Employee</th>
                          <th className="py-2.5 px-4">Department</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4 text-right">Signed Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {complianceData.records
                          .filter((r) => {
                            if (complianceFilter === 'signed') return r.isAcknowledged;
                            if (complianceFilter === 'pending') return !r.isAcknowledged;
                            return true;
                          })
                          .map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/60">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900">{r.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {r.employeeCode} &bull; {r.email}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-slate-700">{r.department}</td>

                              <td className="py-3 px-4">
                                {r.isAcknowledged ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3" /> Signed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Clock className="w-3 h-3" /> Pending
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                                {r.acknowledgedAt
                                  ? new Date(r.acknowledgedAt).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : '--'}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPANY HANDBOOK MASTER MODAL ────────────────────────────── */}
      <CompanyHandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
      />

      {/* ── SINGLE POLICY READER MODAL ─────────────────────────────────── */}
      {readingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setReadingPolicy(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#8B1D2C]" />
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Official Corporate Policy Clause
                </span>
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {readingPolicy.policyCode}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / Save PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReadingPolicy(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Viewport with Letterhead */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 text-xs">
              {/* Company Letterhead */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-200 flex items-center justify-center shrink-0">
                    <img src="/logo.png" alt="Gupta Tech Web Logo" className="h-full w-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
                      Gupta Tech Web
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">
                      410 Shagun Tower, Vijay Nagar, Indore – 452010 (M.P) India
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Phone: 7400554294 &bull; info@guptatechweb.com &bull; guptatechweb.com
                    </p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#8B1D2C]/10 text-[#8B1D2C]">
                    {CATEGORY_NAMES[readingPolicy.category] || readingPolicy.category}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Ver: {readingPolicy.currentVersion} &bull; Effective: {readingPolicy.effectiveDate}
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    Nikita Gupta, CEO
                  </div>
                </div>
              </div>

              {/* Policy Title & Summary Box */}
              <div className="space-y-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  {readingPolicy.title}
                </h1>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 italic leading-relaxed">
                  "{readingPolicy.summary}"
                </div>
              </div>

              {/* Policy Content / Clauses */}
              <div className="space-y-4 pt-2 leading-relaxed text-slate-700">
                {readingPolicy.content ? (
                  <div className="whitespace-pre-wrap font-sans text-xs space-y-3 leading-relaxed">
                    {readingPolicy.content}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No additional clause text provided.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPolicyManagementView;
