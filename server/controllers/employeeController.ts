import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, Employee, User } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';
import { LeaveBalanceService } from '../services/leaveBalanceService';

export class EmployeeController {
  static getAll = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { departmentId, status, search, role } = req.query;

      let employeesList = db.employees.map(emp => {
        const user = db.users.find(u => u.id === emp.user_id);
        const dept = db.departments.find(d => d.id === emp.department_id);
        const desig = db.designations.find(d => d.id === emp.designation_id);
        const mgrUser = emp.manager_id ? db.users.find(u => u.id === emp.manager_id) : undefined;

        return {
          id: emp.id,
          employee_code: emp.employee_code,
          user_id: emp.user_id,
          name: user?.name || 'Unknown',
          email: user?.email || '',
          role: user?.role || 'EMPLOYEE',
          user_status: user?.status || 'ACTIVE',
          department_id: emp.department_id,
          department_name: dept?.department_name || 'Unassigned',
          department_code: dept?.department_code || '',
          designation_id: emp.designation_id,
          designation_title: desig?.title || 'Staff',
          manager_id: emp.manager_id,
          manager_name: mgrUser?.name || 'None',
          phone: emp.phone,
          gender: emp.gender,
          joining_date: emp.joining_date,
          employment_type: emp.employment_type,
          status: emp.status,
          address: emp.address,
          avatar: user?.avatar,
          created_at: emp.created_at,
        };
      });

      // Filter by department
      if (departmentId) {
        employeesList = employeesList.filter(e => e.department_id === Number(departmentId));
      }

      // Filter by status
      if (status) {
        employeesList = employeesList.filter(e => e.status === status);
      }

      // Filter by role
      if (role) {
        employeesList = employeesList.filter(e => e.role === role);
      }

      // Search keyword
      if (search) {
        const q = String(search).toLowerCase();
        employeesList = employeesList.filter(e =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.employee_code.toLowerCase().includes(q) ||
          e.department_name.toLowerCase().includes(q)
        );
      }

      return res.json({
        success: true,
        data: employeesList,
        total: employeesList.length,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static getById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const emp = db.employees.find(e => e.id === id);
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const user = db.users.find(u => u.id === emp.user_id);
      const dept = db.departments.find(d => d.id === emp.department_id);
      const desig = db.designations.find(d => d.id === emp.designation_id);
      const mgrUser = emp.manager_id ? db.users.find(u => u.id === emp.manager_id) : undefined;
      const balances = LeaveBalanceService.getEmployeeBalances(emp.id);

      return res.json({
        success: true,
        data: {
          id: emp.id,
          employee_code: emp.employee_code,
          user_id: emp.user_id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
          avatar: user?.avatar,
          department_id: emp.department_id,
          department_name: dept?.department_name,
          designation_id: emp.designation_id,
          designation_title: desig?.title,
          manager_id: emp.manager_id,
          manager_name: mgrUser?.name,
          phone: emp.phone,
          gender: emp.gender,
          joining_date: emp.joining_date,
          employment_type: emp.employment_type,
          status: emp.status,
          address: emp.address,
          balances,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        name,
        email,
        password,
        role,
        department_id,
        designation_id,
        manager_id,
        phone,
        gender,
        joining_date,
        employment_type,
        address,
      } = req.body;

      if (!name || !email || !password || !department_id || !designation_id) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: Name, Email, Password, Department, and Designation are mandatory.',
        });
      }

      const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email is already registered.' });
      }

      const now = new Date().toISOString();
      const userId = db.getNextId('users');
      const employeeId = db.getNextId('employees');
      const employeeCode = `EMP-${1000 + employeeId}`;

      const newUser: User = {
        id: userId,
        employee_id: employeeId,
        name,
        email,
        password: bcrypt.hashSync(password, 10),
        role: role || 'EMPLOYEE',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      };
      db.users.push(newUser);

      const newEmp: Employee = {
        id: employeeId,
        employee_code: employeeCode,
        user_id: userId,
        department_id: Number(department_id),
        designation_id: Number(designation_id),
        manager_id: manager_id ? Number(manager_id) : undefined,
        phone,
        gender: gender || 'OTHER',
        joining_date: joining_date || now.split('T')[0],
        employment_type: employment_type || 'FULL_TIME',
        status: 'ACTIVE',
        address,
        created_at: now,
        updated_at: now,
      };
      db.employees.push(newEmp);

      // Initialize leave balances for current year
      LeaveBalanceService.getEmployeeBalances(employeeId);

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'EMPLOYEE_CREATED',
        module: 'Employees',
        recordId: employeeId,
        details: `Created employee ${name} (${employeeCode})`,
        ipAddress: req.ip,
      });

      return res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: {
          id: employeeId,
          employee_code: employeeCode,
          name,
          email,
          role: newUser.role,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const emp = db.employees.find(e => e.id === id);
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const user = db.users.find(u => u.id === emp.user_id);
      const {
        name,
        email,
        role,
        department_id,
        designation_id,
        manager_id,
        phone,
        gender,
        joining_date,
        employment_type,
        status,
        address,
      } = req.body;

      const now = new Date().toISOString();

      if (user) {
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (status) user.status = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
        user.updated_at = now;
      }

      if (department_id) emp.department_id = Number(department_id);
      if (designation_id) emp.designation_id = Number(designation_id);
      if (manager_id !== undefined) emp.manager_id = manager_id ? Number(manager_id) : undefined;
      if (phone !== undefined) emp.phone = phone;
      if (gender) emp.gender = gender;
      if (joining_date) emp.joining_date = joining_date;
      if (employment_type) emp.employment_type = employment_type;
      if (status) emp.status = status;
      if (address !== undefined) emp.address = address;
      emp.updated_at = now;

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'EMPLOYEE_UPDATED',
        module: 'Employees',
        recordId: emp.id,
        details: `Updated details for employee ${user?.name} (${emp.employee_code})`,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: 'Employee updated successfully',
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static resetPassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const emp = db.employees.find(e => e.id === id);
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
      }

      const user = db.users.find(u => u.id === emp.user_id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Associated user account not found' });
      }

      const { newPassword } = req.body;
      const passToSet = newPassword || 'Password@123';
      user.password = bcrypt.hashSync(passToSet, 10);
      user.updated_at = new Date().toISOString();

      AuditService.log({
        userId: req.user?.userId,
        userEmail: req.user?.email,
        action: 'PASSWORD_RESET_BY_ADMIN',
        module: 'Employees',
        recordId: emp.id,
        details: `Admin reset password for employee ${user.name}`,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: `Password has been reset successfully to '${passToSet}'`,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static getTeamMembers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const managerUserId = req.user?.userId;
      const managerEmp = db.employees.find(e => e.user_id === managerUserId);

      // If admin/HR, can view any manager's team or all
      const managerId = req.query.managerId ? Number(req.query.managerId) : managerEmp?.id;

      if (!managerId) {
        return res.json({ success: true, data: [] });
      }

      const team = db.employees
        .filter(e => e.manager_id === managerId)
        .map(emp => {
          const user = db.users.find(u => u.id === emp.user_id);
          const dept = db.departments.find(d => d.id === emp.department_id);
          const desig = db.designations.find(d => d.id === emp.designation_id);
          const activeLeaves = db.leave_requests.filter(
            lr => lr.employee_id === emp.id && lr.status === 'APPROVED' &&
            new Date(lr.start_date) <= new Date() && new Date(lr.end_date) >= new Date()
          );

          return {
            id: emp.id,
            employee_code: emp.employee_code,
            name: user?.name,
            email: user?.email,
            avatar: user?.avatar,
            department_name: dept?.department_name,
            designation_title: desig?.title,
            phone: emp.phone,
            status: emp.status,
            currently_on_leave: activeLeaves.length > 0,
            active_leave_info: activeLeaves[0] ? {
              reason: activeLeaves[0].reason,
              start_date: activeLeaves[0].start_date,
              end_date: activeLeaves[0].end_date,
            } : null,
          };
        });

      return res.json({ success: true, data: team });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
