import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';

export class ReportController {
  /**
   * Main dashboard summary metrics and charts
   */
  static getSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const todayStr = new Date().toISOString().split('T')[0];
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Filter scope for managers / employees
      let accessibleEmployees = db.employees;
      let accessibleRequests = db.leave_requests;

      if (user.role === 'EMPLOYEE') {
        const emp = db.employees.find(e => e.user_id === user.userId);
        if (emp) {
          accessibleEmployees = [emp];
          accessibleRequests = db.leave_requests.filter(r => r.employee_id === emp.id);
        }
      } else if (user.role === 'MANAGER') {
        const mgrEmp = db.employees.find(e => e.user_id === user.userId);
        if (mgrEmp) {
          const team = db.employees.filter(e => e.manager_id === mgrEmp.id || e.id === mgrEmp.id);
          const teamIds = team.map(e => e.id);
          accessibleEmployees = team;
          accessibleRequests = db.leave_requests.filter(r => teamIds.includes(r.employee_id));
        }
      }

      // 1. Total Employees
      const totalEmployees = accessibleEmployees.length;

      // 2. Employees on leave today
      const employeesOnLeaveToday = accessibleRequests.filter(r => {
        return r.status === 'APPROVED' && r.start_date <= todayStr && r.end_date >= todayStr;
      }).length;

      // 3. Pending leave requests
      const pendingRequestsCount = accessibleRequests.filter(r => ['PENDING', 'MANAGER_APPROVED'].includes(r.status)).length;

      // 4. Approved leaves this month
      const approvedThisMonth = accessibleRequests.filter(r => {
        if (r.status !== 'APPROVED') return false;
        const d = new Date(r.start_date);
        return d.getFullYear() === currentYear && (d.getMonth() + 1) === currentMonth;
      }).reduce((acc, curr) => acc + curr.total_days, 0);

      // 5. Leave Type Distribution
      const leaveTypeDistribution = db.leave_types.map(lt => {
        const usedCount = accessibleRequests
          .filter(r => r.leave_type_id === lt.id && r.status === 'APPROVED')
          .reduce((sum, r) => sum + r.total_days, 0);

        return {
          id: lt.id,
          name: lt.name,
          code: lt.code,
          color: lt.color_code,
          days_used: usedCount,
        };
      }).filter(item => item.days_used > 0 || user.role === 'ADMIN');

      // 6. Monthly Trends (Jan - Dec)
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyTrends = monthNames.map((monthName, idx) => {
        const monthNum = idx + 1;
        const approvedDays = accessibleRequests
          .filter(r => {
            if (r.status !== 'APPROVED') return false;
            const d = new Date(r.start_date);
            return d.getFullYear() === currentYear && (d.getMonth() + 1) === monthNum;
          })
          .reduce((sum, r) => sum + r.total_days, 0);

        const pendingDays = accessibleRequests
          .filter(r => {
            if (!['PENDING', 'MANAGER_APPROVED'].includes(r.status)) return false;
            const d = new Date(r.start_date);
            return d.getFullYear() === currentYear && (d.getMonth() + 1) === monthNum;
          })
          .reduce((sum, r) => sum + r.total_days, 0);

        return {
          month: monthName,
          approved: approvedDays,
          pending: pendingDays,
        };
      });

      // 7. Department-wise usage
      const departmentUsage = db.departments.map(dept => {
        const deptEmpIds = db.employees.filter(e => e.department_id === dept.id).map(e => e.id);
        const deptDays = db.leave_requests
          .filter(r => deptEmpIds.includes(r.employee_id) && r.status === 'APPROVED')
          .reduce((sum, r) => sum + r.total_days, 0);

        return {
          id: dept.id,
          department_name: dept.department_name,
          department_code: dept.department_code,
          employee_count: deptEmpIds.length,
          total_leave_days: deptDays,
        };
      });

