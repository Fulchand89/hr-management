import React from 'react';
import { Settings, Building, Bell, Shield, Key } from 'lucide-react';

export const AdminSettingsPage = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-600" />
          Enterprise Settings & Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure organization working hours, attendance policies, and security credentials.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            Company Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Company Legal Name</label>
              <input type="text" defaultValue="WorkPulse Technologies Pvt. Ltd." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Work Email Domain</label>
              <input type="text" defaultValue="@workpulse.io" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            Attendance & Work Hours Policy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Standard Work Hours / Day</label>
              <input type="number" defaultValue="8" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Punch Grace Period (Mins)</label>
              <input type="number" defaultValue="15" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Half-Day Threshold (Hours)</label>
              <input type="number" defaultValue="4.5" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs" />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex justify-end">
          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer">
            Save Settings Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
