import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import {
  normalizeUsername,
  validatePassword,
  validateUsername,
} from '../../utils/validation';

const Login = ({ onAuthSuccess = () => {} }) => {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [touched, setTouched] = useState({ username: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameValid = useMemo(
    () => validateUsername(form.username),
    [form.username]
  );
  const passwordValid = useMemo(
    () => validatePassword(form.password),
    [form.password]
  );

  const isFormValid = usernameValid && passwordValid;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);
    const normalizedUsername = normalizeUsername(form.username);

    // TODO: replace with API call
    setTimeout(() => {
      onAuthSuccess({ username: normalizedUsername });
      navigate('/dashboard', { replace: true });
    }, 300);
  };


  return (
    <PageShell title="auth:login" showNav={false}>
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <form className="space-y-6" onSubmit={onSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="username">
                {t('auth:username')}
              </label>
              <input
                id="username"
                className={`w-full border rounded px-3 py-2 ${
                  touched.username && !usernameValid ? 'border-red-500' : 'border-gray-300'
                }`}
                name="username"
                value={form.username}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={t('auth:usernamePlaceholder')}
                autoComplete="username"
              />
              <p className="text-xs text-gray-500 mt-1">{t('auth:usernameHelp')}</p>
              {touched.username && !usernameValid && (
                <p className="text-xs text-red-600 mt-1">{t('auth:errors.usernameInvalid')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">
                {t('auth:password')}
              </label>
              <input
                id="password"
                type="password"
                className={`w-full border rounded px-3 py-2 ${
                  touched.password && !passwordValid ? 'border-red-500' : 'border-gray-300'
                }`}
                name="password"
                value={form.password}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={t('auth:passwordPlaceholder')}
                autoComplete="current-password"
              />
              <p className="text-xs text-gray-500 mt-1">{t('auth:passwordHelp')}</p>
              {touched.password && !passwordValid && (
                <p className="text-xs text-red-600 mt-1">{t('auth:errors.passwordInvalid')}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                className="bg-black text-white rounded px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? t('common:pleaseWait') : t('auth:login')}
              </button>
              <a className="text-blue-600 text-sm" href="/auth/forgot-password">
                {t('auth:forgotPassword')}
              </a>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default Login;
