import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';

export const AdminLayout = ({
  children,
  employeeCount,
  departmentCount,
  designationCount,
  roleCount,
  searchQuery,
  setSearchQuery,
  onOpenAddEmployee,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentTab = location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || 'dashboard';

  const tabTitles = {
    dashboard: 'HR Admin Dashboard',
    employees: 'Employee Staff Directory',
    departments: 'Departments Management',
    designations: 'Designations & Job Titles',
    roles: 'Roles & Access Control',
    attendance: 'Daily Attendance Roster',
    leaves: 'Leave & Time-Off Management',
    payroll: 'Payroll & Compensation',
    assets: 'Company Hardware Assets',
    documents: 'Document Vault',
    announcements: 'Company Announcements',
    'activity-logs': 'Security Audit Trail',
    settings: 'Enterprise Settings'
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AdminSidebar
        employeeCount={employeeCount}
        departmentCount={departmentCount}
        designationCount={designationCount}
        roleCount={roleCount}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <AdminNavbar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddEmployee={onOpenAddEmployee}
          setMobileOpen={setMobileOpen}
          activeTabTitle={tabTitles[currentTab] || 'HR Management'}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 bg-white py-4 px-6 text-center text-xs text-slate-400">
          WorkPulse HRMS &bull; Enterprise Human Resources Administration Panel
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
