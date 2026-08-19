import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { StatusBadge, SessionBadge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { leavesApi } from '../../services/api';
import { LeaveRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Calendar, User as UserIcon, FileText, CheckCircle, XCircle, Ban, Clock, MessageSquare, Download } from 'lucide-react';

interface LeaveDetailsModalProps {
  requestId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete?: () => void;
}

export const LeaveDetailsModal: React.FC<LeaveDetailsModalProps> = ({
  requestId,
  isOpen,
  onClose,
  onActionComplete,
}) => {
  const { user, canApproveLeaves } = useAuth();
  const { fetchNotifications } = useNotifications();

  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Dialog states
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  useEffect(() => {
    if (isOpen && requestId) {
      loadDetails(requestId);
    }
  }, [isOpen, requestId]);

  const loadDetails = async (id: number) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await leavesApi.getById(id);
      if (res.data.success) {
        setLeave(res.data.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load leave details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (comments?: string) => {
    if (!leave) return;
    await leavesApi.approve(leave.id, comments);
    fetchNotifications();
    if (onActionComplete) onActionComplete();
    loadDetails(leave.id);
  };

  const handleReject = async (reason?: string) => {
    if (!leave) return;
    await leavesApi.reject(leave.id, reason || 'Rejected by approver');
    fetchNotifications();
    if (onActionComplete) onActionComplete();
    loadDetails(leave.id);
  };

  const handleCancel = async (reason?: string) => {
    if (!leave) return;
    await leavesApi.cancel(leave.id, reason || 'Cancelled by employee');
    fetchNotifications();
    if (onActionComplete) onActionComplete();
    loadDetails(leave.id);
  };

  if (!isOpen) return null;

  // Determine permissions
  const isOwner = user?.employee?.id === leave?.employee_id;
  const isPending = leave?.status === 'PENDING' || leave?.status === 'MANAGER_APPROVED';
  const canApprove = canApproveLeaves && isPending && (!isOwner || user?.role === 'ADMIN');
  const canCancel = (isOwner || user?.role === 'ADMIN') && ['PENDING', 'MANAGER_APPROVED'].includes(leave?.status || '');

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={leave ? `Leave Request ${leave.request_number}` : 'Leave Details'}
        subtitle={leave ? `Submitted on ${new Date(leave.submitted_at).toLocaleDateString()}` : ''}
        maxWidth="3xl"
      >
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 mt-2">Loading details...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-xs text-rose-700 bg-rose-50 rounded-lg">{error}</div>
        ) : leave ? (
          <div className="space-y-6">
            {/* Header Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {leave.employee?.name ? leave.employee.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{leave.employee?.name}</h4>
                  <p className="text-xs text-slate-500">
                    {leave.employee?.employee_code} • {leave.employee?.department_name} ({leave.employee?.designation_title})
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <StatusBadge status={leave.status} />
              </div>
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium">Leave Type</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: leave.leave_type?.color_code || '#3B82F6' }}
                  />
                  <span className="text-xs font-bold text-slate-900">{leave.leave_type?.name}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium">Total Duration</span>
                <p className="text-xs font-bold text-blue-600 mt-1">{leave.total_days} Day(s)</p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium">Date Range</span>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  {leave.start_date} → {leave.end_date}
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium">Session Types</span>
                <div className="flex items-center space-x-1 mt-1">
                  <SessionBadge session={leave.start_session} />
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Reason for Leave</span>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{leave.reason}</p>
            </div>

            {/* Attachment if present */}
            {leave.document && (
              <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{leave.document_name || 'Attached Document'}</p>
                    <p className="text-[10px] text-slate-500">Supporting Verification Document</p>
                  </div>
                </div>
                <a
                  href={leave.document}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 flex items-center space-x-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>View / Download</span>
                </a>
              </div>
            )}

            {/* Approval History & Audit Trail */}
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                Approval Workflow & History
              </span>
              <div className="space-y-3">
                {leave.history && leave.history.length > 0 ? (
                  leave.history.map((hist, idx) => (
                    <div
                      key={hist.id || idx}
                      className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs"
                    >
                      <div className="mt-0.5">
                        {hist.action.includes('APPROVED') ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : hist.action === 'REJECTED' ? (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        ) : hist.action === 'CANCELLED' ? (
                          <Ban className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {hist.approver_name} <span className="text-slate-400 font-normal">({hist.approver_role})</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(hist.action_date).toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <StatusBadge status={hist.action} />
                          {hist.comments && (
                            <span className="text-slate-600 italic">“{hist.comments}”</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No history records found.</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div>
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => setIsCancelOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center space-x-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Cancel Request</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close
                </button>

                {canApprove && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsRejectOpen(true)}
                      className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsApproveOpen(true)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Approve Leave</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={handleApprove}
        title="Approve Leave Request"
        message={`Are you sure you want to approve this leave request (${leave?.total_days} days for ${leave?.employee?.name})?`}
        confirmText="Confirm Approval"
        type="success"
        requireComment={false}
        commentPlaceholder="Optional approval remarks (e.g. approved, have a good break)..."
      />

      {/* Reject Confirm Dialog */}
      <ConfirmDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleReject}
        title="Reject Leave Request"
        message={`Are you sure you want to reject this leave request for ${leave?.employee?.name}?`}
        confirmText="Confirm Rejection"
        type="danger"
        requireComment={true}
        commentLabel="Rejection Reason"
        commentPlaceholder="Explain why this leave request is being rejected..."
      />

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Leave Request"
        message="Are you sure you want to cancel this leave application? The deducted/pending days will be restored."
        confirmText="Confirm Cancellation"
        type="warning"
        requireComment={false}
        commentPlaceholder="Optional cancellation reason..."
      />
    </>
  );
};
