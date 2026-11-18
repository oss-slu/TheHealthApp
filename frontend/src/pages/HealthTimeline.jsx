import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PageShell from '../components/PageShell';
import { EmptyState, ErrorAlert, LoadingState, Timeline } from '../components/ui';
import { healthTimelineService } from '../services/healthTimelineService';

const PAGE_SIZE = 20;

const EVENT_ICONS = {
  assessment: '📋',
  measurement: '📏',
  medication: '💊',
  symptom: '🩺',
  goal: '🎯',
  note: '📝',
};

const EVENT_LINKS = {
  health_risk_assessment: '/modules/framingham-risk',
  questionnaire: '/questionnaire',
  prescription: '/modules/prescription',
  medication_dose: '/modules/prescription',
};

const formatEventDate = (value, locale) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const HealthTimeline = () => {
  const { t, i18n } = useTranslation('timeline');

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [hasMore, setHasMore] = useState(false);

    const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const response = await healthTimelineService.getTimeline({
        limit: PAGE_SIZE,
        offset: 0,
      });

      setEvents(response.events || []);
      setHasMore(response.has_more);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

    const loadMore = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    setLoadMoreError(false);

    try {
      const response = await healthTimelineService.getTimeline({
        limit: PAGE_SIZE,
        offset: events.length,
      });

      setEvents((previousEvents) => [
        ...previousEvents,
        ...(response.events || []),
      ]);
      setHasMore(response.has_more);
    } catch {
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const timelineItems = events.map((event) => {
    const category = event.category;
    const date = formatEventDate(
      event.occurred_at,
      i18n.resolvedLanguage || i18n.language
    );

    return {
      id: event.id,
      title: t(`sources.${event.source}`, {
        defaultValue: t(`categories.${category}`),
      }),
      description: t(`categories.${category}`),
      meta: date ? `${t('eventDate')}: ${date}` : '',
      icon: EVENT_ICONS[category] || '•',
      iconLabel: t(`iconLabels.${category}`, {
        defaultValue: t(`categories.${category}`),
      }),
      href: EVENT_LINKS[event.source],
      linkLabel: EVENT_LINKS[event.source] ? t('viewRelated') : undefined,
    };
  });

  return (
    <PageShell title={t('title')}>
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <header>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            {t('title')}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t('intro')}
          </p>
        </header>
                {loading && <LoadingState label={t('loading')} />}

        {error && (
          <ErrorAlert
            title={t('loadErrorTitle')}
            onRetry={loadTimeline}
            retryLabel={t('retry')}
          >
            {t('loadError')}
          </ErrorAlert>
        )}

        {!loading && !error && events.length === 0 && (
          <EmptyState
            title={t('emptyTitle')}
            description={t('emptyDescription')}
          />
        )}

        {!loading && !error && events.length > 0 && (
          <section aria-label={t('title')} className="space-y-5">
            <Timeline items={timelineItems} />

            {loadMoreError && (
              <ErrorAlert
                onRetry={loadMore}
                retryLabel={t('retry')}
              >
                {t('loadMoreError')}
              </ErrorAlert>
            )}

            {hasMore && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-[var(--radius-md)] border border-[var(--surface-border)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? t('loadingMore') : t('loadMore')}
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </PageShell>
  );
};

export default HealthTimeline;