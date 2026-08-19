import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'neutral';
  accentBorder?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'neutral',
  accentBorder = false,
  onClick,
}) => {
  const badgeColors = {
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
    info: 'bg-indigo-50 text-indigo-600',
    neutral: 'bg-slate-100 text-slate-500',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 rounded-xl border border-slate-200 shadow-xs transition-all ${
        accentBorder ? 'border-l-4 border-l-indigo-500' : ''
      } ${onClick ? 'cursor-pointer hover:border-slate-300' : ''}`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="flex items-end justify-between mt-1">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {badgeText ? (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeColors[badgeType]}`}>
            {badgeText}
          </span>
        ) : subtitle ? (
          <span className="text-[10px] text-slate-400">{subtitle}</span>
        ) : null}
      </div>
    </div>
  );
};
