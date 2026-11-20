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
  const [nextAction, setNextAction] = useState(null);
  const [nextActionLoading, setNextActionLoading] = useState(true);
  const [nextActionError, setNextActionError] = useState(false);
  const [nextActionDismissing, setNextActionDismissing] = useState(false);
  const [checkIn, setCheckIn] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(true);
  const [checkInSubmitting, setCheckInSubmitting] = useState(false);
  const [checkInError, setCheckInError] = useState(false);
  const [checkInFeeling, setCheckInFeeling] = useState('');
  const [checkInCompleted, setCheckInCompleted] = useState(false);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const loadDailyCheckIn = useCallback(async () => {
    setCheckInLoading(true);
    setCheckInError(false);

    try {
      const response = await apiClient.get('/users/me/daily-check-in', {
        params: { timezone: userTimezone },
      });

      if (isMounted.current) {
        setCheckIn(response?.check_in || null);
        setCheckInCompleted(Boolean(response?.completed));
      }
    } catch (error) {
      console.error('Failed to load daily check-in:', error);
      if (isMounted.current) setCheckInError(true);
    } finally {
      if (isMounted.current) setCheckInLoading(false);
    }
  }, [userTimezone]);

  const submitDailyCheckIn = async () => {
    if (!checkInFeeling || checkInSubmitting) return;

    setCheckInSubmitting(true);
    setCheckInError(false);

    try {
      const response = await apiClient.post(
        '/users/me/daily-check-in',
        { feeling: checkInFeeling },
        { params: { timezone: userTimezone } },
      );

      if (isMounted.current) {
        setCheckIn(response);
        setCheckInCompleted(true);
        setCheckInFeeling('');
        loadActivity();
      }
    } catch (error) {
      console.error('Failed to submit daily check-in:', error);
      if (isMounted.current) setCheckInError(true);
    } finally {
      if (isMounted.current) setCheckInSubmitting(false);
    }
  };

  const loadNextAction = useCallback(async () => {
    setNextActionLoading(true);
    setNextActionError(false);

    try {
      const response = await apiClient.get('/users/me/next-action');

      if (isMounted.current) {
        setNextAction(response?.action || null);
      }
    } catch (error) {
      console.error('Failed to load dashboard next action:', error);
      if (isMounted.current) setNextActionError(true);
    } finally {
      if (isMounted.current) setNextActionLoading(false);
    }
  }, []);

  const dismissNextAction = async () => {
    if (!nextAction || nextActionDismissing) return;

    setNextActionDismissing(true);
    setNextActionError(false);

    try {
      await apiClient.post('/users/me/next-action/dismiss', {
        action_key: nextAction.key,
      });

      if (isMounted.current) {
        setNextAction(null);
      }
    } catch (error) {
      console.error('Failed to dismiss dashboard next action:', error);
      if (isMounted.current) setNextActionError(true);
    } finally {
      if (isMounted.current) setNextActionDismissing(false);
    }
  };

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
    loadDailyCheckIn();
    loadNextAction();
  }, [loadActivity, loadMeasurements, loadPrescriptions, loadDailyCheckIn, loadNextAction]);

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

          {(nextActionLoading || nextActionError || nextAction) && (
          <section
            aria-labelledby="next-action-heading"
            className="surface-elevated p-5 sm:p-6"
            data-testid="next-action"
          >
            {nextActionLoading ? (
              <LoadingState label={t('dashboard:nextAction.loading')} />
            ) : nextActionError ? (
              <ErrorAlert
                title={t('dashboard:nextAction.errorTitle')}
                onRetry={loadNextAction}
                retryLabel={t('dashboard:nextAction.retry')}
              >
                {t('dashboard:nextAction.error')}
              </ErrorAlert>
            ) : (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-700)]">
                      {t('dashboard:nextAction.heading')}
                    </p>
                    <h2
                      id="next-action-heading"
                      className="mt-2 font-display text-xl font-semibold"
                    >
                      {t('dashboard:nextAction.title')}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {t('dashboard:nextAction.description')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={dismissNextAction}
                    disabled={nextActionDismissing}
                    className="text-sm font-medium text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {nextActionDismissing
                      ? t('dashboard:nextAction.dismissing')
                      : t('dashboard:nextAction.dismiss')}
                  </button>
                </div>

                <Link
                  to={nextAction.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-700)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  {t('dashboard:nextAction.cta')}
                  <span aria-hidden="true">→</span>
                </Link>
              </>
            )}
          </section>
        )}

        <section
          aria-labelledby="daily-check-in-heading"
          className="surface-elevated p-5 sm:p-6"
          data-testid="daily-check-in"
        >
          <div className="mb-4">
            <h2
              id="daily-check-in-heading"
              className="font-display text-xl font-semibold"
            >
              {t('dashboard:dailyCheckIn.heading')}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {t('dashboard:dailyCheckIn.description')}
            </p>
          </div>

          {checkInLoading ? (
            <LoadingState label={t('dashboard:dailyCheckIn.loading')} />
          ) : checkInError ? (
            <ErrorAlert
              title={t('dashboard:dailyCheckIn.errorTitle')}
              onRetry={loadDailyCheckIn}
              retryLabel={t('dashboard:dailyCheckIn.retry')}
            >
              {t('dashboard:dailyCheckIn.error')}
            </ErrorAlert>
          ) : checkInCompleted ? (
            <div
              className="rounded-[var(--radius-md)] bg-[var(--surface-subtle)] p-4"
              role="status"
              aria-live="polite"
            >
              <p className="font-semibold text-[var(--text-primary)]">
                {t('dashboard:dailyCheckIn.completed')}
              </p>
              {checkIn?.feeling && (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {t('dashboard:dailyCheckIn.completedFeeling')}{' '}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {t(`dashboard:dailyCheckIn.${checkIn.feeling}`)}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitDailyCheckIn();
              }}
              className="space-y-4"
            >
              <fieldset disabled={checkInSubmitting}>
                <legend className="mb-3 font-medium text-[var(--text-primary)]">
                  {t('dashboard:dailyCheckIn.question')}
                </legend>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {['good', 'okay', 'not_well'].map((feeling) => (
                    <label
                      key={feeling}
                      className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border p-4 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus-ring)] ${
                        checkInFeeling === feeling
                          ? 'border-[var(--color-brand-600)] bg-[var(--surface-subtle)]'
                          : 'border-[var(--border-default)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="daily-check-in-feeling"
                        value={feeling}
                        checked={checkInFeeling === feeling}
                        onChange={() => setCheckInFeeling(feeling)}
                        className="h-4 w-4 accent-[var(--color-brand-600)]"
                      />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {t(`dashboard:dailyCheckIn.${feeling === 'not_well' ? 'notWell' : feeling}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {checkInError && (
                <p role="alert" className="text-sm text-[var(--color-danger-700)]">
                  {t('dashboard:dailyCheckIn.error')}
                </p>
              )}

              <button
                type="submit"
                disabled={!checkInFeeling || checkInSubmitting}
                className="rounded-[var(--radius-md)] bg-[var(--color-brand-600)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                {checkInSubmitting
                  ? t('dashboard:dailyCheckIn.submitting')
                  : t('dashboard:dailyCheckIn.submit')}
              </button>
            </form>
          )}
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
