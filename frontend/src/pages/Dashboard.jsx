import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { EmptyState, Metric } from '../components/ui';
import apiClient from '../api/client';

const TOOLS = [
  {
    path: '/health-summary',
    titleKey: 'summary:navLabel',
    descKey: 'summary:dashboardDescription',
    ns: 'summary',
  },
  {
    path: '/modules/framingham-risk',
    titleKey: 'dashboard:framinghamCardTitle',
    descKey: 'dashboard:framinghamCardDesc',
    ns: 'dashboard',
  },
  {
    path: '/modules/heart-risk',
    titleKey: 'modules:heartRisk',
    descKey: 'modules:cardioRiskAssessmentDescription',
    ns: 'modules',
  },
  {
    path: '/modules/prescription',
    titleKey: 'modules:prescription',
    descKey: 'modules:medicalDescription',
    ns: 'modules',
  },
  {
    path: '/modules/tba',
    titleKey: 'modules:tba',
    descKey: 'modules:tbaDescription',
    ns: 'modules',
  },
];

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'modules', 'questionnaire', 'common', 'summary']);
  const location = useLocation();
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [questionnaireComplete, setQuestionnaireComplete] = useState(
    Boolean(location.state?.questionnaireComplete)
  );

  useEffect(() => {
    let cancelled = false;

    const checkQuestionnaireStatus = async () => {
      try {
        const response = await apiClient.get('/questionnaire/status');
        if (!cancelled) {
          setQuestionnaireComplete(Boolean(response.completed));
        }
      } catch (error) {
        console.error('Failed to check questionnaire status:', error);
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    };

    checkQuestionnaireStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryHref = questionnaireComplete ? '/modules/framingham-risk' : '/questionnaire';
  const primaryTitle = questionnaireComplete
    ? t('dashboard:primaryActionCompleteTitle')
    : t('dashboard:healthQuestionnaire');
  const primaryDescription = questionnaireComplete
    ? t('dashboard:primaryActionCompleteDesc')
    : t('dashboard:questionnaireDescription');
  const primaryCta = questionnaireComplete
    ? t('dashboard:startFramingham')
    : t('dashboard:completeQuestionnaire');

  return (
    <PageShell title="dashboard:title">
      <div className="space-y-10" data-testid="dashboard-root">
        <section aria-labelledby="dashboard-primary-heading" data-testid="dashboard-primary">
          <Link
            to={primaryHref}
            className="group relative block overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-brand-700)] px-6 py-8 text-[var(--text-inverse)] shadow-[var(--shadow-surface)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-100/90">
              {t('dashboard:primaryActionLabel')}
            </p>
            <h2
              id="dashboard-primary-heading"
              className="mt-2 font-display text-2xl font-bold sm:text-3xl"
            >
              {primaryTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-teal-50/90 sm:text-base">
              {primaryDescription}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold">
              {primaryCta}
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5">
                →
              </span>
            </span>
          </Link>
        </section>

        <section aria-labelledby="dashboard-status-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 id="dashboard-status-heading" className="font-display text-xl font-semibold">
              {t('dashboard:healthStatus')}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Metric
              label={t('dashboard:profileMetricLabel')}
              value={
                loadingStatus
                  ? t('common:pleaseWait')
                  : questionnaireComplete
                    ? t('dashboard:profileComplete')
                    : t('dashboard:profileIncomplete')
              }
              status={questionnaireComplete ? 'ok' : 'warn'}
              hint={
                questionnaireComplete
                  ? t('dashboard:profileCompleteHint')
                  : t('dashboard:promptAssess')
              }
            />
            <Metric
              label={t('dashboard:nextStepLabel')}
              value={
                questionnaireComplete
                  ? t('dashboard:nextStepAssess')
                  : t('dashboard:nextStepQuestionnaire')
              }
              status="info"
              hint={t('dashboard:nextStepHint')}
            />
          </div>
        </section>

        <section aria-labelledby="dashboard-tools-heading">
          <div className="mb-4">
            <h2 id="dashboard-tools-heading" className="font-display text-xl font-semibold">
              {t('dashboard:toolsHeading')}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{t('dashboard:toolsSubtitle')}</p>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="dashboard-tools">
            {TOOLS.map((tool) => (
              <li key={tool.path}>
                <Link
                  to={tool.path}
                  className="surface-elevated flex h-full flex-col p-5 transition-colors hover:border-[var(--color-brand-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                    {t(tool.titleKey)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)]">{t(tool.descKey)}</p>
                  <span className="mt-4 text-sm font-semibold text-[var(--color-brand-700)]">
                    {t('dashboard:viewDetails')} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="dashboard-activity-heading">
          <h2 id="dashboard-activity-heading" className="mb-4 font-display text-xl font-semibold">
            {t('dashboard:recentAssessments')}
          </h2>
          <EmptyState
            title={t('dashboard:noRecent')}
            description={t('dashboard:activityEmptyDesc')}
            action={
              <Link
                to={questionnaireComplete ? '/modules/framingham-risk' : '/questionnaire'}
                className="rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
              >
                {questionnaireComplete
                  ? t('dashboard:startFramingham')
                  : t('dashboard:completeQuestionnaire')}
              </Link>
            }
          />
        </section>
      </div>
    </PageShell>
  );
};

export default Dashboard;
