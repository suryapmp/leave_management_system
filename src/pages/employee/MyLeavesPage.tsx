import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leavesApi, leaveTypesApi } from '../../services/api';
import { LeaveRequest, LeaveType } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge, SessionBadge } from '../../components/common/Badge';
import { LeaveDetailsModal } from '../../components/leave/LeaveDetailsModal';
import { ApplyLeaveModal } from '../../components/leave/ApplyLeaveModal';
import { Plus, Eye, Filter, FileSpreadsheet } from 'lucide-react';
import { ExportUtils } from '../../components/export/ExportUtils';

export const MyLeavesPage: React.FC = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.employee?.id) return;
    setIsLoading(true);
    try {
      const [leavesRes, ltRes] = await Promise.all([
        leavesApi.getAll({ employeeId: user.employee.id }),
        leaveTypesApi.getAll(),
      ]);
      if (leavesRes.data.success) setLeaves(leavesRes.data.data);
      if (ltRes.data.success) setLeaveTypes(ltRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeaves = leaves.filter(l => {
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    if (leaveTypeFilter !== 'ALL' && String(l.leave_type_id) !== leaveTypeFilter) return false;
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
      header: 'Session',
      accessor: r => <SessionBadge session={r.start_session} />,
    },
    {
      header: 'Reason',
      accessor: r => <p className="max-w-xs truncate text-slate-600 italic">“{r.reason}”</p>,
    },
    {
      header: 'Status',
      accessor: r => <StatusBadge status={r.status} />,
      sortable: true,
      sortKey: 'status',
    },
    {
      header: 'Submitted On',
      accessor: r => <span className="text-slate-500">{new Date(r.submitted_at).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      accessor: r => (
        <button
          onClick={e => {
            e.stopPropagation();
            setSelectedRequestId(r.id);
          }}
          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-100 flex items-center space-x-1 text-[11px] font-semibold"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View</span>
        </button>
      ),
    },
  ];

  const handleExportCSV = () => {
    const rows = filteredLeaves.map(l => ({
      Request_Number: l.request_number,
      Leave_Type: l.leave_type?.name,
      Start_Date: l.start_date,
      End_Date: l.end_date,
      Total_Days: l.total_days,
      Status: l.status,
      Reason: l.reason,
      Submitted_At: l.submitted_at,
    }));
    ExportUtils.exportToCSV('my_leave_history', rows);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Leave Applications</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review your complete time-off history, current requests, and approval records
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
            onClick={() => setIsApplyOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center space-x-1.5 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
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
        data={filteredLeaves}
        isLoading={isLoading}
        searchPlaceholder="Search by request # or reason..."
        searchKey={r => `${r.request_number} ${r.reason} ${r.leave_type?.name}`}
        onRowClick={r => setSelectedRequestId(r.id)}
      />

      {/* Modals */}
      <ApplyLeaveModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={loadData}
      />

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
