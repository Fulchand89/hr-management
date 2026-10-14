import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  X,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Sparkles,
  Loader2
} from 'lucide-react';
import { getPolicies } from '../../services/policyService';

export const CompanyHandbookModal = ({ isOpen, onClose }) => {
  const [policies, setPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (!isOpen) return;
    const fetchPolicies = async () => {
      setIsLoading(true);
      try {
        const res = await getPolicies({ status: 'published' });
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setPolicies(list);
      } catch (err) {
        console.error('Failed to load handbook policies in modal:', err);
        setPolicies([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPolicies();
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const categories = Array.from(new Set(policies.map((p) => p.category).filter(Boolean)));

  const filteredPolicies = selectedCategory === 'all'
    ? policies
    : policies.filter((p) => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white">
      {/* Backdrop */}
      <div className="fixed inset-0 print:hidden" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 p-1.5 flex items-center justify-center border border-slate-200 shrink-0">
              <img src="/logo.png" alt="Company Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900">
                  Official Policy Handbook
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  Database Synchronized
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Official Corporate Regulations, HR Policies & Governance Documentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-slate-50/70 border-b border-slate-200 shrink-0 overflow-x-auto print:hidden">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap capitalize ${
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

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 font-sans print:p-0 print:overflow-visible">
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
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {policy.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="font-mono">{policy.policyCode || 'POL'}</span>
                        {policy.currentVersion && <span>&bull; Ver {policy.currentVersion}</span>}
                        {policy.effectiveDate && <span>&bull; Effective: {String(policy.effectiveDate).split('T')[0]}</span>}
                      </div>
                    </div>
                  </div>
                  {policy.isMandatory && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#8B1D2C] border border-rose-200 text-[10px] font-bold">
                      Mandatory
                    </span>
                  )}
                </div>

                {policy.summary && (
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {policy.summary}
                  </p>
                )}

                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pt-1">
                  {policy.content}
                </div>
              </div>
            ))
          )}

          {/* Master Seal & Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              Corporate Governance Records &bull; Database Table Source
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer self-start sm:self-auto"
            >
              Close Handbook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyHandbookModal;
