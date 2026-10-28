import React from 'react';
import HealthBadge from './HealthBadge';

const HealthMetricCard = ({
  title,
  value,
  unit,
  status = 'neutral',
  statusLabel,
  description,
  onClick,
  className = '',
}) => {
  const isClickable = typeof onClick === 'function';

  return (
    <div
      role={isClickable ? 'button' : 'region'}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={title}
      className={`p-5 bg-white rounded-xl border border-slate-200 shadow-sm transition-all ${
        isClickable ? 'hover:shadow-md hover:border-teal-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500' : ''
      } ${className}`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="text-sm font-medium text-slate-600 truncate">{title}</h3>
        {statusLabel && <HealthBadge status={status} label={statusLabel} />}
      </div>
      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {unit && <span className="text-xs text-slate-500 font-medium">{unit}</span>}
      </div>
      {description && <p className="text-xs text-slate-500 mt-2">{description}</p>}
    </div>
  );
};

export default HealthMetricCard;