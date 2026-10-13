import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, CheckCircle2, Clock, Search, Download } from 'lucide-react';
import { getAllEmployeeDocuments } from '../../services/hrService';

export const DocumentsPage = () => {
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllEmployeeDocuments();
      const rawDocs = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setDocs(
        rawDocs.map((d) => {
          const emp = d.user || d.employee || {};
          return {
            id: d.id,
            employee: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || emp.email || 'Employee',
            type: d.documentType || d.type || 'Document',
            fileName: d.documentName || d.fileName || 'file.pdf',
            date: d.createdAt ? d.createdAt.split('T')[0] : '',
            status: (d.status || 'pending').toLowerCase(),
            fileUrl: d.fileUrl || ''
          };
        })
      );
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-600" />
            Employee Document Vault
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official employee verification documents, contracts, and certifications.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Uploaded Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    {isLoading ? 'Loading documents...' : 'No employee documents uploaded yet.'}
                  </td>
                </tr>
              ) : (
                docs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.employee}</td>
                    <td className="py-3 px-4">{d.type}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{d.fileName}</td>
                    <td className="py-3 px-4">{d.date}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          d.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {d.fileUrl ? (
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
