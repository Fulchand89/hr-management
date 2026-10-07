import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

export const OrganizationPage = ({
  departments = [],
  employees = [],
  onAddDepartment,
  onViewDepartmentEmployees,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    head: '',
    budget: '$200,000',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;

    onAddDepartment({
      id: `dept-${Date.now()}`,
      name: deptForm.name.trim(),
      code: deptForm.code.trim().toUpperCase() || deptForm.name.slice(0, 3).toUpperCase(),
      head: deptForm.head.trim() || 'Unassigned',
      employeeCount: 0,
      budget: deptForm.budget || '$150,000',
      color: 'indigo',
    });

    setDeptForm({ name: '', code: '', head: '', budget: '$200,000' });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Departments Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Organize teams, assign department heads, and monitor departmental headcount allocations.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="shadow-sm"
        >
          Add Department
        </Button>
      </div>

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => {
          // Calculate dynamic live count of employees in this department
          const actualCount = employees.filter((e) => e.department === dept.name).length;

          return (
            <Card key={dept.id} hover className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg ring-1 ring-indigo-100">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <Badge variant="indigo" className="font-mono">
                    {dept.code || dept.name.slice(0, 3).toUpperCase()}
                  </Badge>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-bold text-slate-900">{dept.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    Head: <span className="font-medium text-slate-700">{dept.head || 'Unassigned'}</span>
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-400 block font-medium">Headcount</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      {actualCount} Members
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-slate-400 block font-medium">Annual Budget</span>
                    <span className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      {dept.budget || '$200,000'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onViewDepartmentEmployees(dept.name)}
                  className="w-full py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  View Staff in {dept.name}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Department"
        subtitle="Create an organizational business division for assigning employees and designations"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Department Name"
            placeholder="e.g. Operations & Logistics"
            required
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
          />

          <Input
            label="Department Code"
            placeholder="e.g. OPS"
            value={deptForm.code}
            onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
            helperText="Short 3-4 letter code for identification"
          />

          <Input
            label="Department Head"
            placeholder="e.g. Michael Scott"
            value={deptForm.head}
            onChange={(e) => setDeptForm({ ...deptForm, head: e.target.value })}
          />

          <Input
            label="Budget Allocation"
            placeholder="e.g. $250,000"
            value={deptForm.budget}
            onChange={(e) => setDeptForm({ ...deptForm, budget: e.target.value })}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default OrganizationPage;
