import { db, LeaveBalance, LeaveBalanceAdjustment } from '../config/database';

export class LeaveBalanceService {
  static getEmployeeBalances(employeeId: number, year: number = new Date().getFullYear()): LeaveBalance[] {
    let balances = db.leave_balances.filter(b => b.employee_id === employeeId && b.year === year);

    // If balances don't exist for this year, auto-generate them from active leave types
    if (balances.length === 0) {
      const now = new Date().toISOString();
      db.leave_types.filter(lt => lt.status === 'ACTIVE').forEach(lt => {
        const newBal: LeaveBalance = {
          id: db.getNextId('leave_balances'),
          employee_id: employeeId,
          leave_type_id: lt.id,
          year,
          allocated: lt.annual_limit,
          used: 0,
          pending: 0,
          remaining: lt.annual_limit,
          carried_forward: 0,
          created_at: now,
          updated_at: now,
        };
        db.leave_balances.push(newBal);
      });
      balances = db.leave_balances.filter(b => b.employee_id === employeeId && b.year === year);
    }

    return balances;
  }

  static getBalance(employeeId: number, leaveTypeId: number, year: number = new Date().getFullYear()): LeaveBalance | undefined {
    let balance = db.leave_balances.find(b => b.employee_id === employeeId && b.leave_type_id === leaveTypeId && b.year === year);
    if (!balance) {
      const leaveType = db.leave_types.find(lt => lt.id === leaveTypeId);
      if (leaveType) {
        const now = new Date().toISOString();
        balance = {
          id: db.getNextId('leave_balances'),
          employee_id: employeeId,
          leave_type_id: leaveTypeId,
          year,
          allocated: leaveType.annual_limit,
          used: 0,
          pending: 0,
          remaining: leaveType.annual_limit,
          carried_forward: 0,
          created_at: now,
          updated_at: now,
        };
        db.leave_balances.push(balance);
      }
    }
    return balance;
  }

  /**
   * When an employee submits a leave request, update pending days
   */
  static holdPendingLeave(employeeId: number, leaveTypeId: number, days: number, year: number = new Date().getFullYear()): boolean {
    const bal = this.getBalance(employeeId, leaveTypeId, year);
    if (!bal) return false;
    bal.pending += days;
    bal.remaining = Math.max(0, bal.allocated - bal.used - bal.pending);
    bal.updated_at = new Date().toISOString();
    return true;
  }

  /**
   * When a leave request is approved, shift from pending to used
   */
  static deductApprovedLeave(employeeId: number, leaveTypeId: number, days: number, wasPending: boolean = true, year: number = new Date().getFullYear()): boolean {
    const bal = this.getBalance(employeeId, leaveTypeId, year);
    if (!bal) return false;
    if (wasPending) {
      bal.pending = Math.max(0, bal.pending - days);
    }
    bal.used += days;
    bal.remaining = Math.max(0, bal.allocated - bal.used - bal.pending);
    bal.updated_at = new Date().toISOString();
    return true;
  }

  /**
   * When a pending leave is rejected or cancelled, release pending days
   */
  static releasePendingLeave(employeeId: number, leaveTypeId: number, days: number, year: number = new Date().getFullYear()): boolean {
    const bal = this.getBalance(employeeId, leaveTypeId, year);
    if (!bal) return false;
    bal.pending = Math.max(0, bal.pending - days);
    bal.remaining = Math.max(0, bal.allocated - bal.used - bal.pending);
    bal.updated_at = new Date().toISOString();
    return true;
  }

  /**
   * When an approved leave is cancelled, restore used balance
   */
  static restoreUsedLeave(employeeId: number, leaveTypeId: number, days: number, year: number = new Date().getFullYear()): boolean {
    const bal = this.getBalance(employeeId, leaveTypeId, year);
    if (!bal) return false;
    bal.used = Math.max(0, bal.used - days);
    bal.remaining = Math.max(0, bal.allocated - bal.used - bal.pending);
    bal.updated_at = new Date().toISOString();
    return true;
  }

  /**
   * Admin manual balance adjustment
   */
  static adjustBalance(params: {
    employeeId: number;
    leaveTypeId: number;
    adjustedByUserId: number;
    adjustmentType: 'ADD' | 'DEDUCT' | 'OVERRIDE';
    amount: number;
    reason: string;
    year?: number;
  }): LeaveBalanceAdjustment {
    const year = params.year || new Date().getFullYear();
    const bal = this.getBalance(params.employeeId, params.leaveTypeId, year);
    if (!bal) {
      throw new Error('Leave balance record not found');
    }

    const prevBalance = bal.remaining;
    let newBalance = prevBalance;

    if (params.adjustmentType === 'ADD') {
      bal.allocated += params.amount;
      newBalance = Math.max(0, bal.allocated - bal.used - bal.pending);
      bal.remaining = newBalance;
    } else if (params.adjustmentType === 'DEDUCT') {
      bal.allocated = Math.max(0, bal.allocated - params.amount);
      newBalance = Math.max(0, bal.allocated - bal.used - bal.pending);
      bal.remaining = newBalance;
    } else if (params.adjustmentType === 'OVERRIDE') {
      bal.allocated = params.amount;
      newBalance = Math.max(0, bal.allocated - bal.used - bal.pending);
      bal.remaining = newBalance;
    }

    bal.updated_at = new Date().toISOString();

    const adjustmentRecord: LeaveBalanceAdjustment = {
      id: db.getNextId('leave_balance_adjustments'),
      employee_id: params.employeeId,
      leave_type_id: params.leaveTypeId,
      adjusted_by: params.adjustedByUserId,
      adjustment_type: params.adjustmentType,
      amount: params.amount,
      previous_balance: prevBalance,
      new_balance: newBalance,
      reason: params.reason,
      created_at: new Date().toISOString(),
    };

    db.leave_balance_adjustments.push(adjustmentRecord);
    return adjustmentRecord;
  }
}
