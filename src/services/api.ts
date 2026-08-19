import axios from 'axios';
import {
  User,
  EmployeeListItem,
  Department,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  CalculationPreview,
  Holiday,
  NotificationItem,
  SystemSetting,
  AuditLogItem,
  DashboardSummary,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('leaveease_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor: Catch 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        // Clear token if invalid
        // localStorage.removeItem('leaveease_token');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<{ success: boolean; token: string; user: User; message: string }>('/auth/login', credentials),
  demoLogin: (role: string) =>
    api.post<{ success: boolean; token: string; user: User; message: string }>('/auth/demo-login', { role }),
  getMe: () => api.get<{ success: boolean; user: User }>('/auth/me'),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post<{ success: boolean; message: string }>('/auth/change-password', data),
};

export const employeesApi = {
  getAll: (params?: { departmentId?: number; status?: string; search?: string; role?: string }) =>
    api.get<{ success: boolean; data: EmployeeListItem[]; total: number }>('/employees', { params }),
  getTeam: (params?: { managerId?: number }) =>
    api.get<{ success: boolean; data: any[] }>('/employees/team', { params }),
  getById: (id: number) =>
    api.get<{ success: boolean; data: any }>(`/employees/${id}`),
  create: (data: any) => api.post<{ success: boolean; message: string; data: any }>('/employees', data),
  update: (id: number, data: any) => api.put<{ success: boolean; message: string }>(`/employees/${id}`, data),
  resetPassword: (id: number, newPassword?: string) =>
    api.post<{ success: boolean; message: string }>(`/employees/${id}/reset-password`, { newPassword }),
};

export const departmentsApi = {
  getAll: () => api.get<{ success: boolean; data: Department[] }>('/departments'),
  create: (data: Partial<Department>) => api.post<{ success: boolean; data: Department; message: string }>('/departments', data),
  update: (id: number, data: Partial<Department>) => api.put<{ success: boolean; data: Department; message: string }>(`/departments/${id}`, data),
  delete: (id: number) => api.delete<{ success: boolean; message: string }>(`/departments/${id}`),
};

export const leaveTypesApi = {
  getAll: (params?: { status?: string }) => api.get<{ success: boolean; data: LeaveType[] }>('/leave-types', { params }),
  create: (data: Partial<LeaveType>) => api.post<{ success: boolean; data: LeaveType; message: string }>('/leave-types', data),
  update: (id: number, data: Partial<LeaveType>) => api.put<{ success: boolean; data: LeaveType; message: string }>(`/leave-types/${id}`, data),
  delete: (id: number) => api.delete<{ success: boolean; message: string }>(`/leave-types/${id}`),
};

export const leavesApi = {
  calculateDays: (data: {
    employee_id?: number;
    leave_type_id?: number;
    start_date: string;
    end_date: string;
    start_session?: string;
    end_session?: string;
  }) => api.post<{ success: boolean; data: CalculationPreview }>('/leaves/calculate-days', data),

  apply: (formData: FormData | any) => {
    const isFormData = formData instanceof FormData;
    return api.post<{ success: boolean; message: string; data: LeaveRequest }>('/leaves', formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  getAll: (params?: {
    status?: string;
    leaveTypeId?: number;
    departmentId?: number;
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    search?: string;
    all?: boolean;
    limit?: number;
    offset?: number;
  }) => api.get<{ success: boolean; data: LeaveRequest[]; total: number }>('/leaves', { params }),

  getById: (id: number) => api.get<{ success: boolean; data: LeaveRequest }>(`/leaves/${id}`),

  approve: (id: number, comments?: string) =>
    api.post<{ success: boolean; message: string; data: LeaveRequest }>(`/leaves/${id}/approve`, { comments }),

  reject: (id: number, rejection_reason: string) =>
    api.post<{ success: boolean; message: string; data: LeaveRequest }>(`/leaves/${id}/reject`, { rejection_reason }),

  cancel: (id: number, cancellation_reason?: string) =>
    api.post<{ success: boolean; message: string; data: LeaveRequest }>(`/leaves/${id}/cancel`, { cancellation_reason }),
};

export const leaveBalancesApi = {
  getAll: (params?: { year?: number; departmentId?: number; search?: string }) =>
    api.get<{ success: boolean; data: any[]; total: number }>('/leave-balances', { params }),

  getByEmployee: (employeeId: number, params?: { year?: number }) =>
    api.get<{ success: boolean; data: { employee_id: number; year: number; balances: LeaveBalance[]; adjustments: any[] } }>(
      `/leave-balances/${employeeId}`,
      { params }
    ),

  adjust: (data: {
    employee_id: number;
    leave_type_id: number;
    adjustment_type: 'ADD' | 'DEDUCT' | 'OVERRIDE';
    amount: number;
    reason: string;
    year?: number;
  }) => api.post<{ success: boolean; message: string; data: any }>('/leave-balances/adjust', data),
};

export const holidaysApi = {
  getAll: (params?: { year?: number }) => api.get<{ success: boolean; data: Holiday[] }>('/holidays', { params }),
  create: (data: Partial<Holiday>) => api.post<{ success: boolean; data: Holiday; message: string }>('/holidays', data),
  update: (id: number, data: Partial<Holiday>) => api.put<{ success: boolean; data: Holiday; message: string }>(`/holidays/${id}`, data),
  delete: (id: number) => api.delete<{ success: boolean; message: string }>(`/holidays/${id}`),
};

export const notificationsApi = {
  getAll: () => api.get<{ success: boolean; data: NotificationItem[]; unread_count: number }>('/notifications'),
  markAsRead: (id: number) => api.put<{ success: boolean; message: string }>(`/notifications/${id}/read`),
  markAllAsRead: () => api.put<{ success: boolean; count: number; message: string }>('/notifications/read-all'),
};

export const reportsApi = {
  getSummary: () => api.get<{ success: boolean; data: DashboardSummary }>('/reports/summary'),
  getDepartmentReport: (params?: any) => api.get<{ success: boolean; data: any[] }>('/reports/department', { params }),
  getEmployeeReport: (params?: any) => api.get<{ success: boolean; data: any[] }>('/reports/employee', { params }),
  getMonthlyReport: (params?: any) => api.get<{ success: boolean; data: any[] }>('/reports/monthly', { params }),
  getLeaveSummary: (params?: {
    department_id?: number;
    leave_type_id?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    employee_id?: number;
  }) => api.get<{ success: boolean; data: any[]; total: number; total_days_sum: number }>('/reports/leave-summary', { params }),
};

export const settingsApi = {
  getAll: () => api.get<{ success: boolean; data: any }>('/settings'),
  update: (settings: Record<string, any> | Array<{ setting_key: string; setting_value: any }>) =>
    api.post<{ success: boolean; data: any; message: string }>('/settings', { settings }),
  updateBatch: (settings: Record<string, any>) =>
    api.post<{ success: boolean; data: any; message: string }>('/settings', { settings }),
};

export const auditApi = {
  getLogs: (params?: { limit?: number; offset?: number; module?: string; user?: string }) =>
    api.get<{ success: boolean; data: AuditLogItem[]; total: number }>('/audit-logs', { params }),
};

export default api;
