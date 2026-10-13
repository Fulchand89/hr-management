import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, User, Clock, Terminal } from 'lucide-react';
import { getActivityLogs } from '../../services/hrService';

export const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getActivityLogs();
      const rawLogs = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setLogs(
        rawLogs.map((l) => {
          const emp = l.user || {};
          const userName = emp.firstName
            ? `${emp.firstName} ${emp.lastName || ''}`.trim()
            : (emp.email || 'System');

          const formattedTime = l.createdAt
            ? new Date(l.createdAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : '';

          return {
            id: l.id,
            action: l.action || 'OPERATION',
            user: userName,
            module: l.module || 'system',
            ip: l.ipAddress || '127.0.0.1',
            time: formattedTime,
            details: l.details || `Operation on ${l.module}`
          };
        })
      );
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

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
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    {isLoading ? 'Loading activity logs...' : 'No activity audit logs recorded yet.'}
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600">{l.action}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{l.user}</td>
                    <td className="py-3.5 px-4 capitalize">{l.module}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{l.ip}</td>
                    <td className="py-3.5 px-4 text-slate-500">{l.time}</td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">{l.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsPage;
