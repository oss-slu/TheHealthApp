
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

describe('HealthTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays health events with dates and related links', async () => {
    healthTimelineService.getTimeline.mockResolvedValue({
      events: [
        {
          id: 'event-1',
          category: 'assessment',
          source: 'health_risk_assessment',
          occurred_at: '2026-11-18T14:00:00.000Z',
          created_at: '2026-11-18T14:00:00.000Z',
          detail_reference: {
            entity_type: 'assessment',
            entity_id: 'record-1',
          },
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
      has_more: false,
    });

    renderWithProviders(<HealthTimeline />, {
      authContext: createAuthenticatedContext(),
    });

    expect(
      await screen.findByText('Health risk assessment')
    ).toBeInTheDocument();

    expect(screen.getByText('Assessment')).toBeInTheDocument();

    expect(
      screen.getByRole('link', { name: 'View related information' })
    ).toHaveAttribute('href', '/modules/framingham-risk');

    expect(healthTimelineService.getTimeline).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
    });
  });

    it('displays an accessible empty state when there are no events', async () => {
    healthTimelineService.getTimeline.mockResolvedValue({
      events: [],
      total: 0,
      limit: 20,
      offset: 0,
      has_more: false,
    });

    renderWithProviders(<HealthTimeline />, {
      authContext: createAuthenticatedContext(),
    });

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

    it('displays an error and retries loading the timeline', async () => {
    healthTimelineService.getTimeline
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        events: [],
        total: 0,
        limit: 20,
        offset: 0,
        has_more: false,
      });

    renderWithProviders(<HealthTimeline />, {
      authContext: createAuthenticatedContext(),
    });

    expect(
      await screen.findByText('Your health timeline could not be loaded. Please try again.')
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
      .mockResolvedValueOnce({
        events: [
          {
            id: 'event-1',
            category: 'assessment',
            source: 'health_risk_assessment',
            occurred_at: '2026-11-18T14:00:00.000Z',
            created_at: '2026-11-18T14:00:00.000Z',
            detail_reference: {
              entity_type: 'assessment',
              entity_id: 'record-1',
            },
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
        has_more: true,
      })
      .mockResolvedValueOnce({
        events: [
          {
            id: 'event-2',
            category: 'medication',
            source: 'prescription',
            occurred_at: '2026-11-17T14:00:00.000Z',
            created_at: '2026-11-17T14:00:00.000Z',
            detail_reference: {
              entity_type: 'prescription',
              entity_id: 'record-2',
            },
          },
        ],
        total: 2,
        limit: 20,
        offset: 1,
        has_more: false,
      });

    renderWithProviders(<HealthTimeline />, {
      authContext: createAuthenticatedContext(),
    });

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

    it('keeps existing events and allows retry when loading more fails', async () => {
    healthTimelineService.getTimeline
      .mockResolvedValueOnce({
        events: [
          {
            id: 'event-1',
            category: 'assessment',
            source: 'health_risk_assessment',
            occurred_at: '2026-11-18T14:00:00.000Z',
            created_at: '2026-11-18T14:00:00.000Z',
            detail_reference: {
              entity_type: 'assessment',
              entity_id: 'record-1',
            },
          },
        ],
        total: 2,
        limit: 20,
        offset: 0,
        has_more: true,
      })
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        events: [
          {
            id: 'event-2',
            category: 'medication',
            source: 'prescription',
            occurred_at: '2026-11-17T14:00:00.000Z',
            created_at: '2026-11-17T14:00:00.000Z',
            detail_reference: {
              entity_type: 'prescription',
              entity_id: 'record-2',
            },
          },
        ],
        total: 2,
        limit: 20,
        offset: 1,
        has_more: false,
      });

    renderWithProviders(<HealthTimeline />, {
      authContext: createAuthenticatedContext(),
    });

    expect(
      await screen.findByText('Health risk assessment')
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Load more' })
    );

    expect(
      await screen.findByText('More events could not be loaded. Please try again.')
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
});
