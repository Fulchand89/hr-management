import React from 'react';
import Card from '../common/Card';

export const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'indigo',
  trend,
  trendType = 'positive',
  onClick,
}) => {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100' },
    blue: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-100' },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className={`p-5 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tracking-tight">{value}</h4>
          {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-2xl ${scheme.bg} ${scheme.text} ring-1 ${scheme.ring} shrink-0`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trendType === 'positive'
                ? 'text-emerald-600'
                : trendType === 'negative'
                ? 'text-rose-600'
                : 'text-slate-600'
            }`}
          >
            {trend}
          </span>
          <span className="text-slate-400">vs last month</span>
        </div>
      )}
    </Card>
  );
};

export default StatCard;
