
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';

const Login = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [form, setForm] = useState({ name: '', password: '' });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const [error, setError] = useState(null);
  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await import('../../apiClient').then(m => m.default.post('/auth/login', form));
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || t('auth:loginFailed', 'Login failed'));
    }
  };

  return (
    <PageShell title="auth:login">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 p-3">{error}</div>
          )}
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('auth:name')}
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder={t('auth:name')}
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
              />
            </div>

            <div className="flex items-center justify-between">
              <button className="bg-black text-white rounded px-4 py-2" type="submit">
                {t('auth:login')}
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