      // 8. Upcoming Organization Holidays
      const upcomingHolidays = db.holidays
        .filter(h => h.holiday_date >= todayStr)
        .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime())
        .slice(0, 5);

      return res.json({
        success: true,
        data: {
          metrics: {
            total_employees: totalEmployees,
            on_leave_today: employeesOnLeaveToday,
            pending_requests: pendingRequestsCount,
            approved_days_this_month: approvedThisMonth,
            departments_count: db.departments.length,
          },
          leave_type_distribution: leaveTypeDistribution,
          monthly_trends: monthlyTrends,
          department_usage: departmentUsage,
          upcoming_holidays: upcomingHolidays,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Detailed Department Report
   */
  static getDepartmentReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];

      const report = db.departments.map(dept => {
        const deptEmps = db.employees.filter(e => e.department_id === dept.id);
        const deptEmpIds = deptEmps.map(e => e.id);

        const onLeaveToday = db.leave_requests.filter(
          r => deptEmpIds.includes(r.employee_id) && r.status === 'APPROVED' && r.start_date <= todayStr && r.end_date >= todayStr
        ).length;

        const deptRequests = db.leave_requests.filter(r => deptEmpIds.includes(r.employee_id) && r.status === 'APPROVED');
        const totalDays = deptRequests.reduce((sum, r) => sum + r.total_days, 0);

        // Find most used leave type in this dept
        const counts: Record<number, number> = {};
        deptRequests.forEach(r => {
          counts[r.leave_type_id] = (counts[r.leave_type_id] || 0) + r.total_days;
        });

        let mostUsedLtId = 0;
        let maxCount = -1;
        Object.entries(counts).forEach(([ltId, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mostUsedLtId = Number(ltId);
          }
        });

        const mostUsedLt = db.leave_types.find(lt => lt.id === mostUsedLtId);
        const managerEmp = dept.manager_id ? db.employees.find(e => e.id === dept.manager_id) : undefined;
        const managerUser = managerEmp ? db.users.find(u => u.id === managerEmp.user_id) : undefined;

        return {
          department_id: dept.id,
          department_name: dept.department_name,
          department_code: dept.department_code,
          manager_name: managerUser?.name || 'Unassigned',
          total_employees: deptEmps.length,
          employees_on_leave_today: onLeaveToday,
          total_leave_days: totalDays,
          most_used_leave_type: mostUsedLt?.name || 'N/A',
        };
      });

      return res.json({ success: true, data: report });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Leave Summary Report with multi-filters
   */
  static getLeaveSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        department_id,
        leave_type_id,
        status,
        start_date,
        end_date,
        employee_id,
      } = req.query;

      let requests = db.leave_requests;

      if (department_id) {
        const dId = Number(department_id);
        const deptEmpIds = db.employees.filter(e => e.department_id === dId).map(e => e.id);
        requests = requests.filter(r => deptEmpIds.includes(r.employee_id));
      }

      if (employee_id) {
        requests = requests.filter(r => r.employee_id === Number(employee_id));
      }

      if (leave_type_id) {
        requests = requests.filter(r => r.leave_type_id === Number(leave_type_id));
      }

      if (status) {
        requests = requests.filter(r => r.status === status);
      }

      if (start_date) {
        requests = requests.filter(r => new Date(r.start_date) >= new Date(String(start_date)));
      }

      if (end_date) {
        requests = requests.filter(r => new Date(r.end_date) <= new Date(String(end_date)));
      }

      const enriched = requests.map(r => {
        const emp = db.employees.find(e => e.id === r.employee_id);
        const empUser = emp ? db.users.find(u => u.id === emp.user_id) : undefined;
        const dept = emp ? db.departments.find(d => d.id === emp.department_id) : undefined;
        const desig = emp ? db.designations.find(d => d.id === emp.designation_id) : undefined;
        const lt = db.leave_types.find(t => t.id === r.leave_type_id);

        return {
          id: r.id,
          request_number: r.request_number,
          employee_name: empUser?.name || 'Unknown',
          employee_code: emp?.employee_code || '',
          department_name: dept?.department_name || '',
          designation_title: desig?.title || '',
          leave_type_name: lt?.name || '',
          leave_type_code: lt?.code || '',
          start_date: r.start_date,
          end_date: r.end_date,
          start_session: r.start_session,
          end_session: r.end_session,
          total_days: r.total_days,
          reason: r.reason,
          status: r.status,
          submitted_at: r.submitted_at,
          approved_at: r.approved_at,
          rejected_at: r.rejected_at,
        };
      });

      return res.json({
        success: true,
        data: enriched,
        total: enriched.length,
        total_days_sum: enriched.reduce((sum, r) => sum + r.total_days, 0),
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
