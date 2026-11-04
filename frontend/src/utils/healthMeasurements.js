// Supported manual health measurement definitions.
// Keep these rules synchronized with backend/src/health_measurements.py
// and docs/manual-health-measurements.md.

export const METRIC_RULES = {
  blood_pressure_systolic: {
    unit: 'mmHg',
    minimum: 40,
    maximum: 300,
    decimalPlaces: 0,
  },
  blood_pressure_diastolic: {
    unit: 'mmHg',
    minimum: 20,
    maximum: 200,
    decimalPlaces: 0,
  },
  weight: {
    units: {
      kg: {
        minimum: 0.1,
        maximum: 1000,
        decimalPlaces: 1,
      },
      lb: {
        minimum: 0.2,
        maximum: 2204.6,
        decimalPlaces: 1,
      },
    },
  },
  heart_rate: {
    unit: 'bpm',
    minimum: 20,
    maximum: 300,
    decimalPlaces: 0,
  },
  blood_glucose: {
    units: {
      'mg/dL': {
        minimum: 1,
        maximum: 2000,
        decimalPlaces: 1,
      },
      'mmol/L': {
        minimum: 0.1,
        maximum: 111.1,
        decimalPlaces: 1,
      },
    },
  },
  total_cholesterol: {
    units: {
      'mg/dL': {
        minimum: 1,
        maximum: 1500,
        decimalPlaces: 1,
      },
      'mmol/L': {
        minimum: 0.03,
        maximum: 38.8,
        decimalPlaces: 2,
      },
    },
  },
  sleep_duration: {
    unit: 'hours',
    minimum: 0,
    maximum: 24,
    decimalPlaces: 1,
  },
  mood: {
    unit: 'scale',
    minimum: 1,
    maximum: 5,
    decimalPlaces: 0,
  },
  stress: {
    unit: 'scale',
    minimum: 1,
    maximum: 5,
    decimalPlaces: 0,
  },
};

export const TEXT_METRIC_RULES = {
  symptoms: {
    maximumLength: 1000,
  },
};

export const MAX_NOTES_LENGTH = 1000;

export function validateMeasurementValue(metric, value, unit) {
  const rule = METRIC_RULES[metric];

  if (!rule) {
    return `Unsupported measurement metric: ${metric}`;
  }

  const unitRule = rule.units
    ? rule.units[unit]
    : rule.unit === unit
      ? rule
      : null;

  if (!unitRule) {
    return `Unsupported unit for ${metric}: ${unit}`;
  }

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return 'Measurement value must be a finite number.';
  }

  if (
    value < unitRule.minimum ||
    value > unitRule.maximum
  ) {
    return `${metric} must be between ${unitRule.minimum} and ${unitRule.maximum} ${unit}.`;
  }

  const decimalPlaces = String(value).includes('e')
    ? Math.max(0, -(Number(value).toExponential().split('e')[1]))
    : (String(value).split('.')[1] || '').length;

  if (decimalPlaces > unitRule.decimalPlaces) {
    return `${metric} supports at most ${unitRule.decimalPlaces} decimal places.`;
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
    return 'Systolic pressure must be greater than diastolic pressure.';
  }

  return null;
}

export function validateTextMeasurement(metric, value) {
  const rule = TEXT_METRIC_RULES[metric];

  if (!rule) {
    return `Unsupported text measurement: ${metric}`;
  }

  if (typeof value !== 'string' || !value.trim()) {
    return 'This field cannot be blank.';
  }

  if (value.length > rule.maximumLength) {
    return `${metric} cannot exceed ${rule.maximumLength} characters.`;
  }

  return null;
}

export function validateMeasurementNotes(notes) {
  if (
    notes !== null &&
    notes !== undefined &&
    typeof notes !== 'string'
  ) {
    return 'Notes must be text.';
  }

  if (notes && notes.length > MAX_NOTES_LENGTH) {
    return `Notes cannot exceed ${MAX_NOTES_LENGTH} characters.`;
  }

  return null;
}

export function validateMeasurementDate(value, today = new Date()) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return 'Measurement date must be a valid ISO date.';
  }

  const parsedDate = new Date(`${value}T00:00:00Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== value
  ) {
    return 'Measurement date must be a valid ISO date.';
  }

  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  if (value > todayString) {
    return 'Measurement date cannot be in the future.';
  }

  return null;
}