import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../hooks/useAuth.js';

const defaultFormState = {
  username: '',
  name: '',
  age: '',
  gender: 'male',
  phone: '',
  password: '',
  confirm: '',
};

const Signup = () => {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  const [form, setForm] = useState(defaultFormState);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const genderOptions = useMemo(
    () => [
      { value: 'male', label: t('common:male', 'Male') },
      { value: 'female', label: t('common:female', 'Female') },
      { value: 'other', label: t('common:others', 'Other') },
      { value: 'na', label: t('common:preferNotSay', 'Prefer not to say') },
    ],
    [t],
  );

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
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
    if (form.password !== form.confirm) {
      setFormError(t('errors.passwordMismatch', 'Passwords do not match.'));
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    try {
      await signup({
        username: form.username.trim(),
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone.trim(),
        password: form.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(translateError(error));
      if (Array.isArray(error?.details)) {
        const nextFieldErrors = {};
        error.details.forEach((detail) => {
          const fieldName = detail?.loc?.slice(-1)[0];
          if (fieldName) {
            nextFieldErrors[fieldName] = detail?.msg || translateError(error);
          }
        });
        setFieldErrors(nextFieldErrors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="auth:signup">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {formError ? (
            <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 p-3">
              {formError}
            </div>
          ) : null}
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth:username', 'Username')}</label>
              <input
                className={`w-full border rounded px-3 py-2 ${fieldErrors.username ? 'border-red-500' : ''}`}
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder={t('auth:username', 'Username')}
                autoComplete="username"
                required
              />
              {fieldErrors.username ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('auth:name')}</label>
              <input
                className={`w-full border rounded px-3 py-2 ${fieldErrors.name ? 'border-red-500' : ''}`}
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder={t('auth:name', 'Name')}
                required
              />
              {fieldErrors.name ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:age', 'Age')}</label>
                <input
                  type="number"
                  className={`w-full border rounded px-3 py-2 ${fieldErrors.age ? 'border-red-500' : ''}`}
                  name="age"
                  value={form.age}
                  onChange={onChange}
                  placeholder={t('auth:age', 'Age')}
                  min="13"
                  max="120"
                  required
                />
                {fieldErrors.age ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.age}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:gender')}</label>
                <select
                  className={`w-full border rounded px-3 py-2 ${fieldErrors.gender ? 'border-red-500' : ''}`}
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                  required
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('auth:phone')}</label>
              <input
                className={`w-full border rounded px-3 py-2 ${fieldErrors.phone ? 'border-red-500' : ''}`}
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder={t('auth:phone')}
                autoComplete="tel"
                required
              />
              {fieldErrors.phone ? (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:password')}</label>
                <input
                  type="password"
                  className={`w-full border rounded px-3 py-2 ${fieldErrors.password ? 'border-red-500' : ''}`}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder={t('auth:password')}
                  autoComplete="new-password"
                  required
                />
                {fieldErrors.password ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:confirmPassword')}</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  name="confirm"
                  value={form.confirm}
                  onChange={onChange}
                  placeholder={t('auth:confirmPassword')}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="bg-black text-white rounded px-4 py-2 disabled:opacity-70"
                type="submit"
                disabled={submitting}
              >
                {submitting ? t('common:loading', 'Loading...') : t('auth:signup')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default Signup;
