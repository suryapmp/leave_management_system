import { Response } from 'express';
import { db, LeaveRequest, LeaveApprovalHistory } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { LeaveCalculationService } from '../services/leaveCalculationService';
import { LeaveBalanceService } from '../services/leaveBalanceService';
import { NotificationService } from '../services/notificationService';
import { AuditService } from '../services/auditService';

export class LeaveController {
  /**
   * Dry-run calculation endpoint to calculate days before submitting
   */
  static calculatePreview = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        employee_id,
        leave_type_id,
        start_date,
        end_date,
        start_session,
        end_session,
      } = req.body;

      if (!start_date || !end_date) {
        return res.status(400).json({ success: false, message: 'Start date and end date are required.' });
      }

      const calculation = LeaveCalculationService.calculateDays(
        start_date,
        end_date,
        start_session || 'FULL_DAY',
        end_session || 'FULL_DAY'
      );

      // Check balance if employee and leave type are provided
      let balanceInfo = null;
      let overlapInfo = null;
      let policyValidation = { allowed: true, warnings: [] as string[] };

      if (employee_id && leave_type_id) {
        const empId = Number(employee_id);
        const ltId = Number(leave_type_id);
        const lt = db.leave_types.find(t => t.id === ltId);
        const bal = LeaveBalanceService.getBalance(empId, ltId);

        if (bal && lt) {
          const available = bal.remaining;
          const afterApproval = available - calculation.total_leave_days;

          balanceInfo = {
            allocated: bal.allocated,
            used: bal.used,
            pending: bal.pending,
            available,
            requested_days: calculation.total_leave_days,
            remaining_after: afterApproval,
            is_insufficient: afterApproval < 0 && !lt.is_paid && lt.code !== 'LOP',
          };

          // Policy limits
          if (calculation.total_leave_days < lt.minimum_days) {
            policyValidation.allowed = false;
            policyValidation.warnings.push(`Minimum duration for ${lt.name} is ${lt.minimum_days} day(s).`);
          }
          if (calculation.total_leave_days > lt.maximum_days) {
            policyValidation.allowed = false;
            policyValidation.warnings.push(`Maximum continuous duration for ${lt.name} is ${lt.maximum_days} day(s).`);
          }
          if (afterApproval < 0 && lt.is_paid) {
            const allowNegSetting = db.system_settings.find(s => s.setting_key === 'allow_negative_balance');
            const allowNeg = allowNegSetting?.setting_value === 'true';
            if (!allowNeg) {
              policyValidation.allowed = false;
              policyValidation.warnings.push(`Insufficient leave balance. You have ${available} day(s) remaining for ${lt.name}.`);
            }
          }
        }

        // Check overlapping requests
        overlapInfo = LeaveCalculationService.checkOverlapping(empId, start_date, end_date);
        if (overlapInfo.hasOverlap) {
          policyValidation.allowed = false;
          policyValidation.warnings.push(`You already have an active leave request (${overlapInfo.overlappingRequest?.request_number}) covering these dates.`);
        }
      }

      return res.json({
        success: true,
        data: {
          ...calculation,
          balance_info: balanceInfo,
          overlap_info: overlapInfo,
          policy_validation: policyValidation,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Apply for Leave
   */
  static apply = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const {
        leave_type_id,
        start_date,
        end_date,
        start_session = 'FULL_DAY',
        end_session = 'FULL_DAY',
        reason,
        document,
        document_name,
      } = req.body;

      // Determine applying employee ID
      let employeeId = user.employeeId;
      if ((user.role === 'ADMIN' || user.role === 'HR') && req.body.employee_id) {
        employeeId = Number(req.body.employee_id);
      }

      if (!employeeId) {
        const emp = db.employees.find(e => e.user_id === user.userId);
        if (emp) employeeId = emp.id;
      }

      if (!employeeId) {
        return res.status(400).json({ success: false, message: 'Employee profile not associated with this account.' });
      }

      const employee = db.employees.find(e => e.id === employeeId);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found.' });
      }

      if (!leave_type_id || !start_date || !end_date || !reason) {
        return res.status(400).json({ success: false, message: 'Leave type, start date, end date, and reason are required.' });
      }

      const leaveType = db.leave_types.find(lt => lt.id === Number(leave_type_id));
      if (!leaveType) {
        return res.status(404).json({ success: false, message: 'Selected leave type not found.' });
      }

      // Check document requirement
      if (leaveType.document_required && !document && !req.file) {
        return res.status(400).json({
          success: false,
          message: `Supporting document is required for ${leaveType.name}.`,
        });
      }

      // Calculate working leave days
      const calculation = LeaveCalculationService.calculateDays(
        start_date,
        end_date,
        start_session,
        end_session
      );

      if (!calculation.valid || calculation.total_leave_days <= 0) {
        return res.status(400).json({
          success: false,
          message: calculation.errors.join(' ') || 'Calculated leave days must be greater than 0.',
        });
      }

      // Check policy limits
      if (calculation.total_leave_days < leaveType.minimum_days) {
        return res.status(400).json({
          success: false,
          message: `Minimum leave duration for ${leaveType.name} is ${leaveType.minimum_days} day(s).`,
        });
      }

      if (calculation.total_leave_days > leaveType.maximum_days) {
        return res.status(400).json({
          success: false,
          message: `Maximum continuous duration for ${leaveType.name} is ${leaveType.maximum_days} day(s).`,
        });
      }

      // Check overlapping dates
      const overlap = LeaveCalculationService.checkOverlapping(employeeId, start_date, end_date);
      if (overlap.hasOverlap) {
        return res.status(400).json({
          success: false,
          message: `An active leave request (${overlap.overlappingRequest?.request_number}) already exists for this date period.`,
        });
      }

      // Check balance
      const balance = LeaveBalanceService.getBalance(employeeId, leaveType.id);
      if (balance && leaveType.is_paid && leaveType.code !== 'LOP') {
        const allowNegSetting = db.system_settings.find(s => s.setting_key === 'allow_negative_balance');
        const allowNeg = allowNegSetting?.setting_value === 'true';

        if (balance.remaining < calculation.total_leave_days && !allowNeg) {
          return res.status(400).json({
            success: false,
            message: `Insufficient leave balance! You have ${balance.remaining} day(s) remaining for ${leaveType.name}, but requested ${calculation.total_leave_days} day(s).`,
          });
        }
      }

      const now = new Date().toISOString();
      const requestId = db.getNextId('leave_requests');
      const yearStr = new Date().getFullYear();
      const requestNumber = `LR-${yearStr}-${String(requestId).padStart(4, '0')}`;

      // Document handling
      let finalDoc = document;
      let finalDocName = document_name;
      if (req.file) {
        finalDoc = `/uploads/${req.file.filename}`;
        finalDocName = req.file.originalname;
      }

      // Assign approver (direct manager, or department head, or admin)
      let approverEmployeeId = employee.manager_id;
      if (!approverEmployeeId) {
        const dept = db.departments.find(d => d.id === employee.department_id);
        approverEmployeeId = dept?.manager_id;
      }

      const newRequest: LeaveRequest = {
        id: requestId,
        request_number: requestNumber,
        employee_id: employeeId,
        leave_type_id: leaveType.id,
        start_date,
        end_date,
        start_session,
        end_session,
        total_days: calculation.total_leave_days,
        reason,
        document: finalDoc,
        document_name: finalDocName,
        status: 'PENDING',
        current_approver_id: approverEmployeeId,
        submitted_at: now,
        created_at: now,
        updated_at: now,
      };
      db.leave_requests.unshift(newRequest);

      // Hold pending balance
      LeaveBalanceService.holdPendingLeave(employeeId, leaveType.id, calculation.total_leave_days);

      // Record in Approval History
      const historyEntry: LeaveApprovalHistory = {
        id: db.getNextId('leave_approval_history'),
        leave_request_id: requestId,
        approver_id: user.userId,
        action: 'SUBMITTED',
        comments: `Leave application submitted: ${calculation.total_leave_days} day(s) ${leaveType.name}`,
        action_date: now,
      };
      db.leave_approval_history.push(historyEntry);

      // Notifications:
      // 1. Notify employee
      NotificationService.createNotification({
        userId: employee.user_id,
        title: 'Leave Request Submitted',
        message: `Your request (${requestNumber}) for ${calculation.total_leave_days} day(s) ${leaveType.name} has been submitted for review.`,
        type: 'LEAVE_SUBMITTED',
        referenceType: 'leave_request',
        referenceId: requestId,
      });

      // 2. Notify manager / approver
      if (approverEmployeeId) {
        const managerEmp = db.employees.find(e => e.id === approverEmployeeId);
        if (managerEmp) {
          const empUser = db.users.find(u => u.id === employee.user_id);
          NotificationService.createNotification({
            userId: managerEmp.user_id,
            title: 'New Leave Approval Needed',
            message: `${empUser?.name || 'An employee'} requested ${calculation.total_leave_days} day(s) ${leaveType.name} (${start_date} to ${end_date}).`,
            type: 'LEAVE_SUBMITTED',
            referenceType: 'leave_request',
            referenceId: requestId,
          });
        }
      }

      AuditService.log({
        userId: user.userId,
        userEmail: user.email,
        action: 'LEAVE_APPLIED',
        module: 'Leave',
        recordId: requestId,
        details: `Applied for ${calculation.total_leave_days} days ${leaveType.name} (${requestNumber})`,
        ipAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully.',
        data: newRequest,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get Leave Requests with full filters and role boundaries
   */
  static getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const {
        status,
        leaveTypeId,
        departmentId,
        employeeId,
        startDate,
        endDate,
        search,
      } = req.query;

      let requests = db.leave_requests;

      // Role boundary check
      if (user.role === 'EMPLOYEE') {
        const emp = db.employees.find(e => e.user_id === user.userId);
        if (!emp) return res.json({ success: true, data: [] });
        requests = requests.filter(r => r.employee_id === emp.id);
      } else if (user.role === 'MANAGER' && !req.query.all) {
        const mgrEmp = db.employees.find(e => e.user_id === user.userId);
        if (mgrEmp) {
          // Managers see their team's requests AND their own
          const teamMemberIds = db.employees.filter(e => e.manager_id === mgrEmp.id).map(e => e.id);
          requests = requests.filter(r => r.employee_id === mgrEmp.id || teamMemberIds.includes(r.employee_id));
        }
      }

      // Query Filters
      if (status) {
        requests = requests.filter(r => r.status === status);
      }
      if (leaveTypeId) {
        requests = requests.filter(r => r.leave_type_id === Number(leaveTypeId));
      }
      if (employeeId) {
        requests = requests.filter(r => r.employee_id === Number(employeeId));
      }
      if (startDate) {
        requests = requests.filter(r => new Date(r.start_date) >= new Date(String(startDate)));
      }
      if (endDate) {
        requests = requests.filter(r => new Date(r.end_date) <= new Date(String(endDate)));
      }

      // Enrich records
      const enriched = requests.map(reqItem => {
        const emp = db.employees.find(e => e.id === reqItem.employee_id);
        const empUser = emp ? db.users.find(u => u.id === emp.user_id) : undefined;
        const dept = emp ? db.departments.find(d => d.id === emp.department_id) : undefined;
        const desig = emp ? db.designations.find(d => d.id === emp.designation_id) : undefined;
        const lt = db.leave_types.find(t => t.id === reqItem.leave_type_id);
        const approverEmp = reqItem.current_approver_id ? db.employees.find(e => e.id === reqItem.current_approver_id) : undefined;
        const approverUser = approverEmp ? db.users.find(u => u.id === approverEmp.user_id) : undefined;

        return {
          ...reqItem,
          employee: {
            id: emp?.id,
            name: empUser?.name || 'Unknown',
            email: empUser?.email || '',
            employee_code: emp?.employee_code || '',
            avatar: empUser?.avatar,
            department_name: dept?.department_name || '',
            designation_title: desig?.title || '',
          },
          leave_type: lt ? {
            id: lt.id,
            name: lt.name,
            code: lt.code,
            color_code: lt.color_code,
            is_paid: lt.is_paid,
          } : null,
          current_approver_name: approverUser?.name || 'Pending Assignment',
        };
      });

      // Search keyword
      let result = enriched;
      if (search) {
        const q = String(search).toLowerCase();
        result = result.filter(r =>
          r.request_number.toLowerCase().includes(q) ||
          r.employee.name.toLowerCase().includes(q) ||
          r.employee.employee_code.toLowerCase().includes(q) ||
          r.leave_type?.name.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
        );
      }

      if (departmentId) {
        const deptId = Number(departmentId);
        const deptEmpIds = db.employees.filter(e => e.department_id === deptId).map(e => e.id);
        result = result.filter(r => deptEmpIds.includes(r.employee_id));
      }

      // Sort newest first
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return res.json({ success: true, data: result, total: result.length });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Get Single Leave Details
   */
  static getById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const leaveReq = db.leave_requests.find(r => r.id === id);
      if (!leaveReq) {
        return res.status(404).json({ success: false, message: 'Leave request not found' });
      }

      const emp = db.employees.find(e => e.id === leaveReq.employee_id);
      const empUser = emp ? db.users.find(u => u.id === emp.user_id) : undefined;
      const dept = emp ? db.departments.find(d => d.id === emp.department_id) : undefined;
      const desig = emp ? db.designations.find(d => d.id === emp.designation_id) : undefined;
      const lt = db.leave_types.find(t => t.id === leaveReq.leave_type_id);
      const history = db.leave_approval_history
        .filter(h => h.leave_request_id === id)
        .map(h => {
          const approver = db.users.find(u => u.id === h.approver_id);
          return {
            ...h,
            approver_name: approver?.name || 'System',
            approver_role: approver?.role || '',
            approver_avatar: approver?.avatar,
          };
        })
        .sort((a, b) => new Date(a.action_date).getTime() - new Date(b.action_date).getTime());

      // Calculation breakdown
      const calculation = LeaveCalculationService.calculateDays(
        leaveReq.start_date,
        leaveReq.end_date,
        leaveReq.start_session,
        leaveReq.end_session
      );

      return res.json({
        success: true,
        data: {
          ...leaveReq,
          employee: {
            id: emp?.id,
            name: empUser?.name,
            email: empUser?.email,
            employee_code: emp?.employee_code,
            avatar: empUser?.avatar,
            department_name: dept?.department_name,
            designation_title: desig?.title,
          },
          leave_type: lt,
          history,
          breakdown: calculation.breakdown,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Approve Leave Request
   */
  static approve = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const id = Number(req.params.id);
      const { comments } = req.body;

      const leaveReq = db.leave_requests.find(r => r.id === id);
      if (!leaveReq) {
        return res.status(404).json({ success: false, message: 'Leave request not found' });
      }

      if (!['PENDING', 'MANAGER_APPROVED'].includes(leaveReq.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve leave in '${leaveReq.status}' status.`,
        });
      }

      // Prevent approving own leave
      const userEmp = db.employees.find(e => e.user_id === user.userId);
      if (userEmp && userEmp.id === leaveReq.employee_id && user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Security Policy: You cannot approve your own leave request.',
        });
      }

      const now = new Date().toISOString();
      const twoTierSetting = db.system_settings.find(s => s.setting_key === 'two_tier_approval');
      const isTwoTier = twoTierSetting?.setting_value === 'true';

      let newStatus: LeaveRequest['status'] = 'APPROVED';
      let actionType: LeaveApprovalHistory['action'] = 'APPROVED';

      if (isTwoTier && leaveReq.status === 'PENDING' && user.role === 'MANAGER') {
        newStatus = 'MANAGER_APPROVED';
        actionType = 'MANAGER_APPROVED';
      } else {
        newStatus = 'APPROVED';
        actionType = 'APPROVED';
        leaveReq.approved_at = now;

        // Deduct from pending to used
        LeaveBalanceService.deductApprovedLeave(leaveReq.employee_id, leaveReq.leave_type_id, leaveReq.total_days, true);
      }

      leaveReq.status = newStatus;
      leaveReq.updated_at = now;

      // Record approval history
      db.leave_approval_history.push({
        id: db.getNextId('leave_approval_history'),
        leave_request_id: id,
        approver_id: user.userId,
        action: actionType,
        comments: comments || (newStatus === 'APPROVED' ? 'Approved by ' + user.name : 'Manager approval granted'),
        action_date: now,
      });

      const emp = db.employees.find(e => e.id === leaveReq.employee_id);
      const leaveType = db.leave_types.find(t => t.id === leaveReq.leave_type_id);

      // Notification to Employee
      if (emp) {
        NotificationService.createNotification({
          userId: emp.user_id,
          title: newStatus === 'APPROVED' ? 'Leave Request Approved!' : 'Manager Approval Granted',
          message: `Your leave request ${leaveReq.request_number} (${leaveReq.total_days} days ${leaveType?.name || ''}) has been ${newStatus.toLowerCase().replace('_', ' ')} by ${user.name}.`,
          type: 'LEAVE_APPROVED',
          referenceType: 'leave_request',
          referenceId: leaveReq.id,
        });
      }

      AuditService.log({
        userId: user.userId,
        userEmail: user.email,
        action: 'LEAVE_APPROVED',
        module: 'Leave',
        recordId: id,
        details: `${user.name} approved leave request ${leaveReq.request_number}`,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: newStatus === 'APPROVED' ? 'Leave approved successfully.' : 'Manager approval completed. Pending final HR review.',
        data: leaveReq,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Reject Leave Request
   */
  static reject = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const id = Number(req.params.id);
      const { rejection_reason } = req.body;

      if (!rejection_reason || rejection_reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Please provide a clear reason for rejecting this leave request.',
        });
      }

      const leaveReq = db.leave_requests.find(r => r.id === id);
      if (!leaveReq) {
        return res.status(404).json({ success: false, message: 'Leave request not found.' });
      }

      if (!['PENDING', 'MANAGER_APPROVED'].includes(leaveReq.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot reject leave in '${leaveReq.status}' status.`,
        });
      }

      const now = new Date().toISOString();
      leaveReq.status = 'REJECTED';
      leaveReq.rejection_reason = rejection_reason;
      leaveReq.rejected_at = now;
      leaveReq.updated_at = now;

      // Release pending balance
      LeaveBalanceService.releasePendingLeave(leaveReq.employee_id, leaveReq.leave_type_id, leaveReq.total_days);

      // Record approval history
      db.leave_approval_history.push({
        id: db.getNextId('leave_approval_history'),
        leave_request_id: id,
        approver_id: user.userId,
        action: 'REJECTED',
        comments: rejection_reason,
        action_date: now,
      });

      const emp = db.employees.find(e => e.id === leaveReq.employee_id);
      const leaveType = db.leave_types.find(t => t.id === leaveReq.leave_type_id);

      if (emp) {
        NotificationService.createNotification({
          userId: emp.user_id,
          title: 'Leave Request Rejected',
          message: `Your leave request ${leaveReq.request_number} (${leaveType?.name || ''}) was rejected by ${user.name}. Reason: ${rejection_reason}`,
          type: 'LEAVE_REJECTED',
          referenceType: 'leave_request',
          referenceId: leaveReq.id,
        });
      }

      AuditService.log({
        userId: user.userId,
        userEmail: user.email,
        action: 'LEAVE_REJECTED',
        module: 'Leave',
        recordId: id,
        details: `${user.name} rejected leave ${leaveReq.request_number}. Reason: ${rejection_reason}`,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: 'Leave request has been rejected and balance restored.',
        data: leaveReq,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  /**
   * Cancel Leave Request
   */
  static cancel = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const id = Number(req.params.id);
      const { cancellation_reason } = req.body;

      const leaveReq = db.leave_requests.find(r => r.id === id);
      if (!leaveReq) {
        return res.status(404).json({ success: false, message: 'Leave request not found.' });
      }

      const emp = db.employees.find(e => e.id === leaveReq.employee_id);
      const isOwner = emp && emp.user_id === user.userId;
      const isAdminOrHR = ['ADMIN', 'HR'].includes(user.role);

      if (!isOwner && !isAdminOrHR) {
        return res.status(403).json({ success: false, message: 'Unauthorized to cancel this leave request.' });
      }

      if (['REJECTED', 'CANCELLED'].includes(leaveReq.status)) {
        return res.status(400).json({
          success: false,
          message: `Leave request is already in '${leaveReq.status}' status.`,
        });
      }

      const prevStatus = leaveReq.status;
      const now = new Date().toISOString();

      if (prevStatus === 'PENDING' || prevStatus === 'MANAGER_APPROVED') {
        LeaveBalanceService.releasePendingLeave(leaveReq.employee_id, leaveReq.leave_type_id, leaveReq.total_days);
      } else if (prevStatus === 'APPROVED') {
        LeaveBalanceService.restoreUsedLeave(leaveReq.employee_id, leaveReq.leave_type_id, leaveReq.total_days);
      }

      leaveReq.status = 'CANCELLED';
      leaveReq.cancellation_reason = cancellation_reason || 'Cancelled by ' + user.name;
      leaveReq.cancelled_at = now;
      leaveReq.updated_at = now;

      // History
      db.leave_approval_history.push({
        id: db.getNextId('leave_approval_history'),
        leave_request_id: id,
        approver_id: user.userId,
        action: 'CANCELLED',
        comments: cancellation_reason || 'Cancelled',
        action_date: now,
      });

      if (emp) {
        NotificationService.createNotification({
          userId: emp.user_id,
          title: 'Leave Request Cancelled',
          message: `Leave request ${leaveReq.request_number} has been cancelled and days restored.`,
          type: 'LEAVE_CANCELLED',
          referenceType: 'leave_request',
          referenceId: leaveReq.id,
        });
      }

      AuditService.log({
        userId: user.userId,
        userEmail: user.email,
        action: 'LEAVE_CANCELLED',
        module: 'Leave',
        recordId: id,
        details: `Cancelled leave request ${leaveReq.request_number}`,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: 'Leave request cancelled successfully. Balance has been restored.',
        data: leaveReq,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
