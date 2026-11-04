import { describe, expect, it } from 'vitest';

import {
  METRIC_RULES,
  TEXT_METRIC_RULES,
  validateBloodPressure,
  validateMeasurementDate,
  validateMeasurementNotes,
  validateMeasurementValue,
  validateTextMeasurement,
} from './healthMeasurements';

describe('health measurement definitions', () => {
  it('defines all nine numeric metrics', () => {
    expect(Object.keys(METRIC_RULES)).toHaveLength(9);
  });

  it('defines the symptoms text metric', () => {
    expect(TEXT_METRIC_RULES.symptoms.maximumLength).toBe(1000);
  });
});

describe('validateMeasurementValue', () => {
  it.each([
    ['blood_pressure_systolic', 120, 'mmHg'],
    ['blood_pressure_diastolic', 80, 'mmHg'],
    ['weight', 70.5, 'kg'],
    ['weight', 155.5, 'lb'],
    ['heart_rate', 72, 'bpm'],
    ['blood_glucose', 100, 'mg/dL'],
    ['blood_glucose', 5.5, 'mmol/L'],
    ['total_cholesterol', 180, 'mg/dL'],
    ['total_cholesterol', 4.5, 'mmol/L'],
    ['sleep_duration', 8, 'hours'],
    ['mood', 3, 'scale'],
    ['stress', 2, 'scale'],
  ])('accepts valid %s values', (metric, value, unit) => {
    expect(validateMeasurementValue(metric, value, unit)).toBeNull();
  });

  it.each([
    ['blood_pressure_systolic', 39, 'mmHg'],
    ['blood_pressure_systolic', 301, 'mmHg'],
    ['blood_pressure_diastolic', 19, 'mmHg'],
    ['blood_pressure_diastolic', 201, 'mmHg'],
    ['weight', 0, 'kg'],
    ['weight', 2205, 'lb'],
    ['heart_rate', 19, 'bpm'],
    ['heart_rate', 301, 'bpm'],
    ['blood_glucose', 0, 'mg/dL'],
    ['blood_glucose', 2001, 'mg/dL'],
    ['total_cholesterol', 0, 'mg/dL'],
    ['total_cholesterol', 1501, 'mg/dL'],
    ['sleep_duration', -1, 'hours'],
    ['sleep_duration', 25, 'hours'],
    ['mood', 0, 'scale'],
    ['mood', 6, 'scale'],
    ['stress', 0, 'scale'],
    ['stress', 6, 'scale'],
  ])('rejects out-of-range %s values', (metric, value, unit) => {
    expect(validateMeasurementValue(metric, value, unit)).not.toBeNull();
  });

  it('rejects unsupported metrics', () => {
    expect(
      validateMeasurementValue('temperature', 98, 'F')
    ).toContain('Unsupported measurement metric');
  });

  it('rejects unsupported units', () => {
    expect(
      validateMeasurementValue('weight', 70, 'stones')
    ).toContain('Unsupported unit');
  });

  it.each([NaN, Infinity, -Infinity, '70', null, undefined])(
    'rejects invalid numeric values: %s',
    (value) => {
      expect(
        validateMeasurementValue('weight', value, 'kg')
      ).not.toBeNull();
    }
  );

  it('rejects excessive decimal places', () => {
    expect(
      validateMeasurementValue('weight', 70.55, 'kg')
    ).toContain('decimal places');
  });

  it('rejects decimal values for whole-number metrics', () => {
    expect(
      validateMeasurementValue('heart_rate', 72.5, 'bpm')
    ).toContain('decimal places');
  });

  it('accepts values at the minimum and maximum boundaries', () => {
    expect(validateMeasurementValue('heart_rate', 20, 'bpm')).toBeNull();
    expect(validateMeasurementValue('heart_rate', 300, 'bpm')).toBeNull();
  });
});

describe('validateBloodPressure', () => {
  it('accepts valid blood pressure values', () => {
    expect(validateBloodPressure(120, 80)).toBeNull();
  });

  it('rejects systolic equal to diastolic', () => {
    expect(validateBloodPressure(80, 80)).toContain('greater than');
  });

  it('rejects systolic below diastolic', () => {
    expect(validateBloodPressure(70, 90)).toContain('greater than');
  });

  it('rejects values outside the supported ranges', () => {
    expect(validateBloodPressure(301, 80)).not.toBeNull();
    expect(validateBloodPressure(120, 201)).not.toBeNull();
  });
});

describe('validateTextMeasurement', () => {
  it('accepts valid symptom text', () => {
    expect(validateTextMeasurement('symptoms', 'Headache')).toBeNull();
  });

  it('rejects blank symptom text', () => {
    expect(validateTextMeasurement('symptoms', '   ')).toContain('blank');
  });

  it('rejects symptoms exceeding 1000 characters', () => {
    expect(
      validateTextMeasurement('symptoms', 'a'.repeat(1001))
    ).toContain('1000 characters');
  });

  it('accepts symptoms at the 1000-character limit', () => {
    expect(
      validateTextMeasurement('symptoms', 'a'.repeat(1000))
    ).toBeNull();
  });
});

describe('validateMeasurementNotes', () => {
  it('accepts empty optional notes', () => {
    expect(validateMeasurementNotes(null)).toBeNull();
    expect(validateMeasurementNotes('')).toBeNull();
  });

  it('accepts notes at the character limit', () => {
    expect(validateMeasurementNotes('a'.repeat(1000))).toBeNull();
  });

  it('rejects notes exceeding 1000 characters', () => {
    expect(
      validateMeasurementNotes('a'.repeat(1001))
    ).toContain('1000 characters');
  });

  it('rejects non-text notes', () => {
    expect(validateMeasurementNotes(123)).toContain('text');
  });

  describe('validateMeasurementDate', () => {
  const today = new Date(2026, 10, 4);

  it('accepts today', () => {
    expect(validateMeasurementDate('2026-11-04', today)).toBeNull();
  });

  it('accepts a past date', () => {
    expect(validateMeasurementDate('2026-11-03', today)).toBeNull();
  });

  it('rejects a future date', () => {
    expect(
      validateMeasurementDate('2026-11-05', today)
    ).toContain('cannot be in the future');
  });

  it('rejects an invalid date', () => {
    expect(
      validateMeasurementDate('2026-02-30', today)
    ).toContain('valid ISO date');
  });

  it('rejects an incorrectly formatted date', () => {
    expect(
      validateMeasurementDate('11/04/2026', today)
    ).toContain('valid ISO date');
  });

  it('rejects an empty date', () => {
    expect(validateMeasurementDate('', today)).toContain('valid ISO date');
  });
});

});