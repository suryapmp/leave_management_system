import { Response } from 'express';
import { db, Department } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';

export class DepartmentController {
  static getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const departmentsWithCounts = db.departments.map(dept => {
        const memberCount = db.employees.filter(e => e.department_id === dept.id).length;
        const managerEmp = dept.manager_id ? db.employees.find(e => e.id === dept.manager_id) : undefined;
        const managerUser = managerEmp ? db.users.find(u => u.id === managerEmp.user_id) : undefined;

        return {
          ...dept,
          employee_count: memberCount,
          manager_name: managerUser?.name || 'Unassigned',
        };
      });

      return res.json({ success: true, data: departmentsWithCounts });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { department_name, department_code, description, manager_id } = req.body;

      if (!department_name || !department_code) {
        return res.status(400).json({ success: false, message: 'Department name and code are required.' });
      }

      const existing = db.departments.find(d => d.department_code.toUpperCase() === department_code.toUpperCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'Department code already exists.' });
      }

      const now = new Date().toISOString();
      const newDept: Department = {
        id: db.getNextId('departments'),
        department_name,
        department_code: department_code.toUpperCase(),
        description: description || '',
        manager_id: manager_id ? Number(manager_id) : undefined,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      };
      db.departments.push(newDept);

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'DEPARTMENT_CREATED',
        module: 'Departments',
        recordId: newDept.id,
        details: `Created department ${department_name} (${department_code})`,
        ipAddress: req.ip,
      });

      return res.status(201).json({ success: true, data: newDept, message: 'Department created successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const dept = db.departments.find(d => d.id === id);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      const { department_name, department_code, description, manager_id, status } = req.body;
      if (department_name) dept.department_name = department_name;
      if (department_code) dept.department_code = department_code.toUpperCase();
      if (description !== undefined) dept.description = description;
      if (manager_id !== undefined) dept.manager_id = manager_id ? Number(manager_id) : undefined;
      if (status) dept.status = status;
      dept.updated_at = new Date().toISOString();

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'DEPARTMENT_UPDATED',
        module: 'Departments',
        recordId: dept.id,
        details: `Updated department ${dept.department_name}`,
        ipAddress: req.ip,
      });

      return res.json({ success: true, data: dept, message: 'Department updated successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static delete = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const hasEmployees = db.employees.some(e => e.department_id === id);
      if (hasEmployees) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete department that contains active employees. Please reassign them first.',
        });
      }

      const index = db.departments.findIndex(d => d.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      const deleted = db.departments.splice(index, 1)[0];

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'DEPARTMENT_DELETED',
        module: 'Departments',
        recordId: id,
        details: `Deleted department ${deleted.department_name}`,
        ipAddress: req.ip,
      });

      return res.json({ success: true, message: 'Department deleted successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
