import React from 'react';

/**
 * Accessible inline spinner (use inside buttons or full-screen loaders).
 */
const LoadingSpinner = ({ className = 'h-8 w-8 text-teal-600', label }) => (
  <span className={`inline-flex items-center justify-center ${className}`} role="status" aria-live="polite">
    <svg
      className="h-full w-full animate-spin text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    {label ? <span className="sr-only">{label}</span> : null}
  </span>
);

export default LoadingSpinner;
