import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Employee Portal
import EmployeeApp from './pages/employee/EmployeeApp';
import SignInView from './pages/employee/SignInView';

// HR Portal
import HRApp from './pages/hr/HRApp';
import HRSignInView from './pages/hr/HRSignInView';

// Admin Portal Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeesPage from './pages/admin/EmployeesPage';
import OrganizationPage from './pages/admin/OrganizationPage';
import DesignationsPage from './pages/admin/DesignationsPage';
import RolesPermissionsPage from './pages/admin/RolesPermissionsPage';
import AttendancePage from './pages/admin/AttendancePage';
import LeaveManagementPage from './pages/admin/LeaveManagementPage';
import PayrollPage from './pages/admin/PayrollPage';
import CompanyAssetsPage from './pages/admin/CompanyAssetsPage';
import DocumentsPage from './pages/admin/DocumentsPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import ActivityLogsPage from './pages/admin/ActivityLogsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Admin Modals
import EmployeeFormModal from './components/admin/EmployeeFormModal';
import EmployeeProfileModal from './components/admin/EmployeeProfileModal';

// Initial Mock Data
import {
  initialEmployees,
  initialDepartments,
  initialDesignations,
  initialRoles,
} from './services/mockData';

import { CheckCircle2, AlertCircle, LayoutDashboard, LogOut } from 'lucide-react';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAuth } from './context/AuthContext';

