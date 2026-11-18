
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../api/client';
import { healthTimelineService } from './healthTimelineService';

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));

describe('healthTimelineService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requests the first page with default pagination', async () => {
    await healthTimelineService.getTimeline();

    expect(apiClient.get).toHaveBeenCalledWith('/users/me/health-timeline', {
      params: { limit: 20, offset: 0 },
    });
  });

  it('supports custom pagination', async () => {
    await healthTimelineService.getTimeline({ limit: 10, offset: 20 });

    expect(apiClient.get).toHaveBeenCalledWith('/users/me/health-timeline', {
      params: { limit: 10, offset: 20 },
    });
  });

  it('includes optional category and date filters', async () => {
    await healthTimelineService.getTimeline({
      category: 'measurement',
      startAt: '2026-11-01T00:00:00.000Z',
      endBefore: '2026-11-19T00:00:00.000Z',
    });

    expect(apiClient.get).toHaveBeenCalledWith('/users/me/health-timeline', {
      params: {
        limit: 20,
        offset: 0,
        category: 'measurement',
        start_at: '2026-11-01T00:00:00.000Z',
        end_before: '2026-11-19T00:00:00.000Z',
      },
    });
  });
});
