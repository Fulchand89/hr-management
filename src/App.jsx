import React, { useState } from 'react';
import EmployeeApp from './pages/employee/EmployeeApp';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeesPage from './pages/admin/EmployeesPage';
import OrganizationPage from './pages/admin/OrganizationPage';
import DesignationsPage from './pages/admin/DesignationsPage';
import RolesPermissionsPage from './pages/admin/RolesPermissionsPage';
import EmployeeFormModal from './components/admin/EmployeeFormModal';
import EmployeeProfileModal from './components/admin/EmployeeProfileModal';
import {
  initialEmployees,
  initialDepartments,
  initialDesignations,
  initialRoles,
} from './services/mockData';
import { CheckCircle2, AlertCircle, Smartphone, LayoutDashboard } from 'lucide-react';

export function App() {
  // App Mode: 'employee' (Default for the user images) or 'admin'
  const [appMode, setAppMode] = useState('employee');

  // Admin State
  const [activeTab, setActiveTab] = useState('dashboard');
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
    setActiveTab('employees');
  };

  const handleViewDesignationEmployees = (desigTitle) => {
    setSearchQuery(desigTitle);
    setActiveTab('employees');
  };

  const handleViewRoleEmployees = (roleName) => {
    setSearchQuery(roleName);
    setActiveTab('employees');
  };

  // If in Employee App Mode, render the Employee App!
  if (appMode === 'employee') {
    return <EmployeeApp onSwitchToAdmin={() => setAppMode('admin')} />;
  }

  // Otherwise render Admin Portal
  return (
    <div className="relative">
      {/* Top Bar to switch back to Employee App */}
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800">
        <span className="font-semibold text-slate-300">
          WorkPulse HRMS &bull; Enterprise Console
        </span>
        <button
          type="button"
          onClick={() => setAppMode('employee')}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#8B1D2C] hover:bg-[#731724] text-white font-semibold transition-colors cursor-pointer"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Switch to Employee Portal &rarr;
        </button>
      </div>

      <AdminLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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

        {/* Dynamic View by Tab */}
        {activeTab === 'dashboard' && (
          <AdminDashboard
            employees={employees}
            departments={departments}
            designations={designations}
            roles={roles}
            onNavigateTab={setActiveTab}
            onOpenAddEmployee={() => {
              setEmployeeToEdit(null);
              setIsEmployeeModalOpen(true);
            }}
            onSelectEmployee={(emp) => setViewingEmployee(emp)}
          />
        )}

        {activeTab === 'employees' && (
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
        )}

        {activeTab === 'departments' && (
          <OrganizationPage
            departments={departments}
            employees={employees}
            onAddDepartment={handleAddDepartment}
            onViewDepartmentEmployees={handleViewDepartmentEmployees}
          />
        )}

        {activeTab === 'designations' && (
          <DesignationsPage
            designations={designations}
            departments={departments}
            employees={employees}
            onAddDesignation={handleAddDesignation}
            onViewDesignationEmployees={handleViewDesignationEmployees}
          />
        )}

        {activeTab === 'roles' && (
          <RolesPermissionsPage
            roles={roles}
            employees={employees}
            onAddRole={handleAddRole}
            onViewRoleEmployees={handleViewRoleEmployees}
          />
        )}

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
  );
}

export default App;
