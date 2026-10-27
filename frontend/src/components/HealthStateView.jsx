import React from 'react';

const HealthStateView = ({
  type = 'empty', // 'loading' | 'empty' | 'error'
  title,
  message,
  actionLabel,
  onAction,
  className = '',
}) => {
  const isError = type === 'error';
  const isLoading = type === 'loading';

  return (
    <div
      role="region"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed ${
        isError ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-slate-50/50'
      } ${className}`}
    >
      {isLoading ? (
        <div
          role="progressbar"
          aria-label="Loading content"
          className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"
        />
      ) : (
        <div className="text-3xl mb-3" aria-hidden="true">
          {isError ? '⚠️' : '📋'}
        </div>
      )}

      {title && (
        <h4 className={`text-base font-semibold mb-1 ${isError ? 'text-rose-900' : 'text-slate-800'}`}>
          {title}
        </h4>
      )}

      {message && (
        <p className={`text-sm max-w-sm ${isError ? 'text-rose-700' : 'text-slate-600'} mb-4`}>
          {message}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default HealthStateView;