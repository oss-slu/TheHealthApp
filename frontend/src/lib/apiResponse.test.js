import { describe, it, expect } from 'vitest';
import { unwrapSuccessfulApiBody } from './apiResponse';

describe('unwrapSuccessfulApiBody', () => {
  it('returns nested data when the API uses SuccessResponse shape', () => {
    const out = unwrapSuccessfulApiBody({
      status: 200,
      data: { success: true, data: { id: 1 } },
    });
    expect(out).toEqual({ id: 1 });
  });

  it('returns null when the response body is JSON null', () => {
    const out = unwrapSuccessfulApiBody({ status: 200, data: null });
    expect(out).toBeNull();
  });

  it('returns undefined for 204 with no body', () => {
    const out = unwrapSuccessfulApiBody({ status: 204, data: undefined });
    expect(out).toBeUndefined();
  });

  it('returns raw data when there is no nested data key', () => {
    const out = unwrapSuccessfulApiBody({ status: 200, data: { ok: true } });
    expect(out).toEqual({ ok: true });
  });

  it('returns explicit nested null when data field exists', () => {
    const out = unwrapSuccessfulApiBody({
      status: 200,
      data: { success: true, data: null },
    });
    expect(out).toBeNull();
  });
});
