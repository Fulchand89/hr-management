import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Printer,
  Sparkles,
  Loader2
} from 'lucide-react';
import { getPolicies } from '../../services/policyService';

export const EmployeeHandbookView = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchPolicies = async () => {
      setIsLoading(true);
      try {
        const res = await getPolicies({ status: 'published' });
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setPolicies(list);
      } catch (err) {
        console.error('Failed to load handbook policies:', err);
        setPolicies([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const categories = Array.from(new Set(policies.map((p) => p.category).filter(Boolean)));

  const filteredPolicies = selectedCategory === 'all'
    ? policies
    : policies.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-16">
      {/* ── Top Control Bar ─────────────────────────────────────────────── */}
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
            <span className="text-slate-700 font-bold">Official Handbook</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Print or Save Official Handbook PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* ── Official Master Handbook Paper Container ─────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden print:border-none print:shadow-none print:rounded-none">
        
        {/* Header Letterhead */}
        <div className="p-6 sm:p-8 bg-white border-b border-slate-200 text-slate-900 print:p-0 print:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  Corporate Governance Charter
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Official Policy Documentation
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
                Official Company Handbook & Policies
              </h1>

              <div className="text-xs text-slate-500 space-y-1">
                <p className="text-[11px] text-slate-400 font-mono">
                  All active policies are retrieved dynamically from corporate governance database records.
                </p>
              </div>
            </div>

            <div className="w-14 h-14 rounded-xl bg-slate-50 p-2 border border-slate-200 flex items-center justify-center shrink-0 self-start">
              <img src="/logo.png" alt="Company Logo" className="h-full w-full object-contain" />
            </div>
          </div>
        </div>

        {/* Category Filter Tabs (Hidden in Print) */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 px-6 sm:px-8 py-2.5 bg-slate-50/70 border-b border-slate-200 shrink-0 overflow-x-auto print:hidden">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>All Policies ({policies.length})</span>
            </button>

            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap capitalize ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}

        {/* Handbook Content */}
        <div className="p-6 sm:p-10 space-y-8 bg-white text-slate-800 font-sans print:p-0">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#8B1D2C]" />
              <span>Loading official policies from database...</span>
            </div>
          ) : filteredPolicies.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No published company policies found in the database.
            </div>
          ) : (
            filteredPolicies.map((policy, idx) => (
              <div
                key={policy.id || idx}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {policy.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-mono">{policy.policyCode || 'POL'}</span>
                        {policy.currentVersion && <span>&bull; Ver {policy.currentVersion}</span>}
                        {policy.effectiveDate && <span>&bull; Effective: {String(policy.effectiveDate).split('T')[0]}</span>}
                      </div>
                    </div>
                  </div>
                  {policy.isMandatory && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#8B1D2C] border border-rose-200 text-[10px] font-bold">
                      Mandatory
                    </span>
                  )}
                </div>

                {policy.summary && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {policy.summary}
                  </p>
                )}

                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pt-2">
                  {policy.content}
                </div>
              </div>
            ))
          )}

          {/* Master Seal & Verification */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">Corporate Governance System</span>
              <p className="text-[11px] text-slate-400">
                Data synchronized from the corporate database tables.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeHandbookView;
