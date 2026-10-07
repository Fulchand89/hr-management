import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Coffee,
  XCircle,
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';

export const AttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const records = [
    {
      id: 'ATT-1',
      employeeName: 'Aarav Sharma',
      employeeCode: 'EMP-004',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
      department: 'Engineering',
      clockIn: '09:05 AM',
      clockOut: '06:12 PM',
      totalHours: '09h 07m',
      status: 'present'
    },
    {
      id: 'ATT-2',
      employeeName: 'Priya Patel',
      employeeCode: 'EMP-005',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      department: 'Human Resources',
      clockIn: '09:25 AM',
      clockOut: '--:--',
      totalHours: '05h 40m',
      status: 'late'
    },
    {
      id: 'ATT-3',
      employeeName: 'Rohan Verma',
      employeeCode: 'EMP-006',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      department: 'Sales',
      clockIn: '--:--',
      clockOut: '--:--',
      totalHours: '00h 00m',
      status: 'on_leave'
    },
    {
      id: 'ATT-4',
      employeeName: 'Neha Gupta',
      employeeCode: 'EMP-007',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120',
      department: 'Design',
      clockIn: '--:--',
      clockOut: '--:--',
      totalHours: '00h 00m',
      status: 'absent'
    }
  ];

  const filtered = records.filter(
    (r) =>
      r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-7 h-7 text-indigo-600" />
            Daily Attendance Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time biometric & web punch logging across organization branches.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-indigo-500"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">42 / 48</div>
            <div className="text-xs text-slate-500">Present Today</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">3</div>
            <div className="text-xs text-slate-500">Late Arrivals</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-600">2</div>
            <div className="text-xs text-slate-500">On Approved Leave</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600">1</div>
            <div className="text-xs text-slate-500">Absent Without Notice</div>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-800">Attendance Log for {selectedDate}</h3>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Total Hours</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={item.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="font-semibold text-slate-900">{item.employeeName}</div>
                        <div className="text-[11px] text-slate-400">{item.employeeCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{item.department}</td>
                  <td className="py-3 px-4 font-mono">{item.clockIn}</td>
                  <td className="py-3 px-4 font-mono">{item.clockOut}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{item.totalHours}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        item.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700'
                          : item.status === 'late'
                          ? 'bg-amber-50 text-amber-700'
                          : item.status === 'on_leave'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {item.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">
                      Regularize
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

export default AttendancePage;
