import { Response } from 'express';
import { db, LeaveType } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';

export class LeaveTypeController {
  static getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status } = req.query;
      let types = db.leave_types;
      if (status) {
        types = types.filter(t => t.status === status);
      }
      return res.json({ success: true, data: types });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        name,
        code,
        description,
        annual_limit,
        carry_forward_allowed,
        max_carry_forward,
        document_required,
        minimum_days,
        maximum_days,
        color_code,
        is_paid,
      } = req.body;

      if (!name || !code || annual_limit === undefined) {
        return res.status(400).json({ success: false, message: 'Name, code, and annual limit are required.' });
      }

      const existing = db.leave_types.find(lt => lt.code.toUpperCase() === code.toUpperCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'Leave type code already exists.' });
      }

      const now = new Date().toISOString();
      const newType: LeaveType = {
        id: db.getNextId('leave_types'),
        name,
        code: code.toUpperCase(),
        description: description || '',
        annual_limit: Number(annual_limit),
        carry_forward_allowed: !!carry_forward_allowed,
        max_carry_forward: Number(max_carry_forward) || 0,
        document_required: !!document_required,
        minimum_days: Number(minimum_days) || 0.5,
        maximum_days: Number(maximum_days) || 30,
        color_code: color_code || '#3B82F6',
        is_paid: is_paid !== undefined ? !!is_paid : true,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      };
      db.leave_types.push(newType);

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'LEAVE_TYPE_CREATED',
        module: 'LeaveTypes',
        recordId: newType.id,
        details: `Created leave type ${name} (${code})`,
        ipAddress: req.ip,
      });

      return res.status(201).json({ success: true, data: newType, message: 'Leave type created successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const lt = db.leave_types.find(t => t.id === id);
      if (!lt) {
        return res.status(404).json({ success: false, message: 'Leave type not found.' });
      }

      const {
        name,
        code,
        description,
        annual_limit,
        carry_forward_allowed,
        max_carry_forward,
        document_required,
        minimum_days,
        maximum_days,
        color_code,
        is_paid,
        status,
      } = req.body;

      if (name) lt.name = name;
      if (code) lt.code = code.toUpperCase();
      if (description !== undefined) lt.description = description;
      if (annual_limit !== undefined) lt.annual_limit = Number(annual_limit);
      if (carry_forward_allowed !== undefined) lt.carry_forward_allowed = !!carry_forward_allowed;
      if (max_carry_forward !== undefined) lt.max_carry_forward = Number(max_carry_forward);
      if (document_required !== undefined) lt.document_required = !!document_required;
      if (minimum_days !== undefined) lt.minimum_days = Number(minimum_days);
      if (maximum_days !== undefined) lt.maximum_days = Number(maximum_days);
      if (color_code) lt.color_code = color_code;
      if (is_paid !== undefined) lt.is_paid = !!is_paid;
      if (status) lt.status = status;
      lt.updated_at = new Date().toISOString();

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'LEAVE_TYPE_UPDATED',
        module: 'LeaveTypes',
        recordId: lt.id,
        details: `Updated leave type ${lt.name}`,
        ipAddress: req.ip,
      });

      return res.json({ success: true, data: lt, message: 'Leave type updated successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const inUse = db.leave_requests.some(lr => lr.leave_type_id === id);
      if (inUse) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete leave type because historical leave requests exist for it. You can set its status to INACTIVE instead.',
        });
      }

      const index = db.leave_types.findIndex(t => t.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Leave type not found.' });
      }

      const deleted = db.leave_types.splice(index, 1)[0];

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'LEAVE_TYPE_DELETED',
        module: 'LeaveTypes',
        recordId: id,
        details: `Deleted leave type ${deleted.name}`,
        ipAddress: req.ip,
      });

      return res.json({ success: true, message: 'Leave type deleted successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
