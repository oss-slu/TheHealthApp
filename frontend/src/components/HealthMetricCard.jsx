import React, { useId } from 'react';
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
  const idPrefix = useId();
  const titleId = `${idPrefix}-title`;
  const valueId = `${idPrefix}-value`;
  const unitId = unit ? `${idPrefix}-unit` : undefined;
  const statusId = statusLabel ? `${idPrefix}-status` : undefined;
  const descId = description ? `${idPrefix}-desc` : undefined;

  const describedByIds =
    [valueId, unitId, statusId, descId].filter(Boolean).join(' ') || undefined;

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
      aria-labelledby={titleId}
      aria-describedby={describedByIds}
      className={`p-5 bg-white rounded-xl border border-slate-200 shadow-sm transition-all ${
        isClickable
          ? 'hover:shadow-md hover:border-teal-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500'
          : ''
      } ${className}`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 id={titleId} className="text-sm font-medium text-slate-600 truncate">
          {title}
        </h3>
        {statusLabel && <HealthBadge id={statusId} status={status} label={statusLabel} />}
      </div>
      <div className="flex items-baseline gap-1 my-1">
        <span id={valueId} className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {unit && (
          <span id={unitId} className="text-xs text-slate-500 font-medium">
            {unit}
          </span>
        )}
      </div>
      {description && (
        <p id={descId} className="text-xs text-slate-500 mt-2">
          {description}
        </p>
      )}
    </div>
  );
};

export default HealthMetricCard;