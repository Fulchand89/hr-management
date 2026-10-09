import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderOpen,
  Download,
  Search,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Loader2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar
} from 'lucide-react';
import { getPolicies } from '../../services/policyService';

const CATEGORIES = [
  { id: 'all', label: 'All Documents' },
  { id: 'attendance_shifts', label: 'Attendance & Timings' },
  { id: 'leave_holidays', label: 'Leaves & Holidays' },
  { id: 'salary_appraisal', label: 'Salary & Compensation' },
  { id: 'exit_notice_period', label: 'Notice & Exit' },
  { id: 'joining_documents', label: 'Joining & Verification' },
  { id: 'code_of_conduct', label: 'Code of Conduct & NDA' },
  { id: 'general', label: 'Corporate Guidelines' }
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
      // Filter only policies that have an attachment
      setPolicies(list.filter((p) => Boolean(p.attachmentUrl)));
    } catch (err) {
      console.error('Failed to load policy documents:', err);
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
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.policyCode && p.policyCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.summary && p.summary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* ── Simple Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/employee/policies')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Policies</span>
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Policy Documents & SOPs
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Download official company handbook files, PDF circulars, and verified guidelines ({policies.length} Files)
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

      {/* ── Search & Filter Toolbar ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents by title or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#8B1D2C]"
          />
        </div>

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
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Documents Grid ──────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-7 h-7 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading policy documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">No Documents Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No attached document files matched your current filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isSigned = doc.isAcknowledged;
            const isMandatoryPending = doc.isMandatory && !isSigned;
            const isPdf = doc.attachmentUrl?.toLowerCase().endsWith('.pdf');
            const fileType = isPdf ? 'PDF' : 'DOC';
            const fileName = doc.attachmentUrl?.split('/').pop() || `${doc.policyCode || 'Policy'}.pdf`;

            return (
              <div
                key={doc.id}
                className={`bg-white rounded-xl p-4 sm:p-5 border transition-all flex flex-col justify-between space-y-3 ${
                  isMandatoryPending
                    ? 'border-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {doc.policyCode}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-[#8B1D2C]">
                        {fileType}
                      </span>
                      {isSigned ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Signed
                        </span>
                      ) : doc.isMandatory ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-[#8B1D2C] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Sign-off Req
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                          Informational
                        </span>
                      )}
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

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={doc.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Download File"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => navigate('/employee/policies/' + doc.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                    title="View details"
                  >
                    <span>{isMandatoryPending ? 'Read & Sign' : 'View'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeePolicyDocumentsView;
