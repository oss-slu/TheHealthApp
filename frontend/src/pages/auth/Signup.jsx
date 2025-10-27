

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/PageShell';

// --- STUBS for milestone integration ---
// Simulated API client
const apiClient = {
  post: async (url, payload) => {
    // Simulate backend validation
    if (payload.phone === 'duplicate') {
      const err = new Error('Duplicate phone');
      err.response = { data: { message: 'Phone number already exists.' } };
      throw err;
    }
    // Simulate success
    return {
      data: {
        access: 'fake-access-token',
        refresh: 'fake-refresh-token',
        user: { ...payload, id: 1 }
      }
    };
  }
};

// Simulated setTokens helper
function setTokens(data) {
  // Store tokens in localStorage (stub)
  localStorage.setItem('access', data.access);
  localStorage.setItem('refresh', data.refresh);
}

// Simulated useAuth context
function useAuth() {
  return {
    login: (user) => {
      // Store user in localStorage (stub)
      localStorage.setItem('user', JSON.stringify(user));
    }
  };
}


const Signup = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // Client-side validation
      if (form.password !== form.confirmPassword) {
        setError(t('auth:passwordsDoNotMatch', 'Passwords do not match.'));
        return;
      }
      // Prepare payload (exclude confirmPassword)
      const { confirmPassword, ...payload } = form;
      const res = await apiClient.post('/auth/signup', payload);
      setTokens(res.data);
      login(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageShell title="auth:signup">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">{t('auth:name')}</label>
              <input
                className="w-full border rounded px-3 py-2"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder={t('auth:name','Name')}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:age','Age')}</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  name="age"
                  value={form.age}
                  onChange={onChange}
                  placeholder={t('auth:age','Age')}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:gender')}</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
                  disabled={isLoading}
                >
                  <option value="">{t('common:optional','Optional')}</option>
                  <option value="male">{t('common:male','Male')}</option>
                  <option value="female">{t('common:female','Female')}</option>
                  <option value="other">{t('common:others','Others')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('auth:phone')}</label>
              <input
                className="w-full border rounded px-3 py-2"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder={t('auth:phone')}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:password')}</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder={t('auth:password')}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:confirmPassword')}</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={onChange}
                  placeholder={t('auth:confirmPassword')}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                className="bg-black text-white rounded px-4 py-2 flex items-center justify-center min-w-[120px]"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                    {t('auth:signingUp', 'Signing up...')}
                  </>
                ) : (
                  t('auth:signup')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default Signup;
