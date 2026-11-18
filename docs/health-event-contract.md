# Health Event Contract

## Purpose

The health event contract defines a common structure for activity displayed in a user's personal health timeline.

It provides a consistent way to represent assessments, measurements, medications, symptoms, goals, and notes.

## Supported Event Categories

| Category | Description |
|---|---|
| assessment | Health-risk assessments and completed questionnaires |
| measurement | Manually recorded health measurements |
| medication | Prescription activity and recorded medication doses |
| symptom | User-reported symptoms |
| goal | User-created health goals |
| note | User-created health notes |

## Event Sources

Each event includes a source identifying where its information originated.

Supported sources:

- `health_risk_assessment`
- `questionnaire`
- `manual_measurement`
- `prescription`
- `medication_dose`
- `manual_symptom`
- `user_goal`
- `user_note`

Each source must match its corresponding event category.

## Event Fields

| Field | Description |
|---|---|
| `id` | Unique event identifier |
| `user_id` | ID of the user who owns the event |
| `category` | Event category |
| `source` | Origin of the event |
| `occurred_at` | Time the event happened |
| `created_at` | Time the event record was created |
| `detail_reference` | Type and ID of the related detail record |

The detail reference contains:

- `entity_type`: Type of related record.
- `entity_id`: UUID of the related record.

## Validation Rules

- Every event must have an owner.
- Category and source combinations must be valid.
- Every event must reference a detail record.
- Event timestamps must include timezone information.
- Timestamps are normalized to UTC.
- Client-submitted event data cannot specify ownership.
- Unexpected fields in event creation requests are rejected.

## Security and Consent

Health events are sensitive health information.

Timeline API operations must:

- Require an authenticated user.
- Require valid health consent.
- Derive event ownership from the authenticated user.
- Restrict queries to the authenticated user's records.
- Never expose another user's events.
- Ignore any client-supplied `user_id`; the owner is always the authenticated user.

## Timeline Endpoint

`GET /api/v1/users/me/health-timeline`

Returns the authenticated user's health events, newest first.

### Access

- Requires a valid bearer access token. Requests without valid credentials are rejected with `401` or `403`.
- Requires completed consent for the current policy version. Users without it receive `403`.

### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `20` | Page size, from `1` to `100`. |
| `offset` | integer | `0` | Number of events to skip. Must be `0` or greater. |
| `category` | string | none | Return only events in one supported category. |
| `start_at` | ISO 8601 datetime | none | Inclusive lower bound for `occurred_at`. |
| `end_before` | ISO 8601 datetime | none | Exclusive upper bound for `occurred_at`. |

`start_at` and `end_before` must be supplied together, must include a timezone offset, and `start_at` must be earlier than `end_before`. Boundaries are converted to UTC before querying.

### Ordering

Events are sorted newest first by `occurred_at`. Events with the same `occurred_at` are ordered by `_id` descending, so the order is deterministic and an event cannot move between pages.

### Response

The response uses the standard success envelope. `data` contains:

| Field | Description |
|---|---|
| `events` | The requested page of events, each with `id`, `category`, `source`, `occurred_at`, `created_at`, and `detail_reference`. |
| `total` | Number of events matching the filters, across all pages. |
| `limit` | The page size applied. |
| `offset` | The offset applied. |
| `has_more` | `true` when more matching events exist after this page. |

An empty timeline returns `200` with an empty `events` list and `total` of `0`.

### User Isolation

The query is always filtered by the authenticated user's ID. Any `user_id` query parameter is ignored, and `total` counts only the authenticated user's events.

### Errors

| Status | Cause |
|---|---|
| `401` / `403` | Missing or invalid credentials, or consent not current (`403`). |
| `422` | `limit` or `offset` out of range, unknown `category`, only one date boundary, a date without a timezone, or `start_at` not before `end_before`. |
| `500` | Unexpected database failure. The message is generic (`An error occurred while retrieving the health timeline`) and never exposes internal details. |

## Localization and Accessibility

Event categories and sources use stable, language-independent values.

Frontend components should translate category names and descriptions using the application's existing localization system.

Timeline interfaces should provide meaningful accessible labels, keyboard navigation, and screen-reader-friendly event information.

## Timeline States

The timeline API and UI should support:

- Loading: Communicate that timeline data is being retrieved.
- Success: Display available events in chronological order.
- Empty: Explain that no health activity has been recorded yet and provide an appropriate next action.
- Failure: Explain that timeline data could not be loaded and provide a retry option.

## Database

Events are stored in the MongoDB `health_events` collection.

A compound index on `user_id` and `occurred_at` supports efficient user-scoped chronological queries. The timeline adds `_id` as a secondary sort key for stable pagination.
