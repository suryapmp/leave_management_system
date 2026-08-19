import { Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { LeaveBalanceService } from '../services/leaveBalanceService';
import { AuditService } from '../services/auditService';

export class LeaveBalanceController {
  static getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
      const departmentId = req.query.departmentId ? Number(req.query.departmentId) : undefined;
      const search = req.query.search ? String(req.query.search).toLowerCase() : undefined;

      let employees = db.employees;
      if (departmentId) {
        employees = employees.filter(e => e.department_id === departmentId);
      }

      const leaveTypes = db.leave_types.filter(lt => lt.status === 'ACTIVE');

      const result = employees.map(emp => {
        const user = db.users.find(u => u.id === emp.user_id);
        const dept = db.departments.find(d => d.id === emp.department_id);
        const balances = LeaveBalanceService.getEmployeeBalances(emp.id, year);

        return {
          employee_id: emp.id,
          employee_code: emp.employee_code,
          employee_name: user?.name || 'Unknown',
          employee_email: user?.email || '',
          department_name: dept?.department_name || '',
          avatar: user?.avatar,
          balances: balances.map(b => {
            const lt = leaveTypes.find(t => t.id === b.leave_type_id);
            return {
              ...b,
              leave_type_name: lt?.name || 'Unknown',
              leave_type_code: lt?.code || '',
              color_code: lt?.color_code || '#3B82F6',
            };
          }),
        };
      });

      let filtered = result;
      if (search) {
        filtered = result.filter(r =>
          r.employee_name.toLowerCase().includes(search) ||
          r.employee_code.toLowerCase().includes(search) ||
          r.department_name.toLowerCase().includes(search)
        );
      }

      return res.json({ success: true, data: filtered, total: filtered.length });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static getByEmployee = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const employeeId = Number(req.params.employeeId);
      const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

      const emp = db.employees.find(e => e.id === employeeId);
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const balances = LeaveBalanceService.getEmployeeBalances(employeeId, year);
      const enrichedBalances = balances.map(b => {
        const lt = db.leave_types.find(t => t.id === b.leave_type_id);
        return {
          ...b,
          leave_type_name: lt?.name,
          leave_type_code: lt?.code,
          color_code: lt?.color_code,
          annual_limit: lt?.annual_limit,
          carry_forward_allowed: lt?.carry_forward_allowed,
        };
      });

      const adjustments = db.leave_balance_adjustments
        .filter(a => a.employee_id === employeeId)
        .map(a => {
          const lt = db.leave_types.find(t => t.id === a.leave_type_id);
          const adjUser = db.users.find(u => u.id === a.adjusted_by);
          return {
            ...a,
            leave_type_name: lt?.name,
            adjusted_by_name: adjUser?.name || 'Admin',
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return res.json({
        success: true,
        data: {
          employee_id: employeeId,
          year,
          balances: enrichedBalances,
          adjustments,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static adjust = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const {
        employee_id,
        leave_type_id,
        adjustment_type,
        amount,
        reason,
        year,
      } = req.body;

      if (!employee_id || !leave_type_id || !adjustment_type || amount === undefined || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Employee, leave type, adjustment type (ADD/DEDUCT/OVERRIDE), amount, and reason are required.',
        });
      }

      const adjustment = LeaveBalanceService.adjustBalance({
        employeeId: Number(employee_id),
        leaveTypeId: Number(leave_type_id),
        adjustedByUserId: user.userId,
        adjustmentType: adjustment_type,
        amount: Number(amount),
        reason,
        year: year ? Number(year) : undefined,
      });

      AuditService.log({
        userId: user.userId,
        userEmail: user.email,
        action: 'LEAVE_BALANCE_ADJUSTED',
        module: 'LeaveBalances',
        recordId: adjustment.id,
        details: `Adjusted balance for Employee #${employee_id} (${adjustment_type} ${amount} days). Reason: ${reason}`,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: 'Leave balance adjusted successfully.',
        data: adjustment,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
