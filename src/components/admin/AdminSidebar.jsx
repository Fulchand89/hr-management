import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Clock,
  CalendarDays,
  DollarSign,
  Laptop,
  FileText,
  Terminal,
  Settings,
  Megaphone,
  X
} from 'lucide-react';

export const AdminSidebar = ({
  employeeCount = 0,
  departmentCount = 0,
  designationCount = 0,
  roleCount = 0,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'dashboard';

  const menuItems = [
    {
      id: 'dashboard',
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Analytics & Overview'
    },
    {
      id: 'employees',
      path: '/admin/employees',
      label: 'Employees',
      icon: Users,
      badge: employeeCount,
      badgeColor: 'bg-indigo-100 text-indigo-700',
      description: 'Staff Directory & Records'
    },
    {
      id: 'departments',
      path: '/admin/departments',
      label: 'Departments',
      icon: Building2,
      badge: departmentCount,
      badgeColor: 'bg-purple-100 text-purple-700',
      description: 'Organizational Units'
    },
    {
      id: 'designations',
      path: '/admin/designations',
      label: 'Designations',
      icon: Briefcase,
      badge: designationCount,
      badgeColor: 'bg-sky-100 text-sky-700',
      description: 'Job Titles & Grades'
    },
    {
      id: 'roles',
      path: '/admin/roles',
      label: 'Roles & Access',
      icon: ShieldCheck,
      badge: roleCount,
      badgeColor: 'bg-emerald-100 text-emerald-700',
      description: 'Security & Permissions'
    },
    {
      id: 'attendance',
      path: '/admin/attendance',
      label: 'Attendance',
      icon: Clock,
      badge: null,
      description: 'Daily Roster & Timesheets'
    },
    {
      id: 'leaves',
      path: '/admin/leaves',
      label: 'Leave Management',
      icon: CalendarDays,
      badge: null,
      description: 'Time-Off & Approvals'
    },
    {
      id: 'payroll',
      path: '/admin/payroll',
      label: 'Payroll',
      icon: DollarSign,
      badge: null,
      description: 'Salaries & Payslips'
    },
    {
      id: 'assets',
      path: '/admin/assets',
      label: 'Company Assets',
      icon: Laptop,
      badge: null,
      description: 'Hardware Inventory'
    },
    {
      id: 'documents',
      path: '/admin/documents',
      label: 'Documents',
      icon: FileText,
      badge: null,
      description: 'Employee Doc Vault'
    },
    {
      id: 'announcements',
      path: '/admin/announcements',
      label: 'Announcements',
      icon: Megaphone,
      badge: null,
      description: 'Broadcasts & Alerts'
    },
    {
      id: 'activity-logs',
      path: '/admin/activity-logs',
      label: 'Audit Logs',
      icon: Terminal,
      badge: null,
      description: 'Security & System Trace'
    },
    {
      id: 'settings',
      path: '/admin/settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
      description: 'System Preferences'
    }
  ];

  const handleSelect = (item) => {
    navigate(item.path);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto flex-1 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shadow-indigo-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-1.5">
                  WorkPulse <span className="text-xs px-1.5 py-0.5 font-semibold bg-indigo-50 text-indigo-600 rounded-md">HR</span>
                </span>
                <span className="text-[11px] text-slate-400 block -mt-0.5">Admin Management</span>
              </div>
            </div>

            {setMobileOpen && (
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Notice */}
          <div className="px-4 py-2.5 mx-4 my-3 bg-indigo-50/70 border border-indigo-100/80 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-semibold text-indigo-900">HR Portal Online</p>
            </div>
            <p className="text-[11px] text-indigo-600/80 mt-0.5">Route-based Enterprise Console</p>
          </div>

          {/* Nav List */}
          <div className="px-3 py-1 space-y-0.5 pb-4">
            <div className="px-3 pb-1.5 pt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Administration
            </div>

            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'
                      }`}
                    />
                    <div className="text-left">
                      <div className="leading-tight font-semibold">{item.label}</div>
                      <div
                        className={`text-[10px] ${
                          isActive ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight
                      className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isActive ? 'opacity-100 text-indigo-200' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120"
              alt="Admin"
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">Sarah Connor</p>
              <div className="flex items-center gap-1 mt-0.5">
                <UserCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-[11px] text-slate-500 font-medium truncate">HR Administrator</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
