import React from 'react';

const STATUS_STYLES = {
  good: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  critical: 'bg-rose-50 text-rose-800 border-rose-200',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200',
};

const HealthBadge = ({ status = 'neutral', label, children, className = '' }) => {
  const badgeStyle = STATUS_STYLES[status] || STATUS_STYLES.neutral;

  return (
    <span
      role="status"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      {label || children}
    </span>
  );
};

export default HealthBadge;