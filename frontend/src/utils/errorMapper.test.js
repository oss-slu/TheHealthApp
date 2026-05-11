import { describe, it, expect } from 'vitest';
import { mapApiError } from './errorMapper';

const makeAxiosError = (status, data = {}) => ({
  response: { status, data },
});

describe('mapApiError', () => {
  it('maps 413 to payloadTooLarge', () => {
    const mapped = mapApiError(
      makeAxiosError(413, { error: { message: 'Image is too large.' } }),
    );
    expect(mapped.messageKey).toBe('errors.payloadTooLarge');
    expect(mapped.status).toBe(413);
  });

  it('maps network errors without response', () => {
    const mapped = mapApiError({ message: 'Network Error' });
    expect(mapped.messageKey).toBe('errors.network');
  });

  it('maps 404 with generic key when no specific rule matches', () => {
    const mapped = mapApiError(makeAxiosError(404, { error: { message: 'Missing' } }));
    expect(mapped.messageKey).toBe('errors.notFound');
    expect(mapped.status).toBe(404);
  });
});
