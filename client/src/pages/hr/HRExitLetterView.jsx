import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  Printer,
  Copy,
  Check,
  FileText,
  Award,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  Download,
  Share2,
  ArrowRight
} from 'lucide-react';
import { getResignationById } from '../../services/hrService';
import { getMyResignation } from '../../services/employeeService';
import { PageSkeleton } from '../../components/common/Skeleton';

export const HRExitLetterView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isEmployeePortal = location.pathname.startsWith('/employee');
  const [letterType, setLetterType] = useState('relieving'); // 'relieving' | 'experience'
  const [exitData, setExitData] = useState(location.state?.exitRecord || null);
  const [isLoading, setIsLoading] = useState(!location.state?.exitRecord);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleBack = () => {
    if (isEmployeePortal) navigate('/employee/resignation');
    else navigate('/hr/exit-management');
  };

  // Fetch resignation details if not provided via route state
  useEffect(() => {
    if (exitData && (!id || exitData.id === id)) return;

    let isMounted = true;
    const fetchLetterDetails = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = id ? await getResignationById(id) : await getMyResignation();
        const raw = res?.data ?? res ?? {};
        const emp = raw.employee || {};
        const lwd = raw.approvedLastWorkingDay || raw.requestedLastWorkingDay || raw.resignationDate;

        if (isMounted) {
          setExitData({
            id: raw.id,
            employeeName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.email || 'Employee',
            employeeCode: emp.employeeCode || emp.employeeId || 'EMP-XXXX',
            designation: emp.designationDetails?.title || 'Staff',
            department: emp.departmentDetails?.name || 'General',
            joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
            resignationDate: raw.resignationDate ? new Date(raw.resignationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
            lastWorkingDay: lwd ? new Date(lwd).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '2026-12-11',
            status: raw.status || 'approved'
          });
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load letter details:', err);
          setError(err?.response?.data?.message || 'Failed to load exit record. Please return and try again.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLetterDetails();
    return () => {
      isMounted = false;
    };
  }, [id, exitData]);

  // Document Date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const employeeName = exitData?.employeeName || 'Employee';
  const employeeCode = exitData?.employeeCode || 'EMP-001';
  const designation = exitData?.designation || 'Staff Member';
  const department = exitData?.department || 'Operations';
  const joinDateStr = exitData?.joiningDate || '01 Jan 2024';
  const lastWorkingDayStr = exitData?.lastWorkingDay || todayFormatted;
  const refNumber = `GTW/HR/${letterType === 'relieving' ? 'REL' : 'EXP'}/${employeeCode}/${new Date().getFullYear()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = letterType === 'relieving'
      ? `RELIEVING LETTER\nDate: ${todayFormatted}\nRef: ${refNumber}\n\nTO WHOMSOEVER IT MAY CONCERN\n\nThis is to certify that ${employeeName} (Employee Code: ${employeeCode}) was employed with Gupta Tech Web as ${designation} in the ${department} department.\n\nTheir resignation has been formally accepted, and they were relieved of their duties on ${lastWorkingDayStr} after fulfilling the handover and departmental clearance requirements.\n\nDuring their tenure, their conduct and performance were found to be satisfactory. We wish them all the best in their future endeavors.\n\nHuman Resources Department\nGupta Tech Web Technologies Pvt. Ltd.`
      : `EXPERIENCE CERTIFICATE\nDate: ${todayFormatted}\nRef: ${refNumber}\n\nTO WHOMSOEVER IT MAY CONCERN\n\nThis is to certify that ${employeeName} (Employee Code: ${employeeCode}) was employed with Gupta Tech Web as ${designation} in the ${department} department from ${joinDateStr} to ${lastWorkingDayStr}.\n\nDuring their tenure, they have demonstrated high professional competence and dedication in executing their duties.\n\nWe appreciate their contributions and wish them success in all their future professional endeavors.\n\nHuman Resources Department\nGupta Tech Web Technologies Pvt. Ltd.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4">
        <PageSkeleton />
      </div>
    );
  }

  if (error || !exitData) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xs text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Document Record Not Found</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error || 'Unable to retrieve resignation exit record for this document identifier.'}
        </p>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#8B1D2C] text-white text-xs font-bold hover:bg-[#731724] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Return to Exit Records
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* ── Top Bar / Action Controls (Hidden on Print) ─────────────── */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>{letterType === 'relieving' ? 'Relieving Letter' : 'Experience Letter'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-medium">
                {employeeCode}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Official document for <strong className="text-slate-700">{employeeName}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Switch Type Tabs */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setLetterType('relieving')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                letterType === 'relieving'
                  ? 'bg-white text-[#8B1D2C] shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Relieving Letter
            </button>
            <button
              type="button"
              onClick={() => setLetterType('experience')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                letterType === 'experience'
                  ? 'bg-white text-[#8B1D2C] shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Experience Letter
            </button>
          </div>

          {/* Copy Plain Text */}
          <button
            type="button"
            onClick={handleCopyText}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Copy plain text letter to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold text-xs shadow-md shadow-[#8B1D2C]/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Print Document</span>
          </button>
        </div>
      </div>

      {/* ── Official A4 Letterhead Preview (Printed Sheet) ──────────── */}
      <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/90 shadow-lg font-serif text-slate-900 text-sm leading-relaxed print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* Letterhead Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b-2 border-[#8B1D2C]/40 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#8B1D2C] text-white flex items-center justify-center font-sans font-black text-lg tracking-wider">
                GTW
              </div>
              <div>
                <h2 className="font-sans font-black text-lg text-slate-900 leading-tight">
                  Gupta Tech Web Technologies
                </h2>
                <p className="font-sans text-[11px] font-semibold text-[#8B1D2C] tracking-wide uppercase">
                  People Operations & Human Resources
                </p>
              </div>
            </div>
            <p className="font-sans text-[11px] text-slate-500 pt-1">
              Corporate Office: Tech Park Towers, Level 4, Business District, India
            </p>
          </div>

          <div className="font-sans text-right text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">Official Communication</p>
            <p className="text-[11px]">Email: hr@hrmanagement.com</p>
            <p className="text-[11px]">Portal: gtw-hr.internal</p>
          </div>
        </div>

        {/* Reference & Date Line */}
        <div className="flex items-center justify-between font-sans text-xs text-slate-600 pt-6 pb-8 border-b border-slate-100">
          <div>
            <span className="font-bold text-slate-800">Ref No: </span>
            <span className="font-mono text-slate-700">{refNumber}</span>
          </div>
          <div>
            <span className="font-bold text-slate-800">Date: </span>
            <span className="font-medium text-slate-700">{todayFormatted}</span>
          </div>
        </div>

        {/* Document Subject Header */}
        <div className="py-8 text-center">
          <h2 className="font-sans font-black text-base uppercase tracking-widest text-slate-900 inline-block border-b-2 border-slate-900 pb-1">
            TO WHOMSOEVER IT MAY CONCERN
          </h2>
          <p className="font-sans text-xs text-slate-500 mt-2 font-medium">
            Subject: {letterType === 'relieving' ? 'Relieving Letter & Release of Service' : 'Service & Experience Certificate'}
          </p>
        </div>

        {/* Letter Body */}
        <div className="space-y-5 text-[13px] sm:text-sm text-slate-800 leading-relaxed">
          {letterType === 'relieving' ? (
            <>
              <p>
                This is to certify that <strong className="font-bold text-slate-950 font-sans">{employeeName}</strong> (Employee Code:{' '}
                <strong className="font-mono font-bold text-slate-900">{employeeCode}</strong>) was employed with{' '}
                <strong>Gupta Tech Web Technologies Pvt. Ltd.</strong> in the capacity of{' '}
                <strong className="font-sans text-slate-900">{designation}</strong> within the{' '}
                <strong className="font-sans text-slate-900">{department}</strong> department.
              </p>

              <p>
                Their resignation has been formally accepted by the Management, and they were officially relieved of all company duties, authorities, and professional responsibilities effective the close of business hours on{' '}
                <strong className="font-sans font-bold text-slate-950">{lastWorkingDayStr}</strong>, following complete fulfillment of handover requirements and departmental clearances.
              </p>

              <p>
                During their tenure with our organization, their conduct and performance were found to be satisfactory. All company assets, access credentials, and departmental accounts have been verified and settled in full with no outstanding liabilities.
              </p>

              <p>
                We sincerely thank them for their valuable service and contributions to the company and wish them all the best in their future career endeavors.
              </p>
            </>
          ) : (
            <>
              <p>
                This is to certify that <strong className="font-bold text-slate-950 font-sans">{employeeName}</strong> (Employee Code:{' '}
                <strong className="font-mono font-bold text-slate-900">{employeeCode}</strong>) served as a full-time employee with{' '}
                <strong>Gupta Tech Web Technologies Pvt. Ltd.</strong> from{' '}
                <strong className="font-sans text-slate-900">{joinDateStr}</strong> to{' '}
                <strong className="font-sans text-slate-900">{lastWorkingDayStr}</strong>.
              </p>

              <p>
                During their tenure with us, they held the designation of{' '}
                <strong className="font-sans text-slate-900">{designation}</strong> in the{' '}
                <strong className="font-sans text-slate-900">{department}</strong> department, where they handled core responsibilities with dedication, reliability, and technical proficiency.
              </p>

              <p>
                We found them to be sincere, dedicated, and hardworking with commendable professional ethics and interpersonal skills. They maintained positive and collaborative relationships with team members, management, and clients.
              </p>

              <p>
                We appreciate their contributions to our team and wish them continued growth and success in all their future professional pursuits.
              </p>
            </>
          )}
        </div>

        {/* Official Signatory Section */}
        <div className="pt-14 font-sans text-xs flex justify-between items-end border-t border-slate-100 mt-12">
          <div className="space-y-1">
            <p className="text-slate-500 font-medium">Sincerely,</p>
            <p className="font-black text-slate-900 text-sm">For Gupta Tech Web Technologies</p>
            <div className="h-12 flex items-center">
              <span className="font-serif italic text-slate-400 text-xs">
                [Authorized Digital Signature Verified]
              </span>
            </div>
            <p className="font-bold text-slate-800">Human Resources Department</p>
            <p className="text-[11px] text-slate-500">Authorized Signatory & People Operations Hub</p>
          </div>

          <div className="text-right">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-mono text-center p-2 mx-auto">
              Corporate Seal
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Verified Document</p>
          </div>
        </div>

        {/* Verification Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center font-sans text-[10px] text-slate-400">
          This document is generated digitally and constitutes official confirmation by Gupta Tech Web. For credential background verification, contact hr@hrmanagement.com quoting the reference number above.
        </div>
      </div>
    </div>
  );
};

export default HRExitLetterView;
