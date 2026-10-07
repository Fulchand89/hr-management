import React, { useState } from 'react';
import { Laptop, Monitor, Smartphone, Plus, Search, ShieldCheck } from 'lucide-react';

export const CompanyAssetsPage = () => {
  const assets = [
    { id: 'AST-01', name: 'MacBook Pro 16" M3', serial: 'C02G1028MD6T', category: 'laptop', assignedTo: 'John Doe', condition: 'new', status: 'allocated' },
    { id: 'AST-02', name: 'Dell UltraSharp 27" 4K', serial: 'CN-0K790D-74261', category: 'monitor', assignedTo: 'Aarav Sharma', condition: 'good', status: 'allocated' },
    { id: 'AST-03', name: 'ThinkPad X1 Carbon', serial: 'PF-2N9A91', category: 'laptop', assignedTo: 'Unassigned', condition: 'good', status: 'available' },
    { id: 'AST-04', name: 'iPhone 15 Pro (Test Device)', serial: 'F2LXJ08KN7', category: 'mobile', assignedTo: 'Unassigned', condition: 'new', status: 'available' }
  ];

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
        <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer">
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
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
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-semibold text-slate-900">{a.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{a.serial}</td>
                  <td className="py-3 px-4 capitalize">{a.category}</td>
                  <td className="py-3 px-4 font-medium">{a.assignedTo}</td>
                  <td className="py-3 px-4 capitalize">{a.condition}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      a.status === 'allocated' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {a.status.toUpperCase()}
                    </span>
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

export default CompanyAssetsPage;
