import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Award,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Sparkles,
  Gift,
  Printer,
  X,
  Check,
  Loader2,
  Star,
  FileCheck,
  Building2,
  ChevronRight,
  UserCheck,
  DollarSign
} from 'lucide-react';
import { getAllEmployees } from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';

export const HRReferralsRewardsView = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('referrals'); // 'referrals' | 'rewards'
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Sample Mock Referrals matching Gupta Tech Web Policy
  const [referrals, setReferrals] = useState([
    {
      id: 'REF-101',
      candidateName: 'Aman Sharma',
      candidatePhone: '+91 98260 12345',
      candidateEmail: 'aman.sharma@example.com',
      role: 'Full Stack React Developer',
      experienceYears: 2.5, // 1-3 years -> ₹1500
      bonusAmount: 1500,
      referredByEmpId: 'EMP-004',
      referredByName: 'John Doe',
      referralDate: '2026-06-15',
      joiningDate: '2026-07-01',
      threeMonthTargetDate: '2026-10-01',
      status: 'eligible', // 'interviewing' | 'probation_active' | 'eligible' | 'disbursed'
      notes: 'Strong React & Node skills. Passed technical round.'
    },
    {
      id: 'REF-102',
      candidateName: 'Pooja Verma',
      candidatePhone: '+91 98261 67890',
      candidateEmail: 'pooja.verma@example.com',
      role: 'Senior QA Automation Engineer',
      experienceYears: 4.2, // 3-5 years -> ₹3000
      bonusAmount: 3000,
      referredByEmpId: 'EMP-002',
      referredByName: 'HR Lead Specialist',
      referralDate: '2026-08-10',
      joiningDate: '2026-09-01',
      threeMonthTargetDate: '2026-12-01',
      status: 'probation_active',
      notes: 'Playwright & Jest automation specialist.'
    }
  ]);

  // Sample Issued Certificates
  const [certificates, setCertificates] = useState([
    {
      id: 'CERT-2026-01',
      employeeName: 'John Doe',
      employeeCode: 'EMP-004',
      department: 'Engineering & Technology',
      awardTitle: 'Quarterly Excellence in Dedication & Timely Delivery',
      category: 'Dedication & Timely Delivery',
      monetaryBenefit: 5000,
      issuedDate: '2026-10-01',
      quarter: 'Q3 2026',
      citation: 'For exemplary dedication, outstanding sprint delivery, and adherence to 10:00 AM – 7:00 PM office hours.'
    }
  ]);

  // Modal States
  const [isAddReferralOpen, setIsAddReferralOpen] = useState(false);
  const [isIssueCertOpen, setIsIssueCertOpen] = useState(false);
  const [selectedCertForPrint, setSelectedCertForPrint] = useState(null);

  // New Referral Form
  const [newRef, setNewRef] = useState({
    candidateName: '',
    candidatePhone: '',
    candidateEmail: '',
    role: '',
    experienceYears: 2,
    referredByName: 'John Doe',
    joiningDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // New Certificate Form
  const [newCert, setNewCert] = useState({
    employeeName: '',
    employeeCode: '',
    department: 'Engineering',
    awardTitle: 'Excellence in Dedication & Timely Delivery',
    category: 'Dedication',
    monetaryBenefit: 3000,
    quarter: 'Q4 2026',
    citation: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    getAllEmployees({ limit: 50 })
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setEmployees(list);
        if (list.length > 0) {
          setNewCert(prev => ({
            ...prev,
            employeeName: `${list[0].firstName} ${list[0].lastName || ''}`.trim(),
            employeeCode: list[0].employeeCode || 'EMP-001',
            department: list[0].department || 'Engineering'
          }));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Submit Referral
  const handleCreateReferral = (e) => {
    e.preventDefault();
    const exp = Number(newRef.experienceYears);
    const bonus = exp >= 3 ? 3000 : 1500;

    const joinDate = new Date(newRef.joiningDate);
    const target3M = new Date(joinDate);
    target3M.setMonth(target3M.getMonth() + 3);

    const created = {
      id: `REF-${100 + referrals.length + 1}`,
      candidateName: newRef.candidateName,
      candidatePhone: newRef.candidatePhone,
      candidateEmail: newRef.candidateEmail,
      role: newRef.role,
      experienceYears: exp,
      bonusAmount: bonus,
      referredByEmpId: 'EMP-01',
      referredByName: newRef.referredByName,
      referralDate: new Date().toISOString().split('T')[0],
      joiningDate: newRef.joiningDate,
      threeMonthTargetDate: target3M.toISOString().split('T')[0],
      status: 'probation_active',
      notes: newRef.notes
    };

    setReferrals(prev => [created, ...prev]);
    showToast(`Referral registered! Applicable bonus: ₹${bonus.toLocaleString('en-IN')}`);
    setIsAddReferralOpen(false);
  };

  // Disburse Bonus
  const handleDisburseBonus = (refId) => {
    setReferrals(prev =>
      prev.map(r => r.id === refId ? { ...r, status: 'disbursed' } : r)
    );
    showToast('Referral bonus approved & linked to monthly payroll disbursement!');
  };

  // Submit Certificate
  const handleCreateCertificate = (e) => {
    e.preventDefault();
    const created = {
      id: `CERT-2026-${String(certificates.length + 1).padStart(2, '0')}`,
      employeeName: newCert.employeeName,
      employeeCode: newCert.employeeCode,
      department: newCert.department,
      awardTitle: newCert.awardTitle,
      category: newCert.category,
      monetaryBenefit: Number(newCert.monetaryBenefit),
      issuedDate: new Date().toISOString().split('T')[0],
      quarter: newCert.quarter,
      citation: newCert.citation || 'For exemplary performance and adherence to Gupta Tech Web policies.'
    };

    setCertificates(prev => [created, ...prev]);
    showToast(`Appreciation Certificate issued to ${created.employeeName}!`);
    setIsIssueCertOpen(false);
    setSelectedCertForPrint(created);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header Banner ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Referral Bonuses &amp; Appreciation Rewards
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Enforcing Policy Section 10 &amp; 13 (<strong>₹1,500 / ₹3,000 Referral Bonuses</strong>) and Section 4 (<strong>Quarterly Certificates</strong>)
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'referrals'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#8B1D2C]" />
            <span>Referrals &amp; Bonuses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'rewards'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Appreciation Certificates</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: REFERRALS & BONUSES                                         */}
      {/* =================================================================== */}
      {activeTab === 'referrals' && (
        <div className="space-y-6">
          {/* Policy Info Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-950 block">
                Official Referral Reward Rules (Section 10 &amp; 13):
              </span>
              <p className="text-[11px] text-amber-900">
                &bull; 1–3 years experience candidate &rarr; <strong>₹1,500</strong> bonus<br />
                &bull; 3–5 years experience candidate &rarr; <strong>₹3,000</strong> bonus<br />
                &bull; <em>Bonus is awarded strictly after the referred employee successfully completes <strong>3 months</strong>.</em>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddReferralOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Candidate Referral</span>
            </button>
          </div>

          {/* Referral Cards / Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-5">Candidate</th>
                    <th className="py-3.5 px-4">Role &amp; Experience</th>
                    <th className="py-3.5 px-4">Referred By</th>
                    <th className="py-3.5 px-4">Bonus Amount</th>
                    <th className="py-3.5 px-4">3-Month Target</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {referrals.map((r) => {
                    const isEligible = r.status === 'eligible';
                    const isDisbursed = r.status === 'disbursed';

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5">
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{r.candidateName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{r.candidatePhone}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{r.role}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{r.experienceYears} Years Exp</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#8B1D2C] block">{r.referredByName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">Ref: {r.referredByEmpId}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          ₹{r.bonusAmount.toLocaleString('en-IN')}
                          <span className="text-[10px] text-slate-400 font-normal block">
                            {r.experienceYears >= 3 ? '3-5 yr rate' : '1-3 yr rate'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-semibold text-slate-900 block">{r.threeMonthTargetDate}</span>
                          <span className="text-[10px] text-slate-500">Joined: {r.joiningDate}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          {isDisbursed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3 h-3" /> Bonus Disbursed
                            </span>
                          ) : isEligible ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                              <Sparkles className="w-3 h-3" /> 3 Months Complete
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> In 90-Day Probation
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          {isEligible ? (
                            <button
                              type="button"
                              onClick={() => handleDisburseBonus(r.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Disburse ₹{r.bonusAmount}</span>
                            </button>
                          ) : isDisbursed ? (
                            <span className="text-slate-400 font-mono text-[11px]">Paid in Payroll</span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Probation Ongoing</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: APPRECIATION CERTIFICATES & REWARDS                         */}
      {/* =================================================================== */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Header Action */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Quarterly Employee Recognition &amp; Awards
              </h2>
              <p className="text-xs text-slate-500">
                Performance recognized every 2–3 months: Dedication, Timely delivery, Punctuality, Quality of work, Discipline
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsIssueCertOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Issue Appreciation Certificate</span>
            </button>
          </div>

          {/* Certificate Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {cert.quarter} &bull; Official Award
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">{cert.id}</span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {cert.employeeName}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium block">
                      {cert.department} &bull; {cert.employeeCode}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-950 space-y-1">
                    <span className="font-bold text-xs block text-[#8B1D2C]">{cert.awardTitle}</span>
                    <p className="text-[11px] text-slate-700 italic">"{cert.citation}"</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Benefit</span>
                    <span className="font-mono text-xs font-black text-emerald-700">
                      ₹{cert.monetaryBenefit.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCertForPrint(cert)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>View / Print Certificate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADD REFERRAL MODAL ───────────────────────────────────────────── */}
      {isAddReferralOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsAddReferralOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Record Candidate Referral</h2>
              <button type="button" onClick={() => setIsAddReferralOpen(false)} className="p-1 rounded-xl text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReferral} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newRef.candidateName}
                  onChange={e => setNewRef({ ...newRef, candidateName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={newRef.candidatePhone}
                    onChange={e => setNewRef({ ...newRef, candidatePhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Candidate Email</label>
                  <input
                    type="email"
                    required
                    placeholder="candidate@example.com"
                    value={newRef.candidateEmail}
                    onChange={e => setNewRef({ ...newRef, candidateEmail: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Role / Tech Stack</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Node.js Developer"
                    value={newRef.role}
                    onChange={e => setNewRef({ ...newRef, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Experience (Years)</label>
                  <select
                    value={newRef.experienceYears}
                    onChange={e => setNewRef({ ...newRef, experienceYears: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value={2}>1–3 Years (₹1,500 Bonus)</option>
                    <option value={4}>3–5 Years (₹3,000 Bonus)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Referred By Employee</label>
                  <input
                    type="text"
                    value={newRef.referredByName}
                    onChange={e => setNewRef({ ...newRef, referredByName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Joining / Start Date</label>
                  <input
                    type="date"
                    value={newRef.joiningDate}
                    onChange={e => setNewRef({ ...newRef, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsAddReferralOpen(false)} className="px-4 py-2 rounded-xl text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] text-white font-bold shadow-md">
                  Register Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ISSUE APPRECIATION CERTIFICATE MODAL ─────────────────────────── */}
      {isIssueCertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="fixed inset-0" onClick={() => setIsIssueCertOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Issue Official Appreciation Certificate</h2>
              <button type="button" onClick={() => setIsIssueCertOpen(false)} className="p-1 rounded-xl text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCertificate} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-900 block mb-1">Recipient Employee</label>
                <select
                  value={newCert.employeeName}
                  onChange={e => {
                    const emp = employees.find(x => `${x.firstName} ${x.lastName || ''}`.trim() === e.target.value);
                    setNewCert({
                      ...newCert,
                      employeeName: e.target.value,
                      employeeCode: emp?.employeeCode || 'EMP',
                      department: emp?.department || 'Operations'
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={`${emp.firstName} ${emp.lastName || ''}`.trim()}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-900 block mb-1">Award Category</label>
                  <select
                    value={newCert.category}
                    onChange={e => setNewCert({ ...newCert, category: e.target.value, awardTitle: `Excellence in ${e.target.value}` })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <option value="Dedication">Dedication</option>
                    <option value="Timely Delivery">Timely Delivery</option>
                    <option value="Punctuality">Punctuality</option>
                    <option value="Quality of Work">Quality of Work</option>
                    <option value="Discipline">Discipline</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-900 block mb-1">Quarter / Period</label>
                  <input
                    type="text"
                    value={newCert.quarter}
                    onChange={e => setNewCert({ ...newCert, quarter: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Monetary Benefit Reward (₹)</label>
                <input
                  type="number"
                  value={newCert.monetaryBenefit}
                  onChange={e => setNewCert({ ...newCert, monetaryBenefit: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 block mb-1">Citation Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Official commendation text..."
                  value={newCert.citation}
                  onChange={e => setNewCert({ ...newCert, citation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsIssueCertOpen(false)} className="px-4 py-2 rounded-xl text-slate-500 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] text-white font-bold shadow-md">
                  Generate &amp; Issue Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── OFFICIAL CERTIFICATE OF APPRECIATION PRINT MODAL ─────────────── */}
      {selectedCertForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white">
          <div className="fixed inset-0 print:hidden" onClick={() => setSelectedCertForPrint(null)} />
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:border-none print:rounded-none">
            
            {/* Top Bar (Hidden in Print) */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <span className="text-sm font-bold">Official Gupta Tech Web Certificate Preview</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCertForPrint(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Canvas */}
            <div className="flex-1 overflow-y-auto p-10 sm:p-14 bg-amber-50/20 text-slate-900 font-serif print:p-0 print:overflow-visible">
              <div className="border-8 border-double border-amber-600/40 p-8 sm:p-12 text-center space-y-6 relative bg-white shadow-lg print:shadow-none">
                
                {/* Header Logo */}
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-white p-2 border border-slate-200 flex items-center justify-center shadow-xs">
                    <img src="/logo.png" alt="Gupta Tech Web" className="h-full w-full object-contain" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wider uppercase font-sans">
                    Gupta Tech Web
                  </h1>
                  <p className="text-[11px] text-slate-500 font-sans font-semibold">
                    410 Shagun Tower, Vijay Nagar, Indore, Madhya Pradesh – 452010
                  </p>
                </div>

                <div className="py-2">
                  <span className="text-xs uppercase font-sans font-black tracking-widest text-amber-700 block mb-2">
                    Official Recognition Program (Section 4 &amp; 6)
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#8B1D2C] italic">
                    Certificate of Appreciation
                  </h2>
                </div>

                <p className="text-xs text-slate-600 font-sans">
                  This official honor is proudly presented to
                </p>

                <div className="py-2 border-b-2 border-slate-900 max-w-md mx-auto">
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight">
                    {selectedCertForPrint.employeeName}
                  </span>
                  <span className="text-xs text-slate-500 font-sans block mt-1">
                    {selectedCertForPrint.department} &bull; Employee Code: {selectedCertForPrint.employeeCode}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-xl mx-auto italic font-sans">
                  "{selectedCertForPrint.citation}"
                </p>

                {/* Signatures & Seal */}
                <div className="pt-10 flex justify-between items-end max-w-xl mx-auto font-sans text-xs">
                  <div className="text-left space-y-1">
                    <span className="font-mono text-[11px] text-slate-400 block">
                      Issued: {selectedCertForPrint.issuedDate}
                    </span>
                    <span className="font-bold text-emerald-800 font-mono block">
                      Reward: ₹{selectedCertForPrint.monetaryBenefit.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="w-20 h-20 rounded-full border-4 border-amber-600/50 flex items-center justify-center text-[10px] text-amber-800 font-black uppercase text-center p-1 bg-amber-50 rotate-[-12deg]">
                    Gupta Tech Web Seal
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="font-serif italic text-base text-slate-700">
                      Nikita Gupta
                    </div>
                    <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                      Nikita Gupta, CEO
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Gupta Tech Web &bull; Indore HQ
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default HRReferralsRewardsView;
