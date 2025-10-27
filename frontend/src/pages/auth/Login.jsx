
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../AuthProvider';
import apiClient from '../../apiClient';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [form, setForm] = useState({ name: '', password: '' });

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const payload = { name: form.name, password: form.password };
        const res = await apiClient.request('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        // server likely returns { data: { tokens, user } } or { tokens }
        const data = res?.data ?? res;
        const tokens = data?.tokens ?? data?.tokens_response ?? data;
        if (tokens) {
          auth.setTokens(tokens);
          await auth.fetchMe();
          navigate('/dashboard');
        }
      } catch (err) {
        // TODO: show error toast
        console.error('login failed', err);
      }
    })();
  };

  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <PageShell title="auth:login">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
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