// Dynamic Security Top Bar (Shows switcher and role badge only to authorized users)
function PortalTopBar({ portalTitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isHR = user.role === 'hr' || isAdmin;

  return (
    <div className="bg-slate-900 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-300">
          WorkPulse HRMS &bull; {portalTitle}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-indigo-300">
          Role: {user.role}
        </span>
        <span className="text-slate-400 text-[11px] hidden md:inline">
          ({user.email || user.firstName})
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Only HR & Admin can see HR Portal button */}
        {isHR && !location.pathname.startsWith('/hr') && (
          <button
            type="button"
            onClick={() => navigate('/hr/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-800 hover:bg-rose-900 text-white font-semibold transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            HR Portal &rarr;
          </button>
        )}

        {/* ONLY Super Admin can see Switch to Admin Portal button */}
        {isAdmin && !location.pathname.startsWith('/admin') && (
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Admin Portal &rarr;
          </button>
        )}

        {/* Switch to Employee Portal (for testing / self-service) */}
        {!location.pathname.startsWith('/employee') && (
          <button
            type="button"
            onClick={() => navigate('/employee/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white font-semibold transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Employee Portal &rarr;
          </button>
        )}

        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/signin');
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 font-semibold transition-colors cursor-pointer ml-1"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Admin Data State
  const [employees, setEmployees] = useState(initialEmployees);
  const [departments, setDepartments] = useState(initialDepartments);
  const [designations, setDesignations] = useState(initialDesignations);
  const [roles, setRoles] = useState(initialRoles);

  // Search & Navigation Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);

  // Toast Notification state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Add / Edit Employee Handler
  const handleSaveEmployee = (empData) => {
    if (empData.id) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === empData.id ? { ...e, ...empData } : e))
      );
      showToast(`Updated details for "${empData.name}"`);
    } else {
      const newEmployee = {
        ...empData,
        id: `EMP-${1000 + employees.length + 1}`,
        avatar: `https://images.unsplash.com/photo-${1530000000000 + (employees.length * 12345)}?auto=format&fit=crop&q=80&w=250`,
      };
      setEmployees((prev) => [newEmployee, ...prev]);
      showToast(`New employee "${newEmployee.name}" successfully added!`);
    }
  };

  // Delete Employee Handler
  const handleDeleteEmployee = (id) => {
    const target = employees.find((e) => e.id === id);
    if (!target) return;

    if (window.confirm(`Are you sure you want to remove "${target.name}" from employee records?`)) {
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      showToast(`Employee "${target.name}" removed from records.`, 'info');
    }
  };

  // Add Department Handler
  const handleAddDepartment = (newDept) => {
    setDepartments((prev) => [...prev, newDept]);
    showToast(`Department "${newDept.name}" created!`);
  };

  // Add Designation Handler
  const handleAddDesignation = (newDesig) => {
    setDesignations((prev) => [...prev, newDesig]);
    showToast(`Designation "${newDesig.title}" created!`);
  };

  // Add Role Handler
  const handleAddRole = (newRole) => {
    setRoles((prev) => [...prev, newRole]);
    showToast(`Role "${newRole.name}" created!`);
  };

  // Fast Navigation Handlers from cards to filtered employee list
  const handleViewDepartmentEmployees = (deptName) => {
    setSearchQuery(deptName);
    navigate('/admin/employees');
  };

  const handleViewDesignationEmployees = (desigTitle) => {
    setSearchQuery(desigTitle);
    navigate('/admin/employees');
  };

  const handleViewRoleEmployees = (roleName) => {
    setSearchQuery(roleName);
    navigate('/admin/employees');
  };

  return (
    <div className="relative min-h-screen">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl bg-slate-900 text-white text-xs sm:text-sm font-medium animate-bounce-in border border-slate-700">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <Routes>
        {/* Root Redirect to Employee Dashboard */}
        <Route path="/" element={<Navigate to="/employee/dashboard" replace />} />

        {/* Standalone Authentication */}
        <Route path="/signin" element={<SignInView />} />

        {/* ========================================== */}
        {/* EMPLOYEE PORTAL DEDICATED ROUTES          */}
        {/* ========================================== */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee']}>
              <div>
                <PortalTopBar portalTitle="Employee Self-Service Portal" />
                <EmployeeApp onSwitchToAdmin={() => navigate('/admin/dashboard')} />
              </div>
            </ProtectedRoute>
          }
        />

        {/* ========================================== */}
        {/* ADMIN PORTAL DEDICATED ROUTES             */}
        {/* ========================================== */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <div>
                <PortalTopBar portalTitle="Enterprise Console (Admin)" />
                <AdminLayout
                employeeCount={employees.length}
                departmentCount={departments.length}
                designationCount={designations.length}
                roleCount={roles.length}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onOpenAddEmployee={() => {
                  setEmployeeToEdit(null);
                  setIsEmployeeModalOpen(true);
                }}
              >
                <Routes>
                  <Route index element={<Navigate to="dashboard" replace />} />

                  {/* 1. Dashboard */}
                  <Route
                    path="dashboard"
                    element={
                      <AdminDashboard
                        employees={employees}
                        departments={departments}
                        designations={designations}
                        roles={roles}
                        onNavigateTab={(tab) => navigate(`/admin/${tab}`)}
                        onOpenAddEmployee={() => {
                          setEmployeeToEdit(null);
                          setIsEmployeeModalOpen(true);
                        }}
                        onSelectEmployee={(emp) => setViewingEmployee(emp)}
                      />
                    }
                  />

                  {/* 2. Employees */}
                  <Route
                    path="employees"
                    element={
                      <EmployeesPage
                        employees={employees}
                        departments={departments}
                        designations={designations}
                        roles={roles}
                        onOpenAddModal={() => {
                          setEmployeeToEdit(null);
                          setIsEmployeeModalOpen(true);
                        }}
                        onEditEmployee={(emp) => {
                          setEmployeeToEdit(emp);
                          setIsEmployeeModalOpen(true);
                        }}
                        onDeleteEmployee={handleDeleteEmployee}
                        onViewEmployee={(emp) => setViewingEmployee(emp)}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                      />
                    }
                  />

                  {/* 3. Departments */}
                  <Route
                    path="departments"
                    element={
                      <OrganizationPage
                        departments={departments}
                        employees={employees}
                        onAddDepartment={handleAddDepartment}
                        onViewDepartmentEmployees={handleViewDepartmentEmployees}
                      />
                    }
                  />

                  {/* 4. Designations */}
                  <Route
                    path="designations"
                    element={
                      <DesignationsPage
                        designations={designations}
                        departments={departments}
                        employees={employees}
                        onAddDesignation={handleAddDesignation}
                        onViewDesignationEmployees={handleViewDesignationEmployees}
                      />
                    }
                  />

                  {/* 5. Roles & Access */}
                  <Route
                    path="roles"
                    element={
                      <RolesPermissionsPage
                        roles={roles}
                        employees={employees}
                        onAddRole={handleAddRole}
                        onViewRoleEmployees={handleViewRoleEmployees}
                      />
                    }
                  />

                  {/* 6. Attendance */}
                  <Route path="attendance" element={<AttendancePage />} />

                  {/* 7. Leaves */}
                  <Route path="leaves" element={<LeaveManagementPage />} />

                  {/* 8. Payroll */}
                  <Route path="payroll" element={<PayrollPage />} />

                  {/* 9. Company Assets */}
                  <Route path="assets" element={<CompanyAssetsPage />} />

                  {/* 10. Documents */}
                  <Route path="documents" element={<DocumentsPage />} />

                  {/* 11. Announcements */}
                  <Route path="announcements" element={<AnnouncementsPage />} />

                  {/* 12. Audit Logs */}
                  <Route path="activity-logs" element={<ActivityLogsPage />} />

                  {/* 13. Settings */}
                  <Route path="settings" element={<AdminSettingsPage />} />

                  {/* Catch-all admin fallback */}
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>

                {/* Add / Edit Employee Form Modal */}
                <EmployeeFormModal
                  isOpen={isEmployeeModalOpen}
                  onClose={() => {
                    setIsEmployeeModalOpen(false);
                    setEmployeeToEdit(null);
                  }}
                  onSubmit={handleSaveEmployee}
                  employeeToEdit={employeeToEdit}
                  departments={departments}
                  designations={designations}
                  roles={roles}
                />

                {/* View Employee Profile Details Modal */}
                <EmployeeProfileModal
                  isOpen={Boolean(viewingEmployee)}
                  onClose={() => setViewingEmployee(null)}
                  employee={viewingEmployee}
                  onEdit={(emp) => {
                    setViewingEmployee(null);
                    setEmployeeToEdit(emp);
                    setIsEmployeeModalOpen(true);
                  }}
                  onDelete={(id) => {
                    setViewingEmployee(null);
                    handleDeleteEmployee(id);
                  }}
                />
              </AdminLayout>
            </div>
          </ProtectedRoute>
        }
      />

      {/* ========================================== */}
      {/* HR PORTAL DEDICATED ROUTES                 */}
      {/* ========================================== */}
      <Route path="/hr/signin" element={<Navigate to="/signin" replace />} />
      <Route
        path="/hr/*"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <HRApp />
          </ProtectedRoute>
        }
      />

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
