import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Building2,
  Briefcase,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

const roleColorMap = {
  'Super Admin': 'purple',
  'HR Manager': 'indigo',
  'Team Lead': 'blue',
  'Employee': 'teal',
  'Viewer': 'slate',
};

export const EmployeesPage = ({
  employees = [],
  departments = [],
  designations = [],
  roles = [],
  onOpenAddModal,
  onEditEmployee,
  onDeleteEmployee,
  onViewEmployee,
  searchQuery = '',
  setSearchQuery,
}) => {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedDesig, setSelectedDesig] = useState('ALL');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Filter designations based on selected department if any
  const availableDesignations = useMemo(() => {
    if (selectedDept === 'ALL') return designations;
    return designations.filter((d) => d.department === selectedDept);
  }, [selectedDept, designations]);

  // Combined filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search query filter (name, email, id, phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          emp.name.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.id.toLowerCase().includes(q) ||
          (emp.phone && emp.phone.includes(q)) ||
          emp.department.toLowerCase().includes(q) ||
          emp.designation.toLowerCase().includes(q) ||
          emp.role.toLowerCase().includes(q);

        if (!matchesQuery) return false;
      }

      // Department filter
      if (selectedDept !== 'ALL' && emp.department !== selectedDept) {
        return false;
      }

      // Designation filter
      if (selectedDesig !== 'ALL' && emp.designation !== selectedDesig) {
        return false;
      }

      // Role filter
      if (selectedRole !== 'ALL' && emp.role !== selectedRole) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && emp.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [employees, searchQuery, selectedDept, selectedDesig, selectedRole, selectedStatus]);

  const handleResetFilters = () => {
    setSelectedDept('ALL');
    setSelectedDesig('ALL');
    setSelectedRole('ALL');
    setSelectedStatus('ALL');
    if (setSearchQuery) setSearchQuery('');
  };

  const hasActiveFilters =
    selectedDept !== 'ALL' ||
    selectedDesig !== 'ALL' ||
    selectedRole !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    Boolean(searchQuery.trim());

  return (
    <div className="space-y-5">
      {/* Top Header & Fast Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Employee Directory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage staff profiles, department assignments, job designations, and access roles.
          </p>
        </div>

        <Button
          variant="primary"
          icon={UserPlus}
          onClick={onOpenAddModal}
          className="shadow-sm"
        >
          Add New Employee
        </Button>
      </div>

      {/* Filter Toolbar Card */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span>Filter Staff By:</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Department Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-500" /> Department
              </label>
              <div className="relative">
                <select
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setSelectedDesig('ALL');
                  }}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Departments ({departments.length})</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Designation Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-sky-500" /> Designation
              </label>
              <div className="relative">
                <select
                  value={selectedDesig}
                  onChange={(e) => setSelectedDesig(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Designations ({availableDesignations.length})</option>
                  {availableDesignations.map((desig) => (
                    <option key={desig.id} value={desig.title}>
                      {desig.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-500" /> System Role
              </label>
              <div className="relative">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Roles ({roles.length})</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Employment Status
              </label>
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">Total Staff</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
              {filteredEmployees.length} of {employees.length}
            </span>
          </div>

          {searchQuery && (
            <span className="text-xs text-slate-500">
              Matching query: <strong className="text-slate-800">"{searchQuery}"</strong>
            </span>
          )}
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No employees found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No staff members match the selected filters or search query. Try resetting your criteria or add a new employee.
            </p>
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Department</TableHeaderCell>
                <TableHeaderCell>Designation</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Joining Date</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((emp) => {
                const roleColor = roleColorMap[emp.role] || 'slate';

                return (
                  <TableRow key={emp.id}>
                    {/* Employee Info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                          alt={emp.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onViewEmployee(emp)}
                            className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left text-sm truncate block"
                          >
                            {emp.name}
                          </button>
                          <div className="text-xs text-slate-500 truncate">{emp.email}</div>
                          <span className="text-[10px] font-mono text-slate-400">{emp.id}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Department */}
                    <TableCell>
                      <span className="font-semibold text-slate-800 text-xs sm:text-sm block">
                        {emp.department}
                      </span>
                    </TableCell>

                    {/* Designation */}
                    <TableCell>
                      <span className="text-slate-600 text-xs sm:text-sm block">
                        {emp.designation}
                      </span>
                    </TableCell>

                    {/* Role */}
                    <TableCell>
                      <Badge variant={roleColor}>{emp.role}</Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={
                          emp.status === 'Active'
                            ? 'green'
                            : emp.status === 'On Leave'
                            ? 'amber'
                            : 'slate'
                        }
                        dot
                      >
                        {emp.status}
                      </Badge>
                    </TableCell>

                    {/* Joining Date */}
                    <TableCell>
                      <span className="text-xs text-slate-500 font-mono">
                        {emp.joiningDate || '2023-01-01'}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onViewEmployee(emp)}
                          title="View Profile"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditEmployee(emp)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteEmployee(emp.id)}
                          title="Delete Employee"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default EmployeesPage;
