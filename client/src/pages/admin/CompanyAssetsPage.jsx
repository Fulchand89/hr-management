import React, { useState, useEffect, useCallback } from 'react';
import { Laptop, Monitor, Smartphone, Plus, Search, ShieldCheck } from 'lucide-react';
import { getCompanyAssets } from '../../services/hrService';

export const CompanyAssetsPage = () => {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCompanyAssets();
      const rawAssets = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setAssets(
        rawAssets.map((a) => {
          const emp = a.assignedEmployee || {};
          return {
            id: a.id,
            name: a.assetName || a.name,
            serial: a.serialNumber || a.serial,
            category: a.category || 'other',
            assignedTo: emp.firstName
              ? `${emp.firstName} ${emp.lastName || ''}`.trim()
              : (emp.email || 'Unassigned'),
            condition: a.condition || 'good',
            status: a.status || 'available'
          };
        })
      );
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Laptop className="w-7 h-7 text-indigo-600" />
            Company Asset Inventory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hardware allocations, equipment tracking, and IT asset registry.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Asset Name</th>
                <th className="py-3.5 px-4">Serial Number</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Condition</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    {isLoading ? 'Loading assets...' : 'No company assets currently registered.'}
                  </td>
                </tr>
              ) : (
                assets.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">{a.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{a.serial}</td>
                    <td className="py-3 px-4 capitalize">{a.category}</td>
                    <td className="py-3 px-4 font-medium">{a.assignedTo}</td>
                    <td className="py-3 px-4 capitalize">{a.condition}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          a.status === 'allocated' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {a.status.toUpperCase()}
                      </span>
                    </td>
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

export default CompanyAssetsPage;
