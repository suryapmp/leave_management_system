import React from 'react';
import { LeaveStatus, UserRole, SessionType, HolidayType } from '../../types';

export const StatusBadge: React.FC<{ status: LeaveStatus | string; className?: string }> = ({ status, className = '' }) => {
  const getStyle = () => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'MANAGER_APPROVED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'HR_APPROVED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'DRAFT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'MANAGER_APPROVED':
        return 'Mgr Approved';
      case 'HR_APPROVED':
        return 'HR Approved';
      default:
        return status;
    }
  };

  return (
    <span
      id={`status-badge-${status.toLowerCase()}`}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStyle()} ${className}`}
    >
      {getLabel()}
    </span>
  );
};

export const RoleBadge: React.FC<{ role: UserRole | string; className?: string }> = ({ role, className = '' }) => {
  const getStyle = () => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'HR':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'MANAGER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'EMPLOYEE':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <span
      id={`role-badge-${role.toLowerCase()}`}
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStyle()} ${className}`}
    >
      {role}
    </span>
  );
};

export const SessionBadge: React.FC<{ session: SessionType; className?: string }> = ({ session, className = '' }) => {
  const label = session === 'FULL_DAY' ? 'Full Day' : session === 'FIRST_HALF' ? '1st Half (0.5)' : '2nd Half (0.5)';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      {label}
    </span>
  );
};

export const HolidayTypeBadge: React.FC<{ type: HolidayType; className?: string }> = ({ type, className = '' }) => {
  const isMandatory = type === 'MANDATORY';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
        isMandatory ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
      } ${className}`}
    >
      {type}
    </span>
  );
};
