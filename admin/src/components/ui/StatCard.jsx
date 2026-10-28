import React from 'react';

const StatCard = ({ title, value, icon: Icon, changeText, color = 'blue' }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
    red: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="crm-card flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
        {changeText && (
          <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1">
            {changeText}
          </p>
        )}
      </div>
      {Icon && (
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center border ${scheme.bg} ${scheme.text} ${scheme.border} shrink-0`}
        >
          <Icon size={24} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
