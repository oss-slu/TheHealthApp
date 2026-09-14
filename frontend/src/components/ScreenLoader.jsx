import React from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from './LoadingSpinner';

const ScreenLoader = ({ variant = 'fullscreen' }) => {
  const { t } = useTranslation(['common']);
  const message = t('common:loading', 'Loading...');
  const layoutClass =
    variant === 'embedded'
      ? 'flex min-h-[40vh] flex-col items-center justify-center gap-3 text-gray-600 py-12'
      : 'flex min-h-screen flex-col items-center justify-center gap-3 text-gray-600';

  return (
    <div className={layoutClass} role="status" aria-busy="true" aria-live="polite">
      <LoadingSpinner className="h-10 w-10 text-teal-600" label={message} />
      <p className="text-sm font-medium text-gray-700">{message}</p>
    </div>
  );
};

export default ScreenLoader;
