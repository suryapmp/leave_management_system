import React, { useState, useEffect } from 'react';
import { reportsApi, departmentsApi } from '../../services/api';
import { Department } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { ExportUtils } from '../../components/export/ExportUtils';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Building2,
  Users,
  PieChart as PieIcon,
  Download,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'DEPARTMENT' | 'MONTHLY'>('EMPLOYEE');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Report datasets
  const [empReport, setEmpReport] = useState<any[]>([]);
  const [deptReport, setDeptReport] = useState<any[]>([]);
  const [monthlyReport, setMonthlyReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [year, selectedDept]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, empRepRes, deptRepRes, monthRepRes] = await Promise.all([
        departmentsApi.getAll(),
        reportsApi.getEmployeeReport({
          year,
          departmentId: selectedDept !== 'ALL' ? Number(selectedDept) : undefined,
        }),
        reportsApi.getDepartmentReport({ year }),
        reportsApi.getMonthlyReport({
          year,
          departmentId: selectedDept !== 'ALL' ? Number(selectedDept) : undefined,
        }),
      ]);

      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (empRepRes.data.success) setEmpReport(empRepRes.data.data);
      if (deptRepRes.data.success) setDeptReport(deptRepRes.data.data);
      if (monthRepRes.data.success) setMonthlyReport(monthRepRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (activeTab === 'EMPLOYEE') {
      const rows = empReport.map(r => ({
        Employee_Code: r.employee_code,
        Name: r.name,
        Department: r.department_name,
        Total_Allocated_Days: r.total_allocated,
        Used_Days: r.total_used,
        Remaining_Days: r.total_remaining,
        Pending_Days: r.total_pending,
      }));
      ExportUtils.exportToCSV(`employee_leave_report_${year}`, rows);
    } else if (activeTab === 'DEPARTMENT') {
      const rows = deptReport.map(r => ({
        Department_Name: r.department_name,
        Department_Code: r.department_code,
        Employee_Count: r.employee_count,
        Total_Leave_Days_Taken: r.total_leave_days,
        Total_Requests: r.total_requests,
      }));
      ExportUtils.exportToCSV(`department_leave_report_${year}`, rows);
    } else {
      const rows = monthlyReport.map(r => ({
        Month: r.month_name,
        Approved_Leave_Days: r.approved_days,
        Pending_Leave_Days: r.pending_days,
        Total_Requests: r.total_requests,
      }));
      ExportUtils.exportToCSV(`monthly_leave_trends_${year}`, rows);
    }
  };

  const employeeColumns: Column<any>[] = [
    {
      header: 'Employee',
      accessor: r => (
        <div>
          <p className="font-bold text-slate-900">{r.name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{r.employee_code}</p>
        </div>
      ),
      sortable: true,
      sortKey: 'name',
    },
    {
      header: 'Department',
      accessor: r => <span className="font-semibold text-slate-700">{r.department_name}</span>,
      sortable: true,
      sortKey: 'department_name',
    },
    {
      header: 'Allocated',
      accessor: r => <span className="font-bold text-slate-800">{r.total_allocated}d</span>,
      sortable: true,
      sortKey: 'total_allocated',
    },
    {
      header: 'Used',
      accessor: r => <span className="font-semibold text-rose-600">{r.total_used}d</span>,
      sortable: true,
      sortKey: 'total_used',
    },
    {
      header: 'Pending',
      accessor: r => <span className="font-semibold text-amber-600">{r.total_pending}d</span>,
      sortable: true,
      sortKey: 'total_pending',
    },
    {
      header: 'Remaining Balance',
      accessor: r => (
        <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md text-xs">
          {r.total_remaining} Days
        </span>
      ),
      sortable: true,
      sortKey: 'total_remaining',
    },
  ];

  const departmentColumns: Column<any>[] = [
    {
      header: 'Department',
      accessor: r => (
        <div>
          <p className="font-bold text-slate-900">{r.department_name}</p>
          <p className="text-[10px] text-slate-400 font-mono">{r.department_code}</p>
        </div>
      ),
      sortable: true,
      sortKey: 'department_name',
    },
    {
      header: 'Headcount',
      accessor: r => <span className="font-semibold text-slate-700">{r.employee_count} Staff</span>,
      sortable: true,
      sortKey: 'employee_count',
    },
    {
      header: 'Total Leaves Taken',
      accessor: r => <span className="font-bold text-blue-600">{r.total_leave_days} Days</span>,
      sortable: true,
      sortKey: 'total_leave_days',
    },
    {
      header: 'Total Requests',
      accessor: r => <span className="text-slate-600 font-medium">{r.total_requests}</span>,
      sortable: true,
      sortKey: 'total_requests',
    },
  ];

  const monthlyColumns: Column<any>[] = [
    {
      header: 'Month',
      accessor: r => <span className="font-bold text-slate-900">{r.month_name}</span>,
    },
    {
      header: 'Approved Days',
      accessor: r => <span className="font-bold text-emerald-600">{r.approved_days} Days</span>,
    },
    {
      header: 'Pending Days',
      accessor: r => <span className="font-bold text-amber-600">{r.pending_days} Days</span>,
    },
    {
      header: 'Total Requests',
      accessor: r => <span className="text-slate-600 font-medium">{r.total_requests}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Leave Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Exportable compliance reporting for HR, audit trails, and department managers
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('EMPLOYEE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'EMPLOYEE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Employee Balances
          </button>
          <button
            onClick={() => setActiveTab('DEPARTMENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'DEPARTMENT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Department Summary
          </button>
          <button
            onClick={() => setActiveTab('MONTHLY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'MONTHLY' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Trends
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>

          {activeTab !== 'DEPARTMENT' && (
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.department_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'EMPLOYEE' && (
        <DataTable
          columns={employeeColumns}
          data={empReport}
          isLoading={isLoading}
          searchPlaceholder="Search employee name or code..."
          searchKey={r => `${r.name} ${r.employee_code} ${r.department_name}`}
        />
      )}

      {activeTab === 'DEPARTMENT' && (
        <DataTable
          columns={departmentColumns}
          data={deptReport}
          isLoading={isLoading}
          searchPlaceholder="Search department..."
          searchKey={r => `${r.department_name} ${r.department_code}`}
        />
      )}

      {activeTab === 'MONTHLY' && (
        <DataTable
          columns={monthlyColumns}
          data={monthlyReport}
          isLoading={isLoading}
          searchPlaceholder="Search month..."
          searchKey={r => `${r.month_name}`}
        />
      )}
    </div>
  );
};
