import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ShieldCheck,
  Lock,
  Calendar,
  X,
  Loader2,
  Check,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Info,
  Sparkles,
  FileCheck,
  Printer,
  FolderOpen
} from 'lucide-react';
import { getPolicies, acknowledgePolicy } from '../../services/policyService';
import { useAuth } from '../../context/AuthContext';
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

export const EmployeePoliciesView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Reader Modal State
  const [readingPolicy, setReadingPolicy] = useState(null);
  const [hasAgreedConsent, setHasAgreedConsent] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isHandbookOpen, setIsHandbookOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadPolicies = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getPolicies(params);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setPolicies(list);
    } catch (err) {
      console.error('Failed to load policies for employee:', err);
      showToast('Failed to load company policies');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  // Handle Digital Sign-off
  const handleAcknowledge = async (policyId) => {
    if (!hasAgreedConsent) {
      alert('Please check the confirmation box to confirm that you have read and agree to the policy.');
      return;
    }

    setIsSigning(true);
    try {
      await acknowledgePolicy(policyId);
      showToast('Policy acknowledged and digitally signed successfully!');

      // Update local state
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === policyId
            ? { ...p, isAcknowledged: true, acknowledgedAt: new Date().toISOString() }
            : p
        )
      );

      if (readingPolicy && readingPolicy.id === policyId) {
        setReadingPolicy((prev) => ({
          ...prev,
          isAcknowledged: true,
          acknowledgedAt: new Date().toISOString()
        }));
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to acknowledge policy');
    } finally {
      setIsSigning(false);
    }
  };

  // Pending Mandatory count
  const pendingMandatoryPolicies = policies.filter((p) => p.isMandatory && !p.isAcknowledged);

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
            Company Policies
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official guidelines, employee handbook, and compliance acknowledgments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/employee/policies/documents')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Browse and download official attached policy documents and SOPs"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#8B1D2C]" />
            <span>Policy Documents ({policies.length})</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/employee/policies/handbook')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Read complete official corporate policy handbook"
          >
            <BookOpen className="w-3.5 h-3.5 text-rose-400" />
            <span>Official Handbook</span>
          </button>
        </div>
      </div>

      {/* ── Action Required Alert Strip ─────────────────────────────────── */}
      {pendingMandatoryPolicies.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-rose-950 font-medium">
            <Lock className="w-4 h-4 text-[#8B1D2C] shrink-0" />
            <span>
              You have <strong>{pendingMandatoryPolicies.length}</strong> mandatory {pendingMandatoryPolicies.length === 1 ? 'policy' : 'policies'} requiring digital sign-off.
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/employee/policies/' + pendingMandatoryPolicies[0].id)}
            className="px-3.5 py-1.5 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
          >
            Review & Sign &rarr;
          </button>
        </div>
      )}

      {/* ── Search & Category Filter Toolbar ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rules, shifts, timings, leaves..."
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

      {/* ── Policies Cards Grid ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-7 h-7 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading company handbook...</p>
        </div>
      ) : policies.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">No Policies Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No policies matched your search criteria. Try switching categories or clearing search keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((p) => {
            const isSigned = p.isAcknowledged;
            const isMandatoryPending = p.isMandatory && !isSigned;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-xl p-4 sm:p-5 border transition-all flex flex-col justify-between space-y-3 ${
                  isMandatoryPending
                    ? 'border-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Bar: Code & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {p.policyCode}
                    </span>

                    {isSigned ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Signed
                      </span>
                    ) : p.isMandatory ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-[#8B1D2C] flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Sign-off Req
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500">
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

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
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
                          <Download className="w-3 h-3" /> Doc
                        </a>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/employee/policies/' + p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      isMandatoryPending
                        ? 'bg-[#8B1D2C] hover:bg-[#731724] text-white'
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

      {/* ── FULL POLICY READER & SIGN-OFF MODAL ─────────────────────────── */}
      {readingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setReadingPolicy(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Top Control Bar */}
            <div className="px-6 py-4 bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-4 h-4 text-[#8B1D2C]" />
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Official Corporate Policy Handbook
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

                {readingPolicy.attachmentUrl && (
                  <a
                    href={readingPolicy.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download Doc</span>
                  </a>
                )}

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

              {/* Digital Sign-off Section */}
              <div className="pt-6 border-t border-slate-200 space-y-4">
                {readingPolicy.isAcknowledged ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block">
                        Digitally Signed & Compliant
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        You acknowledged this corporate policy on{' '}
                        {new Date(readingPolicy.acknowledgedAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        . Official audit signature recorded.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/60 to-orange-50/40 border border-rose-200/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#8B1D2C]" />
                      <span className="font-bold text-xs text-slate-900">
                        Employee Acknowledgment & Consent Declaration
                      </span>
                    </div>

                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasAgreedConsent}
                        onChange={(e) => setHasAgreedConsent(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-[#8B1D2C] cursor-pointer"
                      />
                      <span>
                        I hereby confirm that I have read, understood, and agree to strictly comply with all provisions, working hours, and conduct regulations stated in this policy.
                      </span>
                    </label>

                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        disabled={!hasAgreedConsent || isSigning}
                        onClick={() => handleAcknowledge(readingPolicy.id)}
                        className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99] flex items-center gap-2"
                      >
                        {isSigning ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Recording Signature...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Sign & Submit Acknowledgment</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPANY HANDBOOK MASTER MODAL ────────────────────────────── */}
      <CompanyHandbookModal
        isOpen={isHandbookOpen}
        onClose={() => setIsHandbookOpen(false)}
      />
    </div>
  );
};

export default EmployeePoliciesView;
