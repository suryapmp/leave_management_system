import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  PieChart,
  Users,
  Building2,
  Sliders,
  Award,
  CalendarCheck,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  PlusCircle,
  CheckSquare,
  UserCheck,
  X,
  Palmtree,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const { user, isAdmin, isHR, isManager } = useAuth();

  const handleNav = (page: string) => {
    onNavigate(page);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const navItemClass = (page: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      currentPage === page
        ? 'bg-indigo-600 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNav('dashboard')}>
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white text-base">
              L
            </div>
            <span className="text-xl font-bold text-white tracking-tight">LeaveEase</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* General */}
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-2">General</div>
          <button
            onClick={() => handleNav('dashboard')}
            className={`w-full ${navItemClass('dashboard')}`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleNav('apply-leave')}
            className={`w-full ${navItemClass('apply-leave')}`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Apply for Leave</span>
          </button>

          <button
            onClick={() => handleNav('my-leaves')}
            className={`w-full ${navItemClass('my-leaves')}`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>My Leaves</span>
          </button>

          <button
            onClick={() => handleNav('leave-balances')}
            className={`w-full ${navItemClass('leave-balances')}`}
          >
            <PieChart className="w-4 h-4 shrink-0" />
            <span>Leave Balances</span>
          </button>

          <button
            onClick={() => handleNav('calendar')}
            className={`w-full ${navItemClass('calendar')}`}
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            <span>Company Calendar</span>
          </button>

          {/* Management / Team */}
          {(isManager || isHR || isAdmin) && (
            <>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-6">
                Team Management
              </div>
              <button
                onClick={() => handleNav('approvals')}
                className={`w-full ${navItemClass('approvals')}`}
              >
                <CheckSquare className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Leave Approvals</span>
              </button>

              <button
                onClick={() => handleNav('team-members')}
                className={`w-full ${navItemClass('team-members')}`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Team Members</span>
              </button>
            </>
          )}

          {/* Administration */}
          {(isAdmin || isHR) && (
            <>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-6">
                Administration
              </div>
              <button
                onClick={() => handleNav('employees')}
                className={`w-full ${navItemClass('employees')}`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Employees</span>
              </button>

              <button
                onClick={() => handleNav('departments')}
                className={`w-full ${navItemClass('departments')}`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Departments</span>
              </button>

              <button
                onClick={() => handleNav('leave-types')}
                className={`w-full ${navItemClass('leave-types')}`}
              >
                <Award className="w-4 h-4 shrink-0" />
                <span>Leave Types & Quotas</span>
              </button>

              <button
                onClick={() => handleNav('all-balances')}
                className={`w-full ${navItemClass('all-balances')}`}
              >
                <Sliders className="w-4 h-4 shrink-0" />
                <span>Quota Adjustments</span>
              </button>

              <button
                onClick={() => handleNav('all-requests')}
                className={`w-full ${navItemClass('all-requests')}`}
              >
                <CalendarCheck className="w-4 h-4 shrink-0" />
                <span>All Leave Requests</span>
              </button>

              <button
                onClick={() => handleNav('holidays')}
                className={`w-full ${navItemClass('holidays')}`}
              >
                <CalendarDays className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Holidays</span>
              </button>

              <button
                onClick={() => handleNav('reports')}
                className={`w-full ${navItemClass('reports')}`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Reports</span>
              </button>

              <button
                onClick={() => handleNav('audit-logs')}
                className={`w-full ${navItemClass('audit-logs')}`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Audit Logs</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleNav('settings')}
                  className={`w-full ${navItemClass('settings')}`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>System Settings</span>
                </button>
              )}
            </>
          )}
        </nav>

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase tracking-tighter">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
