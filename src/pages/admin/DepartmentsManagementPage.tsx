import React, { useState, useEffect } from 'react';
import { departmentsApi, employeesApi } from '../../services/api';
import { Department } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Plus, Edit2, Trash2, Building2, Users } from 'lucide-react';

export const DepartmentsManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    department_name: '',
    department_code: '',
    description: '',
    manager_id: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        departmentsApi.getAll(),
        employeesApi.getAll(),
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (empRes.data.success) setEmployees(empRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setFormData({
      department_name: '',
      department_code: '',
      description: '',
      manager_id: '',
      status: 'ACTIVE',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setIsEditMode(true);
    setCurrentId(dept.id);
    setFormData({
      department_name: dept.department_name,
      department_code: dept.department_code,
      description: dept.description || '',
      manager_id: dept.manager_id ? String(dept.manager_id) : '',
      status: dept.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.department_name || !formData.department_code) {
      setFormError('Department name and code are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        manager_id: formData.manager_id ? Number(formData.manager_id) : undefined,
      };

      if (isEditMode && currentId) {
        await departmentsApi.update(currentId, payload);
      } else {
        await departmentsApi.create(payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save department');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await departmentsApi.delete(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete department');
    }
  };

  const columns: Column<Department>[] = [
    {
      header: 'Department',
      accessor: d => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{d.department_name}</p>
            <p className="text-[10px] text-slate-400 font-mono">{d.department_code}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'department_name',
    },
    {
      header: 'Department Head / Manager',
      accessor: d => <span className="font-medium text-slate-800">{d.manager_name || 'Unassigned'}</span>,
    },
    {
      header: 'Employees',
      accessor: d => (
        <div className="flex items-center space-x-1 font-semibold text-slate-700">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>{d.employee_count || 0}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'employee_count',
    },
    {
      header: 'Description',
      accessor: d => <p className="text-slate-500 max-w-xs truncate">{d.description || '—'}</p>,
    },
    {
      header: 'Status',
      accessor: d => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            d.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {d.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: d => (
        <div className="flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(d)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteId(d.id)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure business units, assign department managers, and view headcounts
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Department</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={departments}
        isLoading={isLoading}
        searchPlaceholder="Search departments..."
        searchKey={d => `${d.department_name} ${d.department_code} ${d.manager_name}`}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Department' : 'Create Department'}
        subtitle="Manage department details and managerial assignment"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.department_name}
                onChange={e => setFormData({ ...formData, department_name: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Product Engineering"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code / Abbreviation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.department_code}
                onChange={e => setFormData({ ...formData, department_code: e.target.value.toUpperCase() })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="e.g. ENG"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department Head / Manager</label>
            <select
              value={formData.manager_id}
              onChange={e => setFormData({ ...formData, manager_id: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (Unassigned)</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.role}) - {e.department_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
              placeholder="Department purpose and scope..."
            />
          </div>

          {formError && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {formError}
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
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message="Are you sure you want to delete this department? Employees assigned to it must be reassigned first."
        confirmText="Confirm Delete"
        type="danger"
      />
    </div>
  );
};
