import React from 'react';
import { FileText, Upload, CheckCircle2, Clock, Search, Download } from 'lucide-react';

export const DocumentsPage = () => {
  const docs = [
    { id: 'DOC-1', employee: 'John Doe', type: 'Resume / CV', fileName: 'john_doe_resume_2026.pdf', date: '2026-01-15', status: 'verified' },
    { id: 'DOC-2', employee: 'John Doe', type: 'ID Proof (Passport)', fileName: 'passport_scan.pdf', date: '2026-01-15', status: 'verified' },
    { id: 'DOC-3', employee: 'Priya Patel', type: 'Offer Letter', fileName: 'signed_offer_letter.pdf', date: '2026-03-01', status: 'verified' },
    { id: 'DOC-4', employee: 'Rohan Verma', type: 'Tax Declaration (12BB)', fileName: 'form_12bb.pdf', date: '2026-09-20', status: 'pending' }
  ];

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
        <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
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
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-semibold text-slate-900">{d.employee}</td>
                  <td className="py-3 px-4">{d.type}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{d.fileName}</td>
                  <td className="py-3 px-4">{d.date}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      d.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {d.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
