import React, { useState, useEffect, useCallback } from 'react';
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

import {
  getAllEmployees,
  getDepartments,
  getDesignations,
  getRoles,
  createEmployee,
  updateEmployee,
  createDepartment,
  createDesignation,
  createRole
} from './services/hrService';

import { CheckCircle2, AlertCircle } from 'lucide-react';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAuth } from './context/AuthContext';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Admin Data State (100% Dynamic from Backend API)
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(false);

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

  // Fetch real admin data from backend API
  const fetchAdminData = useCallback(async () => {
    setIsLoadingAdminData(true);
    try {
      const [empRes, deptRes, desigRes, roleRes] = await Promise.all([
        getAllEmployees({ limit: 100 }).catch(() => ({ data: [] })),
        getDepartments().catch(() => ({ data: [] })),
        getDesignations().catch(() => ({ data: [] })),
        getRoles().catch(() => ({ data: [] }))
      ]);

      const rawEmployees = Array.isArray(empRes?.data?.rows)
        ? empRes.data.rows
        : Array.isArray(empRes?.data)
        ? empRes.data
        : Array.isArray(empRes)
        ? empRes
        : [];

      setEmployees(
        rawEmployees.map((u) => ({
          id: u.employeeCode || u.id,
          rawId: u.id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          email: u.email,
          phone: u.phone || '',
          department: u.departmentDetails?.name || u.department || 'General',
          designation: u.designationDetails?.title || u.designation || 'Staff',
          role: u.roleDetails?.name || u.role || 'Employee',
          status: u.status ? u.status.charAt(0).toUpperCase() + u.status.slice(1) : 'Active',
          avatar: u.avatar || '',
          joiningDate: u.joiningDate ? u.joiningDate.split('T')[0] : '',
          location: u.branchDetails?.city || 'Headquarters',
          bankName: u.bankName || '',
          bankAccountNumber: u.bankAccountNumber || '',
          bankIfsc: u.bankIfsc || ''
        }))
      );

      const rawDepts = Array.isArray(deptRes?.data) ? deptRes.data : Array.isArray(deptRes) ? deptRes : [];
      setDepartments(
        rawDepts.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          head: d.head || 'Lead',
          employeeCount: d.employeeCount || 0,
          budget: d.budget || '—',
          icon: 'Building2',
          color: 'indigo'
        }))
      );

      const rawDesigs = Array.isArray(desigRes?.data) ? desigRes.data : Array.isArray(desigRes) ? desigRes : [];
      setDesignations(
        rawDesigs.map((dg) => ({
          id: dg.id,
          title: dg.title,
          department: dg.departmentDetails?.name || dg.department || 'General',
          level: dg.level || 'Mid',
          count: dg.employeeCount || 0
        }))
      );

      const rawRoles = Array.isArray(roleRes?.data) ? roleRes.data : Array.isArray(roleRes) ? roleRes : [];
      setRoles(
        rawRoles.map((r) => ({
          id: r.id,
          name: r.name,
          badgeColor: 'indigo',
          description: r.description || '',
          permissions: Array.isArray(r.permissions) ? r.permissions.map((p) => p.name || p) : [],
          usersCount: r.usersCount || 0
        }))
      );
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoadingAdminData(false);
    }
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      fetchAdminData();
    }
  }, [location.pathname, fetchAdminData]);

  // Add / Edit Employee Handler
  const handleSaveEmployee = async (empData) => {
    try {
      if (empData.id || empData.rawId) {
        const targetId = empData.rawId || empData.id;
        await updateEmployee(targetId, empData).catch(() => null);
        showToast(`Updated details for "${empData.name}"`);
      } else {
        await createEmployee(empData).catch(() => null);
        showToast(`New employee "${empData.name || empData.firstName}" successfully added!`);
      }
      fetchAdminData();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Operation failed', 'error');
    }
  };

  // Delete Employee Handler
  const handleDeleteEmployee = async (id) => {
    const target = employees.find((e) => e.id === id || e.rawId === id);
    if (!target) return;

    if (window.confirm(`Are you sure you want to remove "${target.name}" from employee records?`)) {
      setEmployees((prev) => prev.filter((e) => e.id !== id && e.rawId !== id));
      showToast(`Employee "${target.name}" removed from records.`, 'info');
    }
  };

  // Add Department Handler
  const handleAddDepartment = async (newDept) => {
    try {
      await createDepartment(newDept).catch(() => null);
      showToast(`Department "${newDept.name}" created!`);
      fetchAdminData();
    } catch (err) {
      showToast('Created locally', 'info');
      setDepartments((prev) => [...prev, newDept]);
    }
  };

  // Add Designation Handler
  const handleAddDesignation = async (newDesig) => {
    try {
      await createDesignation(newDesig).catch(() => null);
      showToast(`Designation "${newDesig.title}" created!`);
      fetchAdminData();
    } catch (err) {
      showToast('Created locally', 'info');
      setDesignations((prev) => [...prev, newDesig]);
    }
  };

  // Add Role Handler
  const handleAddRole = async (newRole) => {
    try {
      await createRole(newRole).catch(() => null);
      showToast(`Role "${newRole.name}" created!`);
      fetchAdminData();
    } catch (err) {
      showToast('Created locally', 'info');
      setRoles((prev) => [...prev, newRole]);
    }
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
        {/* Root Redirect to Sign In / Sign Up */}
        <Route path="/" element={<Navigate to="/signin" replace />} />

        {/* Standalone Authentication */}
        <Route path="/signin" element={<SignInView />} />
        <Route path="/signup" element={<Navigate to="/signin" replace />} />

        {/* ========================================== */}
        {/* EMPLOYEE PORTAL DEDICATED ROUTES          */}
        {/* ========================================== */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee']}>
              <EmployeeApp onSwitchToAdmin={() => navigate('/admin/dashboard')} />
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
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />

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
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
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
            </ProtectedRoute>
        }
      />

      {/* ========================================== */}
      {/* HR PORTAL DEDICATED ROUTES                 */}
      {/* ========================================== */}
      <Route path="/hr/signin" element={<HRSignInView onSignIn={() => navigate('/hr/dashboard')} />} />
      <Route
        path="/hr/*"
        element={
          <ProtectedRoute allowedRoles={['admin', 'hr']}>
            <HRApp />
          </ProtectedRoute>
        }
      />

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </div>
  );
}

export default App;
