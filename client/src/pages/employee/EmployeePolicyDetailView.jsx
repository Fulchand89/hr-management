import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Calendar,
  Printer,
  Loader2,
  Building2,
  Check,
  ExternalLink,
  BookOpen,
  FolderOpen,
  FileCheck
} from 'lucide-react';
import { getPolicyById, acknowledgePolicy } from '../../services/policyService';
import { useAuth } from '../../context/AuthContext';

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

export const EmployeePolicyDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [policy, setPolicy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [hasAgreedConsent, setHasAgreedConsent] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadPolicy = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getPolicyById(id);
      const data = res?.data || res;
      setPolicy(data);
    } catch (err) {
      console.error('Failed to load policy details:', err);
      showToast('Policy not found or failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  const handleSignOff = async () => {
    if (!hasAgreedConsent) {
      alert('Please check the confirmation box to confirm that you have read and agree to the policy.');
      return;
    }

    setIsSigning(true);
    try {
      await acknowledgePolicy(id);
      showToast('Policy acknowledged and digitally signed successfully!');
      setPolicy((prev) => ({
        ...prev,
        isAcknowledged: true,
        acknowledgedAt: new Date().toISOString()
      }));
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to acknowledge policy');
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200/80 max-w-4xl mx-auto my-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
        <p className="text-xs font-bold text-slate-500">Loading policy details...</p>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 max-w-2xl mx-auto my-8 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Policy Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested company policy could not be found or may have been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/employee/policies')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Policies</span>
        </button>
      </div>
    );
  }

  const isSigned = policy.isAcknowledged;
  const isMandatoryPending = policy.isMandatory && !isSigned;
  const isPdf = policy.attachmentUrl?.toLowerCase().endsWith('.pdf');
  const fileName = policy.attachmentUrl?.split('/').pop() || `${policy.policyCode || 'Policy'}.pdf`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Control Bar & Breadcrumbs ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/employee/policies')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Policies</span>
          </button>

          <div className="text-xs text-slate-400 font-medium">
            <span>Policies</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="font-mono text-slate-700 font-bold">{policy.policyCode}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {policy.attachmentUrl && (
            <a
              href={policy.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
              title="Download attached official document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Doc</span>
            </a>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Print or Save as Official PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Policy</span>
          </button>
        </div>
      </div>

      {/* ── Action Required Alert (if mandatory & pending) ───────────────── */}
      {isMandatoryPending && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-50 via-orange-50/50 to-white border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8B1D2C] text-white flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Action Required: Digital Sign-off Pending
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                This is a mandatory company policy. Please read the clauses below and complete digital sign-off at the bottom.
              </p>
            </div>
          </div>

          <a
            href="#sign-off-section"
            className="px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto shadow-xs"
          >
            Go to Sign-off &darr;
          </a>
        </div>
      )}

      {/* ── Main Policy Document Paper View ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
        {/* Document Header - Clean Letterhead */}
        <div className="p-6 sm:p-8 bg-white border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                  {policy.policyCode}
                </span>

                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  {CATEGORY_NAMES[policy.category] || policy.category}
                </span>

                <span className="font-mono text-xs text-slate-500">
                  v{policy.currentVersion}
                </span>

                {isSigned ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Digitally Signed
                  </span>
                ) : policy.isMandatory ? (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-rose-50 text-[#8B1D2C] border border-rose-200 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Mandatory Sign-off
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                    Informational
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
                {policy.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Effective: <strong className="text-slate-700">{policy.effectiveDate}</strong></span>
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Gupta Tech Web &bull; Indore HQ</span>
                </span>
                <span>&bull;</span>
                <span>Authority: <strong className="text-slate-700">Nikita Gupta, CEO</strong></span>
              </div>
            </div>

            <div className="w-14 h-14 rounded-xl bg-slate-50 p-2 border border-slate-200 flex items-center justify-center shrink-0 self-start">
              <img src="/logo.png" alt="Gupta Tech Web" className="h-full w-full object-contain" />
            </div>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* Executive Summary */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#8B1D2C]" />
              <span>Policy Purpose & Summary</span>
            </h2>
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm font-medium text-slate-700 leading-relaxed italic">
              "{policy.summary}"
            </div>
          </div>

          {/* Official Attachment Callout (if available) */}
          {policy.attachmentUrl && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/60 to-blue-50/40 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900">
                      Official Signed Attachment ({isPdf ? 'PDF' : 'Document'})
                    </h3>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-mono mt-0.5 break-all">
                    {fileName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={policy.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
              </div>
            </div>
          )}

          {/* Full Clauses / Content Text */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8B1D2C]" />
              <span>Regulations, Procedures & Clauses</span>
            </h2>

            {policy.content ? (
              <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
                {policy.content}
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 italic">
                Standard company guidelines apply as outlined in the official corporate handbook. For complete operational annexures, refer to the document attachment above.
              </div>
            )}
          </div>

          {/* Official Sign-off Seal / Corporate Signatures */}
          <div className="pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
              <span className="font-bold text-slate-900 block">Corporate Authority</span>
              <p className="text-[11px] text-slate-500">
                Issued under the authority of Executive Management:
              </p>
              <div className="pt-2">
                <span className="font-bold text-slate-900 block">Nikita Gupta</span>
                <span className="text-[11px] text-slate-500">Chief Executive Officer</span>
                <span className="text-[10px] text-slate-400 block font-mono">Gupta Tech Web &bull; Indore HQ</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
              <span className="font-bold text-slate-900 block">Legal & HR Compliance</span>
              <p className="text-[11px] text-slate-500">
                This document is binding for all active workforce members under Indian Employment Regulations.
              </p>
              <div className="pt-2 font-mono text-[10px] text-slate-400">
                Audit Registry ID: GTW-POL-{policy.id}
              </div>
            </div>
          </div>
        </div>

        {/* ── Digital Sign-off & Acknowledgment Section ────────────────────── */}
        <div id="sign-off-section" className="p-6 sm:p-8 bg-slate-50 border-t border-slate-200/80">
          {isSigned ? (
            /* Already Signed State */
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Digitally Signed & Acknowledged
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Signed by: <strong>{user?.name || 'Employee'}</strong> &bull;{' '}
                    <span>{policy.acknowledgedAt ? new Date(policy.acknowledgedAt).toLocaleString() : 'Recorded'}</span>
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-emerald-800 font-mono bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
                Status: Compliant & Verified
              </div>
            </div>
          ) : (
            /* Pending Sign-off Form */
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Employee Digital Acknowledgment & Undertaking
                  </h3>
                  <p className="text-xs text-slate-500">
                    Please read and sign below to record your formal compliance acknowledgment in the workforce registry.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200 cursor-pointer hover:border-[#8B1D2C] transition-colors">
                <input
                  type="checkbox"
                  checked={hasAgreedConsent}
                  onChange={(e) => setHasAgreedConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-md border-slate-300 text-[#8B1D2C] focus:ring-[#8B1D2C]"
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  I hereby confirm that I have carefully read and understood all clauses of policy{' '}
                  <strong className="text-slate-900">{policy.policyCode} ({policy.title})</strong>.
                  I agree to abide by these guidelines and understand that non-compliance is subject to company disciplinary procedures.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-slate-400 font-mono">
                  Signer: {user?.name || 'Current Employee'} ({user?.email || 'Authenticated User'})
                </div>

                <button
                  type="button"
                  disabled={!hasAgreedConsent || isSigning}
                  onClick={handleSignOff}
                  className="px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer self-start sm:self-auto"
                >
                  {isSigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Signature...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Digitally Acknowledge & Sign Policy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeePolicyDetailView;
