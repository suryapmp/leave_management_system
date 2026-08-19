import React from 'react';
import { InteractiveLeaveCalendar } from '../../components/calendar/InteractiveLeaveCalendar';

export const CompanyCalendarPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">Organization Leave Calendar</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Interactive monthly schedule of employee leaves, public holidays, and departmental coverage
        </p>
      </div>

      <InteractiveLeaveCalendar />
    </div>
  );
};
