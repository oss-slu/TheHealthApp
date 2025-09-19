<<<<<<< HEAD
import React from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/PageShell';

const ForgotPassword = () => {
  return (
    <PageShell title="Forgot Password">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          <form className="space-y-6">
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
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Send Reset Link
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link
              to="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Back to Login
            </Link>
          </div>
=======
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';

const ForgotPassword = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    // TODO: call your API to send reset link (email/phone)
    setSent(true);
  };

  return (
    // PageShell will translate this key because we made it call t(title) when title is a string
    <PageShell title="auth:forgotPassword">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {sent && (
            <div className="mb-4 rounded border border-green-300 bg-green-50 text-green-800 p-3">
              {t('auth:resetLinkSent')}
            </div>
          )}

          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('auth:phone')} / Email
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                name="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder={`${t('auth:phone')} / Email`}
              />
            </div>

            <div className="flex justify-end">
              <button className="bg-black text-white rounded px-4 py-2" type="submit">
                {t('common:save')}
              </button>
            </div>
          </form>
>>>>>>> 3e3312ad02ea663c5db4d2ab07e66a6a526ab010
        </div>
      </div>
    </PageShell>
  );
};

export default ForgotPassword;
