import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Building2,
  Users,
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/common/Table';

export const DesignationsPage = ({
  designations = [],
  departments = [],
  employees = [],
  onAddDesignation,
  onViewDesignationEmployees,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDept, setFilterDept] = useState('ALL');
  const [desigForm, setDesigForm] = useState({
    title: '',
    department: departments[0]?.name || '',
    level: 'Level 3 - Mid',
  });

  const filteredDesignations = designations.filter(
    (d) => filterDept === 'ALL' || d.department === filterDept
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!desigForm.title.trim()) return;

    onAddDesignation({
      id: `desig-${Date.now()}`,
      title: desigForm.title.trim(),
      department: desigForm.department,
      level: desigForm.level,
      count: 0,
    });

    setDesigForm({
      title: '',
      department: departments[0]?.name || '',
      level: 'Level 3 - Mid',
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Designations Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure job designations, career levels, and departmental alignments.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="shadow-sm"
        >
          Add Designation
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 uppercase">Filter by Department:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterDept('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterDept === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({designations.length})
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => setFilterDept(dept.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                filterDept === dept.name
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Designation Title</TableHeaderCell>
              <TableHeaderCell>Associated Department</TableHeaderCell>
              <TableHeaderCell>Seniority Level</TableHeaderCell>
              <TableHeaderCell>Active Staff Count</TableHeaderCell>
              <TableHeaderCell className="text-right">Action</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {filteredDesignations.map((desig) => {
              const staffCount = employees.filter((e) => e.designation === desig.title).length;

              return (
                <TableRow key={desig.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{desig.title}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium text-slate-700 text-xs sm:text-sm">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      {desig.department}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="blue">{desig.level}</Badge>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {staffCount} Employees
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => onViewDesignationEmployees(desig.title)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                    >
                      View Staff &rarr;
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Add Designation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Designation"
        subtitle="Define a job role/title and associate it with a department"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Job Designation Title"
            placeholder="e.g. Senior Backend Engineer"
            required
            value={desigForm.title}
            onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })}
          />

          <Select
            label="Department"
            required
            value={desigForm.department}
            onChange={(e) => setDesigForm({ ...desigForm, department: e.target.value })}
            options={departments.map((d) => ({ value: d.name, label: d.name }))}
          />

          <Select
            label="Seniority / Grade Level"
            value={desigForm.level}
            onChange={(e) => setDesigForm({ ...desigForm, level: e.target.value })}
            options={[
              { value: 'Level 1 - Junior / Trainee', label: 'Level 1 - Junior / Trainee' },
              { value: 'Level 2 - Mid / Associate', label: 'Level 2 - Mid / Associate' },
              { value: 'Level 3 - Mid-Senior', label: 'Level 3 - Mid-Senior' },
              { value: 'Level 4 - Senior', label: 'Level 4 - Senior' },
              { value: 'Level 5 - Lead / Principal', label: 'Level 5 - Lead / Principal' },
              { value: 'Level 6 - Director / VP', label: 'Level 6 - Director / VP' },
            ]}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Designation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DesignationsPage;
