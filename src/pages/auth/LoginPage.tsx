import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Shield, Briefcase, User, Sparkles, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, demoLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@leaveease.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [activeRoleLoggingIn, setActiveRoleLoggingIn] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password. Please try again.');
    }
  };

  const handleDemo = async (role: UserRole, demoEmail: string) => {
    setError('');
    setEmail(demoEmail);
    setPassword('password123');
    setActiveRoleLoggingIn(role);
    try {
      await demoLogin(role);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Demo login failed');
    } finally {
      setActiveRoleLoggingIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg mb-3">
          <span className="text-xl font-black">L</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">LeaveEase Enterprise</h2>
        <p className="mt-1 text-xs text-slate-400">Employee Leave & Time-Off Management System</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-7 px-6 sm:px-8 rounded-2xl shadow-2xl border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors text-slate-900 font-medium"
                  placeholder="admin@leaveease.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-slate-400 font-mono">default: password123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors text-slate-900 font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading && !activeRoleLoggingIn ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">1-Click Demo Login</span>
              </div>
              <span className="text-[10px] text-slate-400">Click to enter role</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('ADMIN', 'admin@leaveease.com')}
                disabled={isLoading}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-indigo-700 font-bold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </div>
                  {activeRoleLoggingIn === 'ADMIN' && (
                    <span className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Full system management</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('HR', 'hr@leaveease.com')}
                disabled={isLoading}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-pink-500 hover:bg-pink-50/50 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-pink-700 font-bold">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>HR Manager</span>
                  </div>
                  {activeRoleLoggingIn === 'HR' && (
                    <span className="w-3 h-3 border-2 border-pink-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Policies & quotas</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('MANAGER', 'manager@leaveease.com')}
                disabled={isLoading}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-amber-700 font-bold">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Manager</span>
                  </div>
                  {activeRoleLoggingIn === 'MANAGER' && (
                    <span className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Team approvals queue</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('EMPLOYEE', 'employee@leaveease.com')}
                disabled={isLoading}
                className="p-3 text-left rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-xs group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                    <User className="w-3.5 h-3.5" />
                    <span>Employee</span>
                  </div>
                  {activeRoleLoggingIn === 'EMPLOYEE' && (
                    <span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Apply & track leaves</p>
              </button>
            </div>

            {/* Quick Demo Credentials helper box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Demo Credentials:</span>
              </div>
              <p className="font-mono text-[10px] text-slate-500">
                Password for all accounts: <strong className="text-slate-800">password123</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
