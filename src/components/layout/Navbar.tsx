import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { UserRole } from '../../types';
import {
  Bell,
  User as UserIcon,
  LogOut,
  Sparkles,
  Clock,
  ChevronDown,
  Menu,
  Search,
} from 'lucide-react';
import { RoleBadge } from '../common/Badge';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onNavigate?: (page: string) => void;
  onApplyLeaveClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onNavigate, onApplyLeaveClick }) => {
  const { user, demoLogin, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSwitch = async (role: UserRole) => {
    setIsSwitchingRole(true);
    try {
      await demoLogin(role);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 flex-shrink-0">
      {/* Left: Mobile Toggle & Search / Title */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 rounded-md hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <input
            type="text"
            placeholder="Search records, employees, leaves..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-md text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400"
          />
          <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
        </div>
      </div>

      {/* Center: Fast Role Switcher (for demo evaluation) */}
      <div className="hidden xl:flex items-center bg-slate-100 p-1 rounded-md text-xs mx-3">
        <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Role:</span>
        </span>
        {(['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] as UserRole[]).map(r => (
          <button
            key={r}
            disabled={isSwitchingRole}
            onClick={() => handleRoleSwitch(r)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              user?.role === r
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {r === 'ADMIN' ? 'Admin' : r === 'HR' ? 'HR' : r === 'MANAGER' ? 'Manager' : 'Employee'}
          </button>
        ))}
      </div>

      {/* Right: Add Request Action & Notification Bell & Profile */}
      <div className="flex items-center gap-3">
        {onApplyLeaveClick && (
          <button
            onClick={onApplyLeaveClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors shrink-0"
          >
            + Add Request
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors rounded-md"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No notifications yet</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                        !n.is_read ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <div className="mt-0.5 p-1.5 rounded bg-indigo-50 text-indigo-600 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-800">{n.title}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-tight">{user?.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3.5 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <div className="p-1 text-xs">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onNavigate) onNavigate('profile');
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>My Profile & Settings</span>
                </button>
              </div>

              <div className="p-1 border-t border-slate-100 text-xs">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
