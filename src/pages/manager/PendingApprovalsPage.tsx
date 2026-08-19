import React, { useState, useEffect } from 'react';
import { leavesApi } from '../../services/api';
import { LeaveRequest } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/Badge';
import { LeaveDetailsModal } from '../../components/leave/LeaveDetailsModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useNotifications } from '../../context/NotificationContext';
import { Check, X, Eye, Clock, CheckCircle2 } from 'lucide-react';

export const PendingApprovalsPage: React.FC = () => {
  const { fetchNotifications } = useNotifications();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [approveId, setApproveId] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await leavesApi.getAll({ all: false });
      if (res.data.success) {
        setRequests(
          res.data.data.filter(r => ['PENDING', 'MANAGER_APPROVED'].includes(r.status))
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (comments?: string) => {
    if (!approveId) return;
    await leavesApi.approve(approveId, comments);
    setApproveId(null);
    fetchNotifications();
    loadData();
  };

  const handleReject = async (reason?: string) => {
    if (!rejectId) return;
    await leavesApi.reject(rejectId, reason || 'Rejected');
    setRejectId(null);
    fetchNotifications();
    loadData();
  };

  const columns: Column<LeaveRequest>[] = [
    {
      header: 'Employee',
      accessor: r => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
            {r.employee?.name.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-bold text-slate-900">{r.employee?.name}</p>
            <p className="text-[10px] text-slate-400">
              {r.employee?.employee_code} • {r.employee?.department_name}
            </p>
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
      header: 'Reason',
      accessor: r => <p className="max-w-xs truncate text-slate-600 italic">“{r.reason}”</p>,
    },
    {
      header: 'Status',
      accessor: r => <StatusBadge status={r.status} />,
    },
    {
      header: 'Submitted',
      accessor: r => <span className="text-slate-500">{new Date(r.submitted_at).toLocaleDateString()}</span>,
    },
    {
      header: 'Actions',
      accessor: r => (
        <div className="flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setSelectedRequestId(r.id)}
            title="Inspect Details"
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setRejectId(r.id)}
            title="Reject Request"
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setApproveId(r.id)}
            title="Approve Request"
            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pending Leave Approvals</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review, approve, or reject incoming team leave requests
        </p>
      </div>

      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        searchPlaceholder="Search by employee name or reason..."
        searchKey={r => `${r.employee?.name} ${r.reason} ${r.leave_type?.name}`}
        emptyMessage="No pending leave applications awaiting approval!"
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

      <ConfirmDialog
        isOpen={!!approveId}
        onClose={() => setApproveId(null)}
        onConfirm={handleApprove}
        title="Approve Leave Request"
        message="Are you sure you want to approve this leave request?"
        confirmText="Confirm Approval"
        type="success"
        commentPlaceholder="Optional approval remarks..."
      />

      <ConfirmDialog
        isOpen={!!rejectId}
        onClose={() => setRejectId(null)}
        onConfirm={handleReject}
        title="Reject Leave Request"
        message="Please state the rejection reason below."
        confirmText="Confirm Rejection"
        type="danger"
        requireComment={true}
        commentLabel="Reason for Rejection"
        commentPlaceholder="Enter reason for rejecting this leave..."
      />
    </div>
  );
};
