import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MoreVertical,
  Download,
  CalendarDays,
  TableProperties,
  List
} from 'lucide-react';
import { getAdminDailyAttendance, getAdminMonthlyGrid, getAdminDetailsAll, getAllEmployees } from '../../services/hrService';

const HRStaffAttendance = () => {
  // View Toggle: 'daily' | 'monthly' | 'details'
  const [viewMode, setViewMode] = useState('daily');

  // Common State
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Helper functions for local dates to avoid timezone shift
  const getTodayLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getFirstDayOfMonthLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };

  // Daily View State
  const [date, setDate] = useState(getTodayLocal);
  const [dailyRecords, setDailyRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  // Range Views State (Monthly Grid & Details All)
  const [startDate, setStartDate] = useState(getFirstDayOfMonthLocal);
  const [endDate, setEndDate] = useState(getTodayLocal);
  
  const [monthlyData, setMonthlyData] = useState({ dates: [], records: [] });
  const [detailsData, setDetailsData] = useState([]);

  const fetchDailyAttendance = async (selectedDate, empId) => {
    try {
      setLoading(true);
      const params = { date: selectedDate };
      if (empId) params.employeeId = empId;
      const res = await getAdminDailyAttendance(params);
      const records = Array.isArray(res.data)
        ? res.data
        : (res.data?.records || (Array.isArray(res) ? res : []));
      setDailyRecords(records);
    } catch (error) {
      console.error('Failed to fetch daily staff attendance:', error);
      setDailyRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyGrid = async (start, end, empId) => {
    try {
      setLoading(true);
      const params = { startDate: start, endDate: end };
      if (empId) params.employeeId = empId;
      const res = await getAdminMonthlyGrid(params);
      const grid = res.data || res || {};
      setMonthlyData({
        dates: Array.isArray(grid.dates) ? grid.dates : [],
        records: Array.isArray(grid.records) ? grid.records : []
      });
    } catch (error) {
      console.error('Failed to fetch monthly grid:', error);
      setMonthlyData({ dates: [], records: [] });
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailsAll = async (start, end, empId) => {
    try {
      setLoading(true);
      const params = { startDate: start, endDate: end };
      if (empId) params.employeeId = empId;
      const res = await getAdminDetailsAll(params);
      const records = Array.isArray(res.data)
        ? res.data
        : (res.data?.records || (Array.isArray(res) ? res : (res?.records || [])));
      setDetailsData(records);
    } catch (error) {
      console.error('Failed to fetch details all:', error);
      setDetailsData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const res = await getAllEmployees({ limit: 1000 });
      const records = res.data?.records || (Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []));
      setEmployees(records);
    } catch (error) {
      console.error('Failed to fetch employees list:', error);
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  useEffect(() => {
    if (viewMode === 'daily') {
      fetchDailyAttendance(date, selectedEmployeeId);
    } else if (viewMode === 'monthly') {
      fetchMonthlyGrid(startDate, endDate, selectedEmployeeId);
    } else if (viewMode === 'details') {
      fetchDetailsAll(startDate, endDate, selectedEmployeeId);
    }
  }, [viewMode, date, startDate, endDate, selectedEmployeeId]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, searchTerm, statusFilter, date, startDate, endDate, selectedEmployeeId]);

  const getStatusColor = (status) => {
    const lower = (status || '').toLowerCase();
    if (lower === 'present') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (lower === 'absent') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (lower === 'late') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (lower === 'half day' || lower === 'half_day') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getGridStatusStyle = (status) => {
    switch (status) {
      case 'P': return 'bg-emerald-100 text-emerald-700 font-bold';
      case 'A': return 'bg-rose-100 text-rose-700 font-bold';
      case 'L': return 'bg-amber-100 text-amber-700 font-bold';
      case 'H': return 'bg-indigo-100 text-indigo-700 font-bold';
      case 'W': return 'bg-slate-100 text-slate-400 font-medium';
      case '-': return 'text-slate-300';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const formatDisplayStatus = (status) => {
    const lower = (status || '').toLowerCase();
    if (lower === 'half_day') return 'Half Day';
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  // Filters
  const matchesStatusFilter = (recStatus) => {
    if (statusFilter === 'all') return true;
    const lowerRec = (recStatus || '').toLowerCase();
    const lowerFilter = statusFilter.toLowerCase();
    if (lowerRec === lowerFilter) return true;
    if (lowerRec === 'half_day' && lowerFilter === 'half day') return true;
    return false;
  };

  const filteredDaily = (Array.isArray(dailyRecords) ? dailyRecords : []).filter(record => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (record.employeeName || '').toLowerCase().includes(term) ||
                          (record.employeeId || '').toLowerCase().includes(term);
    return matchesSearch && matchesStatusFilter(record.status);
  });

  const filteredMonthly = (Array.isArray(monthlyData?.records) ? monthlyData.records : []).filter(record => {
    const term = searchTerm.toLowerCase();
    return (record.employeeName || '').toLowerCase().includes(term) ||
           (record.employeeId || '').toLowerCase().includes(term);
  });

  const filteredDetails = (Array.isArray(detailsData) ? detailsData : []).filter(record => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (record.employeeName || '').toLowerCase().includes(term) ||
                          (record.employeeId || '').toLowerCase().includes(term) ||
                          (record.department || '').toLowerCase().includes(term);
    return matchesSearch && matchesStatusFilter(record.status);
  });

  // Pagination Logic
  const getPaginatedData = (dataArray) => {
    const list = Array.isArray(dataArray) ? dataArray : [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      currentItems: list.slice(startIndex, endIndex),
      totalPages: Math.max(1, Math.ceil(list.length / itemsPerPage)),
      totalItems: list.length
    };
  };

  const dailyPagination = getPaginatedData(filteredDaily);
  const monthlyPagination = getPaginatedData(filteredMonthly);
  const detailsPagination = getPaginatedData(filteredDetails);

  const handlePageChange = (newPage, totalPages) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderPagination = ({ totalPages, totalItems }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200">
        <div className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-medium text-slate-900">{totalItems}</span> results
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handlePageChange(currentPage - 1, totalPages)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-1 px-2">
            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              // Simple pagination rendering logic (show few pages around current)
              if (totalPages > 7) {
                if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum, totalPages)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="text-slate-400">...</span>;
                }
                return null;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum, totalPages)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button 
            onClick={() => handlePageChange(currentPage + 1, totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    let filename = "attendance_export.csv";

    if (viewMode === 'daily') {
      filename = `Daily_Attendance_${date}.csv`;
      csvContent += "Employee Name,Employee ID,Status,Punch In,Punch Out,Total Hours\n";
      filteredDaily.forEach(record => {
        const row = [
          `"${record.employeeName}"`,
          `"${record.employeeId}"`,
          `"${formatDisplayStatus(record.status)}"`,
          `"${record.punchIn || '--:--'}"`,
          `"${record.punchOut || '--:--'}"`,
          `"${record.totalHours || '0h 0m'}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    } else if (viewMode === 'monthly') {
      filename = `Monthly_Grid_${startDate}_to_${endDate}.csv`;
      // Header
      let header = ["Employee Name", "Employee ID"];
      (monthlyData.dates || []).forEach(d => header.push(d.day));
      header.push("Total (P)", "Total (A)", "Net Hrs");
      csvContent += header.join(",") + "\n";

      // Rows
      filteredMonthly.forEach(record => {
        let row = [`"${record.employeeName}"`, `"${record.employeeId}"`];
        record.days.forEach(d => {
          row.push(`"${d.status === '-' || d.status === 'W' ? d.rawStatus : d.status}"`);
        });
        row.push(
          `"${record.summary.present}"`,
          `"${record.summary.absent}"`,
          `"${record.summary.totalHoursStr}"`
        );
        csvContent += row.join(",") + "\n";
      });
    } else if (viewMode === 'details') {
      filename = `Details_Attendance_${startDate}_to_${endDate}.csv`;
      csvContent += "Employee Name,Employee ID,Date,Status,Punch In,Punch Out,Break Taken,Total Hours\n";
      filteredDetails.forEach(record => {
        const row = [
          `"${record.employeeName}"`,
          `"${record.employeeId}"`,
          `"${record.date}"`,
          `"${formatDisplayStatus(record.status)}"`,
          `"${record.punchIn || '--:--'}"`,
          `"${record.punchOut || '--:--'}"`,
          `"${record.breakTaken || '0m'}"`,
          `"${record.totalHours}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    }

    // Download Logic
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Daily View
  const renderDailyView = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6 animate-in fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-4 px-6">Employee</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Punch In</th>
              <th className="py-4 px-6">Punch Out</th>
              <th className="py-4 px-6">Total Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">Loading attendance...</td>
              </tr>
            ) : filteredDaily.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">No records found for {date}</td>
              </tr>
            ) : (
              dailyPagination.currentItems.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                        {record.employeeName?.charAt(0) || <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{record.employeeName}</div>
                        <div className="text-xs text-slate-500 font-mono">{record.employeeId || 'EMP-XX'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(record.status)}`}>
                      {formatDisplayStatus(record.status)}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-sm font-medium text-slate-700 font-mono">{record.punchIn || '--:--'}</td>
                  <td className="py-3 px-6 text-sm font-medium text-slate-700 font-mono">{record.punchOut || '--:--'}</td>
                  <td className="py-3 px-6 text-sm font-bold text-slate-900">{record.totalHours || '0h 0m'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination(dailyPagination)}
    </div>
  );

  // Render Monthly Grid View
  const renderMonthlyView = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6 animate-in fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-4 px-4 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[200px]">Employee</th>
              {(monthlyData.dates || []).map((d, i) => (
                <th key={i} className="py-4 px-2 text-center min-w-[32px]">{d.day}</th>
              ))}
              <th className="py-4 px-4 text-center border-l border-slate-200">Total (P)</th>
              <th className="py-4 px-4 text-center">Total (A)</th>
              <th className="py-4 px-4 text-center border-l border-slate-200">Net Hrs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={(monthlyData.dates?.length || 0) + 4} className="py-12 text-center text-slate-400 text-sm">Compiling grid...</td>
              </tr>
            ) : filteredMonthly.length === 0 ? (
              <tr>
                <td colSpan={(monthlyData.dates?.length || 0) + 4} className="py-12 text-center text-slate-400 text-sm">No records found</td>
              </tr>
            ) : (
              monthlyPagination.currentItems.map((record, index) => (
                <tr key={record.userId || index} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] transition-colors">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-900 truncate w-40" title={record.employeeName}>{record.employeeName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{record.employeeId}</span>
                    </div>
                  </td>
                  {record.days.map((dayData, dIndex) => (
                    <td key={dIndex} className="py-3 px-1 text-center">
                      <div 
                        className={`w-7 h-7 mx-auto rounded flex items-center justify-center text-[11px] cursor-help ${getGridStatusStyle(dayData.status)}`}
                        title={
                          dayData.status === '-' || dayData.status === 'W'
                            ? dayData.rawStatus
                            : `${dayData.date}\nStatus: ${dayData.rawStatus}\nIn: ${dayData.punchIn || '--'}\nOut: ${dayData.punchOut || '--'}\nHours: ${dayData.hours}h`
                        }
                      >
                        {dayData.status}
                      </div>
                    </td>
                  ))}
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 text-xs border-l border-slate-100">{record.summary.present}</td>
                  <td className="py-3 px-4 text-center font-bold text-rose-600 text-xs">{record.summary.absent}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800 text-xs font-mono border-l border-slate-100">{record.summary.totalHoursStr}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination(monthlyPagination)}
    </div>
  );

  // Render Details All View
  const renderDetailsView = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6 animate-in fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-4 px-6">Employee</th>
              <th className="py-4 px-6">Date</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Punch In</th>
              <th className="py-4 px-6">Punch Out</th>
              <th className="py-4 px-6">Break Taken</th>
              <th className="py-4 px-6">Net Hours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400 text-sm">Loading details...</td>
              </tr>
            ) : filteredDetails.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400 text-sm">No detailed records found for this range</td>
              </tr>
            ) : (
              detailsPagination.currentItems.map((record, index) => (
                <tr key={record.id || index} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{record.employeeName}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {record.employeeId} {record.department && record.department !== 'N/A' && `• ${record.department}`}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-sm font-medium text-slate-700 font-mono">{record.date}</td>
                  <td className="py-3 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(record.status)}`}>
                      {formatDisplayStatus(record.status)}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-sm font-medium text-slate-700 font-mono">{record.punchIn || '--:--'}</td>
                  <td className="py-3 px-6 text-sm font-medium text-slate-700 font-mono">{record.punchOut || '--:--'}</td>
                  <td className="py-3 px-6 text-sm font-medium text-amber-600 font-mono">{record.breakTaken || '0m'}</td>
                  <td className="py-3 px-6 text-sm font-bold text-slate-900">{record.totalHours}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination(detailsPagination)}
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor daily rosters and track custom attendance registers for all employees
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 rounded-2xl w-fit border border-slate-200">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'daily' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Daily Roster
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'monthly' ? 'bg-white text-[#8B1D2C] shadow-sm border border-rose-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <TableProperties className="w-4 h-4" />
            Master Grid
          </button>
          <button
            onClick={() => setViewMode('details')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'details' ? 'bg-white text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="w-4 h-4" />
            Details All
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
          {/* Employee Dropdown */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] appearance-none cursor-pointer w-full md:w-56 bg-slate-50"
            >
              <option value="">👤 All Staff</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeCode || `EMP-${emp.id.substring(0,4)}`})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker(s) */}
          {viewMode === 'daily' ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
              />
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>
              <span className="text-sm font-medium text-slate-400">to</span>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                />
              </div>
            </div>
          )}

          {(viewMode === 'daily' || viewMode === 'details') && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] appearance-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3 w-full xl:w-auto mt-4 xl:mt-0">
          {/* Search */}
          <div className="relative flex-1 xl:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 w-full focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
            />
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Grid Legend for Monthly View */}
      {viewMode === 'monthly' && (
        <div className="flex flex-wrap gap-4 items-center px-2 text-[11px] font-semibold text-slate-500">
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-100"></div> Present (P)</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-100"></div> Late (L)</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-rose-100"></div> Absent (A)</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-indigo-100"></div> Half Day (H)</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-100"></div> Weekend/Holiday (W)</span>
        </div>
      )}

      {/* Content */}
      {viewMode === 'daily' && renderDailyView()}
      {viewMode === 'monthly' && renderMonthlyView()}
      {viewMode === 'details' && renderDetailsView()}
    </div>
  );
};

export default HRStaffAttendance;
