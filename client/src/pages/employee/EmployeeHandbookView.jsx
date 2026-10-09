import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Printer,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  TrendingUp,
  Mail,
  FolderGit2,
  AlertTriangle,
  UserCheck,
  Smile,
  CheckCircle2,
  Phone,
  Sparkles,
  MapPin,
  Lock,
  ChevronRight
} from 'lucide-react';

export const EmployeeHandbookView = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('doc1'); // 'doc1' | 'doc2' | 'all'

  const handlePrint = () => {
    window.print();
  };

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
        
        {/* Header Letterhead - Clean White */}
        <div className="p-6 sm:p-8 bg-white border-b border-slate-200 text-slate-900 print:p-0 print:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  Corporate Governance Charter
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Indore HQ &bull; Ver 2026.1
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
                Gupta Tech Web — Official Company Handbook
              </h1>

              <div className="text-xs text-slate-500 space-y-1">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>410 Shagun Tower, Vijay Nagar, Indore, Madhya Pradesh – 452010</span>
                </p>
                <p className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>Phone: 7400554294</span>
                  <span>&bull;</span>
                  <span>info@guptatechweb.com</span>
                  <span>&bull;</span>
                  <span>guptatechweb.com</span>
                </p>
              </div>
            </div>

            <div className="w-14 h-14 rounded-xl bg-slate-50 p-2 border border-slate-200 flex items-center justify-center shrink-0 self-start">
              <img src="/logo.png" alt="Gupta Tech Web Logo" className="h-full w-full object-contain" />
            </div>
          </div>
        </div>

        {/* Tab Navigation (Hidden in Print) */}
        <div className="flex items-center gap-2 px-6 sm:px-8 py-2.5 bg-slate-50/70 border-b border-slate-200 shrink-0 overflow-x-auto print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('doc1')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'doc1'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Human Resource Policies (12 Clauses)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('doc2')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'doc2'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>2. Company Policies & Vision (15 Clauses)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#8B1D2C] text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete Master Handbook</span>
          </button>
        </div>

        {/* Handbook Content */}
        <div className="p-6 sm:p-10 space-y-12 bg-white text-slate-800 font-sans print:p-0">
          
          {/* =============================================================== */}
          {/* DOCUMENT 1: HUMAN RESOURCE POLICIES & PROCEDURES               */}
          {/* =============================================================== */}
          {(activeTab === 'doc1' || activeTab === 'all') && (
            <div className="space-y-8 pb-10 border-b border-slate-200 last:border-b-0 print:border-none print:pb-6">
              
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-[#8B1D2C] border border-rose-200">
                  Section 1 &bull; Doc Ref: GTW/HR/POL-2026/01
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Human Resource Policies & Procedures
                </h2>
                <p className="text-xs font-bold text-[#8B1D2C] italic">
                  Innovating Today, Empowering Tomorrow
                </p>

                {/* CEO Message */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic space-y-1 mt-3">
                  <p>
                    "Gupta Tech Web is a team of web and mobile application development professionals dedicated to delivering solutions aligned with our clients' long-term business goals. Our HR Policies are designed to ensure sustainable growth, employee satisfaction, discipline, and a productive work environment."
                  </p>
                  <p className="text-right font-bold text-slate-900 not-italic">
                    — Nikita Gupta, CEO
                  </p>
                </div>
              </div>

              {/* Clauses List */}
              <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
                
                {/* 1. Documents */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">1</span>
                    Documents to Be Submitted Before Joining
                  </h3>
                  <div className="pt-1 text-slate-800 font-medium space-y-1 pl-8">
                    <p className="font-bold text-slate-900">Before joining Gupta Tech Web, all employees must submit:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Copy of PAN Card</li>
                      <li>Copy of Aadhaar Card</li>
                      <li>All educational marksheets & degrees (10th, 12th, Graduation, Post-Graduation)</li>
                      <li>Previous company appointment letter, last 3 months salary slips, and relieving letter</li>
                      <li>Two recent passport-size photographs</li>
                      <li>Updated Curriculum Vitae (CV)</li>
                    </ul>
                  </div>
                </div>

                {/* 2. Working Days & Timings */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">2</span>
                    Working Days & Office Timings
                  </h3>
                  <div className="pt-1 text-slate-800 space-y-2 pl-8">
                    <p>Gupta Tech Web operates on a <strong>6-day working week</strong>, Monday through Saturday.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                        <span className="font-bold text-slate-900 block text-xs">Standard Office Timings</span>
                        <span className="text-[#8B1D2C] font-mono font-bold text-sm">10:00 AM – 7:30 PM</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Mandatory biometric/app punch-in upon arrival.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                        <span className="font-bold text-slate-900 block text-xs">Lunch & Breaks</span>
                        <span className="text-slate-800 font-mono font-bold text-sm">1:30 PM – 2:15 PM (45 min)</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Two 10-minute tea breaks at 11:45 AM & 4:30 PM.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Punctuality & Grace Period */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">3</span>
                    Punctuality & Late Arrival Deduction Policy
                  </h3>
                  <div className="pt-1 text-slate-700 space-y-2 pl-8">
                    <p>Employees are expected to arrive punctually. A grace period of <strong>15 minutes</strong> is allowed up to 10:15 AM.</p>
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-950 font-medium">
                      <strong className="block text-amber-900">Three Late Marks Rule:</strong>
                      Every 3 instances of arriving after 10:15 AM in a single calendar month will automatically result in the deduction of <strong>one half-day (0.5 Day Leave)</strong> from salary or leave balance.
                    </div>
                  </div>
                </div>

                {/* 4. Leave Policy & Sandwitch Rule */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">4</span>
                    Leave Entitlement & Sandwich Rule
                  </h3>
                  <div className="pt-1 text-slate-700 space-y-2 pl-8">
                    <p>Full-time employees accrue <strong>1 Paid Leave (PL)</strong> per completed month of active service (12 PLs annually).</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Leaves must be applied at least <strong>48 hours in advance</strong> via the employee portal.</li>
                      <li>Emergency leave must be intimated to HR before 10:00 AM on the day of absence.</li>
                      <li><strong>Sandwich Rule:</strong> If an employee takes an unauthorized leave on Saturday and Monday, Sunday is counted as an unpaid leave.</li>
                      <li>Leaves cannot be taken during active client project releases or critical delivery milestones.</li>
                    </ul>
                  </div>
                </div>

                {/* 5. Salary Cycle */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">5</span>
                    Salary Disbursement & Appraisal Cycle
                  </h3>
                  <div className="pt-1 text-slate-700 space-y-2 pl-8">
                    <p>
                      Salaries are disbursed between the <strong>7th and 10th of every month</strong> directly into the employee's designated bank account.
                    </p>
                    <p>
                      Performance appraisals are conducted annually in <strong>April</strong> based on KPI achievements, attendance records, quality of deliverables, and peer feedback.
                    </p>
                  </div>
                </div>

                {/* 6. Code of Conduct */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">6</span>
                    Workplace Ethics, POSH & Code of Conduct
                  </h3>
                  <div className="pt-1 text-slate-700 space-y-2 pl-8">
                    <p>
                      Gupta Tech Web maintains a strict zero-tolerance policy towards harassment, discrimination, and unprofessional behavior under the Prevention of Sexual Harassment (POSH) Act, 2013.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Professional decorum and respect must be maintained at all times.</li>
                      <li>Company equipment and email are to be used strictly for official purposes.</li>
                      <li>Violations will lead to disciplinary proceedings and immediate termination.</li>
                    </ul>
                  </div>
                </div>

                {/* 7. Notice Period */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">7</span>
                    Notice Period & Resignation Protocol
                  </h3>
                  <div className="pt-1 text-slate-700 space-y-2 pl-8">
                    <p>
                      Confirmed employees must serve a mandatory <strong>30-day notice period</strong> upon tendering their resignation.
                    </p>
                    <p>
                      Probationary employees are required to serve a <strong>15-day notice period</strong>. During the notice period, knowledge transfer, code handover, and asset returns must be completed in full before Full & Final (FNF) settlement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* DOCUMENT 2: COMPANY POLICIES & GOVERNANCE                      */}
          {/* =============================================================== */}
          {(activeTab === 'doc2' || activeTab === 'all') && (
            <div className="space-y-8 pb-10 border-b border-slate-200 last:border-b-0 print:border-none print:pb-6">
              
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  Section 2 &bull; Doc Ref: GTW/CORP/GOV-2026/02
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Company Operational Policies & Governance
                </h2>
                <p className="text-xs font-bold text-blue-800 italic">
                  Information Security, Intellectual Property & Delivery Standards
                </p>
              </div>

              {/* Clauses List */}
              <div className="space-y-5 text-xs text-slate-700 leading-relaxed">
                
                {/* 1. NDA & Data Security */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-black">1</span>
                    Non-Disclosure Agreement (NDA) & Client Data Protection
                  </h3>
                  <div className="pt-1 text-slate-700 space-y-2 pl-8">
                    <p>
                      All software source code, customer databases, business logic, API credentials, and internal workflows developed at Gupta Tech Web are strictly confidential and protected intellectual property.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Copying code to external USB drives or personal cloud storage is strictly forbidden.</li>
                      <li>Client confidentiality agreements extend indefinitely even after employee separation.</li>
                      <li>Breach of NDA will invite legal prosecution under the Indian IT Act, 2000.</li>
                    </ul>
                  </div>
                </div>

                {/* 2. Referral Rewards */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-black">2</span>
                    Candidate Referral Bonus Scheme
                  </h3>
                  <div className="pt-1 text-slate-700 space-y-2 pl-8">
                    <p>
                      Gupta Tech Web encourages internal talent referrals. Employees whose referred candidate completes 90 days of successful probation receive a cash referral bonus credited directly into their salary.
                    </p>
                  </div>
                </div>

                {/* 3. Fun Friday & Team Engagement */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-black">3</span>
                    Fun Friday & Employee Well-being
                  </h3>
                  <div className="pt-1 text-slate-700 space-y-2 pl-8">
                    <p>
                      Every alternate Friday from 6:00 PM onwards, team building activities, tech showcases, and birthday celebrations are hosted at the Indore development center to foster a vibrant work culture.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Master Seal & Verification */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">Indore Corporate Registry Verification</span>
              <p className="text-[11px] text-slate-400">
                Gupta Tech Web &bull; All Rights Reserved &bull; Effective through December 31, 2026
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
