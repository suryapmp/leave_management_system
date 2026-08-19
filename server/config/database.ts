import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  employee_id?: number;
  name: string;
  email: string;
  password: string; // bcrypt hashed or plaintext in dev
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  status: 'ACTIVE' | 'INACTIVE';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: number;
  department_name: string;
  department_code: string;
  description: string;
  manager_id?: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface Designation {
  id: number;
  title: string;
  code: string;
  department_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  user_id: number;
  department_id: number;
  designation_id: number;
  manager_id?: number;
  phone?: string;
  emergency_contact?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  joining_date: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'ACTIVE' | 'INACTIVE' | 'PROBATION' | 'TERMINATED';
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  description: string;
  annual_limit: number;
  carry_forward_allowed: boolean;
  max_carry_forward: number;
  document_required: boolean;
  minimum_days: number;
  maximum_days: number;
  color_code: string;
  is_paid: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
  carried_forward: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: number;
  request_number: string;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  start_session: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
  end_session: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
  total_days: number;
  reason: string;
  document?: string;
  document_name?: string;
  status: 'DRAFT' | 'PENDING' | 'MANAGER_APPROVED' | 'HR_APPROVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  current_approver_id?: number;
  rejection_reason?: string;
  cancellation_reason?: string;
  submitted_at: string;
  approved_at?: string;
  rejected_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveApprovalHistory {
  id: number;
  leave_request_id: number;
  approver_id: number;
  action: 'SUBMITTED' | 'MANAGER_APPROVED' | 'HR_APPROVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  comments?: string;
  action_date: string;
}

export interface Holiday {
  id: number;
  holiday_name: string;
  holiday_date: string;
  description: string;
  holiday_type: 'MANDATORY' | 'OPTIONAL' | 'REGIONAL';
  year: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'LEAVE_SUBMITTED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'LEAVE_CANCELLED' | 'BALANCE_ADJUSTED' | 'SYSTEM';
  is_read: boolean;
  reference_type?: string;
  reference_id?: number;
  created_at: string;
}

export interface LeaveBalanceAdjustment {
  id: number;
  employee_id: number;
  leave_type_id: number;
  adjusted_by: number;
  adjustment_type: 'ADD' | 'DEDUCT' | 'OVERRIDE';
  amount: number;
  previous_balance: number;
  new_balance: number;
  reason: string;
  created_at: string;
}

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  module: string;
  record_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

class InMemoryDatabase {
  users: User[] = [];
  departments: Department[] = [];
  designations: Designation[] = [];
  employees: Employee[] = [];
  leave_types: LeaveType[] = [];
  leave_balances: LeaveBalance[] = [];
  leave_requests: LeaveRequest[] = [];
  leave_approval_history: LeaveApprovalHistory[] = [];
  holidays: Holiday[] = [];
  notifications: Notification[] = [];
  leave_balance_adjustments: LeaveBalanceAdjustment[] = [];
  system_settings: SystemSetting[] = [];
  audit_logs: AuditLog[] = [];

  private nextIds = {
    users: 1,
    departments: 1,
    designations: 1,
    employees: 1,
    leave_types: 1,
    leave_balances: 1,
    leave_requests: 1,
    leave_approval_history: 1,
    holidays: 1,
    notifications: 1,
    leave_balance_adjustments: 1,
    system_settings: 1,
    audit_logs: 1,
  };

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    const now = new Date().toISOString();
    const currentYear = new Date().getFullYear();

    // Default password hash for Admin@123, Manager@123, Employee@123
    const salt = bcrypt.genSaltSync(10);
    const adminPass = bcrypt.hashSync('Admin@123', salt);
    const managerPass = bcrypt.hashSync('Manager@123', salt);
    const employeePass = bcrypt.hashSync('Employee@123', salt);

    // 1. System Settings
    this.system_settings = [
      { id: 1, setting_key: 'company_name', setting_value: 'LeaveEase Enterprise Inc.', description: 'Organization display name', updated_at: now },
      { id: 2, setting_key: 'exclude_weekends', setting_value: 'true', description: 'Exclude Saturdays & Sundays from leave day calculations', updated_at: now },
      { id: 3, setting_key: 'exclude_holidays', setting_value: 'true', description: 'Exclude designated company holidays from leave count', updated_at: now },
      { id: 4, setting_key: 'two_tier_approval', setting_value: 'false', description: 'Require both Manager and HR approval workflow', updated_at: now },
      { id: 5, setting_key: 'allow_negative_balance', setting_value: 'false', description: 'Allow employees to take leave beyond available balance', updated_at: now },
      { id: 6, setting_key: 'fiscal_year_start', setting_value: '01-01', description: 'Start of leave fiscal year (MM-DD)', updated_at: now },
      { id: 7, setting_key: 'auto_notify_email', setting_value: 'true', description: 'Simulate email notifications along with in-app alerts', updated_at: now },
    ];
    this.nextIds.system_settings = 8;

    // 2. Departments
    this.departments = [
      { id: 1, department_name: 'Engineering & Technology', department_code: 'ENG', description: 'Software Architecture, Cloud, DevOps, and Quality Assurance', status: 'ACTIVE', created_at: now, updated_at: now },
      { id: 2, department_name: 'Human Resources & Talent', department_code: 'HR', description: 'People Operations, Recruitment, Culture, and Benefits', status: 'ACTIVE', created_at: now, updated_at: now },
      { id: 3, department_name: 'Sales & Business Development', department_code: 'SALES', description: 'Enterprise Sales, Account Management, and Revenue Growth', status: 'ACTIVE', created_at: now, updated_at: now },
      { id: 4, department_name: 'Finance & Operations', department_code: 'FIN', description: 'Corporate Accounting, Financial Planning, and Legal Affairs', status: 'ACTIVE', created_at: now, updated_at: now },
    ];
    this.nextIds.departments = 5;

    // 3. Designations
    this.designations = [
      { id: 1, title: 'VP of Engineering', code: 'VP-ENG', department_id: 1, created_at: now, updated_at: now },
      { id: 2, title: 'Engineering Manager', code: 'EM-ENG', department_id: 1, created_at: now, updated_at: now },
      { id: 3, title: 'Senior Full-Stack Engineer', code: 'SR-ENG', department_id: 1, created_at: now, updated_at: now },
      { id: 4, title: 'Frontend Developer', code: 'FE-DEV', department_id: 1, created_at: now, updated_at: now },
      { id: 5, title: 'QA Automation Engineer', code: 'QA-ENG', department_id: 1, created_at: now, updated_at: now },
      { id: 6, title: 'Head of Human Resources', code: 'HR-HEAD', department_id: 2, created_at: now, updated_at: now },
      { id: 7, title: 'HR Generalist & Talent Lead', code: 'HR-GEN', department_id: 2, created_at: now, updated_at: now },
      { id: 8, title: 'Director of Sales', code: 'SALES-DIR', department_id: 3, created_at: now, updated_at: now },
      { id: 9, title: 'Senior Account Executive', code: 'SR-AE', department_id: 3, created_at: now, updated_at: now },
      { id: 10, title: 'Chief Financial Officer', code: 'CFO', department_id: 4, created_at: now, updated_at: now },
      { id: 11, title: 'Senior Financial Analyst', code: 'SR-FIN', department_id: 4, created_at: now, updated_at: now },
    ];
    this.nextIds.designations = 12;

    // 4. Leave Types
    this.leave_types = [
      { id: 1, name: 'Casual Leave', code: 'CL', description: 'For urgent personal matters, short family events, and personal errands', annual_limit: 12, carry_forward_allowed: false, max_carry_forward: 0, document_required: false, minimum_days: 0.5, maximum_days: 3, color_code: '#2563EB', is_paid: true, status: 'ACTIVE', created_at: now, updated_at: now },
      { id: 2, name: 'Sick Leave', code: 'SL', description: 'For health recovery, illness, surgeries, or doctor consultations', annual_limit: 10, carry_forward_allowed: true, max_carry_forward: 5, document_required: true, minimum_days: 0.5, maximum_days: 10, color_code: '#DC2626', is_paid: true, status: 'ACTIVE', created_at: now, updated_at: now },
      { id: 3, name: 'Earned Leave / Annual Vacation', code: 'EL', description: 'Planned vacations, rest, and personal recreation time', annual_limit: 18, carry_forward_allowed: true, max_carry_forward: 15, document_required: false, minimum_days: 1.0, maximum_days: 15, color_code: '#059669', is_paid: true, status: 'ACTIVE', created_at: now, updated_at: now },
      { id: 4, name: 'Maternity Leave', code: 'ML', description: 'Statutory maternity leave for expecting and nursing mothers', annual_limit: 90, carry_forward_allowed: false, max_carry_forward: 0, document_required: true, minimum_days: 30, maximum_days: 90, color_code: '#DB2777', is_paid: true, status: 'ACTIVE', created_at: now, updated_at: now },
      { id: 5, name: 'Paternity Leave', code: 'PL', description: 'Paternity leave for new fathers welcoming a child', annual_limit: 10, carry_forward_allowed: false, max_carry_forward: 0, document_required: true, minimum_days: 1.0, maximum_days: 10, color_code: '#7C3AED', is_paid: true, status: 'ACTIVE', created_at: now, updated_at: now },
      { id: 6, name: 'Compensatory Off', code: 'COMP', description: 'Time off granted in exchange for worked weekends or project sprints', annual_limit: 6, carry_forward_allowed: false, max_carry_forward: 0, document_required: false, minimum_days: 0.5, maximum_days: 3, color_code: '#D97706', is_paid: true, status: 'ACTIVE', created_at: now, updated_at: now },
      { id: 7, name: 'Loss of Pay (Unpaid)', code: 'LOP', description: 'Approved unpaid leave taken beyond all available leave balances', annual_limit: 30, carry_forward_allowed: false, max_carry_forward: 0, document_required: false, minimum_days: 0.5, maximum_days: 30, color_code: '#4B5563', is_paid: false, status: 'ACTIVE', created_at: now, updated_at: now },
    ];
    this.nextIds.leave_types = 8;

    // 5. Holidays (2026)
    this.holidays = [
      { id: 1, holiday_name: "New Year's Day", holiday_date: `${currentYear}-01-01`, description: "National celebration for New Year's Day", holiday_type: 'MANDATORY', year: currentYear, created_at: now, updated_at: now },
      { id: 2, holiday_name: 'Martin Luther King Jr. Day', holiday_date: `${currentYear}-01-19`, description: 'Federal holiday commemorating Dr. Martin Luther King Jr.', holiday_type: 'MANDATORY', year: currentYear, created_at: now, updated_at: now },
      { id: 3, holiday_name: "Presidents' Day", holiday_date: `${currentYear}-02-16`, description: "Washington's Birthday federal holiday", holiday_type: 'MANDATORY', year: currentYear, created_at: now, updated_at: now },
      { id: 4, holiday_name: 'Memorial Day', holiday_date: `${currentYear}-05-25`, description: 'Honoring and mourning military personnel', holiday_type: 'MANDATORY', year: currentYear, created_at: now, updated_at: now },
      { id: 5, holiday_name: 'Independence Day', holiday_date: `${currentYear}-07-04`, description: 'Declaration of Independence holiday', holiday_type: 'MANDATORY', year: currentYear, created_at: now, updated_at: now },
      { id: 6, holiday_name: 'Labor Day', holiday_date: `${currentYear}-09-07`, description: 'Honoring the American labor movement and workers', holiday_type: 'MANDATORY', year: currentYear, created_at: now, updated_at: now },
      { id: 7, holiday_name: 'Thanksgiving Day', holiday_date: `${currentYear}-11-26`, description: 'National harvest and thanksgiving celebration', holiday_type: 'MANDATORY', year: currentYear, created_at: now, updated_at: now },
      { id: 8, holiday_name: 'Day After Thanksgiving', holiday_date: `${currentYear}-11-27`, description: 'Extended thanksgiving holiday weekend', holiday_type: 'OPTIONAL', year: currentYear, created_at: now, updated_at: now },
      { id: 9, holiday_name: 'Christmas Eve', holiday_date: `${currentYear}-12-24`, description: 'Winter holiday eve celebration', holiday_type: 'OPTIONAL', year: currentYear, created_at: now, updated_at: now },
      { id: 10, holiday_name: 'Christmas Day', holiday_date: `${currentYear}-12-25`, description: 'Winter Christmas celebration', holiday_type: 'MANDATORY', year: currentYear, created_at: now, updated_at: now },
    ];
    this.nextIds.holidays = 11;

    // 6. Users & Employees
    // Let's create primary seed accounts:
    // User 1: Admin (Sarah Jenkins) - HR/Admin
    // User 2: Manager (David Miller) - Engineering Manager
    // User 3: Employee (Alex Johnson) - Senior Full-Stack Engineer (Reports to David Miller)
    // User 4: HR Specialist (Emily Clark)
    // User 5: Employee (Michael Chang) - Frontend Developer (Reports to David Miller)
    // User 6: Employee (Sophia Rodriguez) - QA Engineer (Reports to David Miller)
    // User 7: Manager (Robert Taylor) - Sales Director
    // User 8: Employee (Olivia Martinez) - Senior AE (Reports to Robert Taylor)
    // User 9: Manager (James Wilson) - CFO
    // User 10: Employee (Daniel Lee) - Financial Analyst (Reports to James Wilson)

    const rawUsers: Array<Omit<User, 'id' | 'created_at' | 'updated_at'> & { employee_code: string; department_id: number; designation_id: number; manager_id?: number; phone: string; joining_date: string; employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'; gender: 'MALE' | 'FEMALE' | 'OTHER'; address: string }> = [
      {
        name: 'Sarah Jenkins',
        email: 'admin@leaveease.com',
        password: adminPass,
        role: 'ADMIN',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        employee_code: 'EMP-1001',
        department_id: 2,
        designation_id: 6,
        phone: '+1 (555) 234-5670',
        joining_date: '2022-01-15',
        employment_type: 'FULL_TIME',
        gender: 'FEMALE',
        address: '100 Silicon Blvd, Suite 400, San Francisco, CA'
      },
      {
        name: 'David Miller',
        email: 'manager@leaveease.com',
        password: managerPass,
        role: 'MANAGER',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        employee_code: 'EMP-1002',
        department_id: 1,
        designation_id: 2,
        phone: '+1 (555) 345-6781',
        joining_date: '2022-03-01',
        employment_type: 'FULL_TIME',
        gender: 'MALE',
        address: '240 Tech Park Way, San Jose, CA'
      },
      {
        name: 'Alex Johnson',
        email: 'employee@leaveease.com',
        password: employeePass,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        employee_code: 'EMP-1003',
        department_id: 1,
        designation_id: 3,
        manager_id: 2, // Reports to David Miller (Employee #2)
        phone: '+1 (555) 456-7892',
        joining_date: '2023-06-12',
        employment_type: 'FULL_TIME',
        gender: 'MALE',
        address: '55 Pine Street, Apt 3B, Oakland, CA'
      },
      {
        name: 'Emily Clark',
        email: 'hr@leaveease.com',
        password: adminPass,
        role: 'HR',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        employee_code: 'EMP-1004',
        department_id: 2,
        designation_id: 7,
        manager_id: 1,
        phone: '+1 (555) 567-8903',
        joining_date: '2023-02-10',
        employment_type: 'FULL_TIME',
        gender: 'FEMALE',
        address: '78 Mission Street, San Francisco, CA'
      },
      {
        name: 'Michael Chang',
        email: 'michael.c@leaveease.com',
        password: employeePass,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        employee_code: 'EMP-1005',
        department_id: 1,
        designation_id: 4,
        manager_id: 2, // Reports to David Miller
        phone: '+1 (555) 678-9014',
        joining_date: '2023-09-01',
        employment_type: 'FULL_TIME',
        gender: 'MALE',
        address: '412 Broadway, San Francisco, CA'
      },
      {
        name: 'Sophia Rodriguez',
        email: 'sophia.r@leaveease.com',
        password: employeePass,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        employee_code: 'EMP-1006',
        department_id: 1,
        designation_id: 5,
        manager_id: 2, // Reports to David Miller
        phone: '+1 (555) 789-0125',
        joining_date: '2024-01-15',
        employment_type: 'FULL_TIME',
        gender: 'FEMALE',
        address: '890 Castro St, Mountain View, CA'
      },
      {
        name: 'Robert Taylor',
        email: 'robert.t@leaveease.com',
        password: managerPass,
        role: 'MANAGER',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        employee_code: 'EMP-1007',
        department_id: 3,
        designation_id: 8,
        phone: '+1 (555) 890-1236',
        joining_date: '2022-08-20',
        employment_type: 'FULL_TIME',
        gender: 'MALE',
        address: '320 University Ave, Palo Alto, CA'
      },
      {
        name: 'Olivia Martinez',
        email: 'olivia.m@leaveease.com',
        password: employeePass,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        employee_code: 'EMP-1008',
        department_id: 3,
        designation_id: 9,
        manager_id: 7, // Reports to Robert Taylor
        phone: '+1 (555) 901-2347',
        joining_date: '2023-11-05',
        employment_type: 'FULL_TIME',
        gender: 'FEMALE',
        address: '150 4th Street, San Francisco, CA'
      },
      {
        name: 'James Wilson',
        email: 'james.w@leaveease.com',
        password: managerPass,
        role: 'MANAGER',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        employee_code: 'EMP-1009',
        department_id: 4,
        designation_id: 10,
        phone: '+1 (555) 012-3458',
        joining_date: '2021-11-10',
        employment_type: 'FULL_TIME',
        gender: 'MALE',
        address: '500 Market Street, San Francisco, CA'
      },
      {
        name: 'Daniel Lee',
        email: 'daniel.l@leaveease.com',
        password: employeePass,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        employee_code: 'EMP-1010',
        department_id: 4,
        designation_id: 11,
        manager_id: 9, // Reports to James Wilson
        phone: '+1 (555) 123-4569',
        joining_date: '2024-02-01',
        employment_type: 'FULL_TIME',
        gender: 'MALE',
        address: '678 Embarcadero, San Francisco, CA'
      }
    ];

    rawUsers.forEach((u, index) => {
      const id = index + 1;
      const user: User = {
        id,
        employee_id: id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        status: u.status,
        avatar: u.avatar,
        created_at: now,
        updated_at: now,
      };
      this.users.push(user);

      const emp: Employee = {
        id,
        employee_code: u.employee_code,
        user_id: id,
        department_id: u.department_id,
        designation_id: u.designation_id,
        manager_id: u.manager_id,
        phone: u.phone,
        emergency_contact: '+1 (555) 999-0000',
        gender: u.gender,
        joining_date: u.joining_date,
        employment_type: u.employment_type,
        status: 'ACTIVE',
        address: u.address,
        created_at: now,
        updated_at: now,
      };
      this.employees.push(emp);
    });
    this.nextIds.users = rawUsers.length + 1;
    this.nextIds.employees = rawUsers.length + 1;

    // Update Department Managers
    this.departments[0].manager_id = 2; // David Miller for Engineering
    this.departments[1].manager_id = 1; // Sarah Jenkins for HR
    this.departments[2].manager_id = 7; // Robert Taylor for Sales
    this.departments[3].manager_id = 9; // James Wilson for Finance

    // 7. Seed Leave Balances for all employees for current year
    let balanceId = 1;
    this.employees.forEach((emp) => {
      this.leave_types.forEach((lt) => {
        const carried = lt.carry_forward_allowed ? (emp.id === 3 ? 3.0 : 2.0) : 0.0;
        const allocated = lt.annual_limit + carried;
        let used = 0;
        let pending = 0;

        // Custom realistic initial values for Alex Johnson (Employee #3)
        if (emp.id === 3) {
          if (lt.code === 'CL') {
            used = 2.0;
            pending = 1.0;
          } else if (lt.code === 'SL') {
            used = 1.0;
            pending = 0;
          } else if (lt.code === 'EL') {
            used = 4.0;
            pending = 0;
          }
        } else if (emp.id === 5) { // Michael Chang
          if (lt.code === 'CL') used = 1.5;
          if (lt.code === 'EL') used = 2.0;
        }

        const remaining = Math.max(0, allocated - used - pending);

        this.leave_balances.push({
          id: balanceId++,
          employee_id: emp.id,
          leave_type_id: lt.id,
          year: currentYear,
          allocated,
          used,
          pending,
          remaining,
          carried_forward: carried,
          created_at: now,
          updated_at: now,
        });
      });
    });
    this.nextIds.leave_balances = balanceId;

    // 8. Seed Leave Requests & History
    this.leave_requests = [
      {
        id: 1,
        request_number: 'LR-2026-0001',
        employee_id: 3, // Alex Johnson
        leave_type_id: 1, // Casual Leave
        start_date: `${currentYear}-08-25`,
        end_date: `${currentYear}-08-25`,
        start_session: 'FULL_DAY',
        end_session: 'FULL_DAY',
        total_days: 1.0,
        reason: 'Attending sibling graduation ceremony out of town.',
        status: 'PENDING',
        current_approver_id: 2, // David Miller
        submitted_at: new Date(Date.now() - 86400000).toISOString(),
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 2,
        request_number: 'LR-2026-0002',
        employee_id: 3, // Alex Johnson
        leave_type_id: 3, // Earned Leave
        start_date: `${currentYear}-07-13`,
        end_date: `${currentYear}-07-16`,
        start_session: 'FULL_DAY',
        end_session: 'FULL_DAY',
        total_days: 4.0,
        reason: 'Annual family summer hiking vacation.',
        status: 'APPROVED',
        current_approver_id: 2,
        submitted_at: `${currentYear}-06-20T10:00:00Z`,
        approved_at: `${currentYear}-06-21T14:30:00Z`,
        created_at: `${currentYear}-06-20T10:00:00Z`,
        updated_at: `${currentYear}-06-21T14:30:00Z`,
      },
      {
        id: 3,
        request_number: 'LR-2026-0003',
        employee_id: 5, // Michael Chang
        leave_type_id: 2, // Sick Leave
        start_date: `${currentYear}-08-27`,
        end_date: `${currentYear}-08-28`,
        start_session: 'FULL_DAY',
        end_session: 'FULL_DAY',
        total_days: 2.0,
        reason: 'Scheduled dental oral surgery recovery.',
        document: '/uploads/sample-medical-cert.pdf',
        document_name: 'Dentist_Medical_Certificate.pdf',
        status: 'PENDING',
        current_approver_id: 2,
        submitted_at: new Date(Date.now() - 43200000).toISOString(),
        created_at: new Date(Date.now() - 43200000).toISOString(),
        updated_at: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 4,
        request_number: 'LR-2026-0004',
        employee_id: 6, // Sophia Rodriguez
        leave_type_id: 1, // Casual Leave
        start_date: `${currentYear}-09-10`,
        end_date: `${currentYear}-09-11`,
        start_session: 'FULL_DAY',
        end_session: 'SECOND_HALF',
        total_days: 1.5,
        reason: 'Moving to new apartment across town.',
        status: 'PENDING',
        current_approver_id: 2,
        submitted_at: new Date(Date.now() - 12000000).toISOString(),
        created_at: new Date(Date.now() - 12000000).toISOString(),
        updated_at: new Date(Date.now() - 12000000).toISOString(),
      },
      {
        id: 5,
        request_number: 'LR-2026-0005',
        employee_id: 8, // Olivia Martinez
        leave_type_id: 3, // Earned Leave
        start_date: `${currentYear}-08-18`,
        end_date: `${currentYear}-08-20`,
        start_session: 'FULL_DAY',
        end_session: 'FULL_DAY',
        total_days: 3.0,
        reason: 'Attending regional sales leadership summit workshop.',
        status: 'APPROVED',
        current_approver_id: 7, // Robert Taylor
        submitted_at: `${currentYear}-08-01T09:00:00Z`,
        approved_at: `${currentYear}-08-02T11:00:00Z`,
        created_at: `${currentYear}-08-01T09:00:00Z`,
        updated_at: `${currentYear}-08-02T11:00:00Z`,
      }
    ];
    this.nextIds.leave_requests = 6;

    // 9. Leave Approval History
    this.leave_approval_history = [
      { id: 1, leave_request_id: 1, approver_id: 3, action: 'SUBMITTED', comments: 'Submitted by Alex Johnson', action_date: new Date(Date.now() - 86400000).toISOString() },
      { id: 2, leave_request_id: 2, approver_id: 3, action: 'SUBMITTED', comments: 'Submitted for summer family vacation', action_date: `${currentYear}-06-20T10:00:00Z` },
      { id: 3, leave_request_id: 2, approver_id: 2, action: 'APPROVED', comments: 'Approved. Enjoy your well-deserved break!', action_date: `${currentYear}-06-21T14:30:00Z` },
      { id: 4, leave_request_id: 3, approver_id: 5, action: 'SUBMITTED', comments: 'Submitted with attached medical certificate', action_date: new Date(Date.now() - 43200000).toISOString() },
      { id: 5, leave_request_id: 4, approver_id: 6, action: 'SUBMITTED', comments: 'Submitted for apartment relocation', action_date: new Date(Date.now() - 12000000).toISOString() },
      { id: 6, leave_request_id: 5, approver_id: 8, action: 'SUBMITTED', comments: 'Submitted request for sales summit', action_date: `${currentYear}-08-01T09:00:00Z` },
      { id: 7, leave_request_id: 5, approver_id: 7, action: 'APPROVED', comments: 'Approved by Sales Director Robert Taylor', action_date: `${currentYear}-08-02T11:00:00Z` },
    ];
    this.nextIds.leave_approval_history = 8;

    // 10. Notifications
    this.notifications = [
      { id: 1, user_id: 2, title: 'New Leave Request Received', message: 'Alex Johnson applied for 1.0 day(s) Casual Leave on 2026-08-25.', type: 'LEAVE_SUBMITTED', is_read: false, reference_type: 'leave_request', reference_id: 1, created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 2, user_id: 2, title: 'New Leave Request Received', message: 'Michael Chang applied for 2.0 day(s) Sick Leave starting 2026-08-27.', type: 'LEAVE_SUBMITTED', is_read: false, reference_type: 'leave_request', reference_id: 3, created_at: new Date(Date.now() - 43200000).toISOString() },
      { id: 3, user_id: 3, title: 'Leave Approved', message: 'Your Earned Leave request (LR-2026-0002) for 4.0 days has been approved by David Miller.', type: 'LEAVE_APPROVED', is_read: true, reference_type: 'leave_request', reference_id: 2, created_at: `${currentYear}-06-21T14:30:00Z` },
      { id: 4, user_id: 1, title: 'System Initialized', message: 'LeaveEase System is running smoothly with active organization policies.', type: 'SYSTEM', is_read: false, created_at: now }
    ];
    this.nextIds.notifications = 5;

    // 11. Audit Logs
    this.audit_logs = [
      { id: 1, user_id: 1, user_email: 'admin@leaveease.com', action: 'SYSTEM_INIT', module: 'System', record_id: '1', details: 'Database seeded and initial leave policies established', ip_address: '127.0.0.1', created_at: now },
      { id: 2, user_id: 3, user_email: 'employee@leaveease.com', action: 'LEAVE_APPLY', module: 'Leave', record_id: '1', details: 'Applied for 1.0 day Casual Leave', ip_address: '127.0.0.1', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, user_id: 2, user_email: 'manager@leaveease.com', action: 'LEAVE_APPROVE', module: 'Leave', record_id: '2', details: 'Approved 4.0 days Earned Leave for Alex Johnson', ip_address: '127.0.0.1', created_at: `${currentYear}-06-21T14:30:00Z` }
    ];
    this.nextIds.audit_logs = 4;
  }

  // Helper generators
  getNextId(table: keyof typeof this.nextIds): number {
    return this.nextIds[table]++;
  }
}

export const db = new InMemoryDatabase();
