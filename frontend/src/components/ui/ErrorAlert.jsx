import React from 'react';

const ErrorAlert = ({ title, children, onRetry, retryLabel, className = '' }) => {
  return (
    <div
      className={`status-critical rounded-[var(--radius-md)] border border-current/20 px-4 py-3 ${className}`}
      role="alert"
      aria-live="assertive"
      data-testid="error-alert"
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1 text-sm' : 'text-sm'}>{children}</div>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-semibold underline underline-offset-2"
        >
          {retryLabel || 'Retry'}
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
