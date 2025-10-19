
import React, { useState } from 'react';
import apiClient from '../../apiClient';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';

const ForgotPassword = () => {
  const { t } = useTranslation(['auth', 'common']);
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState(false);

  const [error, setError] = useState(null);
  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/auth/forgot-password', { phoneOrEmail: contact });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || t('auth:resetFailed', 'Failed to send reset link'));
    }
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
          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 p-3">{error}</div>
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

        </div>
      </div>
    </PageShell>
  );
};

export default ForgotPassword;
