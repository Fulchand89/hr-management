import React from 'react';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Mail, Phone, MapPin, Calendar, Building2, Briefcase, ShieldCheck, Edit3, Trash2 } from 'lucide-react';

const roleColorMap = {
  'Super Admin': 'purple',
  'HR Manager': 'indigo',
  'Team Lead': 'blue',
  'Employee': 'teal',
  'Viewer': 'slate',
};

export const EmployeeProfileModal = ({
  isOpen,
  onClose,
  employee,
  onEdit,
  onDelete,
}) => {
  if (!employee) return null;

  const roleColor = roleColorMap[employee.role] || 'slate';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Profile"
      subtitle={`ID: ${employee.id}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <img
            src={employee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
            alt={employee.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/20"
          />
          <div>
            <h4 className="text-lg font-bold text-slate-900">{employee.name}</h4>
            <p className="text-sm font-medium text-slate-500">{employee.designation}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={roleColor}>{employee.role}</Badge>
              <Badge
                variant={
                  employee.status === 'Active'
                    ? 'green'
                    : employee.status === 'On Leave'
                    ? 'amber'
                    : 'slate'
                }
                dot
              >
                {employee.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 divide-y divide-slate-200/60">
          <div className="pb-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Department</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                {employee.department}
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Designation</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-1">
                <Briefcase className="w-3.5 h-3.5 text-sky-500" />
                {employee.designation}
              </div>
            </div>
          </div>

          <div className="py-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 font-medium block">Role Privilege</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                {employee.role}
              </div>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Joining Date</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {employee.joiningDate || '2023-01-01'}
              </div>
            </div>
          </div>

          <div className="pt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{employee.email}</span>
            </div>
            {employee.phone && (
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{employee.phone}</span>
              </div>
            )}
            {employee.location && (
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{employee.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => {
              onDelete(employee.id);
              onClose();
            }}
          >
            Delete
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Edit3}
              onClick={() => {
                onEdit(employee);
                onClose();
              }}
            >
              Edit Employee
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeProfileModal;
