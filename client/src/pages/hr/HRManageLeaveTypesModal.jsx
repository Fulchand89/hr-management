import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  CalendarDays,
  ShieldCheck,
  Info
} from 'lucide-react';
import {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType
} from '../../services/hrService';

export const HRManageLeaveTypesModal = ({
  isOpen,
  onClose,
  onUpdated,
  initialEditTypeId = null
}) => {
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    daysPerYear: '',
    isPaid: true
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFormData, setNewFormData] = useState({
    name: '',
    code: '',
    daysPerYear: '12',
    isPaid: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all leave types
  const loadTypes = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await getLeaveTypes();
      const rawList = Array.isArray(res?.data)
        ? res.data
        : (Array.isArray(res) ? res : []);
      
      const seen = new Set();
      const uniqueTypes = rawList.filter((t) => {
        const key = t.id || t.code || t.name;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setTypes(uniqueTypes);

      // If initialEditTypeId was provided, open edit mode for it
      if (initialEditTypeId) {
        const target = uniqueTypes.find(
          (t) => String(t.id) === String(initialEditTypeId) || String(t.code) === String(initialEditTypeId)
        );
        if (target) {
          setEditingId(target.id);
          setEditFormData({
            name: target.name || '',
            code: target.code || '',
            daysPerYear: String(target.daysPerYear ?? 12),
            isPaid: target.isPaid ?? true
          });
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load leave types');
    } finally {
      setIsLoading(false);
    }
  }, [initialEditTypeId]);

  useEffect(() => {
    if (isOpen) {
      setSuccessMsg('');
      setError('');
      setIsAddingNew(false);
      loadTypes();
    } else {
      setEditingId(null);
    }
  }, [isOpen, loadTypes]);

  if (!isOpen) return null;

  const startEdit = (t) => {
    setError('');
    setSuccessMsg('');
    setIsAddingNew(false);
    setEditingId(t.id);
    setEditFormData({
      name: t.name || '',
      code: t.code || '',
      daysPerYear: String(t.daysPerYear ?? 12),
      isPaid: t.isPaid ?? true
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError('');
  };

  const handleUpdate = async (typeId) => {
    if (!editFormData.name.trim()) {
      setError('Leave category name is required');
      return;
    }
    if (!editFormData.code.trim()) {
      setError('Leave short code is required (e.g. CL, SL)');
      return;
    }
    const daysNum = parseFloat(editFormData.daysPerYear);
    if (isNaN(daysNum) || daysNum < 0 || daysNum > 365) {
      setError('Annual quota must be a valid number between 0 and 365');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await updateLeaveType(typeId, {
        name: editFormData.name.trim(),
        code: editFormData.code.trim().toUpperCase(),
        daysPerYear: daysNum,
        isPaid: editFormData.isPaid
      });
      setSuccessMsg(`Successfully updated "${editFormData.name.trim()}" (${daysNum} days quota)!`);
      setEditingId(null);
      await loadTypes();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to update leave type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newFormData.name.trim()) {
      setError('Leave category name is required');
      return;
    }
    if (!newFormData.code.trim()) {
      setError('Leave short code is required');
      return;
    }
    const daysNum = parseFloat(newFormData.daysPerYear);
    if (isNaN(daysNum) || daysNum < 0 || daysNum > 365) {
      setError('Annual quota must be between 0 and 365');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await createLeaveType({
        name: newFormData.name.trim(),
        code: newFormData.code.trim().toUpperCase(),
        daysPerYear: daysNum,
        isPaid: newFormData.isPaid
      });
      setSuccessMsg(`Created new leave category "${newFormData.name.trim()}" (${daysNum} days quota)!`);
      setIsAddingNew(false);
      setNewFormData({ name: '', code: '', daysPerYear: '12', isPaid: true });
      await loadTypes();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create leave type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Are you sure you want to delete leave category "${t.name}"? This action cannot be undone.`)) {
      return;
    }
    setIsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await deleteLeaveType(t.id);
      setSuccessMsg(`Deleted leave category "${t.name}"`);
      await loadTypes();
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err?.response?.data?.message || 'Cannot delete this leave type because employee requests exist for it.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8B1D2C]/10 flex items-center justify-center text-[#8B1D2C]">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Manage Leave Categories & Quotas</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update leave names, annual quota balances (kitani leave he), and codes for all staff.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        <div className="px-6 pt-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 mb-3">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Add New Button Toggle */}
          {!isAddingNew ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Configured Quotas ({types.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setEditingId(null);
                  setError('');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Leave Category</span>
              </button>
            </div>
          ) : (
            /* Add New Form */
            <form onSubmit={handleCreate} className="p-5 rounded-2xl bg-[#8B1D2C]/5 border border-[#8B1D2C]/20 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#8B1D2C] uppercase tracking-wider">
                  Create New Leave Category
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Leave Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paternity Leave"
                    value={newFormData.name}
                    onChange={(e) => setNewFormData({ ...newFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Code</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. PT"
                    value={newFormData.code}
                    onChange={(e) => setNewFormData({ ...newFormData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold uppercase bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Annual Quota (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    step="0.5"
                    required
                    value={newFormData.daysPerYear}
                    onChange={(e) => setNewFormData({ ...newFormData, daysPerYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]"
                  />
                </div>

                <div className="flex items-center sm:col-span-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newFormData.isPaid}
                      onChange={(e) => setNewFormData({ ...newFormData, isPaid: e.target.checked })}
                      className="rounded text-[#8B1D2C] focus:ring-[#8B1D2C] w-4 h-4 cursor-pointer"
                    />
                    <span>Paid Leave (Counts towards paid days)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Leave Types */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#8B1D2C]" />
              <span className="text-xs">Loading leave types...</span>
            </div>
          ) : types.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No leave categories found. Click "Add New Leave Category" to create one.
            </div>
          ) : (
            <div className="space-y-2.5">
              {types.map((t) => {
                const isEditing = editingId === t.id;

                if (isEditing) {
                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 shadow-xs space-y-3 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900">
                          Editing: {t.name} ({t.code})
                        </span>
                        <span className="text-[11px] text-amber-700">
                          Updates both leave name & quota for all employees
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Leave Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]"
                            placeholder="e.g. Casual Leave"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Short Code <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={10}
                            value={editFormData.code}
                            onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold uppercase bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]"
                            placeholder="e.g. CL"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Kitani Leave He / Total Quota (Days/Year) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="365"
                            step="0.5"
                            value={editFormData.daysPerYear}
                            onChange={(e) => setEditFormData({ ...editFormData, daysPerYear: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-[#8B1D2C] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]"
                            placeholder="e.g. 12"
                          />
                        </div>

                        <div className="flex items-center sm:col-span-2 pt-5">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={editFormData.isPaid}
                              onChange={(e) => setEditFormData({ ...editFormData, isPaid: e.target.checked })}
                              className="rounded text-[#8B1D2C] focus:ring-[#8B1D2C] w-4 h-4 cursor-pointer"
                            />
                            <span>Paid Leave Type</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/50">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdate(t.id)}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold disabled:opacity-50 shadow-xs cursor-pointer"
                        >
                          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Save Changes</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-2xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0">
                        {t.code || 'LV'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{t.name}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              t.isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-baseline gap-1 text-[11px] text-slate-500">
                          <span>Annual Quota:</span>
                          <span className="font-black text-[#8B1D2C]">
                            {t.daysPerYear} {Number(t.daysPerYear) === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(t)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                        title="Edit Name and Quota"
                      >
                        <Pencil className="w-3 h-3 text-[#8B1D2C]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Updating quotas synchronizes quota allowances for all staff immediately.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default HRManageLeaveTypesModal;
