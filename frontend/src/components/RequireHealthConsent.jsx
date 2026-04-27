import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

/**
 * Blocks health-related routes until consent status is loaded and valid.
 * Parent route must be wrapped by RequireAuth.
 */
const RequireHealthConsent = () => {
  const { initializing, consentReady, consentStatus, consentLoadError, retryConsentLoad } = useAuth();
  const location = useLocation();
  const { t } = useTranslation(['common']);

  if (initializing || !consentReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        {t('common:loading', 'Loading...')}
      </div>
    );
  }

  if (consentLoadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-800 max-w-md">
          {t(
            'common:consentLoadError',
            'We could not verify your consent preferences. Check your connection and try again.',
          )}
        </p>
        <button
          type="button"
          className="rounded-lg bg-teal-700 px-4 py-2 text-white hover:bg-teal-800"
          onClick={() => retryConsentLoad()}
        >
          {t('common:retry', 'Retry')}
        </button>
      </div>
    );
  }

  if (!consentStatus?.consent_given) {
    return <Navigate to="/consent" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default RequireHealthConsent;
