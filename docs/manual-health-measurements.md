# Manual Health Measurements: Metric and Validation Contract

## Purpose

This document defines the initial supported metrics, accepted units, and validation rules for manual health measurements in TheHealthApp.

Validation limits are intended to prevent malformed or implausible data entry. They are not clinical reference ranges and must not be used to diagnose medical conditions.

## 1. Supported Metrics and Units

| Metric | Accepted Unit | Minimum | Maximum | Precision |
|---|---|---:|---:|---|
| Blood pressure (systolic) | mmHg | 40 | 300 | Whole number |
| Blood pressure (diastolic) | mmHg | 20 | 200 | Whole number |
| Weight | kg | 0.1 | 1,000 | 1 decimal |
| Weight | lb | 0.2 | 2,204.6 | 1 decimal |
| Heart rate | bpm | 20 | 300 | Whole number |
| Blood glucose | mg/dL | 1 | 2,000 | 1 decimal |
| Blood glucose | mmol/L | 0.1 | 111.1 | 1 decimal |
| Total cholesterol | mg/dL | 1 | 1,500 | 1 decimal |
| Total cholesterol | mmol/L | 0.03 | 38.8 | 2 decimals |
| Sleep duration | hours | 0 | 24 | 1 decimal |
| Mood | Self-reported scale | 1 | 5 | Whole number |
| Stress | Self-reported scale | 1 | 5 | Whole number |
| Symptoms | Text | N/A | 1,000 characters | N/A |

### Blood Pressure

Blood pressure requires two values:

- Systolic pressure.
- Diastolic pressure.

Both values use mmHg and must be whole numbers. Systolic pressure must be greater than diastolic pressure.

### Mood and Stress

Mood and stress use a self-reported scale from 1 to 5. These values represent the user's own descriptions and are not clinical assessments or diagnoses.

### Symptoms

Symptoms are recorded as user-provided text. Empty or whitespace-only entries are invalid. Entries cannot exceed 1,000 characters.

## 2. Shared Validation Rules

The authoritative validation rules are defined in `shared/health_measurements.json`. Both the frontend and backend load their metric definitions from this shared contract to prevent differences in supported metrics, units, value ranges, and decimal precision. Changes to measurement rules should be made in the shared contract rather than separately in frontend or backend code.

Frontend and backend validation must agree on:

- Supported metric identifiers.
- Accepted units.
- Minimum and maximum values.
- Decimal precision.
- Required fields.
- Blood pressure relationships.
- Date restrictions.
- Optional notes and text length limits.

All numeric values must be finite numbers. NaN and infinite values are invalid.

Measurement dates must use the ISO 8601 date format (YYYY-MM-DD) and cannot be in the future. Optional notes may contain up to 1,000 characters.

Values outside supported entry ranges must be rejected before storage.

Unusual but valid readings must remain recordable. Validation ranges must not be interpreted as healthy or unhealthy medical thresholds.

## 3. Ownership and Consent

Manual health measurements contain personal health information.

- Every measurement must belong to an authenticated user.
- The backend must determine ownership from the authenticated user rather than trusting a user ID supplied by the frontend.
- Users may only access or modify their own measurements.
- Health measurement functionality requires valid consent under the current health consent policy.
- Requests without authentication must be rejected.
- Requests without valid health consent must be rejected.

The implementation should follow the existing authentication and health-consent patterns in the backend.

## 4. Safety and Non-Diagnostic Language

The application records user-provided health information for personal tracking.

- The application must not diagnose medical conditions.
- Validation limits must not be described as normal health ranges.
- Unusual readings must not automatically be rejected solely because they may be medically concerning.
- Safety messages should use neutral language and encourage users to consult qualified healthcare professionals when appropriate.
- The application must not replace professional medical advice.

## 5. Localization

All user-facing measurement labels, unit descriptions, validation errors, and safety messages must support:

- English (en)
- Spanish (es)
- Hindi (hi)
- Arabic (ar)
- Chinese (zh)

Translation keys should be consistent across all five language files.

User-facing text must not be hardcoded in measurement components.

## 6. Accessibility

Measurement interfaces must:

- Provide accessible labels for every input.
- Clearly identify measurement units.
- Associate validation errors with the relevant input.
- Make errors understandable without relying only on color.
- Support keyboard navigation.
- Provide accessible instructions for mood and stress scales.
- Preserve readable layouts for right-to-left languages.

## 7. Expected Application States

| State | Expected Behavior |
|---|---|
| Success | Confirm that a measurement was recorded or updated. |
| Empty | Explain that no measurements have been recorded yet. |
| Validation failure | Identify the invalid field and explain the accepted value or unit. |
| Request failure | Display a clear error and allow the user to retry. |
| Unauthorized | Require authentication. |
| Consent required | Explain that valid health consent is required. |

## 8. Testing Requirements

Tests should verify:

- Every supported metric and accepted unit.
- Minimum and maximum valid values.
- Values immediately outside supported ranges.
- Decimal precision.
- Invalid numeric values, including NaN and infinity.
- Blood pressure relationship validation.
- Rejection of future measurement dates.
- Optional notes and symptom text limits.
- Matching frontend and backend validation rules.
- Authentication and consent requirements where applicable.
- Accessible labels and validation messages.
- Translation key availability in all supported languages.
- Expected success, empty, and failure states.

## 9. Scope

This contract establishes the initial metric definitions and validation requirements for manual health tracking.

Database persistence, authenticated measurement API endpoints, measurement forms, measurement history, editing, deletion, and symptom or wellbeing check-in interfaces are separate implementation tasks.

Future changes to supported metrics, units, or validation ranges must update both frontend and backend definitions and this document.