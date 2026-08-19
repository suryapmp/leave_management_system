import React, { useState, useEffect } from 'react';
import { settingsApi } from '../../services/api';
import { Settings, Save, CheckCircle2, AlertCircle, Building, Clock, Bell, Shield } from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'LeaveEase Corp',
    company_email: 'hr@leaveease.com',
    workweek_days: 'Monday,Tuesday,Wednesday,Thursday,Friday',
    auto_approve_days_threshold: '0',
    allow_half_day: 'true',
    allow_negative_balance: 'false',
    enable_email_notifications: 'true',
    max_carry_forward_limit: '10',
    require_manager_approval: 'true',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await settingsApi.getAll();
      if (res.data.success) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await settingsApi.updateBatch(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentWorkdays = (settings.workweek_days || '').split(',').map(s => s.trim());

  const toggleWorkday = (day: string) => {
    let updated = [...currentWorkdays];
    if (updated.includes(day)) {
      updated = updated.filter(d => d !== day);
    } else {
      updated.push(day);
    }
    setSettings({ ...settings, workweek_days: updated.join(',') });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System & Policy Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure organization workweeks, approval workflows, and leave management defaults
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Info */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Organization Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
              <input
                type="text"
                value={settings.company_name || ''}
                onChange={e => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HR Support Email</label>
              <input
                type="email"
                value={settings.company_email || ''}
                onChange={e => setSettings({ ...settings, company_email: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Workweek Schedule */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Working Days / Workweek Policy</h3>
          </div>
          <p className="text-xs text-slate-500">
            Unchecked days will be counted as non-working weekends and will not consume employee leave quota.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {daysOfWeek.map(day => {
              const isWorkday = currentWorkdays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleWorkday(day)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                    isWorkday
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Leave Rules & Workflow */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Approval Workflow & Leave Rules</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-slate-800">Require Direct Manager Approval</p>
                <p className="text-[11px] text-slate-500">
                  When enabled, leaves go to the direct reporting manager before final HR approval
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.require_manager_approval === 'true'}
                onChange={e =>
                  setSettings({
                    ...settings,
                    require_manager_approval: e.target.checked ? 'true' : 'false',
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-slate-800">Allow Half-Day Applications</p>
                <p className="text-[11px] text-slate-500">
                  Allow employees to apply for Morning Session (0.5d) or Afternoon Session (0.5d)
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.allow_half_day === 'true'}
                onChange={e =>
                  setSettings({
                    ...settings,
                    allow_half_day: e.target.checked ? 'true' : 'false',
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-slate-800">Enable In-App & Email Notifications</p>
                <p className="text-[11px] text-slate-500">
                  Notify managers when new requests are submitted, and employees when approved/rejected
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.enable_email_notifications === 'true'}
                onChange={e =>
                  setSettings({
                    ...settings,
                    enable_email_notifications: e.target.checked ? 'true' : 'false',
                  })
                }
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>System settings saved successfully!</span>
            </div>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
