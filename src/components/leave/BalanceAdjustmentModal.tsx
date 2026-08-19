import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { leaveBalancesApi, leaveTypesApi, employeesApi } from '../../services/api';
import { LeaveType } from '../../types';
import { PlusCircle, MinusCircle, SlidersHorizontal, AlertCircle } from 'lucide-react';

interface BalanceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId?: number;
  onSuccess?: () => void;
}

export const BalanceAdjustmentModal: React.FC<BalanceAdjustmentModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  onSuccess,
}) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<number | string>(employeeId || '');
  const [selectedLtId, setSelectedLtId] = useState<number | string>('');
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'DEDUCT' | 'OVERRIDE'>('ADD');
  const [amount, setAmount] = useState<number | string>(1);
  const [reason, setReason] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (employeeId) setSelectedEmpId(employeeId);
      loadData();
    }
  }, [isOpen, employeeId]);

  const loadData = async () => {
    try {
      const [empRes, ltRes] = await Promise.all([
        employeesApi.getAll({ status: 'ACTIVE' }),
        leaveTypesApi.getAll({ status: 'ACTIVE' }),
      ]);
      if (empRes.data.data) {
        setEmployees(empRes.data.data);
        if (!selectedEmpId && empRes.data.data.length > 0) {
          setSelectedEmpId(empRes.data.data[0].id);
        }
      }
      if (ltRes.data.data) {
        setLeaveTypes(ltRes.data.data);
        if (!selectedLtId && ltRes.data.data.length > 0) {
          setSelectedLtId(ltRes.data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedEmpId || !selectedLtId || amount === '' || !reason.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await leaveBalancesApi.adjust({
        employee_id: Number(selectedEmpId),
        leave_type_id: Number(selectedLtId),
        adjustment_type: adjustmentType,
        amount: Number(amount),
        reason,
        year: Number(year),
      });

      if (res.data.success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to adjust balance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Leave Balance" subtitle="Manually credit, deduct, or override employee quota with audit logging" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Employee */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Employee <span className="text-rose-500">*</span>
          </label>
          <select
            value={selectedEmpId}
            onChange={e => setSelectedEmpId(e.target.value)}
            disabled={!!employeeId}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.employee_code}) - {emp.department_name}
              </option>
            ))}
          </select>
        </div>

        {/* Leave Type & Year */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Leave Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedLtId}
              onChange={e => setSelectedLtId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              {leaveTypes.map(lt => (
                <option key={lt.id} value={lt.id}>
                  {lt.name} ({lt.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Adjustment Type Segmented */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Adjustment Action</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAdjustmentType('ADD')}
              className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
                adjustmentType === 'ADD'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Credit (Add)</span>
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('DEDUCT')}
              className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
                adjustmentType === 'DEDUCT'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MinusCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Deduct</span>
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('OVERRIDE')}
              className={`p-2 rounded-lg text-xs font-medium border flex items-center justify-center space-x-1.5 transition-colors ${
                adjustmentType === 'OVERRIDE'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Set Total</span>
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Days Amount <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 2 or 0.5"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason / Remarks <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Provide justification for this balance adjustment..."
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {errorMsg && (
          <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center space-x-1"
          >
            {isSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            <span>Save Adjustment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
