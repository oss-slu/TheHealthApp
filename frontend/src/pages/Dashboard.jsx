import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import PageShell from '../components/PageShell';
import {
  EmptyState,
  ErrorAlert,
  LoadingState,
  Metric,
} from '../components/ui';
import apiClient from '../api/client';
import { healthTimelineService } from '../services/healthTimelineService';
import { integrationService } from '../services/integrationService';
import { prescriptionService } from '../services/prescriptionService';

const TOOLS = [
  {
    path: '/health-summary',
    titleKey: 'summary:navLabel',
    descKey: 'summary:dashboardDescription',
  },
    {
    path: '/health-timeline',
    titleKey: 'timeline:navLabel',
    descKey: 'timeline:dashboardDescription',
  },
  {
    path: '/modules/framingham-risk',
    titleKey: 'dashboard:framinghamCardTitle',
    descKey: 'dashboard:framinghamCardDesc',
  },
  {
    path: '/modules/heart-risk',
    titleKey: 'modules:heartRisk',
    descKey: 'modules:cardioRiskAssessmentDescription',
  },
  {
    path: '/modules/prescription',
    titleKey: 'modules:prescription',
    descKey: 'modules:medicalDescription',
  },
  {
    path: '/modules/tba',
    titleKey: 'modules:tba',
    descKey: 'modules:tbaDescription',
  },
];

