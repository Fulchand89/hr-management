import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  Check,
  X,
  Trash2,
  Loader2,
  Eye,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  getAllEmployeeDocuments,
  verifyEmployeeDocument,
  deleteEmployeeDocument
} from '../../services/hrService';

export const HRKycVerificationView = ({ onDocumentUpdated }) => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reject Modal State
  const [rejectModalDoc, setRejectModalDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllEmployeeDocuments({
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        documentType: selectedType !== 'all' ? selectedType : undefined
      });
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load employee KYC documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedType]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Client-side search filtering
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const emp = doc.user || {};
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeCode || ''}`.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        fullName.includes(searchQuery.toLowerCase()) ||
        (doc.title && doc.title.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [documents, searchQuery]);

  // Metrics
  const pendingCount = documents.filter((d) => d.verificationStatus === 'pending').length;
  const verifiedCount = documents.filter((d) => d.verificationStatus === 'verified').length;
  const rejectedCount = documents.filter((d) => d.verificationStatus === 'rejected').length;

  const handleVerify = async (docId) => {
    setIsSubmitting(true);
    try {
      await verifyEmployeeDocument(docId, { status: 'verified', remarks: 'Verified by HR' });
      showToast('Document successfully verified!');
      await loadDocuments();
      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to verify document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRejectModal = (doc) => {
    setRejectModalDoc(doc);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalDoc) return;
    const reason = rejectReason.trim() || 'Document illegible or invalid details';
    setIsSubmitting(true);
    try {
      await verifyEmployeeDocument(rejectModalDoc.id, {
        status: 'rejected',
        remarks: reason
      });
      showToast('Document rejected.');
      setRejectModalDoc(null);
      await loadDocuments();
      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to reject document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document record?')) return;
    try {
      await deleteEmployeeDocument(docId);
      showToast('Document record deleted.');
      await loadDocuments();
      if (onDocumentUpdated) onDocumentUpdated();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete document');
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Filter & Search Bar ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Status Filter Buttons (no overflow-x-auto, wraps cleanly) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              selectedStatus === 'all'
                ? 'bg-[#8B1D2C] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All ({documents.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('verified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'verified'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified ({verifiedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              selectedStatus === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedCount})</span>
          </button>
        </div>

        {/* Search & Type dropdown */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap grow sm:grow-0">
          <div className="relative w-full sm:w-56 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#8B1D2C]"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer shrink-0"
          >
            <option value="all">All Types</option>
            <option value="id_proof">ID Proof</option>
            <option value="education">Education</option>
            <option value="experience">Experience</option>
            <option value="address_proof">Address Proof</option>
            <option value="other">Other</option>
          </select>

          <button
            type="button"
            onClick={loadDocuments}
            disabled={isLoading}
            className="p-2 text-slate-600 hover:text-[#8B1D2C] bg-slate-50 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#8B1D2C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Simple Documents Table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B1D2C]" />
            <span className="text-xs font-semibold">Loading documents...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-1.5">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No documents found</p>
            <p className="text-[11px] text-slate-400">
              No employee documents match the selected filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map((doc) => {
                  const emp = doc.user || {};
                  const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
                  const isVerified = doc.verificationStatus === 'verified';
                  const isRejected = doc.verificationStatus === 'rejected';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Employee */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {emp.employeeCode || 'EMP'} &bull; {emp.departmentDetails?.name || 'General'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Title & Type */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">{doc.title}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {doc.documentType?.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Upload Date */}
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" /> Verified
                          </span>
                        ) : isRejected ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <X className="w-3 h-3" /> Rejected
                            </span>
                            {doc.remarks && (
                              <p className="text-[10px] text-rose-600 italic mt-0.5 max-w-xs truncate" title={doc.remarks}>
                                Reason: {doc.remarks}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* View Modal Trigger */}
                        {doc.fileUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>View</span>
                          </button>
                        )}

                        {/* Verify Button */}
                        {!isVerified && (
                          <button
                            type="button"
                            onClick={() => handleVerify(doc.id)}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>
                        )}

                        {/* Reject Button */}
                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => openRejectModal(doc)}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Document Preview Modal ────────────────────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setPreviewDoc(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm leading-tight">{previewDoc.title}</h4>
                <p className="text-[11px] text-slate-300 font-mono">
                  {previewDoc.user?.firstName} {previewDoc.user?.lastName} &bull; {previewDoc.documentType?.toUpperCase()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Fullscreen</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Viewer */}
            <div className="p-3 overflow-auto grow flex items-center justify-center bg-slate-100 min-h-[350px]">
              {previewDoc.mimeType?.startsWith('image/') || previewDoc.fileUrl?.match(/\.(jpeg|jpg|png|webp)$/i) ? (
                <img
                  src={previewDoc.fileUrl}
                  alt={previewDoc.title}
                  className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-xs"
                />
              ) : (
                <iframe
                  src={previewDoc.fileUrl}
                  title={previewDoc.title}
                  className="w-full h-[65vh] rounded-lg border border-slate-200 bg-white"
                />
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-mono">
                Status: <strong className="uppercase">{previewDoc.verificationStatus}</strong>
              </span>
              <div className="flex items-center gap-2">
                {previewDoc.verificationStatus !== 'verified' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleVerify(previewDoc.id);
                      setPreviewDoc(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Verify Document</span>
                  </button>
                )}
                {previewDoc.verificationStatus !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => {
                      const d = previewDoc;
                      setPreviewDoc(null);
                      openRejectModal(d);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Rejection Modal ──────────────────────────────────────── */}
      {rejectModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => !isSubmitting && setRejectModalDoc(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4 z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-sm">Reject KYC Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600">
              <p>
                Rejecting <strong className="text-slate-900">&ldquo;{rejectModalDoc.title}&rdquo;</strong> for{' '}
                <strong className="text-slate-900">
                  {rejectModalDoc.user?.firstName} {rejectModalDoc.user?.lastName}
                </strong>.
              </p>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Blur / Unreadable Image',
                'Wrong Document Uploaded',
                'Name Mismatch',
                'Expired Document'
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setRejectReason(chip)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700 cursor-pointer transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Rejection Reason
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalDoc(null)}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                <span>Confirm Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRKycVerificationView;
