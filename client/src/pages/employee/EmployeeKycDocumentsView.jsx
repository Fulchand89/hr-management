import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  Upload,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  FileText,
  Building2,
  CreditCard,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Lock
} from 'lucide-react';
import {
  getMyDocuments,
  uploadMyDocument,
  deleteMyDocument
} from '../../services/employeeService';

export const EmployeeKycDocumentsView = ({ onBack }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Upload Form State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docType, setDocType] = useState('aadhaar');
  const [docTitle, setDocTitle] = useState('Aadhaar Card (Front & Back)');
  const [docNumber, setDocNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getMyDocuments();
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setDocuments(list);
    } catch (err) {
      console.error('Failed to load employee KYC documents:', err);
      setErrorMsg('Failed to load KYC document records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = documents.length;
    const verified = documents.filter((d) => d.status === 'verified').length;
    const pending = documents.filter((d) => d.status === 'pending').length;
    const rejected = documents.filter((d) => d.status === 'rejected').length;
    return { total, verified, pending, rejected };
  }, [documents]);

  const handleDocTypeChange = (type) => {
    setDocType(type);
    switch (type) {
      case 'aadhaar':
        setDocTitle('Aadhaar Card (Front & Back)');
        break;
      case 'pan':
        setDocTitle('Permanent Account Number (PAN Card)');
        break;
      case 'bank':
        setDocTitle('Bank Passbook / Cancelled Cheque');
        break;
      case 'degree':
        setDocTitle('Highest Educational Degree / Certificate');
        break;
      case 'experience':
        setDocTitle('Previous Experience / Relieving Letter');
        break;
      default:
        setDocTitle('Supporting Identity Document');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please choose a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('documentType', docType);
    formData.append('title', docTitle);
    formData.append('documentNumber', docNumber);
    formData.append('file', selectedFile);

    setIsSubmitting(true);
    try {
      await uploadMyDocument(formData);
      showToast('Document uploaded successfully for HR verification!');
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setDocNumber('');
      await loadDocuments();
    } catch (err) {
      console.error('Failed to upload document:', err);
      alert(err?.response?.data?.message || 'Failed to upload document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteMyDocument(docId);
      showToast('Document deleted.');
      await loadDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert(err?.response?.data?.message || 'Failed to delete document.');
    }
  };

  const getDocTypeIcon = (type) => {
    switch (type) {
      case 'pan':
      case 'aadhaar':
        return CreditCard;
      case 'bank':
        return Building2;
      case 'degree':
        return GraduationCap;
      case 'experience':
        return Briefcase;
      default:
        return FileText;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return {
          label: 'Verified & Approved',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500'
        };
      case 'rejected':
        return {
          label: 'Rejected by HR',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500'
        };
      default:
        return {
          label: 'Under Verification',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500'
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Page Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                ← Back
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              KYC & Verification Documents
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload national identity records, academic credentials, and bank details for HR audit
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadDocuments}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
          <p className="text-xs font-semibold text-slate-500">Loading your compliance documents...</p>
        </div>
      )}

      {!loading && errorMsg && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      {!loading && !errorMsg && (
        <>
          {/* ── 2. Top Metric Cards ────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Uploaded
                </span>
                <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <FileText className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-slate-900">{metrics.total}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Records in locker</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Verified & Approved
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-emerald-600">{metrics.verified}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Compliant credentials</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Under Verification
                </span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-amber-600">{metrics.pending}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">In review queue</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Action Required
                </span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-rose-600">{metrics.rejected}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Re-upload required</div>
              </div>
            </div>
          </div>

          {/* ── 3. KYC Documents Grid ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Official KYC Compliance Files</h3>
                <p className="text-xs text-slate-500">Manage uploaded certificates and proof of identity</p>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                {documents.length} Document(s)
              </span>
            </div>

            {documents.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">No KYC Documents Uploaded</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Please upload your Aadhaar, PAN card, and Bank account proof to complete your mandatory employee profile compliance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Initial Document</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => {
                  const Icon = getDocTypeIcon(doc.documentType);
                  const badge = getStatusBadge(doc.status);
                  const fileUrl = doc.fileUrl?.startsWith('http')
                    ? doc.fileUrl
                    : `http://localhost:5000${doc.fileUrl || ''}`;

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                              <Icon className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                                {doc.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 capitalize font-mono">
                                {doc.documentType?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </div>

                        {doc.documentNumber && (
                          <div className="text-[11px] font-mono text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
                            ID: <span className="font-semibold">{doc.documentNumber}</span>
                          </div>
                        )}

                        {/* Rejection Remarks */}
                        {doc.status === 'rejected' && doc.verificationRemarks && (
                          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 space-y-0.5">
                            <span className="font-bold block">Rejection Reason:</span>
                            <span>{doc.verificationRemarks}</span>
                          </div>
                        )}

                        {/* Verified Timestamp */}
                        {doc.status === 'verified' && doc.verifiedAt && (
                          <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              Verified on {new Date(doc.verifiedAt).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        {doc.fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#8B1D2C] hover:underline font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Proof</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No file link</span>
                        )}

                        {doc.status !== 'verified' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                            title="Delete and re-upload"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── 4. Guidelines Box ───────────────────────────────────────────── */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-700" />
              <span>Document Confidentiality & Verification Standards</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-blue-800/90 text-[11px] leading-relaxed">
              <li>All uploaded documents are stored in encrypted storage compliant with IT Security standards.</li>
              <li>Ensure scanned copies or photographs are clear, well-lit, and all 4 borders of the document are visible.</li>
              <li>Bank proofs must clearly show your Account Number, Beneficiary Name, and IFSC Code to prevent payroll failure.</li>
            </ul>
          </div>
        </>
      )}

      {/* ── Upload Modal ─────────────────────────────────────────────────── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  <Upload className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload KYC Document</h3>
                  <p className="text-[11px] text-slate-500">Provide official identity or banking record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-5 space-y-4">
              {/* Document Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Document Category *</label>
                <select
                  value={docType}
                  onChange={(e) => handleDocTypeChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                >
                  <option value="aadhaar">Aadhaar Card (National ID)</option>
                  <option value="pan">PAN Card (Tax Identification)</option>
                  <option value="bank">Bank Passbook / Cheque (Salary Payout)</option>
                  <option value="degree">Degree / Education Certificate</option>
                  <option value="experience">Relieving / Experience Letter</option>
                  <option value="other">Other Official Document</option>
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Document Title *</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              {/* Document Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Document / Account Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE1234F or 1234-5678-9012"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              {/* File Attachment */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select File *</label>
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 text-xs text-slate-500">
                    <Upload className="w-5 h-5 text-slate-400" />
                    {selectedFile ? (
                      <span className="font-semibold text-[#8B1D2C]">{selectedFile.name}</span>
                    ) : (
                      <span>Choose PDF, PNG, or JPG (Max 10MB)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>Upload & Submit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeKycDocumentsView;
