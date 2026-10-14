import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { createHoliday } from '../../services/hrService';

export const HRAddHolidayView = () => {
  const navigate = useNavigate();

  // Form State
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('national');
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg('Please enter a valid holiday name (minimum 2 characters).');
      return;
    }

    if (!date) {
      setErrorMsg('Please select a valid holiday date.');
      return;
    }

    setIsLoading(true);
    try {
      await createHoliday({
        title: trimmedName,
        date,
        type,
        description: description.trim() || 'Official company holiday.'
      });

      setSuccessMsg(`Holiday "${trimmedName}" added successfully.`);
      setTimeout(() => {
        navigate('/hr/holiday-management');
      }, 1000);
    } catch (err) {
      console.error('Failed to create holiday:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Failed to add holiday. A holiday may already exist on this date.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Header with Back Button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/hr/holiday-management')}
          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          title="Back to Holiday Management"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#8B1D2C]" />
            <span>Add New Holiday</span>
          </h1>
          <p className="text-xs text-slate-500">Add an official calendar date for company holidays</p>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* Simple Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Holiday Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Holiday Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Independence Day, Diwali, Eid al-Fitr"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
            />
          </div>

          {/* Holiday Date */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Holiday Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
            />
          </div>

          {/* Holiday Classification */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Holiday Classification <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('national')}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-colors cursor-pointer text-center ${
                  type === 'national'
                    ? 'bg-rose-50 border-[#8B1D2C] text-[#8B1D2C]'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                National Holiday
              </button>
              <button
                type="button"
                onClick={() => setType('restricted')}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-colors cursor-pointer text-center ${
                  type === 'restricted'
                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Optional Holiday
              </button>
              <button
                type="button"
                onClick={() => setType('gazetted')}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-colors cursor-pointer text-center ${
                  type === 'gazetted'
                    ? 'bg-blue-50 border-blue-500 text-blue-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Gazetted Holiday
              </button>
              <button
                type="button"
                onClick={() => setType('company')}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-colors cursor-pointer text-center ${
                  type === 'company'
                    ? 'bg-purple-50 border-purple-500 text-purple-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Company Holiday
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Description / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Optional notes or details about the holiday observance"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/hr/holiday-management')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Holiday</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HRAddHolidayView;
