import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leavesApi, employeesApi } from '../../services/api';
import { LeaveRequest } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { LeaveDetailsModal } from '../../components/leave/LeaveDetailsModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

interface ManagerDashboardProps {
  onNavigate?: (page: string) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [teamLeavesToday, setTeamLeavesToday] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [quickApproveId, setQuickApproveId] = useState<number | null>(null);
  const [quickRejectId, setQuickRejectId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const [teamRes, leavesRes] = await Promise.all([
        employeesApi.getTeam(),
        leavesApi.getAll({ all: false }),
      ]);

      if (teamRes.data.success) {
        setTeamMembers(teamRes.data.data);
      }

      if (leavesRes.data.success) {
        const allLeaves = leavesRes.data.data;
        // Pending
        setPendingRequests(
          allLeaves.filter(r => ['PENDING', 'MANAGER_APPROVED'].includes(r.status))
        );
        // On Leave today
        setTeamLeavesToday(
          allLeaves.filter(
            r => r.status === 'APPROVED' && r.start_date <= todayStr && r.end_date >= todayStr
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (comments?: string) => {
    if (!quickApproveId) return;
    await leavesApi.approve(quickApproveId, comments);
    setQuickApproveId(null);
    loadData();
  };

  const handleReject = async (reason?: string) => {
    if (!quickRejectId) return;
    await leavesApi.reject(quickRejectId, reason || 'Rejected by manager');
    setQuickRejectId(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manager Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Team approvals, attendance tracking, and leave overview
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('approvals')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Manage All Approvals ({pendingRequests.length})</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Pending Approvals"
          value={pendingRequests.length}
          subtitle="Requests awaiting your review"
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-600"
          onClick={() => onNavigate && onNavigate('approvals')}
        />
        <StatCard
          title="Team on Leave Today"
          value={teamLeavesToday.length}
          subtitle="Direct reports absent today"
          icon={Calendar}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Team Size"
          value={teamMembers.length}
          subtitle="Reporting employees in your team"
          icon={Users}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-600"
          onClick={() => onNavigate && onNavigate('team-members')}
        />
      </div>

      {/* Main Grid: Pending Approvals & Team on Leave Today */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pending Leave Approvals</h3>
              <p className="text-xs text-slate-500">Requires manager review and sign-off</p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('approvals')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <span>All clear! No pending leave requests requiring approval.</span>
              </div>
            ) : (
              pendingRequests.map(req => (
                <div
                  key={req.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div
                    className="flex items-start space-x-3 cursor-pointer"
                    onClick={() => setSelectedRequestId(req.id)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {req.employee?.name.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">{req.employee?.name}</span>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">{req.leave_type?.name}</span> •{' '}
                        {req.total_days} Day(s) ({req.start_date} → {req.end_date})
                      </p>
                      <p className="text-[11px] text-slate-600 italic line-clamp-1 mt-1">“{req.reason}”</p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() => setQuickRejectId(req.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => setQuickApproveId(req.id)}
                      className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Leaves Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Team on Leave Today</h3>
            <p className="text-xs text-slate-500 mb-4">Colleagues away from office</p>

            <div className="space-y-3">
              {teamLeavesToday.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Entire team is currently working today!
                </div>
              ) : (
                teamLeavesToday.map(leave => (
                  <div
                    key={leave.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                        {leave.employee?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{leave.employee?.name}</p>
                        <p className="text-[10px] text-slate-500">{leave.leave_type?.name}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Returns {leave.end_date}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate && onNavigate('calendar')}
              className="w-full py-2 text-xs font-semibold text-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              View Team Leave Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedRequestId && (
        <LeaveDetailsModal
          requestId={selectedRequestId}
          isOpen={!!selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onActionComplete={loadData}
        />
      )}

      {/* Quick Approve Dialog */}
      <ConfirmDialog
        isOpen={!!quickApproveId}
        onClose={() => setQuickApproveId(null)}
        onConfirm={handleApprove}
        title="Approve Leave Request"
        message="Are you sure you want to approve this team member's leave request?"
        confirmText="Approve"
        type="success"
      />

      {/* Quick Reject Dialog */}
      <ConfirmDialog
        isOpen={!!quickRejectId}
        onClose={() => setQuickRejectId(null)}
        onConfirm={handleReject}
        title="Reject Leave Request"
        message="Please provide a clear reason for rejecting this leave request."
        confirmText="Reject Request"
        type="danger"
        requireComment={true}
        commentLabel="Rejection Reason"
      />
    </div>
  );
};
