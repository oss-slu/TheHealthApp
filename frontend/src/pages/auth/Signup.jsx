
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { setTokens } from '../../apiClient';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';

const Signup = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    password: '',
    confirm: ''
  });
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const [error, setError] = useState(null);
  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError(t('auth:passwordsNoMatch', 'Passwords do not match'));
      return;
    }
    try {
      const payload = { ...form };
      delete payload.confirm;
      const res = await apiClient.post('/auth/signup', payload);
      const tokens = res?.data?.data?.tokens;
      setTokens({ access: tokens?.access_token, refresh: tokens?.refresh_token });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || t('auth:signupFailed', 'Signup failed'));
    }
  };

  return (
    <PageShell title="auth:signup">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 p-3">{error}</div>
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('auth:gender')}</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  name="gender"
                  value={form.gender}
                  onChange={onChange}
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
                />
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
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button className="bg-black text-white rounded px-4 py-2" type="submit">
                {t('auth:signup')}
              </button>
            </div>
          </form>

        </div>
      </div>
    </PageShell>
  );
};

export default Signup;
