import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../../components/PageShell';
import { authService } from '../../services/authService';
import { showErrorToast } from '../../lib/toast';

const ForgotPassword = () => {
  const { t } = useTranslation(['auth', 'common', 'errors']);
  const [contact, setContact] = useState('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const isValidContact = contact.trim().length > 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isValidContact) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await authService.forgotPassword({ phoneOrEmail: contact.trim() });
      setSent(true);
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
    <PageShell title="auth:forgotPassword" showNav={false}>
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-md">
          {sent && (
            <div className="mb-4 rounded border border-green-300 bg-green-50 text-green-800 p-3">
              {t('auth:resetLinkSent')}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 text-red-800 p-3">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('auth:phone')} / Email
              </label>
              <input
                className="w-full border rounded px-3 py-2 border-gray-300"
                name="contact"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={`${t('auth:phone')} / Email`}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex justify-end">
              <button
                className="bg-black text-white rounded px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                type="submit"
                disabled={!isValidContact || isSubmitting}
              >
                {isSubmitting ? t('common:pleaseWait') : t('common:save')}
              </button>
            </div>
          </form>

        </div>
      </div>
    </PageShell>
  );
};

export default ForgotPassword;
