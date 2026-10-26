import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../api/client';
import { healthSummaryService } from './healthSummaryService';

vi.mock('../api/client', () => ({ default: { get: vi.fn() } }));

describe('healthSummaryService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('converts inclusive local calendar dates to UTC query boundaries', async () => {
    const start = new Date('2026-03-07T00:00:00');
    const endBefore = new Date('2026-03-09T00:00:00');
    endBefore.setDate(endBefore.getDate() + 1);

    await healthSummaryService.getSummary('2026-03-07', '2026-03-09');

    expect(apiClient.get).toHaveBeenCalledWith('/users/me/health-summary', {
      params: {
        start_date: '2026-03-07',
        end_date: '2026-03-09',
        start_at: start.toISOString(),
        end_before: endBefore.toISOString(),
      },
    });
  });
});