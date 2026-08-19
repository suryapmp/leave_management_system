import React, { useState, useEffect } from 'react';
import { leaveBalancesApi, employeesApi } from '../../services/api';
import { DataTable, Column } from '../../components/common/DataTable';
import { BalanceAdjustmentModal } from '../../components/leave/BalanceAdjustmentModal';
import { Sliders, RefreshCw, Plus, Users, Award } from 'lucide-react';

export const LeaveBalancesManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustTargetEmp, setAdjustTargetEmp] = useState<any>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmpId) {
      loadEmployeeBalances(selectedEmpId);
    }
  }, [selectedEmpId, year]);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await employeesApi.getAll();
      if (res.data.success) {
        setEmployees(res.data.data);
        if (res.data.data.length > 0 && !selectedEmpId) {
          setSelectedEmpId(res.data.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployeeBalances = async (empId: number) => {
    try {
      const res = await leaveBalancesApi.getByEmployee(empId, { year });
      if (res.data.success) {
        setBalances(res.data.data.balances);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedEmployeeObj = employees.find(e => e.id === selectedEmpId);

  const columns: Column<any>[] = [
    {
      header: 'Leave Type',
      accessor: b => (
        <div className="flex items-center space-x-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: b.color_code || '#3B82F6' }}
          />
          <span className="font-bold text-slate-900">{b.leave_type_name}</span>
        </div>
      ),
    },
    {
      header: 'Annual Allocated',
      accessor: b => <span className="font-bold text-slate-800">{b.allocated}d</span>,
    },
    {
      header: 'Carried Forward',
      accessor: b => <span className="font-medium text-emerald-600">+{b.carried_forward}d</span>,
    },
    {
      header: 'Used',
      accessor: b => <span className="font-medium text-slate-600">{b.used}d</span>,
    },
    {
      header: 'Pending Approval',
      accessor: b => <span className="font-medium text-amber-600">{b.pending}d</span>,
    },
    {
      header: 'Available Remaining',
      accessor: b => (
        <span className="font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">
          {b.remaining} Days
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: b => (
        <button
          onClick={() => {
            setAdjustTargetEmp({
              employee_id: selectedEmpId,
              leave_type_id: b.leave_type_id,
            });
            setIsAdjustOpen(true);
          }}
          className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center space-x-1"
        >
          <Sliders className="w-3 h-3" />
          <span>Adjust</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Quota Adjustments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manually allocate quotas, grant additional compensatory leaves, or adjust balances
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-xs text-slate-800"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setAdjustTargetEmp({ employee_id: selectedEmpId });
              setIsAdjustOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Make Adjustment</span>
          </button>
        </div>
      </div>

      {/* Main layout: Employee Selector on Left, Balances on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Employee List */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs lg:col-span-1 h-[600px] flex flex-col">
          <div className="flex items-center space-x-2 pb-3 mb-2 border-b border-slate-100">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Employee</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmpId(emp.id)}
                className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center space-x-2.5 text-xs ${
                  selectedEmpId === emp.id
                    ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  {emp.name.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="truncate">{emp.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{emp.department_name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Balances Grid */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs lg:col-span-3 space-y-4">
          {selectedEmployeeObj && (
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedEmployeeObj.name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedEmployeeObj.employee_code} • {selectedEmployeeObj.department_name} •{' '}
                  {selectedEmployeeObj.designation_title}
                </p>
              </div>
              <button
                onClick={() => loadEmployeeBalances(selectedEmployeeObj.id)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          <DataTable
            columns={columns}
            data={balances}
            isLoading={false}
            emptyMessage="No leave balances configured for this employee in this year."
          />
        </div>
      </div>

      <BalanceAdjustmentModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        initialEmployeeId={adjustTargetEmp?.employee_id}
        initialLeaveTypeId={adjustTargetEmp?.leave_type_id}
        onSuccess={() => {
          if (selectedEmpId) loadEmployeeBalances(selectedEmpId);
        }}
      />
    </div>
  );
};
