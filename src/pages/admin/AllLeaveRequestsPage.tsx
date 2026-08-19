import React, { useState, useEffect } from 'react';
import { leavesApi, departmentsApi, leaveTypesApi } from '../../services/api';
import { LeaveRequest, Department, LeaveType } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge, SessionBadge } from '../../components/common/Badge';
import { LeaveDetailsModal } from '../../components/leave/LeaveDetailsModal';
import { ExportUtils } from '../../components/export/ExportUtils';
import { Eye, Filter, FileSpreadsheet, CalendarCheck, Check, X } from 'lucide-react';

export const AllLeaveRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('ALL');

  // Modal
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [leavesRes, deptRes, ltRes] = await Promise.all([
        leavesApi.getAll({ all: true }),
        departmentsApi.getAll(),
        leaveTypesApi.getAll(),
      ]);

      if (leavesRes.data.success) setRequests(leavesRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (ltRes.data.success) setLeaveTypes(ltRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (deptFilter !== 'ALL' && String(r.employee?.department_id) !== deptFilter) return false;
    if (leaveTypeFilter !== 'ALL' && String(r.leave_type_id) !== leaveTypeFilter) return false;
    return true;
  });

  const columns: Column<LeaveRequest>[] = [
    {
      header: 'Request #',
      accessor: r => <span className="font-mono font-bold text-slate-900">{r.request_number}</span>,
      sortable: true,
      sortKey: 'request_number',
    },
    {
      header: 'Employee',
      accessor: r => (
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {r.employee?.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-900">{r.employee?.name}</p>
            <p className="text-[10px] text-slate-400">{r.employee?.department_name}</p>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'employee_id',
    },
    {
      header: 'Leave Type',
      accessor: r => (
        <div className="flex items-center space-x-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: r.leave_type?.color_code || '#3B82F6' }}
          />
          <span className="font-semibold text-slate-800">{r.leave_type?.name}</span>
        </div>
      ),
    },
    {
      header: 'Duration',
      accessor: r => (
        <div>
          <span className="font-bold text-blue-600">{r.total_days} Day(s)</span>
          <p className="text-[10px] text-slate-400">
            {r.start_date} → {r.end_date}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: r => <StatusBadge status={r.status} />,
      sortable: true,
      sortKey: 'status',
    },
    {
      header: 'Submitted',
      accessor: r => <span className="text-slate-500">{new Date(r.submitted_at).toLocaleDateString()}</span>,
      sortable: true,
      sortKey: 'submitted_at',
    },
    {
      header: 'Actions',
      accessor: r => (
        <button
          onClick={e => {
            e.stopPropagation();
            setSelectedRequestId(r.id);
          }}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 flex items-center space-x-1 text-[11px] font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>
      ),
    },
  ];

  const handleExportCSV = () => {
    const rows = filteredRequests.map(r => ({
      Request_Number: r.request_number,
      Employee_Name: r.employee?.name,
      Department: r.employee?.department_name,
      Leave_Type: r.leave_type?.name,
      Start_Date: r.start_date,
      End_Date: r.end_date,
      Total_Days: r.total_days,
      Status: r.status,
      Reason: r.reason,
      Submitted_At: r.submitted_at,
    }));
    ExportUtils.exportToCSV('all_enterprise_leaves', rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Master Leave Applications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise-wide audit and tracking of all employee leave applications
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Export Master CSV</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter by:</span>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="MANAGER_APPROVED">Manager Approved</option>
          <option value="APPROVED">Approved (Final)</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

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
          value={leaveTypeFilter}
          onChange={e => setLeaveTypeFilter(e.target.value)}
          className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
        >
          <option value="ALL">All Leave Types</option>
          {leaveTypes.map(lt => (
            <option key={lt.id} value={lt.id}>
              {lt.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        isLoading={isLoading}
        searchPlaceholder="Search by employee name, request #, reason..."
        searchKey={r => `${r.request_number} ${r.employee?.name} ${r.reason} ${r.leave_type?.name}`}
        onRowClick={r => setSelectedRequestId(r.id)}
      />

      {/* Modals */}
      {selectedRequestId && (
        <LeaveDetailsModal
          requestId={selectedRequestId}
          isOpen={!!selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onActionComplete={loadData}
        />
      )}
    </div>
  );
};
