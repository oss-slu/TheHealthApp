import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { useAuth } from '../hooks/useAuth';
import { consentService } from '../services/consentService';
import { CURRENT_CONSENT_VERSION } from '../lib/consentConstants';

const CONSENT_SCROLL_TEXT = `
The Health App provides educational health screening tools and is not a substitute for professional medical advice, diagnosis, or treatment.

By using health-related features, you agree to use this application responsibly and to consult a qualified healthcare provider for any medical concerns.

Data you submit may be processed to generate risk estimates and personalized recommendations within the application. Do not enter information you are not authorized to share.

You may withdraw optional marketing preferences at any time; core service data processing required for the features you use will remain subject to the applicable terms.
`.trim();

const ConsentPage = () => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, initializing, consentReady, consentStatus, consentLoadError, refreshUser, retryConsentLoad } =
    useAuth();

  const [terms, setTerms] = useState(false);
  const [dataUsage, setDataUsage] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fromPath =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/')
      ? location.state.from
      : '/questionnaire';

  const requiredOk = terms && dataUsage;
  const canSubmit = useMemo(() => requiredOk && !submitting, [requiredOk, submitting]);

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      navigate('/auth/login', { replace: true, state: { from: '/consent' } });
    }
  }, [initializing, isAuthenticated, navigate]);

  useEffect(() => {
    if (consentReady && !consentLoadError && consentStatus?.consent_given) {
      navigate(fromPath, { replace: true });
    }
  }, [consentReady, consentLoadError, consentStatus, fromPath, navigate]);

  if (initializing || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        {t('common:loading', 'Loading...')}
      </div>
    );
  }

  if (!consentReady) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600">
        {t('common:loading', 'Loading...')}
      </div>
    );
  }

  if (consentLoadError) {
    return (
      <PageShell title={null} showNav={false}>
        <div className="mx-auto max-w-md px-4 py-12 text-center">
          <p className="text-gray-800">
            {t(
              'common:consentLoadError',
              'We could not verify your consent preferences. Check your connection and try again.',
            )}
          </p>
          <button
            type="button"
            className="mt-6 rounded-lg bg-teal-700 px-4 py-2 text-white hover:bg-teal-800"
            onClick={() => retryConsentLoad()}
          >
            {t('common:retry', 'Retry')}
          </button>
        </div>
      </PageShell>
    );
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await consentService.submit({
        consent_given: true,
        data_usage: true,
        marketing,
        version: CURRENT_CONSENT_VERSION,
      });
      await refreshUser();
      navigate(fromPath, { replace: true });
    } catch (err) {
      const msg =
        err?.message ||
        err?.originalError?.response?.data?.error?.message ||
        t('common:consentSubmitError', 'Could not save consent. Please try again.');
      setError(typeof msg === 'string' ? msg : t('common:consentSubmitError', 'Could not save consent.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title={null} showNav={false}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('common:consentTitle', 'Consent & data use')}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {t('common:consentIntro', 'Please review and accept the following before using health features.')}
        </p>

        <div
          className="mt-6 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap"
          role="region"
          aria-label={t('common:consentDocument', 'Consent document')}
        >
          {CONSENT_SCROLL_TEXT}
        </div>

        <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
          {error && (
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          <label className="flex items-start gap-3 text-sm text-gray-800">
            <input
              type="checkbox"
              name="consent_terms"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1"
            />
            <span>{t('common:consentCheckboxTerms', 'I have read and agree to the terms above.')}</span>
          </label>

          <label className="flex items-start gap-3 text-sm text-gray-800">
            <input
              type="checkbox"
              name="consent_data_usage"
              checked={dataUsage}
              onChange={(e) => setDataUsage(e.target.checked)}
              className="mt-1"
            />
            <span>
              {t(
                'common:consentCheckboxData',
                'I consent to the processing of my health-related data as described for these features.',
              )}
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-gray-800">
            <input
              type="checkbox"
              name="consent_marketing"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-1"
            />
            <span>
              {t(
                'common:consentCheckboxMarketing',
                '(Optional) I would like to receive product updates and health tips by email or SMS.',
              )}
            </span>
          </label>

          <div className="flex flex-wrap gap-3 pt-4">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-teal-700 px-6 py-2.5 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-800"
            >
              {submitting ? t('common:pleaseWait', 'Please wait…') : t('common:consentAccept', 'Accept & continue')}
            </button>
            <Link to="/" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
              {t('common:cancel', 'Cancel')}
            </Link>
          </div>
        </form>
      </div>
    </PageShell>
  );
};

export default ConsentPage;
