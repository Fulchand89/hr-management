import React from 'react';
import {
  Users,
  Building2,
  Briefcase,
  ShieldCheck,
  UserPlus,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export const AdminDashboard = ({
  employees = [],
  departments = [],
  designations = [],
  roles = [],
  onNavigateTab,
  onOpenAddEmployee,
  onSelectEmployee,
}) => {
  const activeEmployees = employees.filter((e) => e.status === 'Active').length;
  const onLeaveEmployees = employees.filter((e) => e.status === 'On Leave').length;

  // Department distribution
  const departmentStats = departments.map((dept) => {
    const count = employees.filter((e) => e.department === dept.name).length;
    const percentage = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0;
    return {
      ...dept,
      count,
      percentage,
    };
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-700 via-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-lg shadow-indigo-500/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              HR Portal v2.0 - Active Workspace
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, HR Administrator
            </h2>
            <p className="text-sm text-indigo-100/90 leading-relaxed">
              Manage your complete organizational structure, staff directory, departmental allocations,
              designations, and system privileges from one simple console.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              icon={Building2}
              onClick={() => onNavigateTab('departments')}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 shadow-none"
            >
              View Departments
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={UserPlus}
              onClick={onOpenAddEmployee}
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold"
            >
              Add New Employee
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Total Employees"
          value={employees.length}
          subtext={`${activeEmployees} Active • ${onLeaveEmployees} On Leave`}
          icon={Users}
          color="indigo"
          trend="+12%"
          trendType="positive"
          onClick={() => onNavigateTab('employees')}
        />
        <StatCard
          title="Departments"
          value={departments.length}
          subtext="Active business divisions"
          icon={Building2}
          color="purple"
          trend="+2"
          trendType="positive"
          onClick={() => onNavigateTab('departments')}
        />
        <StatCard
          title="Designations"
          value={designations.length}
          subtext="Job positions defined"
          icon={Briefcase}
          color="blue"
          trend="Balanced"
          trendType="neutral"
          onClick={() => onNavigateTab('designations')}
        />
        <StatCard
          title="Access Roles"
          value={roles.length}
          subtext="Configured permission tiers"
          icon={ShieldCheck}
          color="emerald"
          trend="Secure"
          trendType="positive"
          onClick={() => onNavigateTab('roles')}
        />
      </div>

      {/* Grid: Department Distribution + Recent Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Breakdown (1 col) */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="Department Allocation"
            subtitle="Staff distribution by department"
            action={
              <button
                type="button"
                onClick={() => onNavigateTab('departments')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                Manage <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <CardBody className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{dept.name}</span>
                  <span className="text-slate-500 font-medium">
                    {dept.count} members ({dept.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(dept.percentage, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Recent Employees List (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Staff Members"
            subtitle="Recently joined or updated employees"
            action={
              <button
                type="button"
                onClick={() => onNavigateTab('employees')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                View Directory <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Employee</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.slice(0, 5).map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                          alt={emp.name}
                          className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{emp.name}</div>
                          <div className="text-[11px] text-slate-400">{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">{emp.department}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{emp.designation}</td>
                    <td className="py-3 px-4 text-xs">
                      <Badge
                        variant={
                          emp.role === 'Super Admin'
                            ? 'purple'
                            : emp.role === 'HR Manager'
                            ? 'indigo'
                            : emp.role === 'Team Lead'
                            ? 'blue'
                            : 'teal'
                        }
                      >
                        {emp.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
