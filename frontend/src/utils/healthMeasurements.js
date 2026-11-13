
// Supported manual health measurement definitions.
// Rules are loaded from the shared contract used by the backend.

import HEALTH_MEASUREMENT_CONTRACT from '@shared/health_measurements.json';

export const METRIC_RULES = HEALTH_MEASUREMENT_CONTRACT.metrics;
export const TEXT_METRIC_RULES = HEALTH_MEASUREMENT_CONTRACT.text_metrics;
export const MAX_NOTES_LENGTH =
  HEALTH_MEASUREMENT_CONTRACT.maximum_notes_length;

function validationError(code, params = {}) {
  return { code, params };
}

export function validateMeasurementValue(metric, value, unit) {
  const rule = METRIC_RULES[metric];

  if (!rule) {
    return validationError('unsupported_metric', { metric });
  }

  const unitRule = rule.units
    ? rule.units[unit]
    : rule.unit === unit
      ? rule
      : null;

  if (!unitRule) {
    return validationError('unsupported_unit', { metric, unit });
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return validationError('invalid_number');
  }

  if (value < unitRule.minimum || value > unitRule.maximum) {
    return validationError('out_of_range', {
      metric,
      minimum: unitRule.minimum,
      maximum: unitRule.maximum,
      unit,
    });
  }

  const decimalPlaces = String(value).includes('e')
    ? Math.max(0, -(Number(value).toExponential().split('e')[1]))
    : (String(value).split('.')[1] || '').length;

  if (decimalPlaces > unitRule.decimal_places) {
    return validationError('too_many_decimals', {
      metric,
      maximum: unitRule.decimal_places,
    });
  }

  return null;
}

export function validateBloodPressure(systolic, diastolic) {
  const systolicError = validateMeasurementValue(
    'blood_pressure_systolic',
    systolic,
    'mmHg'
  );

  if (systolicError) {
    return systolicError;
  }

  const diastolicError = validateMeasurementValue(
    'blood_pressure_diastolic',
    diastolic,
    'mmHg'
  );

  if (diastolicError) {
    return diastolicError;
  }

  if (systolic <= diastolic) {
    return validationError('systolic_not_greater_than_diastolic');
  }

  return null;
}

export function validateTextMeasurement(metric, value) {
  const rule = TEXT_METRIC_RULES[metric];

  if (!rule) {
    return validationError('unsupported_text_metric', { metric });
  }

  if (typeof value !== 'string' || !value.trim()) {
    return validationError('blank_value');
  }

  if (value.length > rule.maximum_length) {
    return validationError('too_long', {
      metric,
      maximum: rule.maximum_length,
    });
  }

  return null;
}

export function validateMeasurementNotes(notes) {
  if (
    notes !== null &&
    notes !== undefined &&
    typeof notes !== 'string'
  ) {
    return validationError('invalid_type');
  }

  if (notes && notes.length > MAX_NOTES_LENGTH) {
    return validationError('too_long', {
      maximum: MAX_NOTES_LENGTH,
    });
  }

  return null;
}

export function validateMeasurementDate(value, today = new Date()) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return validationError('invalid_date');
  }

  const parsedDate = new Date(`${value}T00:00:00Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== value
  ) {
    return validationError('invalid_date');
  }

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  if (value > todayString) {
    return validationError('future_date');
  }

  return null;
}
