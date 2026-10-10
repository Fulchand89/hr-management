import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Eye,
  Check,
  X,
  Loader2,
  Building2,
  User,
  ShieldCheck,
  ExternalLink,
  Trash2
} from 'lucide-react';
import {
  getAllEmployeeDocuments,
  verifyEmployeeDocument,
  deleteEmployeeDocument
} from '../../services/hrService';

export const HRKycVerificationView = () => {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [toastMessage, setToastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllEmployeeDocuments({
        status: selectedStatus,
        documentType: selectedType
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

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const emp = doc.user || {};
      const fullName = `${emp.firstName || ''} ${emp.lastName || ''} ${emp.employeeId || ''}`.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        fullName.includes(searchQuery.toLowerCase()) ||
        doc.title.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [documents, searchQuery]);

  const handleVerify = async (docId, status) => {
    let remarks = '';
    if (status === 'rejected') {
      remarks = prompt('Enter rejection reason:') || 'Document illegible or invalid';
    }
    setIsSubmitting(true);
    try {
      await verifyEmployeeDocument(docId, { status, remarks });
      showToast(`Document marked as ${status.toUpperCase()} successfully!`);
      await loadDocuments();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update document status');
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
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete document');
    }
  };

  const pendingCount = documents.filter((d) => d.verificationStatus === 'pending').length;
  const verifiedCount = documents.filter((d) => d.verificationStatus === 'verified').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Employee Compliance &amp; KYC Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Employee KYC &amp; Verification Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
            Review and authenticate employee Aadhaar cards, PAN cards, degree certificates, experience letters, and identity credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Pending Verification</span>
              <span className="text-lg font-black">{pendingCount} Documents</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Verified Active</span>
              <span className="text-lg font-black">{verifiedCount} Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee or document title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Verification Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="verified">Verified Documents</option>
            <option value="rejected">Rejected Documents</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">All Document Types</option>
            <option value="id_proof">ID Proof (Aadhaar / PAN)</option>
            <option value="address_proof">Address Proof</option>
            <option value="education">Educational Degree</option>
            <option value="experience">Experience Letter</option>
            <option value="offer_letter">Offer Letter</option>
            <option value="tax_doc">Tax / Form 16</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#8B1D2C]" />
            <span className="text-xs font-semibold">Loading documents queue from database...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No KYC documents matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">Document Title &amp; Category</th>
                  <th className="py-3.5 px-4">File Details</th>
                  <th className="py-3.5 px-4">Uploaded Date</th>
                  <th className="py-3.5 px-4">Verification Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredDocuments.map((doc) => {
                  const emp = doc.user || {};
                  const isVerified = doc.verificationStatus === 'verified';
                  const isRejected = doc.verificationStatus === 'rejected';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Employee */}
                      <td className="py-3.5 px-5">
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">
                            {emp.firstName} {emp.lastName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {emp.employeeId || 'EMP'} &bull; {emp.departmentDetails?.name || 'General'}
                          </span>
                        </div>
                      </td>

                      {/* Title & Type */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{doc.title}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {doc.documentType.replace('_', ' ')}
                        </span>
                      </td>

                      {/* File Details */}
                      <td className="py-3.5 px-4">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Document</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                        {doc.fileSize && (
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {(doc.fileSize / 1024).toFixed(0)} KB &bull; {doc.mimeType?.split('/')[1] || 'pdf'}
                          </span>
                        )}
                      </td>

                      {/* Upload Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {new Date(doc.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" /> Verified
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={doc.remarks}>
                            <X className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Pending Review
                          </span>
                        )}
                        {doc.remarks && (
                          <span className="text-[10px] text-slate-400 block italic line-clamp-1 mt-0.5">
                            Note: {doc.remarks}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right space-x-2">
                        {!isVerified && (
                          <button
                            type="button"
                            onClick={() => handleVerify(doc.id, 'verified')}
                            disabled={isSubmitting}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Verify</span>
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            type="button"
                            onClick={() => handleVerify(doc.id, 'rejected')}
                            disabled={isSubmitting}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Delete Document"
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
    </div>
  );
};

export default HRKycVerificationView;
