import React from 'react';
import { ShieldCheck, User, Clock, Terminal } from 'lucide-react';

export const ActivityLogsPage = () => {
  const logs = [
    { id: 'LOG-1', action: 'LEAVE_APPROVED', user: 'Admin User', module: 'leave', ip: '127.0.0.1', time: '10 mins ago', details: 'Approved Casual Leave for Aarav Sharma' },
    { id: 'LOG-2', action: 'PUNCH_IN', user: 'Aarav Sharma', module: 'attendance', ip: '192.168.1.100', time: '09:05 AM', details: 'Clocked in from Bangalore HQ' },
    { id: 'LOG-3', action: 'EMPLOYEE_CREATED', user: 'Helen Rivers (HR)', module: 'employees', ip: '127.0.0.1', time: 'Yesterday', details: 'Created profile for Rohan Verma (EMP-006)' },
    { id: 'LOG-4', action: 'ROLE_PERMISSION_UPDATED', user: 'Admin User', module: 'rbac', ip: '127.0.0.1', time: '2 days ago', details: 'Assigned leave:approve permission to Department Manager' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Terminal className="w-7 h-7 text-indigo-600" />
          Security Audit & Activity Logs
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Trace administrative operations, security events, and employee logins.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Initiated By</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600">{l.action}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{l.user}</td>
                  <td className="py-3.5 px-4 capitalize">{l.module}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{l.ip}</td>
                  <td className="py-3.5 px-4 text-slate-500">{l.time}</td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsPage;
