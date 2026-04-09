import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

/**
 * Requires a valid access token. Renders child routes via <Outlet />.
 */
const RequireAuth = () => {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();
  const { t } = useTranslation(['common']);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        {t('common:loading', 'Loading...')}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
