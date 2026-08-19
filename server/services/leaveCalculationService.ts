import { db, Holiday } from '../config/database';

export interface CalculatedDay {
  date: string;
  day_of_week: string;
  day_type: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
  day_count: number;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_name?: string;
  is_deductible: boolean;
}

export interface LeaveCalculationResult {
  start_date: string;
  end_date: string;
  calendar_days: number;
  working_days: number;
  total_leave_days: number;
  breakdown: CalculatedDay[];
  valid: boolean;
  errors: string[];
}

export class LeaveCalculationService {
  /**
   * Helper to format YYYY-MM-DD
   */
  static formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculate leave duration excluding weekends and holidays
   */
  static calculateDays(
    startDateStr: string,
    endDateStr: string,
    startSession: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF' = 'FULL_DAY',
    endSession: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF' = 'FULL_DAY'
  ): LeaveCalculationResult {
    const errors: string[] = [];

    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        start_date: startDateStr,
        end_date: endDateStr,
        calendar_days: 0,
        working_days: 0,
        total_leave_days: 0,
        breakdown: [],
        valid: false,
        errors: ['Invalid date format. Please provide valid start and end dates.'],
      };
    }

    if (end < start) {
      return {
        start_date: startDateStr,
        end_date: endDateStr,
        calendar_days: 0,
        working_days: 0,
        total_leave_days: 0,
        breakdown: [],
        valid: false,
        errors: ['End date cannot be earlier than start date.'],
      };
    }

    // Check system settings
    const excludeWeekendsSetting = db.system_settings.find(s => s.setting_key === 'exclude_weekends');
    const excludeWeekends = excludeWeekendsSetting ? excludeWeekendsSetting.setting_value === 'true' : true;

    const excludeHolidaysSetting = db.system_settings.find(s => s.setting_key === 'exclude_holidays');
    const excludeHolidays = excludeHolidaysSetting ? excludeHolidaysSetting.setting_value === 'true' : true;

    // Fetch active holidays
    const holidaysMap = new Map<string, Holiday>();
    db.holidays.forEach(h => {
      holidaysMap.set(h.holiday_date, h);
    });

    const breakdown: CalculatedDay[] = [];
    const current = new Date(start);
    let calendarDays = 0;
    let workingDays = 0;
    let totalLeaveDays = 0;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    while (current <= end) {
      calendarDays++;
      const dateStr = this.formatDate(current);
      const dayOfWeekNum = current.getDay(); // 0 = Sun, 6 = Sat
      const dayOfWeekName = dayNames[dayOfWeekNum];
      const isWeekend = dayOfWeekNum === 0 || dayOfWeekNum === 6;
      const holiday = holidaysMap.get(dateStr);
      const isHoliday = !!holiday;

      const isSingleDay = startDateStr === endDateStr;
      const isStartDate = dateStr === startDateStr;
      const isEndDate = dateStr === endDateStr;

      let sessionType: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF' = 'FULL_DAY';
      let dayWeight = 1.0;

      if (isSingleDay) {
        sessionType = startSession;
        dayWeight = startSession === 'FULL_DAY' ? 1.0 : 0.5;
      } else if (isStartDate) {
        sessionType = startSession;
        dayWeight = startSession === 'FULL_DAY' ? 1.0 : 0.5;
      } else if (isEndDate) {
        sessionType = endSession;
        dayWeight = endSession === 'FULL_DAY' ? 1.0 : 0.5;
      }

      // Determine if this day is deductible
      const isDeductible = !(excludeWeekends && isWeekend) && !(excludeHolidays && isHoliday);

      if (!isWeekend && !isHoliday) {
        workingDays++;
      }

      if (isDeductible) {
        totalLeaveDays += dayWeight;
      }

      breakdown.push({
        date: dateStr,
        day_of_week: dayOfWeekName,
        day_type: sessionType,
        day_count: isDeductible ? dayWeight : 0,
        is_weekend: isWeekend,
        is_holiday: isHoliday,
        holiday_name: holiday?.holiday_name,
        is_deductible: isDeductible,
      });

      // Advance by 1 day
      current.setDate(current.getDate() + 1);
    }

    if (totalLeaveDays === 0) {
      errors.push('The selected date range falls entirely on non-working days (weekends/holidays). Total leave days is 0.');
    }

    return {
      start_date: startDateStr,
      end_date: endDateStr,
      calendar_days: calendarDays,
      working_days: workingDays,
      total_leave_days: totalLeaveDays,
      breakdown,
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for overlapping leave requests for an employee
   */
  static checkOverlapping(
    employeeId: number,
    startDateStr: string,
    endDateStr: string,
    excludeRequestId?: number
  ): { hasOverlap: boolean; overlappingRequest?: any } {
    const existingRequests = db.leave_requests.filter(req => {
      if (req.employee_id !== employeeId) return false;
      if (excludeRequestId && req.id === excludeRequestId) return false;
      // Overlap only occurs with active requests (not REJECTED or CANCELLED)
      return ['DRAFT', 'PENDING', 'MANAGER_APPROVED', 'HR_APPROVED', 'APPROVED'].includes(req.status);
    });

    const newStart = new Date(startDateStr + 'T00:00:00').getTime();
    const newEnd = new Date(endDateStr + 'T00:00:00').getTime();

    for (const req of existingRequests) {
      const existingStart = new Date(req.start_date + 'T00:00:00').getTime();
      const existingEnd = new Date(req.end_date + 'T00:00:00').getTime();

      // Overlap formula: max(StartA, StartB) <= min(EndA, EndB)
      if (Math.max(newStart, existingStart) <= Math.min(newEnd, existingEnd)) {
        return { hasOverlap: true, overlappingRequest: req };
      }
    }

    return { hasOverlap: false };
  }
}
