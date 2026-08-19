export type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type LeaveStatus = 'DRAFT' | 'PENDING' | 'MANAGER_APPROVED' | 'HR_APPROVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type SessionType = 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
export type HolidayType = 'MANDATORY' | 'OPTIONAL' | 'REGIONAL';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  employee?: {
    id: number;
    employee_code: string;
    department_id: number;
    department_name?: string;
    department_code?: string;
    designation_id: number;
    designation_title?: string;
    manager_id?: number;
    manager_name?: string;
    joining_date: string;
    employment_type: string;
    phone?: string;
    gender?: string;
    address?: string;
  } | null;
}

export interface EmployeeListItem {
  id: number;
  employee_code: string;
  user_id: number;
  name: string;
  email: string;
  role: UserRole;
  user_status: UserStatus;
  department_id: number;
  department_name: string;
  department_code: string;
  designation_id: number;
  designation_title: string;
  manager_id?: number;
  manager_name: string;
  phone?: string;
  gender: string;
  joining_date: string;
  employment_type: string;
  status: string;
  address?: string;
  avatar?: string;
  created_at: string;
}

export interface Department {
  id: number;
  department_name: string;
  department_code: string;
  description: string;
  manager_id?: number;
  manager_name?: string;
  employee_count?: number;
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
  leave_type_name?: string;
  leave_type_code?: string;
  color_code?: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
  carried_forward: number;
  created_at: string;
  updated_at: string;
}

export interface CalculatedDay {
  date: string;
  day_of_week: string;
  day_type: SessionType;
  day_count: number;
  is_weekend: boolean;
  is_holiday: boolean;
  holiday_name?: string;
  is_deductible: boolean;
}

export interface CalculationPreview {
  start_date: string;
  end_date: string;
  calendar_days: number;
  working_days: number;
  total_leave_days: number;
  breakdown: CalculatedDay[];
  valid: boolean;
  errors: string[];
  balance_info?: {
    allocated: number;
    used: number;
    pending: number;
    available: number;
    requested_days: number;
    remaining_after: number;
    is_insufficient: boolean;
  };
  overlap_info?: {
    hasOverlap: boolean;
    overlappingRequest?: any;
  };
  policy_validation?: {
    allowed: boolean;
    warnings: string[];
  };
}

export interface LeaveApprovalHistoryItem {
  id: number;
  leave_request_id: number;
  approver_id: number;
  approver_name: string;
  approver_role: string;
  approver_avatar?: string;
  action: 'SUBMITTED' | 'MANAGER_APPROVED' | 'HR_APPROVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  comments?: string;
  action_date: string;
}

export interface LeaveRequest {
  id: number;
  request_number: string;
  employee_id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  start_session: SessionType;
  end_session: SessionType;
  total_days: number;
  reason: string;
  document?: string;
  document_name?: string;
  status: LeaveStatus;
  current_approver_id?: number;
  current_approver_name?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  submitted_at: string;
  approved_at?: string;
  rejected_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: number;
    name: string;
    email: string;
    employee_code: string;
    avatar?: string;
    department_name?: string;
    designation_title?: string;
  };
  leave_type?: {
    id: number;
    name: string;
    code: string;
    color_code: string;
    is_paid: boolean;
  };
  history?: LeaveApprovalHistoryItem[];
  breakdown?: CalculatedDay[];
}

export interface Holiday {
  id: number;
  holiday_name: string;
  holiday_date: string;
  description: string;
  holiday_type: HolidayType;
  year: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
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

export interface SystemSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  module: string;
  record_id?: string;
  details?: string;
  metadata?: any;
  ip_address?: string;
  created_at: string;
}

export interface DashboardSummary {
  metrics: {
    total_employees: number;
    on_leave_today: number;
    pending_requests: number;
    approved_days_this_month: number;
    departments_count: number;
  };
  leave_type_distribution: Array<{
    id: number;
    name: string;
    code: string;
    color: string;
    days_used: number;
  }>;
  monthly_trends: Array<{
    month: string;
    approved: number;
    pending: number;
  }>;
  department_usage: Array<{
    id: number;
    department_name: string;
    department_code: string;
    employee_count: number;
    total_leave_days: number;
  }>;
  upcoming_holidays: Holiday[];
}
