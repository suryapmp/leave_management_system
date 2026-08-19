import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaveBalancesApi, leavesApi, holidaysApi } from '../../services/api';
import { LeaveBalance, LeaveRequest, Holiday } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { ApplyLeaveModal } from '../../components/leave/ApplyLeaveModal';
import { LeaveDetailsModal } from '../../components/leave/LeaveDetailsModal';
import {
  Calendar,
  Clock,
  CheckCircle2,
  PlusCircle,
  Sparkles,
  Palmtree,
  Users,
  ChevronRight,
  Sun,
} from 'lucide-react';

interface EmployeeDashboardProps {
  onNavigate?: (page: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<LeaveRequest[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.employee?.id) return;
    setIsLoading(true);
    try {
      const [balRes, leavesRes, holRes] = await Promise.all([
        leaveBalancesApi.getByEmployee(user.employee.id),
        leavesApi.getAll({ employeeId: user.employee.id }),
        holidaysApi.getAll(),
      ]);

      if (balRes.data.success) {
        setBalances(balRes.data.data.balances);
      }
      if (leavesRes.data.success) {
        setRecentLeaves(leavesRes.data.data.slice(0, 5));
      }
      if (holRes.data.success) {
        const todayStr = new Date().toISOString().split('T')[0];
        const upcoming = holRes.data.data
          .filter(h => h.holiday_date >= todayStr)
          .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime())
          .slice(0, 4);
        setUpcomingHolidays(upcoming);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const totalAllocated = balances.reduce((sum, b) => sum + b.allocated, 0);
  const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
  const totalRemaining = balances.reduce((sum, b) => sum + b.remaining, 0);
  const pendingCount = recentLeaves.filter(r => ['PENDING', 'MANAGER_APPROVED'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sun className="w-4 h-4 text-amber-300" />
              <span>Employee Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Good Day, {user?.name}!</h1>
            <p className="text-xs text-blue-100 mt-1 max-w-xl">
              You have <span className="font-bold text-white">{totalRemaining} days</span> of paid time-off available. Plan ahead and recharge.
            </p>
          </div>
          <button
            onClick={() => setIsApplyOpen(true)}
            className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Apply for Time-Off</span>
          </button>
        </div>
      </div>

      {/* Leave Balance Quota Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Your Leave Quotas ({new Date().getFullYear()})</h3>
          {onNavigate && (
            <button
              onClick={() => onNavigate('leave-balances')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Detailed Balances</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balances.map(bal => {
            const usagePercent = bal.allocated > 0 ? Math.min(100, Math.round((bal.used / bal.allocated) * 100)) : 0;
            return (
              <div
                key={bal.id}
                className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 truncate">{bal.leave_type_name}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: bal.color_code || '#3B82F6' }}
                    />
                  </div>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-black text-slate-900">{bal.remaining}</span>
                    <span className="text-xs text-slate-400 font-medium">/ {bal.allocated} days left</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Used: {bal.used}d</span>
                    <span>Pending: {bal.pending}d</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${usagePercent}%`,
                        backgroundColor: bal.color_code || '#3B82F6',
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Recent Requests & Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Applications */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Leave Requests</h3>
              <p className="text-xs text-slate-500">Your latest time-off applications and status</p>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('my-leaves')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>View All History</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {recentLeaves.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                You haven't submitted any leave requests yet.
              </div>
            ) : (
              recentLeaves.map(leave => (
                <div
                  key={leave.id}
                  onClick={() => setSelectedRequestId(leave.id)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white"
                      style={{ backgroundColor: leave.leave_type?.color_code || '#3B82F6' }}
                    >
                      {leave.leave_type?.code || 'LV'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {leave.leave_type?.name} • <span className="text-blue-600">{leave.total_days} Day(s)</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {leave.start_date} → {leave.end_date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <StatusBadge status={leave.status} />
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Upcoming Holidays */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Holidays</h3>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {upcomingHolidays.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No upcoming holidays scheduled</p>
              ) : (
                upcomingHolidays.map(hol => (
                  <div
                    key={hol.id}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{hol.holiday_name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{hol.holiday_date}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                      {hol.holiday_type}
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
              Open Full Organization Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ApplyLeaveModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={loadDashboardData}
      />

      {selectedRequestId && (
        <LeaveDetailsModal
          requestId={selectedRequestId}
          isOpen={!!selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          onActionComplete={loadDashboardData}
        />
      )}
    </div>
  );
};
