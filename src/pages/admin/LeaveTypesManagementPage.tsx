import React, { useState, useEffect } from 'react';
import { leaveTypesApi } from '../../services/api';
import { LeaveType } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Plus, Edit2, Trash2, Award, FileText, CheckCircle2, XCircle } from 'lucide-react';

export const LeaveTypesManagementPage: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    annual_limit: 12,
    carry_forward_allowed: true,
    max_carry_forward: 5,
    document_required: false,
    minimum_days: 0.5,
    maximum_days: 30,
    color_code: '#3B82F6',
    is_paid: true,
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
      const res = await leaveTypesApi.getAll();
      if (res.data.success) {
        setLeaveTypes(res.data.data);
      }
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
      name: '',
      code: '',
      description: '',
      annual_limit: 12,
      carry_forward_allowed: true,
      max_carry_forward: 5,
      document_required: false,
      minimum_days: 0.5,
      maximum_days: 30,
      color_code: '#3B82F6',
      is_paid: true,
      status: 'ACTIVE',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lt: LeaveType) => {
    setIsEditMode(true);
    setCurrentId(lt.id);
    setFormData({
      name: lt.name,
      code: lt.code,
      description: lt.description || '',
      annual_limit: lt.annual_limit,
      carry_forward_allowed: lt.carry_forward_allowed,
      max_carry_forward: lt.max_carry_forward,
      document_required: lt.document_required,
      minimum_days: lt.minimum_days,
      maximum_days: lt.maximum_days,
      color_code: lt.color_code || '#3B82F6',
      is_paid: lt.is_paid,
      status: lt.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.code) {
      setFormError('Leave type name and code are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && currentId) {
        await leaveTypesApi.update(currentId, formData);
      } else {
        await leaveTypesApi.create(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save leave type');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await leaveTypesApi.delete(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete leave type');
    }
  };

  const columns: Column<LeaveType>[] = [
    {
      header: 'Leave Type',
      accessor: lt => (
        <div className="flex items-center space-x-2.5">
          <div
            className="w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-xs shadow-2xs"
            style={{ backgroundColor: lt.color_code }}
          >
            {lt.code}
          </div>
          <div>
            <p className="font-bold text-slate-900">{lt.name}</p>
            <p className="text-[10px] text-slate-400">{lt.description}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'name',
    },
    {
      header: 'Annual Limit',
      accessor: lt => <span className="font-bold text-blue-600">{lt.annual_limit} Days/Year</span>,
      sortable: true,
      sortKey: 'annual_limit',
    },
    {
      header: 'Carry Forward',
      accessor: lt => (
        <div>
          {lt.carry_forward_allowed ? (
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
              Allowed (Max {lt.max_carry_forward}d)
            </span>
          ) : (
            <span className="text-slate-400 text-[10px]">No</span>
          )}
        </div>
      ),
    },
    {
      header: 'Doc Required',
      accessor: lt => (
        <span>
          {lt.document_required ? (
            <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[10px] border border-rose-200">
              Required
            </span>
          ) : (
            <span className="text-slate-400 text-[10px]">Optional</span>
          )}
        </span>
      ),
    },
    {
      header: 'Paid / Unpaid',
      accessor: lt => (
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            lt.is_paid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {lt.is_paid ? 'PAID' : 'UNPAID'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: lt => (
        <div className="flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(lt)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteId(lt.id)}
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Types & Policies</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure annual quotas, carry-forward allowances, document requirements, and colors
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Leave Type</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={leaveTypes}
        isLoading={isLoading}
        searchPlaceholder="Search leave policies..."
        searchKey={lt => `${lt.name} ${lt.code} ${lt.description}`}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Leave Type' : 'Create Leave Type'}
        subtitle="Define policy rules, annual limit, and compliance constraints"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Annual Leave"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="e.g. AL"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Quota (Days)</label>
              <input
                type="number"
                min="0"
                value={formData.annual_limit}
                onChange={e => setFormData({ ...formData, annual_limit: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Days per Application</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.minimum_days}
                onChange={e => setFormData({ ...formData, minimum_days: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Days per Application</label>
              <input
                type="number"
                min="1"
                value={formData.maximum_days}
                onChange={e => setFormData({ ...formData, maximum_days: Number(e.target.value) })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Color Code Tag</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color_code}
                  onChange={e => setFormData({ ...formData, color_code: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={formData.color_code}
                  onChange={e => setFormData({ ...formData, color_code: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Compensation</label>
              <select
                value={formData.is_paid ? 'PAID' : 'UNPAID'}
                onChange={e => setFormData({ ...formData, is_paid: e.target.value === 'PAID' })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="PAID">Paid Leave</option>
                <option value="UNPAID">Unpaid (Loss of Pay)</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.carry_forward_allowed}
                onChange={e => setFormData({ ...formData, carry_forward_allowed: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-semibold text-slate-700">Allow Carry Forward</span>
            </label>

            <label className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.document_required}
                onChange={e => setFormData({ ...formData, document_required: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-semibold text-slate-700">Require Supporting Document</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Policy Details</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
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
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Leave Type' : 'Create Leave Type'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Leave Type"
        message="Are you sure you want to delete this leave type policy?"
        confirmText="Confirm Delete"
        type="danger"
      />
    </div>
  );
};
