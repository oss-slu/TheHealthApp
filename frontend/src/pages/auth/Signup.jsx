import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../hooks/useAuth';
import { showErrorToast } from '../../lib/toast';
import {
  normalizeUsername,
  validatePassword,
  validateUsername,
} from '../../utils/validation';

const Signup = ({ onAuthSuccess = () => {} }) => {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    username: '',
    name: '',
    age: '',
    gender: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [touched, setTouched] = useState({
    username: false,
    name: false,
    age: false,
    gender: false,
    phone: false,
    password: false,
    confirm: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const usernameValid = useMemo(
    () => validateUsername(form.username),
    [form.username]
  );
  const nameValid = form.name.trim().length >= 2;
  const ageValid = form.age !== '' && parseInt(form.age, 10) > 12 && parseInt(form.age, 10) < 121;
  const genderValid = ['male', 'female', 'other', 'na'].includes(form.gender);
  const phoneValid = /^\+?[0-9]{10,15}$/.test(form.phone);
  const passwordValid = useMemo(
    () => validatePassword(form.password),
    [form.password]
  );
  const confirmValid = form.confirm.length > 0 && form.confirm === form.password;

  const isFormValid = usernameValid && nameValid && ageValid && genderValid && phoneValid && passwordValid && confirmValid;

  const onChange = (e) => {
    const { name, value } = e.target;
    if (error) setError(null);
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      username: true,
      name: true,
      age: true,
      gender: true,
      phone: true,
      password: true,
      confirm: true,
    });
    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const normalizedUsername = normalizeUsername(form.username);
      const payload = {
        username: normalizedUsername,
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        gender: form.gender,
        phone: form.phone,
        password: form.password,
      };

      const user = await signup(payload);
      onAuthSuccess(user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const messageKey = err.messageKey || 'errors.generic';
      setError(t(messageKey, err.message || t('errors.generic')));
      if (err.status >= 500) {
        showErrorToast(messageKey, err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <PageShell title="auth:signup" showNav={false}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 p-3">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="username">
                  {t('auth:username')} *
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
                <label className="block text-sm font-medium mb-1" htmlFor="name">
                  {t('auth:name', 'Full Name')} *
                </label>
                <input
                  id="name"
                  className={`w-full border rounded px-3 py-2 ${
                    touched.name && !nameValid ? 'border-red-500' : 'border-gray-300'
                  }`}
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder={t('auth:namePlaceholder', 'Enter your full name')}
                  autoComplete="name"
                />
                {touched.name && !nameValid && (
                  <p className="text-xs text-red-600 mt-1">{t('auth:errors.nameInvalid', 'Name must be at least 2 characters')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:age', 'Age')} *</label>
                <input
                  type="number"
                  className={`w-full border rounded px-3 py-2 ${
                    touched.age && !ageValid ? 'border-red-500' : 'border-gray-300'
                  }`}
                  name="age"
                  value={form.age}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder={t('auth:age', 'Age')}
                  min="13"
                  max="120"
                />
                {touched.age && !ageValid && (
                  <p className="text-xs text-red-600 mt-1">{t('auth:errors.ageInvalid', 'Age must be between 13 and 120')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:gender')} *</label>
                <select
                  className={`w-full border rounded px-3 py-2 ${
                    touched.gender && !genderValid ? 'border-red-500' : 'border-gray-300'
                  }`}
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                  onBlur={onBlur}
                >
                  <option value="">{t('common:select', 'Select...')}</option>
                  <option value="male">{t('common:male', 'Male')}</option>
                  <option value="female">{t('common:female', 'Female')}</option>
                  <option value="other">{t('common:others', 'Other')}</option>
                  <option value="na">{t('common:preferNotToSay', 'Prefer not to say')}</option>
                </select>
                {touched.gender && !genderValid && (
                  <p className="text-xs text-red-600 mt-1">{t('auth:errors.genderRequired', 'Please select a gender')}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('auth:phone')} *</label>
              <input
                type="tel"
                className={`w-full border rounded px-3 py-2 ${
                  touched.phone && !phoneValid ? 'border-red-500' : 'border-gray-300'
                }`}
                name="phone"
                value={form.phone}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={t('auth:phonePlaceholder', '10-15 digit phone number')}
                autoComplete="tel"
                inputMode="numeric"
              />
              {touched.phone && !phoneValid && (
                <p className="text-xs text-red-600 mt-1">{t('auth:errors.phoneInvalid', 'Enter a valid 10-15 digit phone number')}</p>
              )}
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
