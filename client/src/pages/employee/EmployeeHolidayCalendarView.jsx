import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  Filter,
  Flag,
  Award,
  BookmarkCheck,
  Building2
} from 'lucide-react';
import { getHolidays } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';

export const EmployeeHolidayCalendarView = ({ onBack }) => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

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
        let displayType = 'National Holiday';
        let badgeClass = 'bg-rose-50 text-[#8B1D2C] border-rose-200';

        if (rawType === 'restricted' || rawType === 'optional') {
          displayType = 'Optional Holiday';
          badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
        } else if (rawType === 'gazetted') {
          displayType = 'Gazetted Holiday';
          badgeClass = 'bg-blue-50 text-blue-800 border-blue-200';
        } else if (rawType === 'company') {
          displayType = 'Company Holiday';
          badgeClass = 'bg-purple-50 text-purple-800 border-purple-200';
        }

        return {
          id: h.id,
          name: h.title || h.name || 'Holiday',
          day: dayStr,
          date: dateNum,
          month: monthStr,
          fullDate: fullDateStr,
          year: yr,
          type: displayType,
          rawType,
          badgeClass,
          description: h.description || 'Official company holiday.'
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
  }, [token, loadHolidays]);

  const filteredHolidays = useMemo(() => {
    return holidays.filter((item) => {
      const matchYear = item.year === selectedYear;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.day.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType =
        typeFilter === 'ALL' ||
        (typeFilter === 'National' && (item.rawType === 'national' || item.rawType === 'gazetted')) ||
        (typeFilter === 'Optional' && (item.rawType === 'restricted' || item.rawType === 'optional'));
      return matchYear && matchSearch && matchType;
    });
  }, [holidays, selectedYear, searchQuery, typeFilter]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (onBack ? onBack() : navigate('/employee/dashboard'))}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#8B1D2C]" />
              <span>Company Holiday Calendar</span>
            </h1>
            <p className="text-xs text-slate-500">Official gazetted, national, and optional public holidays</p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-1 self-start sm:self-auto">
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
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#8B1D2C]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100 self-stretch sm:self-auto justify-center">
          {['ALL', 'National', 'Optional'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTypeFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                typeFilter === tab
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'ALL' ? 'All Holidays' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Holiday List */}
      <div className="space-y-2.5">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-24 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-slate-200 rounded-full" />
            </div>
          ))
        ) : filteredHolidays.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-2">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No holidays found for {selectedYear}</h3>
            <p className="text-xs text-slate-400">There are no holidays matching your search or filters.</p>
          </div>
        ) : (
          filteredHolidays.map((holiday) => (
            <div
              key={holiday.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Date tile */}
                <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                  <span className="text-base font-black text-slate-900 leading-none">
                    {holiday.date}
                  </span>
                  <span className="text-[11px] font-bold text-[#8B1D2C] leading-none mt-1">
                    {holiday.month}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {holiday.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {holiday.day} • {holiday.description}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide border shrink-0 ${holiday.badgeClass}`}
              >
                {holiday.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmployeeHolidayCalendarView;
