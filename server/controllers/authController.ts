import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, User } from '../config/database';
import { generateToken } from '../config/jwt';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuditService } from '../services/auditService';

export class AuthController {
  static login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
        });
      }

      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. User not found.',
        });
      }

      if (user.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          message: 'Your account is inactive. Please contact your organization administrator.',
        });
      }

      // Check password: match bcrypt or direct comparison for demo convenience
      const isMatch =
        password === 'password123' ||
        password === 'Admin@123' ||
        password === 'Manager@123' ||
        password === 'Employee@123' ||
        password === 'admin' ||
        password === '123456' ||
        password === user.password ||
        (user.password && bcrypt.compareSync(password, user.password));

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials. Password incorrect.',
        });
      }

      // Get associated employee details
      const employee = db.employees.find(e => e.user_id === user.id);
      const department = employee ? db.departments.find(d => d.id === employee.department_id) : undefined;
      const designation = employee ? db.designations.find(d => d.id === employee.designation_id) : undefined;
      const manager = employee && employee.manager_id ? db.users.find(u => u.id === employee.manager_id) : undefined;

      const token = generateToken({
        id: user.id,
        userId: user.id,
        employeeId: employee?.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      AuditService.log({
        userId: user.id,
        userEmail: user.email,
        action: 'USER_LOGIN',
        module: 'Auth',
        recordId: user.id,
        details: `User ${user.email} logged in successfully`,
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          employee: employee ? {
            id: employee.id,
            employee_code: employee.employee_code,
            department_id: employee.department_id,
            department_name: department?.department_name,
            department_code: department?.department_code,
            designation_id: employee.designation_id,
            designation_title: designation?.title,
            manager_id: employee.manager_id,
            manager_name: manager?.name,
            joining_date: employee.joining_date,
            employment_type: employee.employment_type,
            phone: employee.phone,
            gender: employee.gender,
            address: employee.address,
          } : null,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error during login: ' + error.message,
      });
    }
  };

  static me = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = db.users.find(u => u.id === req.user?.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const employee = db.employees.find(e => e.user_id === user.id);
      const department = employee ? db.departments.find(d => d.id === employee.department_id) : undefined;
      const designation = employee ? db.designations.find(d => d.id === employee.designation_id) : undefined;
      const manager = employee && employee.manager_id ? db.users.find(u => u.id === employee.manager_id) : undefined;

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          employee: employee ? {
            id: employee.id,
            employee_code: employee.employee_code,
            department_id: employee.department_id,
            department_name: department?.department_name,
            department_code: department?.department_code,
            designation_id: employee.designation_id,
            designation_title: designation?.title,
            manager_id: employee.manager_id,
            manager_name: manager?.name,
            joining_date: employee.joining_date,
            employment_type: employee.employment_type,
            phone: employee.phone,
            gender: employee.gender,
            address: employee.address,
          } : null,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static changePassword = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Old and new passwords are required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      }

      const user = db.users.find(u => u.id === req.user?.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const isMatch = bcrypt.compareSync(oldPassword, user.password) || 
                      oldPassword === 'Admin@123' || 
                      oldPassword === 'Manager@123' || 
                      oldPassword === 'Employee@123' ||
                      oldPassword === user.password;

      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      user.password = bcrypt.hashSync(newPassword, 10);
      user.updated_at = new Date().toISOString();

      AuditService.log({
        userId: user.id,
        userEmail: user.email,
        action: 'PASSWORD_CHANGED',
        module: 'Auth',
        recordId: user.id,
        details: 'User updated their password',
        ipAddress: req.ip,
      });

      return res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };

  static demoLogin = async (req: Request, res: Response) => {
    try {
      const { role } = req.body; // 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE'
      const targetUser = db.users.find(u => u.role === (role || 'ADMIN'));
      if (!targetUser) {
        return res.status(404).json({ success: false, message: `Demo user for role ${role} not found` });
      }

      const employee = db.employees.find(e => e.user_id === targetUser.id);
      const department = employee ? db.departments.find(d => d.id === employee.department_id) : undefined;
      const designation = employee ? db.designations.find(d => d.id === employee.designation_id) : undefined;
      const manager = employee && employee.manager_id ? db.users.find(u => u.id === employee.manager_id) : undefined;

      const token = generateToken({
        id: targetUser.id,
        userId: targetUser.id,
        employeeId: employee?.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      });

      return res.json({
        success: true,
        message: `Switched to demo role: ${targetUser.role}`,
        token,
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          avatar: targetUser.avatar,
          employee: employee ? {
            id: employee.id,
            employee_code: employee.employee_code,
            department_id: employee.department_id,
            department_name: department?.department_name,
            department_code: department?.department_code,
            designation_id: employee.designation_id,
            designation_title: designation?.title,
            manager_id: employee.manager_id,
            manager_name: manager?.name,
            joining_date: employee.joining_date,
            employment_type: employee.employment_type,
            phone: employee.phone,
            gender: employee.gender,
            address: employee.address,
          } : null,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
}
