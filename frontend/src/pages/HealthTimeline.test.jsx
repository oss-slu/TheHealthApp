
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createAuthenticatedContext,
  renderWithProviders,
  screen,
  userEvent,
} from '../test/test-utils';
import { healthTimelineService } from '../services/healthTimelineService';
import HealthTimeline from './HealthTimeline';

vi.mock('../services/healthTimelineService', () => ({
  healthTimelineService: {
    getTimeline: vi.fn(),
  },
}));

const createEvent = ({
  id = 'event-1',
  category = 'assessment',
  source = 'health_risk_assessment',
  date = '2026-11-18T14:00:00.000Z',
} = {}) => ({
  id,
  category,
  source,
  occurred_at: date,
  created_at: date,
  detail_reference: {
    entity_type: category,
    entity_id: `record-${id}`,
  },
});

const createResponse = ({
  events = [],
  total = events.length,
  offset = 0,
  has_more = false,
} = {}) => ({
  events,
  total,
  limit: 20,
  offset,
  has_more,
});

const renderTimeline = () =>
  renderWithProviders(<HealthTimeline />, {
    authContext: createAuthenticatedContext(),
  });

describe('HealthTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays health events with dates and related links', async () => {
    healthTimelineService.getTimeline.mockResolvedValue(
      createResponse({ events: [createEvent()] })
    );

    renderTimeline();

    expect(
      await screen.findByText('Health risk assessment')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Assessment', { selector: 'p' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: 'View related information' })
    ).toHaveAttribute('href', '/modules/framingham-risk');

    expect(healthTimelineService.getTimeline).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
  });
  });

  it('links manual measurement events to the health summary', async () => {
    healthTimelineService.getTimeline.mockResolvedValueOnce(
      createResponse({
        events: [
          createEvent({
            id: 'measurement-1',
            category: 'measurement',
            source: 'manual_measurement',
          }),
        ],
      })
    );

    renderTimeline();

    expect(
      await screen.findByRole('link', {
        name: 'View related information',
      })
    ).toHaveAttribute('href', '/health-summary');
  });

  it('displays an accessible empty state when there are no events', async () => {
    healthTimelineService.getTimeline.mockResolvedValue(createResponse());

    renderTimeline();

    expect(
      await screen.findByText('No health activity yet')
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Your health activity will appear here/)
    ).toBeInTheDocument();

    expect(screen.getByTestId('empty-state')).toHaveAttribute(
      'role',
      'status'
    );
  });

  it('displays a filtered empty state when a category has no events', async () => {
  healthTimelineService.getTimeline
    .mockResolvedValueOnce(createResponse())
    .mockResolvedValueOnce(createResponse());

  renderTimeline();

  await userEvent.click(
    await screen.findByRole('button', { name: 'Measurement' })
  );

  expect(
    await screen.findByText('No matching activity')
  ).toBeInTheDocument();

  expect(
    screen.getByText(
      'No Measurement activity has been recorded yet.'
    )
  ).toBeInTheDocument();
});

  it('displays an error and retries loading the timeline', async () => {
    healthTimelineService.getTimeline
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(createResponse());

    renderTimeline();

    expect(
      await screen.findByText(
        'Your health timeline could not be loaded. Please try again.'
      )
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Try again' })
    );

    expect(
      await screen.findByText('No health activity yet')
    ).toBeInTheDocument();

    expect(healthTimelineService.getTimeline).toHaveBeenCalledTimes(2);
  });

  it('loads more events and appends them to the timeline', async () => {
    healthTimelineService.getTimeline
      .mockResolvedValueOnce(
        createResponse({
          events: [createEvent()],
          total: 2,
          has_more: true,
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          events: [
            createEvent({
              id: 'event-2',
              category: 'medication',
              source: 'prescription',
              date: '2026-11-17T14:00:00.000Z',
            }),
          ],
          total: 2,
          offset: 1,
        })
      );

    renderTimeline();

    expect(
      await screen.findByText('Health risk assessment')
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Load more' })
    );

    expect(
      await screen.findByText('Prescription added or updated')
    ).toBeInTheDocument();

    expect(screen.getByText('Health risk assessment')).toBeInTheDocument();

    expect(healthTimelineService.getTimeline).toHaveBeenNthCalledWith(2, {
      limit: 20,
      offset: 1,
    });

    expect(
      screen.queryByRole('button', { name: 'Load more' })
    ).not.toBeInTheDocument();
  });

  it('keeps the selected category when loading more events', async () => {
  healthTimelineService.getTimeline
  .mockResolvedValueOnce(createResponse())
    .mockResolvedValueOnce(
      createResponse({
        events: [
          createEvent({
            id: 'measurement-1',
            category: 'measurement',
            source: 'manual_measurement',
          }),
        ],
        total: 2,
        has_more: true,
      })
    )
    .mockResolvedValueOnce(
      createResponse({
        events: [
          createEvent({
            id: 'measurement-2',
            category: 'measurement',
            source: 'manual_measurement',
          }),
        ],
        total: 2,
        offset: 1,
      })
    );

  renderTimeline();

  await userEvent.click(
    await screen.findByRole('button', { name: 'Measurement' })
  );

  await userEvent.click(
    await screen.findByRole('button', { name: 'Load more' })
  );

  expect(
    await screen.findAllByText('Health measurement recorded')
  ).toHaveLength(2);

  expect(healthTimelineService.getTimeline).toHaveBeenNthCalledWith(3, {
    limit: 20,
    offset: 1,
    category: 'measurement',
  });
});

  it('keeps existing events and allows retry when loading more fails', async () => {
    healthTimelineService.getTimeline
      .mockResolvedValueOnce(
        createResponse({
          events: [createEvent()],
          total: 2,
          has_more: true,
        })
      )
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(
        createResponse({
          events: [
            createEvent({
              id: 'event-2',
              category: 'medication',
              source: 'prescription',
              date: '2026-11-17T14:00:00.000Z',
            }),
          ],
          total: 2,
          offset: 1,
        })
      );

    renderTimeline();

    expect(
      await screen.findByText('Health risk assessment')
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Load more' })
    );

    expect(
      await screen.findByText(
        'More events could not be loaded. Please try again.'
      )
    ).toBeInTheDocument();

    expect(screen.getByText('Health risk assessment')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Try again' })
    );

    expect(
      await screen.findByText('Prescription added or updated')
    ).toBeInTheDocument();

    expect(healthTimelineService.getTimeline).toHaveBeenCalledTimes(3);
  });

  it('filters timeline events by category', async () => {
  healthTimelineService.getTimeline
    .mockResolvedValueOnce(
      createResponse({ events: [createEvent()] })
    )
    .mockResolvedValueOnce(
      createResponse({
        events: [
          createEvent({
            id: 'measurement-1',
            category: 'measurement',
            source: 'manual_measurement',
          }),
        ],
      })
    );

  renderTimeline();

  expect(
    await screen.findByText('Health risk assessment')
  ).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('button', { name: 'Measurement' })
  );

  expect(
    await screen.findByText('Health measurement recorded')
  ).toBeInTheDocument();

  expect(healthTimelineService.getTimeline).toHaveBeenNthCalledWith(2, {
    limit: 20,
    offset: 0,
    category: 'measurement',
  });

  expect(
    screen.queryByText('Health risk assessment')
  ).not.toBeInTheDocument();
});
});
