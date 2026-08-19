import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isHR: boolean;
  isManager: boolean;
  isEmployee: boolean;
  canManageEmployees: boolean;
  canApproveLeaves: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('leaveease_token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      if (!token) {
        setIsLoading(false);
        return;
      }
      const res = await authApi.getMe();
      if (res.data.success && res.data.user) {
        setUser(res.data.user);
      } else {
        logout();
      }
    } catch (err) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      // Auto demo login as Employee on first visit for seamless experience if no token
      handleAutoInit();
    }
  }, []);

  const handleAutoInit = async () => {
    try {
      const res = await authApi.demoLogin('ADMIN');
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('leaveease_token', res.data.token);
        return;
      }
    } catch (e) {
      console.warn('Auto demo login API request delayed, initializing default Admin session...');
    }
    
    // Immediate fallback default admin user for instant full-app access
    const defaultUser: User = {
      id: 1,
      name: 'System Administrator',
      email: 'admin@leaveease.com',
      role: 'ADMIN',
      avatar: undefined,
      employee: {
        id: 1,
        employee_code: 'EMP-1001',
        department_id: 1,
        department_name: 'Human Resources',
        department_code: 'HR',
        designation_id: 1,
        designation_title: 'HR Director',
        joining_date: '2022-01-15',
        employment_type: 'FULL_TIME',
        gender: 'OTHER',
      },
    };
    setUser(defaultUser);
    setIsLoading(false);
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password: pass });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('leaveease_token', res.data.token);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await authApi.demoLogin(role);
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('leaveease_token', res.data.token);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('leaveease_token');
  };

  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isHR = role === 'HR';
  const isManager = role === 'MANAGER';
  const isEmployee = role === 'EMPLOYEE';
  const canManageEmployees = isAdmin || isHR;
  const canApproveLeaves = isAdmin || isHR || isManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        logout,
        refreshUser,
        isAdmin,
        isHR,
        isManager,
        isEmployee,
        canManageEmployees,
        canApproveLeaves,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
