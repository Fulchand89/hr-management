import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { User, Mail, Phone, Calendar, MapPin, Building2, Briefcase, ShieldCheck } from 'lucide-react';

export const EmployeeFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  employeeToEdit = null,
  departments = [],
  designations = [],
  roles = [],
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    role: 'Employee',
    status: 'Active',
    joiningDate: new Date().toISOString().split('T')[0],
    location: 'Bangalore, IN',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employeeToEdit) {
      setFormData({
        name: employeeToEdit.name || '',
        email: employeeToEdit.email || '',
        phone: employeeToEdit.phone || '',
        department: employeeToEdit.department || '',
        designation: employeeToEdit.designation || '',
        role: employeeToEdit.role || 'Employee',
        status: employeeToEdit.status || 'Active',
        joiningDate: employeeToEdit.joiningDate || new Date().toISOString().split('T')[0],
        location: employeeToEdit.location || 'Bangalore, IN',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: departments[0]?.name || '',
        designation: designations[0]?.title || '',
        role: 'Employee',
        status: 'Active',
        joiningDate: new Date().toISOString().split('T')[0],
        location: 'Bangalore, IN',
      });
    }
    setErrors({});
  }, [employeeToEdit, isOpen, departments, designations]);

  // Filter designations matching the chosen department if any, otherwise all
  const filteredDesignations = designations.filter(
    (d) => !formData.department || d.department === formData.department
  );

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // When department changes, if current designation isn't in new department, auto-select first matching
      if (field === 'department') {
        const matches = designations.filter((d) => d.department === value);
        if (matches.length > 0 && !matches.some((m) => m.title === prev.designation)) {
          updated.designation = matches[0].title;
        }
      }
      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';
    if (!formData.role) newErrors.role = 'Role is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      ...formData,
      id: employeeToEdit?.id,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? 'Edit Employee Details' : 'Add New Employee'}
      subtitle="Fill in the employee information, department, designation, and system role"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Verma"
            icon={User}
            required
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
          />
          <Input
            label="Work Email"
            type="email"
            placeholder="rahul.v@workpulse.io"
            icon={Mail}
            required
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
          />
        </div>

        {/* Row 2: Phone & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
            icon={Phone}
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
          <Input
            label="Work Location"
            placeholder="e.g. Bangalore, IN"
            icon={MapPin}
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>

        {/* Row 3: Department & Designation (Core User Fields) */}
        <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-4">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Organizational Placement
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Department"
              required
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              options={departments.map((d) => ({ value: d.name, label: d.name }))}
              error={errors.department}
            />

            <Select
              label="Designation"
              required
              value={formData.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              options={(filteredDesignations.length > 0 ? filteredDesignations : designations).map((d) => ({
                value: d.title,
                label: d.title,
              }))}
              error={errors.designation}
              helperText={formData.department ? `Showing titles in ${formData.department}` : ''}
            />
          </div>
        </div>

        {/* Row 4: Role & Status (Core User Fields) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="System Role"
            required
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value)}
            options={roles.map((r) => ({ value: r.name, label: r.name }))}
            error={errors.role}
          />

          <Select
            label="Employment Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'On Leave', label: 'On Leave' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />

          <Input
            label="Joining Date"
            type="date"
            icon={Calendar}
            value={formData.joiningDate}
            onChange={(e) => handleChange('joiningDate', e.target.value)}
          />
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {employeeToEdit ? 'Save Changes' : 'Create Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeFormModal;
