import { describe, it, expect } from 'vitest';
import { parseHealthRiskAssessment } from './riskAssessmentResponse';

const validPayload = {
  risk_score: 12.5,
  risk_category: 'moderate',
  risk_category_description: 'Moderate risk',
  factor_breakdown: {
    age_factor: 1.1,
    cholesterol_factor: 2.2,
    blood_pressure_factor: 3.3,
    smoking_factor: 0.5,
    diabetes_factor: 0.2,
  },
  recommendations: ['Eat well', 'Exercise'],
  disclaimer: 'Educational only.',
};

describe('parseHealthRiskAssessment', () => {
  it('accepts a valid backend-shaped payload', () => {
    const out = parseHealthRiskAssessment(validPayload);
    expect(out).not.toBeNull();
    expect(out.risk_score).toBe(12.5);
    expect(out.risk_category).toBe('moderate');
    expect(out.factor_breakdown.age_factor).toBe(1.1);
    expect(out.recommendations).toEqual(['Eat well', 'Exercise']);
  });

  it('rejects null and non-objects', () => {
    expect(parseHealthRiskAssessment(null)).toBeNull();
    expect(parseHealthRiskAssessment(undefined)).toBeNull();
    expect(parseHealthRiskAssessment('x')).toBeNull();
  });

  it('rejects out-of-range risk_score', () => {
    expect(parseHealthRiskAssessment({ ...validPayload, risk_score: 101 })).toBeNull();
    expect(parseHealthRiskAssessment({ ...validPayload, risk_score: -1 })).toBeNull();
    expect(parseHealthRiskAssessment({ ...validPayload, risk_score: NaN })).toBeNull();
  });

  it('rejects missing category or description', () => {
    expect(parseHealthRiskAssessment({ ...validPayload, risk_category: '' })).toBeNull();
    expect(parseHealthRiskAssessment({ ...validPayload, risk_category_description: 123 })).toBeNull();
  });

  it('rejects invalid factor_breakdown', () => {
    expect(parseHealthRiskAssessment({ ...validPayload, factor_breakdown: null })).toBeNull();
    expect(
      parseHealthRiskAssessment({
        ...validPayload,
        factor_breakdown: { ...validPayload.factor_breakdown, age_factor: 'nope' },
      }),
    ).toBeNull();
  });

  it('rejects invalid recommendations', () => {
    expect(parseHealthRiskAssessment({ ...validPayload, recommendations: 'not-array' })).toBeNull();
    expect(parseHealthRiskAssessment({ ...validPayload, recommendations: [1, 2] })).toBeNull();
  });

  it('rejects invalid disclaimer', () => {
    expect(parseHealthRiskAssessment({ ...validPayload, disclaimer: null })).toBeNull();
  });
});
