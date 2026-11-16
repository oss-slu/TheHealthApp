import React from 'react';

const STATUS_CLASS = {
  ok: 'status-ok',
  warn: 'status-warn',
  risk: 'status-risk',
  critical: 'status-critical',
  info: 'status-info',
  neutral: 'surface-muted text-[var(--text-secondary)]',
};

const Metric = ({ label, value, status = 'neutral', hint, className = '' }) => {
  const statusClass = STATUS_CLASS[status] || STATUS_CLASS.neutral;

  return (
    <div
      className={`surface-elevated p-4 ${className}`}
      data-testid="metric"
      data-status={status}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
      {hint && (
        <p className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default Metric;
