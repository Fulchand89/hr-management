import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
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
  ExternalLink,
  Phone,
  Globe,
  MapPin,
  Sparkles
} from 'lucide-react';

export const CompanyHandbookModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('doc1'); // 'doc1' (HR Policies) | 'doc2' (Company Policies) | 'all'

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white">
      {/* Backdrop */}
      <div className="fixed inset-0 print:hidden" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Header Bar (Hidden in Print) */}
        <div className="p-4 sm:p-5 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 p-1.5 flex items-center justify-center border border-slate-200 shrink-0">
              <img src="/logo.png" alt="Gupta Tech Web" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900">
                  Gupta Tech Web — Official Policy Handbook
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-[#8B1D2C]/10 text-[#8B1D2C]">
                  Indore HQ
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
              title="Print or Save as Official PDF"
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

        {/* Navigation Tabs (Hidden in Print) */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-slate-50/70 border-b border-slate-200 shrink-0 overflow-x-auto print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('doc1')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'doc1'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. HR Policies (12 Clauses)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('doc2')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'doc2'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>2. Company Policies (15 Clauses)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#8B1D2C] text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete Master Handbook</span>
          </button>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-12 bg-white text-slate-800 font-sans print:p-0 print:overflow-visible">

          {/* =============================================================== */}
          {/* DOCUMENT 1: HUMAN RESOURCE POLICIES & PROCEDURES               */}
          {/* =============================================================== */}
          {(activeTab === 'doc1' || activeTab === 'all') && (
            <div className="space-y-8 pb-10 border-b border-slate-200 last:border-b-0 print:border-none print:pb-0">
              
              {/* Document 1 Header & Letterhead */}
              <div className="border-b-2 border-slate-900 pb-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-2xl bg-white p-2 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                      <img src="/logo.png" alt="Gupta Tech Web Logo" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Gupta Tech Web
                      </h1>
                      <p className="text-xs text-slate-600 font-semibold">
                        410 Shagun Tower, Vijay Nagar, Indore, Madhya Pradesh – 452010
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Phone: 7400554294 &bull; info@guptatechweb.com &bull; guptatechweb.com
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#8B1D2C]/10 text-[#8B1D2C]">
                      HR Operations Document
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Doc Ref: GTW/HR/POL-2026/01
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h2 className="text-lg font-black text-[#8B1D2C] tracking-tight">
                    Human Resource Policies & Procedures
                  </h2>
                  <p className="text-xs font-bold text-slate-700 italic">
                    Innovating Today, Empowering Tomorrow
                  </p>
                </div>

                {/* CEO Message Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic space-y-1">
                  <p>
                    "Gupta Tech Web is a team of web and mobile application development professionals dedicated to delivering solutions aligned with our clients' long-term business goals. Our HR Policies are designed to ensure sustainable growth, employee satisfaction, discipline, and a productive work environment."
                  </p>
                  <p className="text-right font-bold text-slate-900 not-italic">
                    — Nikita Gupta, CEO
                  </p>
                </div>
              </div>

              {/* Document 1 Clauses (1 to 12) */}
              <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
                
                {/* 1. Documents to Be Submitted */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">1</span>
                    Documents to Be Submitted
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    To be recognized as a leading innovator in the technology marketplace by delivering high-quality software products and nurturing long-term relationships.
                  </p>
                  <div className="pt-1 text-slate-800 font-medium space-y-1 pl-8">
                    <p className="font-bold text-slate-900">Before joining Gupta Tech Web, all employees must submit:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Original 10th-grade mark sheet</strong></li>
                      <li>Xerox copies of 12th-grade and UG/PG mark sheets</li>
                      <li>Xerox copy of Aadhar Card</li>
                      <li>Last 3 months' salary slips from previous employer</li>
                      <li>Relieving and Experience Letter from previous company</li>
                    </ul>
                  </div>
                </div>

                {/* 2. Office Timings & Work Hours */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">2</span>
                    Office Timings & Work Hours
                  </h3>
                  <div className="pl-8 space-y-3">
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Work hours: 10:00 am to 7:00 pm</strong></li>
                      <li><strong>Lunch/break time must not exceed 1 hour</strong></li>
                      <li><strong>Half-day requires minimum 4 working hours</strong></li>
                      <li>Habitual lateness or insufficient work hours may lead to salary deduction or disciplinary action</li>
                    </ul>

                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-1">
                      <strong className="block text-amber-900">Late Working Hours Compensation:</strong>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        <li>Work till <strong>10:00 pm – 12:00 am</strong> &rarr; Allowed to report by <strong>11:00 am</strong></li>
                        <li>Work till <strong>12:00 am – 2:00 am</strong> &rarr; Allowed to report by <strong>12:00 pm</strong></li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <strong className="text-slate-900 block text-xs">Saturday Working Rule:</strong>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          &bull; <strong>1st and 3rd Saturdays – OFF</strong><br />
                          &bull; All other Saturdays are working days
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950">
                        <strong className="text-rose-900 block text-xs">Work From Home (WFH) Policy:</strong>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          <strong>No Work From Home (WFH)</strong> allowed under any circumstances unless officially declared by management.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Leave Policy */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">3</span>
                    Leave Policy & Deductions
                  </h3>
                  <div className="pl-8 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <strong className="text-slate-900 text-xs block">Casual Leave (CL):</strong>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          &bull; 1 paid casual leave per month<br />
                          &bull; Must be requested at least <strong>3 days in advance</strong>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <strong className="text-slate-900 text-xs block">Emergency Leave:</strong>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          &bull; Inform HR before <strong>10:00 am</strong> via phone call or email<br />
                          &bull; <strong>WhatsApp/text is not accepted</strong>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <strong className="text-slate-900 text-xs block">Leave Carry Forward & Encashment:</strong>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          &bull; Unused CL can be carried forward until <strong>December 31</strong><br />
                          &bull; After December 31, unused leave can be <strong>encashed at 80%</strong>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <strong className="text-slate-900 text-xs block">Marriage Leave:</strong>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          &bull; <strong>5 days of paid leave</strong> (conditions apply)
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950">
                      <strong className="block text-amber-900 text-xs">Sandwich Rule:</strong>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Leave on both sides of a holiday makes the holiday <strong>unpaid</strong>.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                      <strong className="block text-rose-900 text-xs font-black">Leave Not Approved Policy (1 + 1 Salary Deduction):</strong>
                      <p className="text-[11px] text-rose-800">
                        If leave is <strong>not approved</strong> and the employee is absent, it will be marked as <strong>ABSENT</strong>.
                      </p>
                      <p className="text-[11px] font-bold text-rose-900">
                        A 1 + 1 salary deduction will be applied:
                      </p>
                      <ul className="list-disc pl-5 text-[11px] text-rose-800">
                        <li>1 day salary for absence</li>
                        <li>1 day penalty deduction</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 4. Appreciation Certificates & Rewards */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">4</span>
                    Appreciation Certificates & Rewards
                  </h3>
                  <div className="pl-8 space-y-1.5">
                    <p className="font-semibold text-slate-800">
                      Performance will be recognized <strong>every 2–3 months</strong> based on:
                    </p>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                      <li>Dedication</li>
                      <li>Timely delivery</li>
                      <li>Punctuality</li>
                      <li>Quality of work</li>
                    </ul>
                    <p className="text-[11px] text-slate-600 italic pt-1">
                      * Rewards may include official certificates and monetary benefits.
                    </p>
                  </div>
                </div>

                {/* 5. Appraisal Policy */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">5</span>
                    Appraisal Policy
                  </h3>
                  <div className="pl-8 space-y-2">
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Salary is confidential</strong> and should not be discussed among employees</li>
                      <li>Appraisals every 9–12 months, based on consistent performance</li>
                    </ul>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                      <strong className="block text-slate-900">Appraisal Cycle:</strong>
                      <p>&bull; Employees earning <strong>&lt; ₹15,000</strong> &rarr; Appraisal every <strong>11 months</strong></p>
                      <p>&bull; Employees earning <strong>&gt; ₹15,000</strong> &rarr; <strong>Annual appraisal</strong></p>
                    </div>
                  </div>
                </div>

                {/* 6. Communication Policy */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">6</span>
                    Communication Policy
                  </h3>
                  <div className="pl-8 space-y-1">
                    <p className="font-semibold text-slate-800">Employees on leave must remain reachable via:</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                      <li>Phone call</li>
                      <li>Email</li>
                      <li>Skype</li>
                    </ul>
                    <p className="text-[11px] text-slate-500 italic">
                      Unless located in a remote or network-restricted area.
                    </p>
                  </div>
                </div>

                {/* 7. Project Management Policy */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">7</span>
                    Project Management Policy
                  </h3>
                  <div className="pl-8 space-y-1">
                    <ul className="list-disc pl-5 space-y-1 text-[11px]">
                      <li>All tasks must be updated daily in <strong>Trello</strong></li>
                      <li>Deadlines are mutually agreed with team leads</li>
                      <li>Delays may require extra working hours or weekend work</li>
                    </ul>
                  </div>
                </div>

                {/* 8. Salary & Attendance Policy */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">8</span>
                    Salary & Attendance Policy
                  </h3>
                  <div className="pl-8 space-y-1">
                    <ul className="list-disc pl-5 space-y-1 text-[11px]">
                      <li>Salary is credited monthly through direct deposit</li>
                      <li>Employees working <strong>less than 20 days in a month</strong> will be paid proportionally</li>
                    </ul>
                  </div>
                </div>

                {/* 9. Notice Period */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">9</span>
                    Notice Period
                  </h3>
                  <div className="pl-8 space-y-1">
                    <ul className="list-disc pl-5 space-y-1 text-[11px]">
                      <li>Resignation requires a <strong>2-month written notice</strong>, submitted to HR</li>
                      <li>No leave is allowed during the notice period</li>
                      <li>If leave is taken, the notice period will be extended accordingly</li>
                    </ul>
                  </div>
                </div>

                {/* 10. Referral Policy */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">10</span>
                    Referral Policy
                  </h3>
                  <div className="pl-8 space-y-1">
                    <p className="font-semibold text-slate-800">Referral rewards for hiring:</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                      <li>1–3 years of experience &rarr; <strong>₹1,500</strong></li>
                      <li>3–5 years of experience &rarr; <strong>₹3,000</strong></li>
                    </ul>
                  </div>
                </div>

                {/* 11. Refreshments, Fun Friday & Recreation */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">11</span>
                    Refreshments, Fun Friday & Recreation
                  </h3>
                  <div className="pl-8 space-y-2 text-[11px]">
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>Monthly games/activities are held on the <strong>2nd or 4th Saturday</strong></li>
                      <li>Annual outings, dinners, or movies are organized</li>
                    </ul>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                      <strong className="block text-slate-900">Fun Friday Activity:</strong>
                      <p>1. Envelope activity must be completed as instructed</p>
                      <p>2. Participation is mandatory for team engagement</p>
                    </div>
                  </div>
                </div>

                {/* 12. General Company Guidelines */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#8B1D2C]/10 text-[#8B1D2C] flex items-center justify-center text-xs font-black">12</span>
                    General Company Guidelines
                  </h3>
                  <div className="pl-8 space-y-1 text-[11px]">
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Freelancing, side projects, or handling any external work is strictly prohibited</strong></li>
                      <li>Unauthorized copying or sharing of company data is not allowed</li>
                      <li>Maintain cleanliness at your workstation</li>
                      <li>Behave professionally and maintain decorum</li>
                      <li>Respect company policies, clients, and co-workers</li>
                    </ul>
                    <p className="font-bold text-[#8B1D2C] pt-2 text-xs">
                      Enjoy working with Gupta Tech Web!
                    </p>
                  </div>
                </div>

              </div>

              {/* Document 1 Footer */}
              <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                <span>410 Shagun Tower, Vijay Nagar, Indore - 452010 (M.P) India</span>
                <span className="font-mono">Phone: 7400554294 | Mail: info@guptatechweb.com | Website: guptatechweb.com</span>
              </div>
            </div>
          )}


          {/* =============================================================== */}
          {/* DOCUMENT 2: GUPTA TECH WEB – COMPANY POLICIES                  */}
          {/* =============================================================== */}
          {(activeTab === 'doc2' || activeTab === 'all') && (
            <div className="space-y-8 pb-10 border-b border-slate-200 last:border-b-0 print:border-none print:pb-0">
              
              {/* Document 2 Header & Letterhead */}
              <div className="border-b-2 border-slate-900 pb-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-2xl bg-white p-2 border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                      <img src="/logo.png" alt="Gupta Tech Web Logo" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Gupta Tech Web
                      </h1>
                      <p className="text-xs text-slate-600 font-semibold">
                        410 Shagun Tower, Vijay Nagar, Indore, Madhya Pradesh – 452010
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Phone: 7400554294 &bull; info@guptatechweb.com &bull; guptatechweb.com
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-900 text-white">
                      Company Policies
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Doc Ref: GTW/CORP/POL-2026/02
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Welcome to Gupta Tech Web
                  </h2>
                  <p className="text-xs font-bold text-slate-700 italic">
                    Innovating Today, Empowering Tomorrow
                  </p>
                </div>

                {/* CEO Welcome & Vision/Mission Box */}
                <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-50 to-orange-50/20 border border-slate-200 space-y-3 text-xs leading-relaxed">
                  <p className="italic text-slate-700">
                    "At Gupta Tech Web, our mission is to deliver transformative digital solutions that empower businesses and enrich communities. Guided by Innovation, Technology, and Relationships, we aim to build a future-focused organization rooted in trust, integrity, and growth."
                  </p>
                  <p className="text-right font-bold text-slate-900">
                    — Nikita Gupta, CEO
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="font-bold text-[11px] text-[#8B1D2C] block uppercase tracking-wider">Vision</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        To be recognized as a leading innovator in the technology marketplace by delivering high-quality software products and nurturing long-term relationships.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="font-bold text-[11px] text-[#8B1D2C] block uppercase tracking-wider">Mission</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Build Technology, Shape Personalities, and Strengthen Connections.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <span className="font-bold text-[11px] text-[#8B1D2C] block uppercase tracking-wider">Policy Objective</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        To establish clear and professional guidelines that help create a productive, disciplined, and supportive work environment for all employees.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document 2 Clauses (1 to 15) */}
              <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
                
                {/* 1. Required Documents at the Time of Joining */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">1</span>
                    Required Documents at the Time of Joining
                  </h3>
                  <div className="pl-8 text-slate-800 space-y-1">
                    <ul className="list-disc pl-5 space-y-1 text-[11px]">
                      <li>10th, 12th, and Graduation/Post-Graduation mark sheets</li>
                      <li>Aadhaar Card & PAN Card (Xerox copies)</li>
                      <li>Last 3 salary slips (if applicable)</li>
                      <li>UAN number (if any)</li>
                      <li>Appointment, appraisal, experience & relieving letters from previous employer</li>
                      <li>2 passport-size photographs</li>
                    </ul>
                  </div>
                </div>

                {/* 2. Working Hours */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">2</span>
                    Working Hours
                  </h3>
                  <div className="pl-8 text-slate-800 space-y-1 text-[11px]">
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Office Timing: 10:00 AM to 7:00 PM</strong></li>
                      <li><strong>Minimum Working Hours: 8 hours</strong> (excluding 1-hour break)</li>
                      <li>Late arrivals / early departures must be adjusted</li>
                      <li>Break time must not exceed 1 hour</li>
                      <li>Repeated late coming or early going may lead to disciplinary action</li>
                      <li>Working on holidays requires prior approval from Team Lead & HR</li>
                    </ul>
                  </div>
                </div>

                {/* 3. Code of Conduct */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">3</span>
                    Code of Conduct
                  </h3>
                  <div className="pl-8 text-slate-800 space-y-1 text-[11px]">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Maintain professionalism and respectful behavior</li>
                      <li>No discrimination or harassment</li>
                      <li>Protect confidential company data</li>
                      <li>Any grievance must first be reported to HR</li>
                    </ul>
                  </div>
                </div>

                {/* 4. Communication & Data Usage */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">4</span>
                    Communication & Data Usage
                  </h3>
                  <div className="pl-8 text-slate-800 space-y-1 text-[11px]">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Check and reply to emails regularly</li>
                      <li>Office internet must be used only for office work</li>
                      <li>Maintain proper data backup</li>
                      <li>Sensitive company information must not be shared outside</li>
                    </ul>
                  </div>
                </div>

                {/* 5. Leave Policies */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">5</span>
                    Leave Policies
                  </h3>
                  <div className="pl-8 space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <strong className="block text-slate-900 text-xs">General Leave Rules:</strong>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        <li><strong>No Casual Leave during the first 3 months (probation period)</strong></li>
                        <li><strong>Annual Leaves: 12 CL per year</strong></li>
                        <li>Leaves can be carried forward monthly but expire on <strong>31 December</strong></li>
                        <li><strong>Marriage Leave: 5 days</strong> (credited after 2 months of resuming work)</li>
                        <li><strong>Paternity Leave: 1 day</strong></li>
                        <li><strong>Sandwich Rule:</strong> Holiday before/after leave will be counted as <strong>unpaid</strong></li>
                        <li>Leave request must be sent through email to HR with CC to Director, PM, and TL</li>
                        <li>In emergency cases, inform before 10:00 AM via call or email</li>
                        <li><strong>WhatsApp or SMS is not considered official leave communication</strong></li>
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                      <strong className="block text-rose-900 text-xs">Additional Leave Rules:</strong>
                      <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                        <li>If your leave is <strong>not approved and you still remain absent</strong>, a <strong>1+1 salary deduction rule</strong> will apply.</li>
                        <li>For long holidays or pre-planned/special occasion leaves, employees must inform at least <strong>15 days in advance</strong>.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 6. Appreciations & Rewards */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">6</span>
                    Appreciations & Rewards
                  </h3>
                  <div className="pl-8 space-y-1 text-[11px]">
                    <p className="font-semibold text-slate-800">Quarterly certificates for:</p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>Performance</li>
                      <li>Discipline</li>
                      <li>Punctuality</li>
                      <li>Work Quality</li>
                    </ul>
                  </div>
                </div>

                {/* 7. Appraisal Policy */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">7</span>
                    Appraisal Policy
                  </h3>
                  <div className="pl-8 space-y-1 text-[11px]">
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>Employees earning below ₹15,000: appraisal every <strong>11 months</strong></li>
                      <li>Employees earning ₹15,000 or above: <strong>annual appraisal</strong></li>
                    </ul>
                  </div>
                </div>

                {/* 8. Accessibility During Leave */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">8</span>
                    Accessibility During Leave
                  </h3>
                  <div className="pl-8 text-[11px]">
                    <p>Employees should remain reachable unless in a no-network area.</p>
                  </div>
                </div>

                {/* 9. Project Management */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">9</span>
                    Project Management
                  </h3>
                  <div className="pl-8 space-y-1 text-[11px]">
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>Update PMT tools daily</li>
                      <li>Complete tasks within deadlines</li>
                      <li>Maintain proper data backup of all project files</li>
                    </ul>
                  </div>
                </div>

                {/* 10. Salary Credit */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">10</span>
                    Salary Credit
                  </h3>
                  <div className="pl-8 text-[11px]">
                    <p className="font-bold text-slate-900">
                      Salary is credited on the <strong>8th of every month</strong>.
                    </p>
                  </div>
                </div>

                {/* 11. Notice Period & Exit Process */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">11</span>
                    Notice Period & Exit Process
                  </h3>
                  <div className="pl-8 space-y-2.5 text-[11px]">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <strong className="block text-slate-900">Resignation:</strong>
                      <ul className="list-disc pl-5 space-y-0.5">
                        <li><strong>2-month notice period is mandatory</strong></li>
                        <li>Leaves during the notice period require approval</li>
                        <li>Salary, relieving letter, and experience letter will be issued only after:</li>
                        <ol className="list-decimal pl-5 space-y-0.5 text-slate-600 font-semibold">
                          <li>Completion of notice period</li>
                          <li>Returning company assets</li>
                          <li>Clearing all dues</li>
                        </ol>
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <strong className="block text-slate-900">Full & Final Settlement:</strong>
                      <p className="mt-0.5">
                        FNF will be processed <strong>45 days after the last working day</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 12. Termination Policy */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">12</span>
                    Termination Policy
                  </h3>
                  <div className="pl-8 space-y-1 text-[11px]">
                    <p className="font-semibold text-rose-800">
                      In case of termination due to performance, behavior, or policy violation:
                    </p>
                    <ul className="list-disc pl-5 space-y-0.5 text-rose-900">
                      <li>Salary for the ongoing month will not be issued</li>
                      <li>Experience/relieving letter will not be given</li>
                      <li>Employee will not be eligible for FNF</li>
                      <li>Company assets must be returned immediately</li>
                    </ul>
                  </div>
                </div>

                {/* 13. Referral Bonus */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">13</span>
                    Referral Bonus
                  </h3>
                  <div className="pl-8 space-y-1 text-[11px]">
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li><strong>₹1,500</strong> for candidates with 1–3 years experience</li>
                      <li><strong>₹3,000</strong> for candidates with 3–5 years experience</li>
                      <li>Bonus is given only after the referred employee completes <strong>3 months</strong></li>
                    </ul>
                  </div>
                </div>

                {/* 14. Moonlighting */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">14</span>
                    Moonlighting
                  </h3>
                  <div className="pl-8 text-[11px]">
                    <p className="font-bold text-rose-800">
                      Freelancing or secondary job without permission is not allowed.
                    </p>
                  </div>
                </div>

                {/* 15. Office Etiquette & General Guidelines */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-black">15</span>
                    Office Etiquette & General Guidelines
                  </h3>
                  <div className="pl-8 space-y-1 text-[11px]">
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li>Knock before entering cabins</li>
                      <li>Keep workstation clean</li>
                      <li>Unauthorized use of company data is prohibited</li>
                      <li><strong>Wearing company I-card inside office is mandatory</strong></li>
                      <li>Social media access on office systems is restricted</li>
                    </ul>
                    <p className="font-black text-slate-900 pt-2 text-xs">
                      Welcome to Gupta Tech Web — Let's Build the Future Together!
                    </p>
                  </div>
                </div>

              </div>

              {/* Document 2 Footer */}
              <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                <span>410 Shagun Tower, Vijay Nagar, Indore - 452010 (M.P) India</span>
                <span className="font-mono">Phone: 7400554294 | Mail: info@guptatechweb.com | Website: guptatechweb.com</span>
              </div>
            </div>
          )}

        </div>

        {/* Print Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .fixed.inset-0, .print\\:overflow-visible, .print\\:overflow-visible * {
              visibility: visible;
            }
            .fixed.inset-0 {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: auto;
              background: white !important;
            }
            @page {
              margin: 1.5cm;
              size: A4 portrait;
            }
          }
        `}} />

      </div>
    </div>
  );
};

export default CompanyHandbookModal;
