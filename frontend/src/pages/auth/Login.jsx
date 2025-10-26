
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { t } = useTranslation(['auth', 'common']);
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(form.username, form.password);
    if (success) {
      window.location.href = '/dashboard';
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <PageShell title="auth:login">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('auth:username')}
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder={t('auth:username')}
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
                required
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
