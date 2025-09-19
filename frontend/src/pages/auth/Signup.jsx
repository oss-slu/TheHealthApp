<<<<<<< HEAD
import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';

const Signup = () => {
  return (
    <PageShell title="Sign Up">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="terms"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500">
                  Terms and Conditions
                </a>
              </label>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Account
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
=======
import React, { useState } from 'react';
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

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: submit to your API
  };

  return (
    <PageShell title="auth:signup">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
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
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
        </div>
      </div>
    </PageShell>
  );
};

export default Signup;