const Dashboard = () => {
  const { t, i18n } = useTranslation(['dashboard', 'modules', 'questionnaire', 'common', 'summary', 'timeline']);
  const location = useLocation();
  const isMounted = useRef(false);
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
  };
}, []);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [questionnaireComplete, setQuestionnaireComplete] = useState(
    Boolean(location.state?.questionnaireComplete)
  );

  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);

  const [measurements, setMeasurements] = useState([]);
  const [measurementsLoading, setMeasurementsLoading] = useState(true);
  const [measurementsError, setMeasurementsError] = useState(false);

  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(true);
  const [prescriptionsError, setPrescriptionsError] = useState(false);

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

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    setActivityError(false);

    try {
      const response = await healthTimelineService.getTimeline({
        limit: 5,
        offset: 0,
      });

      if (isMounted.current) {
        setActivity(Array.isArray(response?.events) ? response.events : []);
      }
    } catch (error) {
      console.error('Failed to load dashboard activity:', error);
      if (isMounted.current) setActivityError(true);
    } finally {
      if (isMounted.current) setActivityLoading(false);
    }
  }, []);

  const loadMeasurements = useCallback(async () => {
    setMeasurementsLoading(true);
    setMeasurementsError(false);

    try {
      const response = await integrationService.listMeasurements();

      if (isMounted.current) {
        setMeasurements(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Failed to load dashboard measurements:', error);
      if (isMounted.current) setMeasurementsError(true);
    } finally {
      if (isMounted.current) setMeasurementsLoading(false);
    }
  }, []);

  const loadPrescriptions = useCallback(async () => {
    setPrescriptionsLoading(true);
    setPrescriptionsError(false);

    try {
      const response = await prescriptionService.getAll();

      if (isMounted.current) {
        setPrescriptions(Array.isArray(response) ? response : []);
      }
    } catch (error) {
      console.error('Failed to load dashboard prescriptions:', error);
      if (isMounted.current) setPrescriptionsError(true);
    } finally {
      if (isMounted.current) setPrescriptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivity();
    loadMeasurements();
    loadPrescriptions();
  }, [loadActivity, loadMeasurements, loadPrescriptions]);

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
            <h2 id="dashboard-primary-heading" className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              {primaryTitle}
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-teal-50/90 sm:text-base">{primaryDescription}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold">
              {primaryCta}
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              >
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
          </div>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2" data-testid="dashboard-tools">
            {TOOLS.map((tool) => (
              <li key={tool.path}>
                <Link
                  to={tool.path}
                  className="surface-elevated flex h-full flex-col p-5 transition-colors hover:border-[var(--color-brand-500)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">
                    {t(tool.titleKey, tool.titleKey)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-[var(--text-secondary)]">
                    {t(tool.descKey, tool.descKey)}
                  </p>
                  <span className="mt-4 text-sm font-semibold text-[var(--color-brand-700)]">
                    {t('dashboard:viewDetails')} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

                <section aria-labelledby="dashboard-measurements-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="dashboard-measurements-heading"
              className="font-display text-xl font-semibold"
            >
              {t('dashboard:measurementsHeading')}
            </h2>
            <Link
              to="/health-timeline"
              className="text-sm font-semibold text-[var(--color-brand-700)] underline underline-offset-2"
            >
              {t('dashboard:viewDetails')}
            </Link>
          </div>

          {measurementsLoading ? (
            <LoadingState label={t('dashboard:measurementsLoading')} />
          ) : measurementsError ? (
            <ErrorAlert
              title={t('dashboard:measurementsErrorTitle')}
              onRetry={loadMeasurements}
              retryLabel={t('dashboard:retry')}
            >
              {t('dashboard:measurementsError')}
            </ErrorAlert>
          ) : measurements.length === 0 ? (
            <EmptyState
              title={t('dashboard:noMeasurements')}
              description={t('dashboard:measurementsEmptyDesc')}
              action={
                <Link
                to="/health-summary"
                className="rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
              >
                {t('dashboard:addMeasurement')}
              </Link>
            }
          />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {measurements.slice(0, 6).map((measurement) => {
                const recordedDate = new Date(measurement.recorded_at);
                const formattedDate = Number.isNaN(recordedDate.getTime())
                  ? ''
                  : new Intl.DateTimeFormat(i18n.language, {
                      dateStyle: 'medium',
                    }).format(recordedDate);

                return (
                  <li
                    key={measurement.id}
                    className="surface-elevated p-4"
                  >
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {t(
                        `dashboard:measurementTypes.${measurement.measurement_type}`,
                        { defaultValue: measurement.measurement_type }
                      )}
                    </h3>
                    <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">
                      {measurement.value} {measurement.unit}
                    </p>
                    {formattedDate && (
                      <time
                        dateTime={measurement.recorded_at}
                        className="mt-1 block text-sm text-[var(--text-secondary)]"
                      >
                        {formattedDate}
                      </time>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

                <section aria-labelledby="dashboard-medications-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="dashboard-medications-heading"
              className="font-display text-xl font-semibold"
            >
              {t('dashboard:medicationsHeading')}
            </h2>
            <Link
              to="/modules/prescription"
              className="text-sm font-semibold text-[var(--color-brand-700)] underline underline-offset-2"
            >
              {t('dashboard:viewDetails')}
            </Link>
          </div>

          {prescriptionsLoading ? (
            <LoadingState label={t('dashboard:medicationsLoading')} />
          ) : prescriptionsError ? (
            <ErrorAlert
              title={t('dashboard:medicationsErrorTitle')}
              onRetry={loadPrescriptions}
              retryLabel={t('dashboard:retry')}
            >
              {t('dashboard:medicationsError')}
            </ErrorAlert>
          ) : prescriptions.length === 0 ? (
            <EmptyState
              title={t('dashboard:noMedications')}
              description={t('dashboard:medicationsEmptyDesc')}
              action={
                <Link
                  to="/modules/prescription"
                  className="rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-4 py-2 text-sm font-semibold text-white"
                >
                  {t('dashboard:manageMedications')}
                </Link>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {prescriptions.slice(0, 4).map((prescription) => {
                const nextDose = prescription.next_dose
                  ? new Date(prescription.next_dose)
                  : null;
                const formattedNextDose =
                  nextDose && !Number.isNaN(nextDose.getTime())
                    ? new Intl.DateTimeFormat(i18n.language, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(nextDose)
                    : '';

                return (
                  <li
                    key={prescription.id}
                    className="surface-elevated p-4"
                  >
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {prescription.medication_name}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {prescription.dosage} · {prescription.frequency}
                    </p>
                    {formattedNextDose && (
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {t('dashboard:nextDose')}: {formattedNextDose}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

                <section aria-labelledby="dashboard-goals-heading">
          <h2
            id="dashboard-goals-heading"
            className="mb-4 font-display text-xl font-semibold"
          >
            {t('dashboard:goalsHeading')}
          </h2>
          <EmptyState
            title={t('dashboard:goalsUnavailable')}
            description={t('dashboard:goalsUnavailableDesc')}
          />
        </section>

        <section aria-labelledby="dashboard-activity-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="dashboard-activity-heading"
              className="font-display text-xl font-semibold"
            >
              {t('dashboard:recentAssessments')}
            </h2>
            <Link
              to="/health-timeline"
              className="text-sm font-semibold text-[var(--color-brand-700)] underline underline-offset-2"
            >
              {t('dashboard:viewAllActivity')}
            </Link>
          </div>

          {activityLoading ? (
            <LoadingState label={t('dashboard:activityLoading')} />
          ) : activityError ? (
            <ErrorAlert
              title={t('dashboard:activityErrorTitle')}
              onRetry={loadActivity}
              retryLabel={t('dashboard:retry')}
            >
              {t('dashboard:activityError')}
            </ErrorAlert>
          ) : activity.length === 0 ? (
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
          ) : (
            <ul className="space-y-3">
              {activity.map((event) => {
                const eventDate = new Date(event.occurred_at || event.created_at);
                const formattedDate = Number.isNaN(eventDate.getTime())
                  ? ''
                  : new Intl.DateTimeFormat(i18n.language, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(eventDate);

                return (
                  <li
                    key={event.id}
                    className="surface-elevated flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {t(
                          `timeline:sources.${event.source}`,
                          {
                            defaultValue: t(`timeline:categories.${event.category}`),
                          }
                        )}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {t(`timeline:categories.${event.category}`)}
                      </p>
                    </div>
                    {formattedDate && (
                      <time
                        dateTime={event.occurred_at || event.created_at}
                        className="text-sm text-[var(--text-secondary)]"
                      >
                        {formattedDate}
                      </time>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
};

export default Dashboard;
