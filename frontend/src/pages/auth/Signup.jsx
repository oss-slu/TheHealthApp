import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import {
  normalizeUsername,
  validatePassword,
  validateUsername,
} from '../../utils/validation';

const Signup = ({ onAuthSuccess = () => {} }) => {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    age: '',
    gender: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [touched, setTouched] = useState({
    username: false,
    password: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameValid = useMemo(
    () => validateUsername(form.username),
    [form.username]
  );
  const passwordValid = useMemo(
    () => validatePassword(form.password),
    [form.password]
  );
  const confirmValid = form.confirm.length > 0 && form.confirm === form.password;

  const isFormValid = usernameValid && passwordValid && confirmValid;

  const onChange = (e) => {
    const { name, value } = e.target;
    // Restrict phone field to numbers only
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, ''); // Remove all non-digit characters
      setForm((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched({ username: true, password: true, confirm: true });
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
    <PageShell title="auth:signup" showNav={false}>
      <div className="max-w-2xl mx-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:age', 'Age')}</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 border-gray-300"
                  name="age"
                  value={form.age}
                  onChange={onChange}
                  placeholder={t('auth:age', 'Age')}
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:gender')}</label>
                <select
                  className="w-full border rounded px-3 py-2 border-gray-300"
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                >
                  <option value="">{t('common:optional', 'Optional')}</option>
                  <option value="male">{t('common:male', 'Male')}</option>
                  <option value="female">{t('common:female', 'Female')}</option>
                  <option value="other">{t('common:others', 'Others')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('auth:phone')}</label>
              <input
                type="tel"
                className="w-full border rounded px-3 py-2 border-gray-300"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder={t('auth:phone')}
                autoComplete="tel"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 mt-1">{t('auth:passwordHelp')}</p>
                {touched.password && !passwordValid && (
                  <p className="text-xs text-red-600 mt-1">{t('auth:errors.passwordInvalid')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="confirm">
                  {t('auth:confirmPassword')}
                </label>
                <input
                  id="confirm"
                  type="password"
                  className={`w-full border rounded px-3 py-2 ${
                    touched.confirm && !confirmValid ? 'border-red-500' : 'border-gray-300'
                  }`}
                  name="confirm"
                  value={form.confirm}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder={t('auth:confirmPassword')}
                  autoComplete="new-password"
                />
                {touched.confirm && !confirmValid && (
                  <p className="text-xs text-red-600 mt-2">{t('auth:errors.passwordMismatch')}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="bg-black text-white rounded px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? t('common:pleaseWait') : t('auth:signup')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default Signup;
