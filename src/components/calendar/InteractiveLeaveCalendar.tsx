import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Plus, Users, Sparkles } from 'lucide-react';
import { LeaveRequest, Holiday, LeaveType, Department } from '../../types';
import { leavesApi, holidaysApi, leaveTypesApi, departmentsApi } from '../../services/api';
import { LeaveDetailsModal } from '../leave/LeaveDetailsModal';
import { ApplyLeaveModal } from '../leave/ApplyLeaveModal';
import { useAuth } from '../../context/AuthContext';

export const InteractiveLeaveCalendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filters
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('ALL');
  const [scope, setScope] = useState<'ALL' | 'MINE' | 'TEAM'>('ALL');

  // Modals
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadData();
  }, [currentDate.getFullYear()]);

  const loadData = async () => {
    try {
      const [leavesRes, holidaysRes, ltRes, deptRes] = await Promise.all([
        leavesApi.getAll({ all: true }),
        holidaysApi.getAll({ year: currentDate.getFullYear() }),
        leaveTypesApi.getAll({ status: 'ACTIVE' }),
        departmentsApi.getAll(),
      ]);

      if (leavesRes.data.success) setLeaves(leavesRes.data.data);
      if (holidaysRes.data.success) setHolidays(holidaysRes.data.data);
      if (ltRes.data.success) setLeaveTypes(ltRes.data.data);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Filter leaves
  const filteredLeaves = leaves.filter(l => {
    if (l.status === 'REJECTED' || l.status === 'CANCELLED') return false;
    if (selectedLeaveType !== 'ALL' && String(l.leave_type_id) !== selectedLeaveType) return false;
    if (selectedDept !== 'ALL' && String(l.employee?.department_name) !== selectedDept) return false;

    if (scope === 'MINE') {
      return l.employee_id === user?.employee?.id;
    }
    return true;
  });

  // Helper to format date string YYYY-MM-DD
  const formatDateStr = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Build grid calendar cells
  const totalCells = 42; // 6 weeks * 7 days
  const calendarCells = [];

  // Previous month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dateStr = formatDateStr(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d);
    calendarCells.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      isWeekend: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dateStr = formatDateStr(year, month, d);

    calendarCells.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      isWeekend,
    });
  }

  // Next month padding
  const remainingCells = totalCells - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const dateStr = formatDateStr(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d);
    calendarCells.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      isWeekend: false,
    });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Calendar Header & Controls */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation & Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {monthNames[month]} {year}
            </h2>
            <p className="text-xs text-slate-500">Company leave schedule & holiday tracker</p>
          </div>
          <div className="flex items-center space-x-1 pl-3 border-l border-slate-200">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scope buttons */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => setScope('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                scope === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Org
            </button>
            <button
              onClick={() => setScope('MINE')}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                scope === 'MINE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Leaves
            </button>
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.department_name}>
                {d.department_name}
              </option>
            ))}
          </select>

          {/* Leave Type Filter */}
          <select
            value={selectedLeaveType}
            onChange={e => setSelectedLeaveType(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Leave Types</option>
            {leaveTypes.map(lt => (
              <option key={lt.id} value={lt.id}>
                {lt.name}
              </option>
            ))}
          </select>

          {/* Apply Leave Button */}
          <button
            onClick={() => setIsApplyOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Weekday Columns Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-600 py-2.5">
        <div className="text-rose-600">Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div className="text-rose-600">Sat</div>
      </div>

      {/* Calendar 7x6 Matrix Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 bg-slate-100">
        {calendarCells.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr;

          // Check holidays on this date
          const dayHoliday = holidays.find(h => h.holiday_date === cell.dateStr);

          // Check leaves spanning this date
          const dayLeaves = filteredLeaves.filter(
            l => l.start_date <= cell.dateStr && l.end_date >= cell.dateStr
          );

          return (
            <div
              key={idx}
              className={`min-h-[105px] p-2 bg-white transition-colors flex flex-col justify-between ${
                !cell.isCurrentMonth
                  ? 'bg-slate-50/60 opacity-40'
                  : cell.isWeekend
                  ? 'bg-slate-50/40'
                  : ''
              } ${isToday ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/20' : ''}`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-xs'
                      : cell.isWeekend
                      ? 'text-rose-600'
                      : 'text-slate-800'
                  }`}
                >
                  {cell.day}
                </span>

                {dayHoliday && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200 truncate max-w-[80px]">
                    🎉 {dayHoliday.holiday_name}
                  </span>
                )}
              </div>

              {/* Day Events Stack */}
              <div className="mt-1.5 space-y-1 overflow-y-auto max-h-[68px] flex-1">
                {dayLeaves.map(leave => {
                  const isApproved = leave.status === 'APPROVED';
                  const lt = leaveTypes.find(t => t.id === leave.leave_type_id);
                  const color = lt?.color_code || '#3B82F6';

                  return (
                    <div
                      key={leave.id}
                      onClick={() => setSelectedRequestId(leave.id)}
                      className={`text-[10px] p-1 rounded-md border cursor-pointer hover:shadow-xs transition-all flex items-center justify-between ${
                        isApproved
                          ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-medium'
                          : 'bg-amber-50/70 border-amber-200 text-amber-900 italic'
                      }`}
                    >
                      <div className="flex items-center space-x-1 truncate">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate">{leave.employee?.name}</span>
                      </div>
                      <span className="text-[9px] opacity-70 shrink-0 ml-1 font-mono">
                        {lt?.code}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-800">Legend:</span>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Approved</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Public Holiday</span>
          </div>
          {leaveTypes.slice(0, 4).map(lt => (
            <div key={lt.id} className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lt.color_code }} />
              <span>{lt.name}</span>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredLeaves.length}</span> active time-off records
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

      <ApplyLeaveModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
