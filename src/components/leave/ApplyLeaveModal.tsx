import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { leavesApi, leaveTypesApi, employeesApi, leaveBalancesApi } from '../../services/api';
import { LeaveType, CalculationPreview, SessionType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Calendar, UploadCloud, AlertCircle, CheckCircle2, FileText, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, canManageEmployees } = useAuth();
  const { fetchNotifications } = useNotifications();

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | string>(user?.employee?.id || '');
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<number | string>('');
  
  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [startSession, setStartSession] = useState<SessionType>('FULL_DAY');
  const [endSession, setEndSession] = useState<SessionType>('FULL_DAY');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Balances
  const [balances, setBalances] = useState<any[]>([]);

  // Real-time calculation preview state
  const [preview, setPreview] = useState<CalculationPreview | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch leave types and employee list
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [ltRes, empRes] = await Promise.all([
        leaveTypesApi.getAll({ status: 'ACTIVE' }),
        canManageEmployees ? employeesApi.getAll({ status: 'ACTIVE' }) : Promise.resolve({ data: { data: [] } }),
      ]);

      if (ltRes.data.success) {
        setLeaveTypes(ltRes.data.data);
        if (ltRes.data.data.length > 0 && !selectedLeaveTypeId) {
          setSelectedLeaveTypeId(ltRes.data.data[0].id);
        }
      }

      if (empRes.data.data) {
        setEmployees(empRes.data.data);
      }

      const activeEmpId = canManageEmployees && selectedEmployeeId ? Number(selectedEmployeeId) : user?.employee?.id;
      if (activeEmpId) {
        const balRes = await leaveBalancesApi.getByEmployee(activeEmpId);
        if (balRes.data.success) {
          setBalances(balRes.data.data.balances);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // When employee or leave type changes, reload balance
  useEffect(() => {
    const empId = canManageEmployees && selectedEmployeeId ? Number(selectedEmployeeId) : user?.employee?.id;
    if (empId) {
      leaveBalancesApi.getByEmployee(empId).then(res => {
        if (res.data.success) {
          setBalances(res.data.data.balances);
        }
      });
    }
  }, [selectedEmployeeId, canManageEmployees, user]);

  // Recalculate preview on any change
  useEffect(() => {
    if (!startDate || !endDate) return;

    const empId = canManageEmployees && selectedEmployeeId ? Number(selectedEmployeeId) : user?.employee?.id;
    const ltId = selectedLeaveTypeId ? Number(selectedLeaveTypeId) : undefined;

    setIsCalculating(true);
    setErrorMsg('');

    leavesApi
      .calculateDays({
        employee_id: empId,
        leave_type_id: ltId,
        start_date: startDate,
        end_date: endDate,
        start_session: startSession,
        end_session: endSession,
      })
      .then(res => {
        if (res.data.success) {
          setPreview(res.data.data);
        }
      })
      .catch(err => {
        setPreview(null);
        setErrorMsg(err?.response?.data?.message || 'Failed to calculate leave days');
      })
      .finally(() => {
        setIsCalculating(false);
      });
  }, [startDate, endDate, startSession, endSession, selectedLeaveTypeId, selectedEmployeeId]);

  const selectedLeaveType = leaveTypes.find(t => t.id === Number(selectedLeaveTypeId));
  const currentBalance = balances.find(b => b.leave_type_id === Number(selectedLeaveTypeId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!startDate || !endDate) {
      setErrorMsg('Please select start and end dates.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please provide a reason for taking leave.');
      return;
    }
    if (selectedLeaveType?.document_required && !file) {
      setErrorMsg(`Supporting document is required for ${selectedLeaveType.name}.`);
      return;
    }

    if (preview && !preview.valid) {
      setErrorMsg(preview.errors.join(' '));
      return;
    }

    if (preview?.policy_validation && !preview.policy_validation.allowed) {
      setErrorMsg(preview.policy_validation.warnings.join(' '));
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (canManageEmployees && selectedEmployeeId) {
        formData.append('employee_id', String(selectedEmployeeId));
      }
      formData.append('leave_type_id', String(selectedLeaveTypeId));
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
      formData.append('start_session', startSession);
      formData.append('end_session', endSession);
      formData.append('reason', reason);
      if (file) {
        formData.append('documentFile', file);
      }

      const res = await leavesApi.apply(formData);
      if (res.data.success) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
        fetchNotifications();
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply for Leave" subtitle="Submit a new time-off request with instant policy check" maxWidth="3xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Admin/HR Employee Picker */}
        {canManageEmployees && employees.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Applying on Behalf of Employee</label>
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_code}) – {emp.department_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Leave Type Selector with Balances */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Leave Type <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {leaveTypes.map(lt => {
              const isSelected = String(lt.id) === String(selectedLeaveTypeId);
              const bal = balances.find(b => b.leave_type_id === lt.id);
              const remaining = bal ? bal.remaining : lt.annual_limit;

              return (
                <div
                  key={lt.id}
                  onClick={() => setSelectedLeaveTypeId(lt.id)}
                  className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">{lt.name}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: lt.color_code || '#3B82F6' }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px]">
                    <span className="text-slate-500">Available:</span>
                    <span className="font-bold text-slate-800">{remaining} days</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Pickers and Sessions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Start Session</label>
              <select
                value={startSession}
                onChange={e => setStartSession(e.target.value as SessionType)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="FIRST_HALF">First Half (Morning 0.5)</option>
                <option value="SECOND_HALF">Second Half (Afternoon 0.5)</option>
              </select>
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              End Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">End Session</label>
              <select
                value={endSession}
                onChange={e => setEndSession(e.target.value as SessionType)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="FIRST_HALF">First Half (Morning 0.5)</option>
                <option value="SECOND_HALF">Second Half (Afternoon 0.5)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Calculation Engine Breakdown Box */}
        {preview && (
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">Leave Duration Summary</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Calculated Deductible Days: </span>
                <span className="text-sm font-extrabold text-blue-600 ml-1">
                  {preview.total_leave_days} day(s)
                </span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-500 font-medium">Calendar Span</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{preview.calendar_days} days</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-500 font-medium">Available Balance</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">
                  {preview.balance_info ? `${preview.balance_info.available} days` : 'N/A'}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-500 font-medium">Balance After Approval</p>
                <p
                  className={`text-sm font-bold mt-0.5 ${
                    (preview.balance_info?.remaining_after || 0) < 0 ? 'text-rose-600' : 'text-slate-800'
                  }`}
                >
                  {preview.balance_info ? `${preview.balance_info.remaining_after} days` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Day by Day Inspection Pill List */}
            {preview.breakdown && preview.breakdown.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] font-semibold text-slate-600 mb-1.5">Date Breakdown:</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {preview.breakdown.map((b, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                        b.is_weekend
                          ? 'bg-slate-100 text-slate-500 border-slate-200 line-through'
                          : b.is_holiday
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {b.date} ({b.day_of_week.slice(0, 3)}) :{' '}
                      {b.is_weekend ? 'Weekend' : b.is_holiday ? b.holiday_name || 'Holiday' : `${b.day_count}d`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings or Policy Errors */}
            {preview.policy_validation && !preview.policy_validation.allowed && (
              <div className="flex items-start space-x-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>{preview.policy_validation.warnings.join(' ')}</div>
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Leave <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Please detail the reason for your time-off request..."
            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Supporting Document {selectedLeaveType?.document_required && <span className="text-rose-500">* (Required)</span>}
          </label>
          <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/40 relative">
            <input
              type="file"
              onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            />
            <div className="flex flex-col items-center">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-1.5" />
              {file ? (
                <div className="flex items-center space-x-1.5 text-xs text-blue-600 font-semibold">
                  <FileText className="w-4 h-4" />
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <>
                  <p className="text-xs font-medium text-slate-700">Click or drag & drop file here</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PDF, DOC, PNG, JPG up to 10MB</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isCalculating || (preview?.policy_validation && !preview.policy_validation.allowed)}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors flex items-center space-x-1.5"
          >
            {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            <span>Submit Leave Request</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
