import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';
import { authService } from '../../services/authService.js';

const ForgotPassword = () => {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const [contact, setContact] = useState('');
  const [sentMessage, setSentMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSentMessage(null);
    setErrorMessage(null);

    try {
      const response = await authService.forgotPassword({ phoneOrEmail: contact.trim() });
      setSentMessage(response?.message || t('auth:resetLinkSent'));
    } catch (error) {
      const message = error?.messageKey ? t(error.messageKey, { defaultValue: error.message }) : error?.message;
      setErrorMessage(message || t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="auth:forgotPassword">
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {sentMessage ? (
            <div className="mb-4 rounded border border-green-300 bg-green-50 text-green-800 p-3">
              {sentMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 p-3">
              {errorMessage}
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('auth:phone')} / Email
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                name="contact"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder={`${t('auth:phone')} / Email`}
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                className="bg-black text-white rounded px-4 py-2 disabled:opacity-70"
                type="submit"
                disabled={submitting}
              >
                {submitting ? t('common:loading', 'Loading...') : t('common:submit', 'Submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageShell>
  );
};

export default ForgotPassword;
