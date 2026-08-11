import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20',
    },
    rose: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
    },
  };

  const currentStyle = colorStyles[color];

  return (
    <div className={`bg-slate-900 border ${currentStyle.border} rounded-xl p-5 shadow-lg flex items-start justify-between relative overflow-hidden group hover:border-slate-700 transition-all`}>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <h4 className="text-2xl font-extrabold text-white mt-1 tracking-tight">{value}</h4>
        {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        {trend && <span className="inline-block text-[11px] font-semibold text-emerald-400 mt-2">{trend}</span>}
      </div>
      <div className={`p-3 rounded-xl ${currentStyle.bg} ${currentStyle.text}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
