import React, { useState, useEffect } from 'react';
import { holidaysApi } from '../../services/api';
import { Holiday, HolidayType } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { HolidayTypeBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Plus, Edit2, Trash2, CalendarDays, Calendar } from 'lucide-react';

export const HolidayManagementPage: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    holiday_name: '',
    holiday_date: '',
    description: '',
    holiday_type: 'MANDATORY' as HolidayType,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [year]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await holidaysApi.getAll({ year });
      if (res.data.success) {
        setHolidays(res.data.data);
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
      holiday_name: '',
      holiday_date: new Date().toISOString().split('T')[0],
      description: '',
      holiday_type: 'MANDATORY',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: Holiday) => {
    setIsEditMode(true);
    setCurrentId(h.id);
    setFormData({
      holiday_name: h.holiday_name,
      holiday_date: h.holiday_date,
      description: h.description || '',
      holiday_type: h.holiday_type,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.holiday_name || !formData.holiday_date) {
      setFormError('Holiday name and date are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && currentId) {
        await holidaysApi.update(currentId, formData);
      } else {
        await holidaysApi.create(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save holiday');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await holidaysApi.delete(deleteId);
      setDeleteId(null);
      loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete holiday');
    }
  };

  const columns: Column<Holiday>[] = [
    {
      header: 'Holiday Name',
      accessor: h => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-900">{h.holiday_name}</p>
            <p className="text-[10px] text-slate-400">{h.description || 'Public Holiday'}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'holiday_name',
    },
    {
      header: 'Date',
      accessor: h => {
        const dateObj = new Date(h.holiday_date);
        const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        return (
          <div>
            <p className="font-bold text-slate-800">{h.holiday_date}</p>
            <p className="text-[10px] text-slate-400">{dayOfWeek}</p>
          </div>
        );
      },
      sortable: true,
      sortKey: 'holiday_date',
    },
    {
      header: 'Type',
      accessor: h => <HolidayTypeBadge type={h.holiday_type} />,
    },
    {
      header: 'Actions',
      accessor: h => (
        <div className="flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(h)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteId(h.id)}
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Public Holidays Schedule</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure organization non-working days that will be excluded from leave balance deductions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-slate-600">Year:</span>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Holiday</span>
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={holidays}
        isLoading={isLoading}
        searchPlaceholder="Search holiday by name..."
        searchKey={h => `${h.holiday_name} ${h.holiday_date} ${h.description}`}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Holiday' : 'Add Holiday'}
        subtitle="Public holidays are automatically excluded from leave deductions"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Holiday Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.holiday_name}
              onChange={e => setFormData({ ...formData, holiday_name: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Independence Day"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.holiday_date}
                onChange={e => setFormData({ ...formData, holiday_date: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
              <select
                value={formData.holiday_type}
                onChange={e => setFormData({ ...formData, holiday_type: e.target.value as HolidayType })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="MANDATORY">Mandatory / Gazetted</option>
                <option value="OPTIONAL">Optional / Restricted</option>
                <option value="REGIONAL">Regional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
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
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Holiday' : 'Create Holiday'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Holiday"
        message="Are you sure you want to remove this public holiday from the calendar?"
        confirmText="Confirm Delete"
        type="danger"
      />
    </div>
  );
};
