import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../components/PageShell';
import { healthSummaryService } from '../services/healthSummaryService';

const localDateInput = (date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const defaultPeriod = () => {
  const today = new Date();
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  return { startDate: localDateInput(yearAgo), endDate: localDateInput(today) };
};

const HealthSummary = () => {
  const { t, i18n } = useTranslation('summary');
  const [period, setPeriod] = useState(defaultPeriod);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [includeQuestionnaires, setIncludeQuestionnaires] = useState(true);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.classList.add('printing-health-summary');
    return () => document.body.classList.remove('printing-health-summary');
  }, []);

  const onPeriodChange = (event) => {
    setPeriod((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const generateSummary = async (event) => {
    event.preventDefault();
    setError('');
    if (!period.startDate || !period.endDate || period.startDate > period.endDate) {
      setError(t('invalidPeriod'));
      return;
    }
    setLoading(true);
    try {
      const data = await healthSummaryService.getSummary(period.startDate, period.endDate);
      setSummary(data);
    } catch (requestError) {
      setError(requestError.message || t('loadError'));
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const selectedData = () => {
    if (!summary) return null;
    return {
      generated_at: summary.generated_at,
      period: summary.period,
      ...(includeProfile ? { profile: summary.profile } : {}),
      ...(includeQuestionnaires ? {
        questionnaires: summary.questionnaires,
        risk_assessments: summary.risk_assessments,
      } : {}),
      disclaimer: t('disclaimer'),
    };
  };

  const downloadJson = () => {
    const content = JSON.stringify(selectedData(), null, 2);
    const objectUrl = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = 'my-health-summary.json';
    link.click();
    URL.revokeObjectURL(objectUrl);
  };

  const shareJson = async () => {
    const file = new File([JSON.stringify(selectedData(), null, 2)], 'my-health-summary.json', {
      type: 'application/json',
    });
    if (!navigator.canShare?.({ files: [file] })) {
      setError(t('shareUnsupported'));
      return;
    }
    try {
      await navigator.share({ title: t('title'), files: [file] });
    } catch (shareError) {
      if (shareError.name !== 'AbortError') setError(t('shareError'));
    }
  };

  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });
  const formattedDate = (value) => value ? dateFormat.format(new Date(value)) : t('notProvided');
  const showValue = (value) => {
    if (Array.isArray(value)) return value.length ? value.join(', ') : t('notProvided');
    return value || t('notProvided');
  };

  return (
    <PageShell title={t('title')}>
      <div className="health-summary-page space-y-6">
        <section className="summary-controls rounded border border-teal-200 bg-white p-5 shadow-sm">
          <p className="text-gray-700">{t('intro')}</p>
          <form onSubmit={generateSummary} className="mt-5 space-y-5">
            <fieldset>
              <legend className="mb-2 font-semibold text-gray-900">{t('periodLabel')}</legend>
              <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  {t('startDate')}
                  <input name="startDate" type="date" value={period.startDate} onChange={onPeriodChange} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" required />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  {t('endDate')}
                  <input name="endDate" type="date" value={period.endDate} onChange={onPeriodChange} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2" required />
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">{t('periodHelp')}</p>
            </fieldset>

            <fieldset>
              <legend className="mb-2 font-semibold text-gray-900">{t('sectionsLabel')}</legend>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={includeProfile} onChange={(event) => setIncludeProfile(event.target.checked)} />
                  {t('profileSection')}
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={includeQuestionnaires} onChange={(event) => setIncludeQuestionnaires(event.target.checked)} />
                  {t('questionnaireSection')}
                </label>
              </div>
            </fieldset>

            <button type="submit" disabled={loading || (!includeProfile && !includeQuestionnaires)} className="rounded bg-teal-800 px-4 py-2 font-medium text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? t('generating') : t('generate')}
            </button>
          </form>

          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        </section>

        <section className="summary-controls rounded border border-cyan-200 bg-cyan-50 p-5" aria-labelledby="summary-privacy-title">
          <h3 id="summary-privacy-title" className="font-semibold text-gray-900">{t('privacyTitle')}</h3>
          <p className="mt-2 text-sm text-gray-700">{t('privacyBody')}</p>
          <p className="mt-2 text-sm font-medium text-gray-800">{t('consentNote')}</p>
        </section>

        {summary && (
          <section className="health-summary-paper rounded border border-gray-300 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="summary-preview-title">
            <header className="border-b border-gray-200 pb-4">
              <h3 id="summary-preview-title" className="text-xl font-semibold text-gray-900">{t('title')}</h3>
              <p className="mt-1 text-sm text-gray-600">{t('periodOutput', { start: formattedDate(`${summary.period.start_date}T00:00:00`), end: formattedDate(`${summary.period.end_date}T00:00:00`) })}</p>
              <p className="text-xs text-gray-500">{t('generatedAt', { date: formattedDate(summary.generated_at) })}</p>
            </header>

            {includeProfile && (
              <section className="mt-5">
                <h4 className="font-semibold text-gray-900">{t('profileSection')}</h4>
                <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div><dt className="text-sm text-gray-500">{t('name')}</dt><dd>{showValue(summary.profile.name)}</dd></div>
                  <div><dt className="text-sm text-gray-500">{t('dateOfBirth')}</dt><dd>{formattedDate(summary.profile.date_of_birth)}</dd></div>
                  <div><dt className="text-sm text-gray-500">{t('gender')}</dt><dd>{showValue(summary.profile.gender)}</dd></div>
                </dl>
              </section>
            )}

            {includeQuestionnaires && (
              <section className="mt-6">
                <h4 className="font-semibold text-gray-900">{t('questionnaireSection')}</h4>
                {summary.questionnaires.length === 0 && summary.risk_assessments.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-600">{t('emptyHistory')}</p>
                ) : null}
                {summary.questionnaires.map((record) => (
                  <article key={record.submitted_at} className="mt-3 border-t border-gray-200 pt-3">
                    <h5 className="font-medium text-gray-800">{t('questionnaireEntry', { date: formattedDate(record.submitted_at) })}</h5>
                    <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                      {[
                        ['existing_conditions', 'conditions'], ['allergies', 'allergies'],
                        ['current_medications', 'medications'], ['family_history', 'familyHistory'],
                        ['exercise_frequency', 'exercise'], ['diet_type', 'diet'],
                        ['smoking_status', 'smoking'], ['alcohol_consumption', 'alcohol'],
                        ['sleep_hours', 'sleep'], ['stress_level', 'stress'],
                      ].map(([field, label]) => (
                        <div key={field}>
                          <dt className="text-sm text-gray-500">{t(label)}</dt>
                          <dd className="whitespace-pre-wrap">{showValue(record[field])}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                ))}
                {summary.risk_assessments.map((assessment) => (
                  <article key={assessment.assessed_at} className="mt-3 border-t border-gray-200 pt-3">
                    <h5 className="font-medium text-gray-800">{t('riskEntry', { date: formattedDate(assessment.assessed_at) })}</h5>
                    <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                      <div><dt className="text-sm text-gray-500">{t('riskScore')}</dt><dd>{assessment.risk_score}%</dd></div>
                      <div><dt className="text-sm text-gray-500">{t('riskCategory')}</dt><dd>{t(`riskCategories.${assessment.risk_category}`, assessment.risk_category)}</dd></div>
                      <div className="sm:col-span-2"><dt className="text-sm text-gray-500">{t('riskDescription')}</dt><dd>{assessment.risk_category_description}</dd></div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm text-gray-500">{t('recommendations')}</dt>
                        <dd><ul className="list-disc ps-5">{assessment.recommendations.map((recommendation, index) => <li key={`${assessment.assessed_at}-${index}`}>{recommendation}</li>)}</ul></dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </section>
            )}

            <p className="mt-6 border-t border-gray-200 pt-4 text-sm font-medium text-gray-700">{t('disclaimer')}</p>
          </section>
        )}

        {summary && (
          <div className="summary-actions flex flex-wrap gap-3">
            <button type="button" onClick={downloadJson} className="rounded border border-teal-800 px-4 py-2 font-medium text-teal-900 hover:bg-teal-50">{t('download')}</button>
            <button type="button" onClick={() => window.print()} className="rounded border border-gray-400 px-4 py-2 font-medium text-gray-800 hover:bg-gray-50">{t('print')}</button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button type="button" onClick={shareJson} className="rounded border border-gray-400 px-4 py-2 font-medium text-gray-800 hover:bg-gray-50">{t('share')}</button>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default HealthSummary;