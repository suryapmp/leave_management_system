import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { reportsApi, leavesApi } from '../../services/api';
import { DashboardSummary, LeaveRequest } from '../../types';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/Badge';
import { Users, Calendar, Clock, Sparkles, FileSpreadsheet, Eye } from 'lucide-react';
import { LeaveDetailsModal } from '../../components/leave/LeaveDetailsModal';

interface AdminDashboardProps {
  onNavigate?: (page: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [sumRes, reqsRes] = await Promise.all([
        reportsApi.getSummary(),
        leavesApi.getAll({ limit: 6 }),
      ]);
      if (sumRes.data.success) {
        setSummary(sumRes.data.data);
      }
      if (reqsRes.data.success) {
        setRecentRequests(reqsRes.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const metrics = summary?.metrics;
  const departmentUsage = summary?.department_usage || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise overview of employee attendance, approvals, department utilization, and calendar
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={() => onNavigate('reports')}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md shadow-2xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Generate Reports</span>
          </button>
        )}
      </div>

      {/* KPI Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={metrics?.total_employees || 1248}
          badgeText="+12%"
          badgeType="success"
          onClick={() => onNavigate && onNavigate('employees')}
        />
        <StatCard
          title="On Leave Today"
          value={metrics?.on_leave_today || 42}
          badgeText="3.3% Staff"
          badgeType="neutral"
          onClick={() => onNavigate && onNavigate('all-requests')}
        />
        <StatCard
          title="Pending Approvals"
          value={metrics?.pending_requests || 15}
          badgeText="Action Required"
          badgeType="warning"
          onClick={() => onNavigate && onNavigate('approvals')}
        />
        <StatCard
          title="Upcoming Holidays"
          value="2"
          badgeText="This Week"
          badgeType="info"
          accentBorder={true}
          onClick={() => onNavigate && onNavigate('holidays')}
        />
      </section>

      {/* Main Grid: 2 Col Table + 1 Col Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Leave Requests Table (2 Columns) */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-0">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Recent Leave Requests</h2>
            <button
              onClick={() => onNavigate && onNavigate('all-requests')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              View All History
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white border-b border-slate-200 z-10">
                <tr>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Days</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  recentRequests.slice(0, 5).map(req => (
                    <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            {req.employee_name
                              ? req.employee_name
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .substring(0, 2)
                              : 'EM'}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{req.employee_name || 'Employee'}</p>
                            <p className="text-[10px] text-slate-400">{req.department_name || 'Department'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-medium text-slate-600">{req.leave_type_name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs text-slate-600 font-mono">
                          {new Date(req.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
                          {new Date(req.end_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-bold text-slate-800">{Number(req.total_days).toFixed(1)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setSelectedLeave(req)}
                          className="text-indigo-600 hover:text-indigo-900 font-bold text-xs"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Widgets Column (1 Column) */}
        <div className="flex flex-col gap-6 min-h-0">
          {/* Department Leave Trends */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col overflow-hidden">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">
              Department Leave Trends
            </h2>
            <div className="flex-1 flex items-end gap-2 px-1 min-h-[120px]">
              <div className="flex-1 bg-indigo-100 rounded-t h-[60%] hover:bg-indigo-200 transition-colors relative group">
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] font-bold opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-1 rounded">
                  HR (60%)
                </span>
              </div>
              <div className="flex-1 bg-indigo-500 rounded-t h-[90%] hover:bg-indigo-600 transition-colors relative group">
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] font-bold opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-1 rounded">
                  IT (90%)
                </span>
              </div>
              <div className="flex-1 bg-indigo-300 rounded-t h-[40%] hover:bg-indigo-400 transition-colors relative group">
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] font-bold opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-1 rounded">
                  OPS (40%)
                </span>
              </div>
              <div className="flex-1 bg-indigo-200 rounded-t h-[75%] hover:bg-indigo-300 transition-colors relative group">
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] font-bold opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-1 rounded">
                  SLS (75%)
                </span>
              </div>
              <div className="flex-1 bg-indigo-600 rounded-t h-[55%] hover:bg-indigo-700 transition-colors relative group">
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[8px] font-bold opacity-0 group-hover:opacity-100 bg-slate-900 text-white px-1 rounded">
                  FIN (55%)
                </span>
              </div>
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
              <span>HR</span>
              <span>IT</span>
              <span>OPS</span>
              <span>SLS</span>
              <span>FIN</span>
            </div>
          </div>

          {/* Dark Team Calendar Widget */}
          <div className="bg-slate-900 rounded-xl shadow-lg p-5 text-white flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team Calendar</h2>
              <span className="text-[10px] font-bold text-slate-300 uppercase">
                {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[8px] text-center text-slate-500 mb-2">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span className="text-red-400">S</span>
              <span className="text-red-400">S</span>
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1">
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">28</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">29</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-600">30</div>
              <div className="aspect-square rounded border border-slate-800 bg-indigo-600/20 border-indigo-600/50 flex items-center justify-center text-[10px] text-white font-bold">1</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">2</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">3</div>
              <div className="aspect-square rounded border border-slate-800 bg-amber-500/20 border-amber-500/50 flex items-center justify-center text-[10px] text-white font-bold">4</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">5</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">6</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">7</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">8</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">9</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">10</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">11</div>
              <div className="aspect-square rounded border border-indigo-500 bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">12</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">13</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">14</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">15</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">16</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">17</div>
              <div className="aspect-square rounded border border-slate-800 flex items-center justify-center text-[10px] text-slate-400">18</div>
            </div>
            <div className="mt-4 space-y-1.5 border-t border-slate-800/80 pt-3">
              <div className="flex items-center gap-2 text-[9px]">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span className="text-slate-400">Pending Review</span>
              </div>
              <div className="flex items-center gap-2 text-[9px]">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-slate-400">Public Holiday</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details modal */}
      {selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          isOpen={!!selectedLeave}
          onClose={() => setSelectedLeave(null)}
          onStatusChange={() => {
            loadDashboard();
            setSelectedLeave(null);
          }}
        />
      )}
    </div>
  );
};
