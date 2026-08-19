import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { leaveBalancesApi } from '../../services/api';
import { LeaveBalance } from '../../types';
import { ApplyLeaveModal } from '../../components/leave/ApplyLeaveModal';
import { PieChart, Plus, History, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export const LeaveBalancesPage: React.FC = () => {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear());
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, year]);

  const loadData = async () => {
    if (!user?.employee?.id) return;
    setIsLoading(true);
    try {
      const res = await leaveBalancesApi.getByEmployee(user.employee.id, { year });
      if (res.data.success) {
        setBalances(res.data.data.balances);
        setAdjustments(res.data.data.adjustments || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Leave Quotas & Balances</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Annual entitlements, utilized time-off, and pending leave deductions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="font-semibold text-slate-600">Year:</span>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-bold text-slate-800"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsApplyOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Leave Balance Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {balances.map(bal => {
          const usedPct = bal.allocated > 0 ? Math.min(100, Math.round((bal.used / bal.allocated) * 100)) : 0;
          return (
            <div
              key={bal.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{bal.leave_type_name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{bal.leave_type_code}</p>
                  </div>
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: bal.color_code || '#3B82F6' }}
                  />
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black text-slate-900">{bal.remaining}</span>
                    <span className="text-xs text-slate-400 font-semibold ml-1">Days Remaining</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">/ {bal.allocated} Allocated</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${usedPct}%`,
                        backgroundColor: bal.color_code || '#3B82F6',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 text-center text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Used</p>
                  <p className="font-bold text-slate-800 mt-0.5">{bal.used}d</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Pending</p>
                  <p className="font-bold text-amber-600 mt-0.5">{bal.pending}d</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Carry Over</p>
                  <p className="font-bold text-emerald-600 mt-0.5">+{bal.carried_forward}d</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjustments & Quota History */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-2 mb-4">
          <History className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Quota Adjustments & Manual Grants</h3>
        </div>

        {adjustments.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No special adjustments have been made to your leave balance for {year}.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {adjustments.map(adj => (
              <div key={adj.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{adj.leave_type_name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        adj.adjustment_type === 'ADD'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {adj.adjustment_type} {adj.amount} DAYS
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{adj.reason}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <p>By {adj.adjusted_by_name}</p>
                  <p>{new Date(adj.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ApplyLeaveModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
