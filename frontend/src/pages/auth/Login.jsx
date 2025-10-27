import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../hooks/useAuth.js';

const Login = () => {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const translateError = (error) => {
    if (!error) return null;
    if (error.messageKey) {
      const translated = t(error.messageKey, { defaultValue: error.message });
      return translated || error.message;
    }
    return error.message || t('errors.generic');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await login({ username: form.username.trim(), password: form.password });
      const redirectTo = location.state?.from?.pathname || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(translateError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="auth:login">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {formError ? (
            <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 p-3">
              {formError}
            </div>
          ) : null}
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('auth:username', 'Username')}
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder={t('auth:username', 'Username')}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {t('auth:password')}
              </label>
              <input
                type="password"
                className="w-full border rounded px-3 py-2"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder={t('auth:password')}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                className="bg-black text-white rounded px-4 py-2 disabled:opacity-70"
                type="submit"
                disabled={submitting}
              >
                {submitting ? t('common:loading', 'Loading...') : t('auth:login')}
              </button>
              <Link className="text-blue-600 text-sm" to="/auth/forgot-password">
                {t('auth:forgotPassword')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default Login;
