import React from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CreditCard,
  LogOut,
  CalendarDays,
  BadgeCheck,
  CheckCircle2,
} from 'lucide-react';

export const ProfileView = ({ onLogout }) => {
  // Official employee details matching company records and original screens
  const profile = {
    name: 'Ankit Parte',
    empId: 'EMP001',
    phone: '98765 43210',
    email: 'ankit@company.com',
    department: 'Engineering',
    designation: 'Software Engineer',
    joiningDate: '01 Jan 2024',
    shift: 'General',
    shiftTime: '09:00 AM - 06:00 PM',
    location: 'Bangalore Office, India',
    status: 'Active',
    manager: 'Alex Morgan (Engineering Lead)',
    bankName: 'HDFC Bank Ltd.',
    accountNo: '•••• •••• 8492',
    ifsc: 'HDFC0001245',
    pan: 'ABCDE1234F',
    leaves: {
      casual: { left: 8, total: 12 },
      sick: { left: 4, total: 6 },
      privilege: { left: 10, total: 15 },
    },
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Top Profile Header Hero Card (No awkward overlaps, 100% clean and readable) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Decorative Top Accent Bar */}
        <div className="h-4 bg-gradient-to-r from-slate-900 via-[#8B1D2C] to-[#5C101B]" />

        {/* Profile Identity Bar */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Avatar + Details */}
            <div className="flex items-center gap-5">
              {/* Avatar with Status Dot */}
              <div className="relative shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
                  alt="Ankit Parte"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-rose-50 shadow-md bg-slate-100"
                />
                <span
                  title="Active Status"
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-3 border-white rounded-full"
                />
              </div>

              {/* Name, Roles & Badges */}
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {profile.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {profile.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {profile.empId}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                  {profile.designation} &bull; {profile.department} Department
                </p>

                {/* Quick Info Tags */}
                <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
                  <span className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-semibold flex items-center gap-1.5 shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 text-[#8B1D2C]" />
                    {profile.location}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-100 text-[#8B1D2C] font-semibold flex items-center gap-1.5 shadow-2xs">
                    <Clock className="w-3.5 h-3.5" />
                    {profile.shift} Shift ({profile.shiftTime})
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-semibold flex items-center gap-1.5 shadow-2xs">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Joined {profile.joiningDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Sign Out Button */}
            {onLogout && (
              <div className="shrink-0 self-start md:self-center">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer border border-rose-200 shadow-2xs active:scale-[0.98]"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Content (All Details Visible & Well-Spaced) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Employment & Shift Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Official Employment Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Employment & Personal Details</h2>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Records
              </span>
            </div>

            {/* 2-Column Responsive Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Full Name */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 font-medium block">Full Name</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                    {profile.name}
                  </span>
                </div>
              </div>

              {/* Employee ID */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                  <BadgeCheck className="w-4 h-4 text-[#8B1D2C]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 font-medium block">Employee ID</span>
                  <span className="font-bold font-mono text-slate-900 text-sm mt-0.5 block">
                    {profile.empId}
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 font-medium block">Phone Number</span>
                  <span className="font-bold font-mono text-slate-900 text-sm mt-0.5 block">
                    {profile.phone}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 font-medium block">Corporate Email</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                    {profile.email}
                  </span>
                </div>
              </div>

              {/* Department */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 font-medium block">Department</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {profile.department}
                  </span>
                </div>
              </div>

              {/* Designation */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 font-medium block">Designation</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {profile.designation}
                  </span>
                </div>
              </div>

              {/* Joining Date */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 font-medium block">Joining Date</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {profile.joiningDate}
                  </span>
                </div>
              </div>

              {/* Reporting Manager */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-slate-400 font-medium block">Reporting Manager</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                    {profile.manager}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Shift Policy & Attendance Rules */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Shift Timings & Work Policy</h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">Regular Workweek</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Assigned Shift</span>
                <span className="font-black text-slate-900 text-sm mt-1 block">
                  {profile.shift} Shift
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block font-mono">
                  {profile.shiftTime}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Grace Punch In</span>
                <span className="font-black text-emerald-700 text-sm mt-1 block">15 Minutes</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Till 09:15 AM on-time</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block">Weekly Offs</span>
                <span className="font-black text-slate-900 text-sm mt-1 block">Sat & Sun</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">5 Days / Week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Leave Quota Balances & Financial Records */}
        <div className="space-y-6">
          {/* Card 3: Annual Leave Quota Balances */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center font-bold">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Leave Balances</h3>
              </div>
              <span className="text-xs font-semibold text-[#8B1D2C]">Year 2026</span>
            </div>

            <div className="space-y-3">
              {/* Casual Leave */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Casual Leave (CL)</span>
                  <span className="font-black text-[#8B1D2C]">
                    {profile.leaves.casual.left} / {profile.leaves.casual.total} Days
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#8B1D2C] rounded-full" style={{ width: '66%' }} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">4 days consumed</span>
              </div>

              {/* Sick Leave */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Sick Leave (SL)</span>
                  <span className="font-black text-emerald-700">
                    {profile.leaves.sick.left} / {profile.leaves.sick.total} Days
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '66%' }} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">2 days consumed</span>
              </div>

              {/* Privilege Leave */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Privilege Leave (PL)</span>
                  <span className="font-black text-blue-700">
                    {profile.leaves.privilege.left} / {profile.leaves.privilege.total} Days
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '66%' }} />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">5 days consumed</span>
              </div>
            </div>
          </div>

          {/* Card 4: Bank & Statutory Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Bank & Tax Records</h3>
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Encrypted</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400">Salary Bank</span>
                <span className="font-bold text-slate-800">{profile.bankName}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400">Account Number</span>
                <span className="font-bold font-mono text-slate-800">{profile.accountNo}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400">IFSC Code</span>
                <span className="font-bold font-mono text-slate-800">{profile.ifsc}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400">PAN Number</span>
                <span className="font-bold font-mono text-slate-800">{profile.pan}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
