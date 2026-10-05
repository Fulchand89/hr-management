import React from 'react';
import { Menu, Search, Bell, Plus, Sparkles } from 'lucide-react';
import Button from '../common/Button';

export const AdminNavbar = ({
  searchQuery,
  setSearchQuery,
  onOpenAddEmployee,
  setMobileOpen,
  activeTabTitle = 'HR Admin Portal'
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left section: mobile menu toggle + Title / Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-base font-bold text-slate-900 leading-tight">{activeTabTitle}</h1>
          <p className="text-xs text-slate-500">Human Resource Operations & Directory</p>
        </div>
      </div>

      {/* Middle: Quick Search */}
      <div className="flex-1 max-w-md mx-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, designation, department..."
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
        </button>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onOpenAddEmployee}
          className="rounded-xl shadow-xs"
        >
          <span className="hidden sm:inline">Add Employee</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
};

export default AdminNavbar;
