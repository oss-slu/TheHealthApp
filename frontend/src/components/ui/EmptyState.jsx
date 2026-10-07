import React from 'react';

const EmptyState = ({ title, description, action = null, className = '' }) => {
  return (
    <div
      className={`surface-muted px-5 py-8 text-center ${className}`}
      role="status"
      data-testid="empty-state"
    >
      <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
