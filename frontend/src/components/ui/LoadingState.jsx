import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadingState = ({ label, className = '' }) => {
  const { t } = useTranslation('common');
  const text = label || t('pleaseWait');

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-10 text-[var(--text-secondary)] ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--surface-border)] border-t-[var(--focus-ring)]"
        aria-hidden
      />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
};

export default LoadingState;
