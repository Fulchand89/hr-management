import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  Check,
  X,
  Trash2,
  Loader2,
  User,
  Building,
  Briefcase,
  Mail,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Download,
  Calendar
} from 'lucide-react';
import {
  getEmployeeDocumentById,
  verifyEmployeeDocument,
  deleteEmployeeDocument
} from '../../services/hrService';
import { PageSkeleton } from '../../components/common/Skeleton';

export const HRKycDocumentDetailView = () => {
  const { docId, id } = useParams();
  const targetDocId = docId || id;
  const navigate = useNavigate();

  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Rejection Form State
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchDocument = async () => {
    if (!targetDocId) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await getEmployeeDocumentById(targetDocId);
      const data = res?.data || res;
      setDocument(data);
    } catch (err) {
      console.error('Failed to load document details:', err);
      setErrorMessage(err?.response?.data?.message || 'Failed to load document details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [targetDocId]);

  const handleVerify = async () => {
    setIsSubmitting(true);
    try {
      await verifyEmployeeDocument(targetDocId, { status: 'verified', remarks: 'Verified by HR' });
      showToast('Document successfully verified and marked Active!');
      await fetchDocument();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to verify document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    const reason = rejectReason.trim() || 'Document illegible or invalid details';
    setIsSubmitting(true);
    try {
      await verifyEmployeeDocument(targetDocId, {
        status: 'rejected',
        remarks: reason
      });
      showToast('Document marked as Rejected.');
      setIsRejectOpen(false);
      setRejectReason('');
      await fetchDocument();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to reject document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this document record?')) return;
    try {
      await deleteEmployeeDocument(targetDocId);
      alert('Document deleted successfully.');
      navigate('/hr/employees?tab=kyc');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete document');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <PageSkeleton />
      </div>
    );
  }

  if (errorMessage || !document) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Document Not Found</h2>
        <p className="text-xs text-slate-500">{errorMessage || 'The requested document record does not exist.'}</p>
        <button
          type="button"
          onClick={() => navigate('/hr/employees?tab=kyc')}
          className="px-4 py-2 rounded-xl bg-[#8B1D2C] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to KYC Documents</span>
        </button>
      </div>
    );
  }

  const emp = document.user || {};
  const isVerified = document.verificationStatus === 'verified';
  const isRejected = document.verificationStatus === 'rejected';
  const isPending = document.verificationStatus === 'pending';

  return (
    <div className="max-w-6xl mx-auto space-y-5 font-sans text-slate-800 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/employees?tab=kyc')}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Back to KYC Documents"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{document.title}</h1>
              {isVerified ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> Verified
                </span>
              ) : isRejected ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                  <X className="w-3 h-3" /> Rejected
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending Review
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitted by <strong className="text-slate-700">{emp.firstName} {emp.lastName}</strong> ({emp.employeeCode || 'EMP'}) &bull; Type: <span className="uppercase font-semibold">{document.documentType?.replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {document.fileUrl && (
            <a
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </a>
          )}
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete Document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Document Viewer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#8B1D2C]" />
                <span>Document File Preview</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {document.mimeType || 'PDF / Image'}
              </span>
            </div>

            <div className="p-4 bg-slate-100/70 min-h-[500px] flex items-center justify-center">
              {document.mimeType?.startsWith('image/') || document.fileUrl?.match(/\.(jpeg|jpg|png|webp)$/i) ? (
                <img
                  src={document.fileUrl}
                  alt={document.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-xs"
                />
              ) : (
                <iframe
                  src={document.fileUrl}
                  title={document.title}
                  className="w-full h-[70vh] rounded-xl border border-slate-200 bg-white"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Employee Details & Verification Decisions */}
        <div className="space-y-4">
          {/* Action Decision Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#8B1D2C]" />
              <span>Verification Decision</span>
            </h3>

            {isPending && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Review the document preview on the left and choose an action:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRejectOpen(true)}
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            )}

            {isVerified && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Document Verified Active</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Verified on {document.verifiedAt ? new Date(document.verifiedAt).toLocaleString() : 'N/A'}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsRejectOpen(true)}
                  className="w-full py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Change Decision to Reject
                </button>
              </div>
            )}

            {isRejected && (
              <div className="space-y-3">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Document Marked Rejected</span>
                  </div>
                  {document.remarks && (
                    <p className="text-[11px] text-rose-700">
                      Reason: <strong>{document.remarks}</strong>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isSubmitting}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Re-Verify &amp; Mark Valid
                </button>
              </div>
            )}

            {/* Rejection Form Collapse */}
            {isRejectOpen && (
              <div className="pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Select or Enter Rejection Reason:
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    'Blur / Unreadable',
                    'Wrong Document',
                    'Expired Document',
                    'Name Mismatch'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setRejectReason(chip)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-sans"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectOpen(false)}
                    className="px-3 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Employee Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-3 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#8B1D2C]" />
              <span>Employee Information</span>
            </h3>

            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Full Name</span>
                <span className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Employee Code</span>
                <span className="font-mono font-semibold text-slate-700">{emp.employeeCode || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department</span>
                <span className="text-slate-700">{emp.departmentDetails?.name || emp.department || 'General'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Designation</span>
                <span className="text-slate-700">{emp.designationDetails?.title || emp.designation || 'Staff'}</span>
              </div>
              {emp.email && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email</span>
                  <span className="text-slate-700 truncate max-w-[160px]">{emp.email}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate(`/hr/employees/${emp.id}`)}
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold text-center block transition-colors cursor-pointer"
              >
                View Complete 360&deg; Profile &rarr;
              </button>
            </div>
          </div>

          {/* Document Metadata Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-2.5 text-xs text-slate-600">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Document Metadata
            </h4>
            <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Uploaded On:</span>
                <span>{new Date(document.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Document Type:</span>
                <span className="uppercase font-semibold">{document.documentType}</span>
              </div>
              {document.fileSize && (
                <div className="flex justify-between">
                  <span className="text-slate-400">File Size:</span>
                  <span>{(document.fileSize / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRKycDocumentDetailView;
