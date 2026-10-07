import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  MoreVertical,
  Search,
  Trash2,
  Edit3,
  CheckCircle2,
  X,
  Filter,
  Check,
  Building2,
  CalendarDays
} from 'lucide-react';
import {
  getHolidays,
  createHoliday,
  deleteHoliday
} from '../../services/hrService';
import { useAuth } from '../../context/AuthContext';

export const HRHolidayManagementView = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [selectedYear, setSelectedYear] = useState(2026);
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'National' | 'Optional'
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    fullDate: '2026-01-01',
    type: 'National',
    description: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const loadHolidays = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getHolidays(selectedYear);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const formatted = list.map((h) => {
        const d = new Date(h.date);
        const dateNum = !isNaN(d.getTime()) ? String(d.getDate()).padStart(2, '0') : '01';
        const monthStr = !isNaN(d.getTime()) ? monthNames[d.getMonth()] : 'Jan';
        const dayStr = !isNaN(d.getTime()) ? dayNames[d.getDay()] : 'Monday';
        const yr = !isNaN(d.getTime()) ? d.getFullYear() : selectedYear;
        const fullDateStr = h.date ? String(h.date).split('T')[0] : `${selectedYear}-01-01`;

        const rawType = (h.type || '').toLowerCase();
        const displayType = rawType === 'restricted' || rawType === 'optional' ? 'Optional' : 'National';

        return {
          id: h.id,
          name: h.title || h.name || 'Holiday',
          day: dayStr,
          date: dateNum,
          month: monthStr,
          fullDate: fullDateStr,
          year: yr,
          type: displayType,
          description: h.description || 'Public holiday.'
        };
      });
      setHolidays(formatted);
    } catch {
      setHolidays([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (!token) return;
    loadHolidays();
  }, [token, user?.role, loadHolidays]);

  // Filtered Holidays
  const filteredHolidays = useMemo(() => {
    return holidays.filter((item) => {
      const matchYear = item.year === selectedYear;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.day.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'ALL' || item.type === typeFilter;
      return matchYear && matchSearch && matchType;
    });
  }, [holidays, selectedYear, searchQuery, typeFilter]);

  // Handle Add Holiday
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.fullDate) {
      alert('Please fill holiday name and date.');
      return;
    }

    try {
      const submitType = (formData.type || 'national').toLowerCase() === 'optional' ? 'restricted' : 'national';
      await createHoliday({
        title: formData.name.trim(),
        date: formData.fullDate,
        type: submitType,
        description: formData.description.trim() || 'Official company recognized holiday.'
      });
      setIsAddModalOpen(false);
      setFormData({ name: '', fullDate: `${selectedYear}-01-01`, type: 'National', description: '' });
      showToast(`Holiday "${formData.name.trim()}" added successfully.`);
      await loadHolidays();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to add holiday');
    }
  };

  // Handle Delete Holiday
  const handleDeleteHoliday = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete holiday "${name}"?`)) return;
    try {
      await deleteHoliday(id);
      setActiveMenuId(null);
      showToast(`Holiday "${name}" deleted.`);
      await loadHolidays();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete holiday');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section matching mockup */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/dashboard')}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Holiday Management</h1>
            <p className="text-xs text-slate-500">Configure annual company calendar and mandatory holidays</p>
          </div>
        </div>

        {/* Year Selector & Add Holiday CTA */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-black text-sm text-slate-900 select-none">
              {selectedYear}
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                fullDate: `${selectedYear}-01-01`,
                type: 'National',
                description: ''
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/20 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Holiday</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search holiday name, month..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              typeFilter === 'ALL'
                ? 'bg-[#8B1D2C] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({holidays.filter((h) => h.year === selectedYear).length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('National')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              typeFilter === 'National'
                ? 'bg-rose-100 text-[#8B1D2C] ring-1 ring-[#8B1D2C]'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            National
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('Optional')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              typeFilter === 'Optional'
                ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Optional
          </button>
        </div>
      </div>

      {/* Holiday Cards List matching user screenshot */}
      <div className="space-y-2.5">
        {filteredHolidays.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No holidays found for {selectedYear}</h3>
            <p className="text-xs text-slate-400">Click the "+ Holiday" button above to add one.</p>
          </div>
        ) : (
          filteredHolidays.map((holiday) => (
            <div
              key={holiday.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between gap-4 relative group"
            >
              {/* Left: Date Block + Title */}
              <div className="flex items-center gap-4 min-w-0">
                {/* Date tile matching screenshot */}
                <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                  <span className="text-base font-black text-slate-900 leading-none">
                    {holiday.date}
                  </span>
                  <span className="text-[11px] font-bold text-[#8B1D2C] leading-none mt-1">
                    {holiday.month}
                  </span>
                </div>

                {/* Holiday Name & Day of Week */}
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 truncate">{holiday.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{holiday.day}</p>
                </div>
              </div>

              {/* Right: Badge & 3-dots Menu */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Badge matching screenshot */}
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${
                    holiday.type === 'National'
                      ? 'bg-rose-50 text-[#8B1D2C] border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {holiday.type}
                </span>

                {/* 3-dots Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveMenuId(activeMenuId === holiday.id ? null : holiday.id)
                    }
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown menu */}
                  {activeMenuId === holiday.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          alert(`Holiday: ${holiday.name}\nDate: ${holiday.date} ${holiday.month} ${holiday.year}\nType: ${holiday.type}\nNote: ${holiday.description}`);
                          setActiveMenuId(null);
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                        className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Holiday Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">Add New Holiday</h3>
                <p className="text-xs text-slate-400">Add an official calendar date for {selectedYear}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Holiday Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Independence Day, Diwali"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Holiday Date</label>
                <input
                  type="date"
                  required
                  value={formData.fullDate}
                  onChange={(e) => setFormData({ ...formData, fullDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Holiday Classification</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'National' })}
                    className={`py-2 px-3 rounded-xl font-bold border transition-colors cursor-pointer ${
                      formData.type === 'National'
                        ? 'bg-rose-50 border-[#8B1D2C] text-[#8B1D2C]'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    National Holiday
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'Optional' })}
                    className={`py-2 px-3 rounded-xl font-bold border transition-colors cursor-pointer ${
                      formData.type === 'Optional'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Optional Holiday
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description of the holiday observance"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold shadow-md shadow-[#8B1D2C]/20 cursor-pointer"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRHolidayManagementView;
