import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Lock,
  Loader2,
  Check,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { getPolicies } from '../../services/policyService';
import { PageSkeleton } from '../../components/common/Skeleton';

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
  leave_holidays: 'Leave Policy',
  salary_appraisal: 'Salary & Appraisals',
  exit_notice_period: 'Notice Period & Exit',
  joining_documents: 'Joining Documents',
  code_of_conduct: 'Code of Conduct & Etiquette',
  project_management: 'Project Management',
  recreation_fun: 'Recreation & Culture',
  general: 'General Guidelines'
};

export const EmployeePoliciesView = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadPolicies = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getPolicies(params);
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setPolicies(list);
    } catch (err) {
      console.error('Failed to load company policies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  // Mandatory policies that still need sign-off
  const pendingMandatory = policies.filter((p) => p.isMandatory && !p.isAcknowledged);

  // Filter policies based on status tabs
  const filteredPolicies = policies.filter((p) => {
    if (statusFilter === 'pending') return p.isMandatory && !p.isAcknowledged;
    if (statusFilter === 'signed') return p.isAcknowledged;
    return true;
  });

  if (isLoading) {
    return <PageSkeleton statsCount={3} tableRows={4} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* ── Top Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Company Policies
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official guidelines, employee handbook, and compliance acknowledgments
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/employee/policies/handbook')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <BookOpen className="w-3.5 h-3.5 text-rose-400" />
          <span>Official Handbook</span>
        </button>
      </div>

      {/* ── Action Required Alert Strip ─────────────────────────────────── */}
      {pendingMandatory.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-rose-950 font-medium">
            <Lock className="w-4 h-4 text-[#8B1D2C] shrink-0" />
            <span>
              You have <strong>{pendingMandatory.length}</strong> mandatory {pendingMandatory.length === 1 ? 'policy' : 'policies'} requiring your digital sign-off.
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/employee/policies/' + pendingMandatory[0].id)}
            className="px-3.5 py-1.5 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
          >
            Review &amp; Sign &rarr;
          </button>
        </div>
      )}

      {/* ── Search, Category & Status Filter Bar ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, rule or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-100 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({policies.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-white text-rose-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Sign-off Needed ({pendingMandatory.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('signed')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              statusFilter === 'signed'
                ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Signed ({policies.filter((p) => p.isAcknowledged).length})
          </button>
        </div>
      </div>

      {/* ── Policies Cards Grid ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-7 h-7 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading company policies...</p>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200 space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">No Policies Found</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            No policies match the selected category or search filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPolicies.map((p) => {
            const isSigned = p.isAcknowledged;
            const isMandatoryPending = p.isMandatory && !isSigned;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl p-5 border transition-all flex flex-col justify-between space-y-4 shadow-2xs ${
                  isMandatoryPending
                    ? 'border-rose-300 ring-1 ring-rose-200/50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Code & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {p.policyCode}
                    </span>

                    {isSigned ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Signed
                      </span>
                    ) : p.isMandatory ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-[#8B1D2C] border border-rose-200/60 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Sign-off Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                        Informational
                      </span>
                    )}
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

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{p.effectiveDate}</span>
                    {p.attachmentUrl && (
                      <>
                        <span>&bull;</span>
                        <a
                          href={p.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                          title="Download attached official file"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-3 h-3" /> PDF
                        </a>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/employee/policies/' + p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                      isMandatoryPending
                        ? 'bg-[#8B1D2C] hover:bg-[#731724] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
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

export default EmployeePoliciesView;
