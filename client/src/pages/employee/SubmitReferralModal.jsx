import React, { useState, useMemo } from 'react';
import {
  X,
  Gift,
  Upload,
  User,
  Phone,
  Mail,
  Briefcase,
  FileText,
  Loader2,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { submitReferral } from '../../services/employeeService';

export const SubmitReferralModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    candidateName: '',
    candidatePhone: '',
    candidateEmail: '',
    role: '',
    experienceYears: '2',
    notes: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Bonus calculation based on experience slabs
  const bonusAmount = useMemo(() => {
    const exp = parseFloat(formData.experienceYears) || 0;
    if (exp >= 5) return 5000;
    if (exp >= 3) return 3000;
    if (exp >= 1) return 1500;
    return 1000;
  }, [formData.experienceYears]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.candidateName.trim()) {
      setErrorMsg('Candidate full name is required.');
      return;
    }
    if (!formData.candidatePhone.trim()) {
      setErrorMsg('Candidate contact phone is required.');
      return;
    }
    if (!formData.candidateEmail.trim()) {
      setErrorMsg('Candidate email address is required.');
      return;
    }
    if (!formData.role.trim()) {
      setErrorMsg('Job title / designation is required.');
      return;
    }

    const payload = new FormData();
    payload.append('candidateName', formData.candidateName);
    payload.append('candidatePhone', formData.candidatePhone);
    payload.append('candidateEmail', formData.candidateEmail);
    payload.append('role', formData.role);
    payload.append('experienceYears', formData.experienceYears);
    payload.append('notes', formData.notes);
    if (resumeFile) {
      payload.append('resume', resumeFile);
    }

    setIsSubmitting(true);
    try {
      await submitReferral(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to submit candidate referral:', err);
      setErrorMsg(err?.response?.data?.message || 'Failed to submit candidate referral.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#8B1D2C]/10 text-[#8B1D2C]">
              <Gift className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Refer a Candidate
              </h2>
              <p className="text-xs text-slate-500">
                Submit candidate resume and earn spot referral rewards
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Bonus Incentive Callout */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Projected Referral Bonus: </span>
                <span>₹{bonusAmount.toLocaleString()}</span>
              </div>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full font-semibold">
              Upon 90-Day Tenure
            </span>
          </div>

          {/* Candidate Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Candidate Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.candidateName}
                onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
              />
            </div>
          </div>

          {/* Contact: Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  value={formData.candidatePhone}
                  onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={formData.candidateEmail}
                  onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                  placeholder="rahul@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>
            </div>
          </div>

          {/* Role & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Position / Role *
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. React Developer"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Experience (Years) *
              </label>
              <select
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
              >
                <option value="0.5">&lt; 1 Year</option>
                <option value="2">1 – 3 Years (₹1,500 Bonus)</option>
                <option value="4">3 – 5 Years (₹3,000 Bonus)</option>
                <option value="6">5+ Years (₹5,000 Bonus)</option>
              </select>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Attach Candidate Resume (PDF / DOC)
            </label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-slate-500">
                <Upload className="w-5 h-5 text-slate-400" />
                {resumeFile ? (
                  <span className="font-semibold text-[#8B1D2C]">{resumeFile.name}</span>
                ) : (
                  <span>Click or drag candidate resume here (Max 10MB)</span>
                )}
              </div>
            </div>
          </div>

          {/* Recommendation Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Why do you recommend this candidate? (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Highlight candidate's core strengths, previous achievements, or skill alignment..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
                <Gift className="w-3.5 h-3.5" />
              )}
              <span>Submit Candidate Referral</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitReferralModal;
