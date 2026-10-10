import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  BookOpen,
  Paperclip,
  FolderOpen
} from 'lucide-react';
import { getPolicies } from '../../services/policyService';

const CATEGORIES = [
  { id: 'all', label: 'All Documents' },
  { id: 'general', label: 'Overview' },
  { id: 'attendance_shifts', label: 'Attendance' },
  { id: 'leave_holidays', label: 'Leaves' },
  { id: 'salary_appraisal', label: 'Salary' },
  { id: 'exit_notice_period', label: 'Exit & Notice' },
  { id: 'joining_documents', label: 'Joining' },
  { id: 'code_of_conduct', label: 'Conduct & NDA' },
  { id: 'project_management', label: 'Projects' },
  { id: 'recreation_fun', label: 'Recreation' }
];

const CATEGORY_NAMES = {
  general: 'Company Overview & Objectives',
  attendance_shifts: 'Attendance & Work Hours',
  leave_holidays: 'Leave Policy & Deductions',
  salary_appraisal: 'Salary & Appraisals',
  exit_notice_period: 'Notice Period & Exit',
  joining_documents: 'Joining Documents',
  code_of_conduct: 'Code of Conduct & Etiquette',
  project_management: 'Project Management & Referral',
  recreation_fun: 'Fun Friday & Recreation'
};

export const EmployeePolicyDocumentsView = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getPolicies();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setPolicies(list);
    } catch (err) {
      console.error('Failed to load policy documents:', err);
      setPolicies([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Client-side filtering
  const filteredDocs = policies.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.policyCode?.toLowerCase().includes(q) ||
      p.summary?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans pb-12">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/employee/policies')}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Back to Policies"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Policy Documents & SOPs
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official company policy guidelines, downloadable files, and verified SOP circulars
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/employee/policies/handbook')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <BookOpen className="w-3.5 h-3.5 text-rose-400" />
          <span>Official Handbook</span>
        </button>
      </div>

      {/* ── Search & Category Filter Toolbar ──────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by title or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-[#8B1D2C] shadow-2xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar pb-1 md:pb-0">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#8B1D2C] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Clean Document Table ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B1D2C]" />
            <span>Loading policy documents...</span>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <FolderOpen className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold text-slate-700">No documents found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No policy documents match your current filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Document / Policy</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const isSigned = doc.isAcknowledged;
                  const isMandatoryPending = doc.isMandatory && !isSigned;
                  const hasAttachment = Boolean(doc.attachmentUrl);
                  const isPdf = doc.attachmentUrl?.toLowerCase().endsWith('.pdf');
                  const fileName = doc.attachmentUrl?.split('/').pop();

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Document info */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                            {doc.policyCode}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {doc.title}
                            </span>
                            <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5" title={doc.summary}>
                              {doc.summary || 'Official company operating guidelines.'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {CATEGORY_NAMES[doc.category] || doc.category}
                      </td>

                      {/* Format / Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {hasAttachment ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-[#8B1D2C] border border-rose-200">
                            <Paperclip className="w-3 h-3" />
                            <span>{isPdf ? 'PDF File' : 'Document File'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                            <FileText className="w-3 h-3" />
                            <span>Official SOP</span>
                          </span>
                        )}
                      </td>

                      {/* Effective Date & Version */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {doc.effectiveDate || '2026'} &bull; v{doc.currentVersion || '1.0'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Signed
                          </span>
                        ) : doc.isMandatory ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#8B1D2C] border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-[#8B1D2C]" />
                            Sign-off Req
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                            Informational
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasAttachment && (
                            <a
                              href={doc.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={fileName}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
                              title="Download Attached Document File"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate('/employee/policies/' + doc.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                            title="View Document Details"
                          >
                            <span>{isMandatoryPending ? 'Read & Sign' : 'View'}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeePolicyDocumentsView;
