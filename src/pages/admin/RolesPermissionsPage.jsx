import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Users,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

export const RolesPermissionsPage = ({
  roles = [],
  employees = [],
  onAddRole,
  onViewRoleEmployees,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: 'Manage Employees, View Reports',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return;

    onAddRole({
      id: `role-${Date.now()}`,
      name: roleForm.name.trim(),
      badgeColor: 'indigo',
      description: roleForm.description || 'Custom administrative access role',
      permissions: roleForm.permissions.split(',').map((p) => p.trim()),
      usersCount: 0,
    });

    setRoleForm({ name: '', description: '', permissions: 'Manage Employees, View Reports' });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Role & Access Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure system authorization levels, access scopes, and assigned employee privileges.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="shadow-sm"
        >
          Add Custom Role
        </Button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role) => {
          const actualCount = employees.filter((e) => e.role === role.name).length;

          return (
            <Card key={role.id} hover className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center ring-1 ring-purple-100">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <Badge variant={role.badgeColor || 'indigo'}>
                    {role.name}
                  </Badge>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {role.description}
                  </p>
                </div>

                {/* Assigned Count */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Assigned Staff</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    {actualCount} Active Users
                  </span>
                </div>

                {/* Permissions Tags */}
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Granted Privileges
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((perm, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onViewRoleEmployees(role.name)}
                  className="w-full py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  View Staff with {role.name} Role
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New System Role"
        subtitle="Define a permission tier to assign to staff members"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Role Title"
            placeholder="e.g. Payroll Auditor"
            required
            value={roleForm.name}
            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
          />

          <Input
            label="Role Description"
            placeholder="Brief explanation of duties & scope"
            value={roleForm.description}
            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
          />

          <Input
            label="Permissions (Comma separated)"
            placeholder="e.g. View Reports, Approve Expenses, Audit Payroll"
            value={roleForm.permissions}
            onChange={(e) => setRoleForm({ ...roleForm, permissions: e.target.value })}
            helperText="Separate multiple permissions with commas"
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Role
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RolesPermissionsPage;
