import React, { useState, useEffect } from 'react';
import { employeesApi, departmentsApi } from '../../services/api';
import { EmployeeListItem, Department, UserRole } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { RoleBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportUtils } from '../../components/export/ExportUtils';
import {
  Plus,
  Edit2,
  KeyRound,
  FileSpreadsheet,
  Mail,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const EmployeesManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEmpId, setCurrentEmpId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as UserRole,
    department_id: '',
    designation_title: '',
    manager_id: '',
    joining_date: new Date().toISOString().split('T')[0],
    employment_type: 'FULL_TIME',
    phone: '',
    gender: 'MALE',
    address: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password Dialog
  const [resetEmpId, setResetEmpId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        employeesApi.getAll(),
        departmentsApi.getAll(),
      ]);
      if (empRes.data.success) setEmployees(empRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setCurrentEmpId(null);
    setFormData({
      name: '',
      email: '',
      password: 'password123',
      role: 'EMPLOYEE',
      department_id: departments[0] ? String(departments[0].id) : '',
      designation_title: 'Software Engineer',
      manager_id: '',
      joining_date: new Date().toISOString().split('T')[0],
      employment_type: 'FULL_TIME',
      phone: '',
      gender: 'MALE',
      address: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: EmployeeListItem) => {
    setIsEditMode(true);
    setCurrentEmpId(emp.id);
    setFormData({
      name: emp.name,
      email: emp.email,
      password: '',
      role: emp.role,
      department_id: String(emp.department_id),
      designation_title: emp.designation_title,
      manager_id: emp.manager_id ? String(emp.manager_id) : '',
      joining_date: emp.joining_date,
      employment_type: emp.employment_type || 'FULL_TIME',
      phone: emp.phone || '',
      gender: emp.gender || 'MALE',
      address: emp.address || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.email || !formData.department_id) {
      setFormError('Name, Email, and Department are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && currentEmpId) {
        await employeesApi.update(currentEmpId, formData);
      } else {
        await employeesApi.create(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmpId) return;
    await employeesApi.resetPassword(resetEmpId);
    setResetEmpId(null);
    alert('Password reset successfully to: password123');
  };

  const filteredEmployees = employees.filter(e => {
    if (deptFilter !== 'ALL' && String(e.department_id) !== deptFilter) return false;
    if (roleFilter !== 'ALL' && e.role !== roleFilter) return false;
    return true;
  });

  const columns: Column<EmployeeListItem>[] = [
    {
      header: 'Employee',
      accessor: e => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {e.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900">{e.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">{e.employee_code}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'name',
    },
    {
      header: 'Department / Title',
      accessor: e => (
        <div>
          <p className="font-semibold text-slate-800">{e.department_name}</p>
          <p className="text-[10px] text-slate-400">{e.designation_title}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: e => <RoleBadge role={e.role} />,
    },
    {
      header: 'Reporting Manager',
      accessor: e => <span className="text-slate-600 font-medium">{e.manager_name || '—'}</span>,
    },
    {
      header: 'Contact Info',
      accessor: e => (
        <div className="text-[11px] text-slate-600 space-y-0.5">
          <p>{e.email}</p>
          {e.phone && <p className="text-slate-400">{e.phone}</p>}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: e => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            e.user_status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {e.user_status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: e => (
        <div className="flex items-center space-x-1.5" onClick={ev => ev.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(e)}
            title="Edit Employee"
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setResetEmpId(e.id)}
            title="Reset Password"
            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-100 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const handleExportCSV = () => {
    const rows = filteredEmployees.map(e => ({
      Employee_Code: e.employee_code,
      Name: e.name,
      Email: e.email,
      Role: e.role,
      Department: e.department_name,
      Designation: e.designation_title,
      Manager: e.manager_name,
      Status: e.user_status,
      Joining_Date: e.joining_date,
    }));
    ExportUtils.exportToCSV('employee_directory', rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employees Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization employees, roles, departments, and credentials
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
        >
          <option value="ALL">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>
              {d.department_name}
            </option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
        >
          <option value="ALL">All System Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="HR">HR Manager</option>
          <option value="MANAGER">Manager</option>
          <option value="EMPLOYEE">Employee</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredEmployees}
        isLoading={isLoading}
        searchPlaceholder="Search by name, code, email, or designation..."
        searchKey={e => `${e.name} ${e.employee_code} ${e.email} ${e.department_name} ${e.designation_title}`}
      />

      {/* Create / Edit Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Employee Profile' : 'Add New Employee'}
        subtitle="Manage employee attributes, system role, and reporting manager"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="jane.doe@company.com"
              />
            </div>
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="HR">HR Manager</option>
                <option value="ADMIN">System Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.department_id}
                onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.department_name} ({d.department_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title / Designation</label>
              <input
                type="text"
                value={formData.designation_title}
                onChange={e => setFormData({ ...formData, designation_title: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Senior Software Engineer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reporting Manager</label>
              <select
                value={formData.manager_id}
                onChange={e => setFormData({ ...formData, manager_id: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Top Level / Self)</option>
                {employees
                  .filter(e => e.id !== currentEmpId)
                  .map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.role})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+1 555-0199"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joining_date}
                onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {formError && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center space-x-1"
            >
              {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <span>{isEditMode ? 'Update Employee' : 'Create Employee'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Dialog */}
      <ConfirmDialog
        isOpen={!!resetEmpId}
        onClose={() => setResetEmpId(null)}
        onConfirm={handleResetPassword}
        title="Reset Employee Password"
        message="Are you sure you want to reset this employee's password to the system default ('password123')?"
        confirmText="Confirm Password Reset"
        type="warning"
      />
    </div>
  );
};
