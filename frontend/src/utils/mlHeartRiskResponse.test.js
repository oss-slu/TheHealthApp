import { describe, it, expect } from 'vitest';
import { parseMlHeartRiskResponse } from './mlHeartRiskResponse';

describe('parseMlHeartRiskResponse', () => {
  it('returns null for empty or non-object input', () => {
    expect(parseMlHeartRiskResponse(null)).toBeNull();
    expect(parseMlHeartRiskResponse(undefined)).toBeNull();
    expect(parseMlHeartRiskResponse('')).toBeNull();
  });

  it('returns null when risk_level is missing', () => {
    expect(parseMlHeartRiskResponse({ advice: 'x' })).toBeNull();
  });

  it('normalizes a valid payload', () => {
    const out = parseMlHeartRiskResponse({
      risk_level: 'Low',
      advice: 'Stay active',
      probability: 0.12,
      urgent_warning: '',
      personalized_tips: [{ title: 'T', points: ['a'] }],
      general_tips: ['g'],
    });
    expect(out).toMatchObject({
      risk_level: 'Low',
      advice: 'Stay active',
      probability: 0.12,
      personalized_tips: [{ title: 'T', points: ['a'] }],
      general_tips: ['g'],
    });
  });

  it('filters invalid personalized_tips entries', () => {
    const out = parseMlHeartRiskResponse({
      risk_level: 'High',
      advice: '',
      personalized_tips: [{ title: 1, points: [] }, { title: 'OK', points: ['x'] }],
    });
    expect(out.personalized_tips).toEqual([{ title: 'OK', points: ['x'] }]);
  });
});
