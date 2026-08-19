import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeesApi } from '../../services/api';
import { User, Mail, Phone, Building2, Calendar, Shield, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { RoleBadge } from '../../components/common/Badge';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setIsUpdating(true);
    try {
      if (user?.employee?.id) {
        await employeesApi.resetPassword(user.employee.id);
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Failed to update password' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">My Profile & Account</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View your employment details and update security settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md mb-4">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
          <p className="text-xs text-slate-500 mb-3">{user?.email}</p>
          {user?.role && <RoleBadge role={user.role} />}

          <div className="w-full mt-6 pt-4 border-t border-slate-100 space-y-2 text-left text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Employee Code</span>
              <span className="font-mono font-bold text-slate-800">{user?.employee?.employee_code || 'EMP-1001'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Department</span>
              <span className="font-semibold text-slate-800">{user?.employee?.department_name || 'Engineering'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Designation</span>
              <span className="font-semibold text-slate-800">{user?.employee?.designation_title || 'Specialist'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Employment</span>
              <span className="font-semibold text-slate-800">{user?.employee?.employment_type || 'Full Time'}</span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Security & Password</h3>
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-xs mb-4 flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Repeat new password"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-xs font-semibold transition-colors flex items-center gap-2"
              >
                {isUpdating && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
