import { describe, expect, it } from 'vitest';
import { getHealthStatusClasses } from './healthStatusClasses';

describe('getHealthStatusClasses', () => {
  it.each([
    ['good', 'health-good'],
    ['warning', 'health-warning'],
    ['critical', 'health-critical'],
  ])('maps %s to its semantic health token', (status, token) => {
    expect(getHealthStatusClasses(status)).toContain(token);
  });

  it('falls back to a neutral status for unknown values', () => {
    expect(getHealthStatusClasses('unknown')).toBe(
      'border-slate-400 bg-slate-100 text-slate-800'
    );
  });
});
