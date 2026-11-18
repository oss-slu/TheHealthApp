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

Future timeline API operations must:

- Require an authenticated user.
- Require valid health consent.
- Derive event ownership from the authenticated user.
- Restrict queries to the authenticated user's records.
- Never expose another user's events.

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

A compound index on `user_id` and `occurred_at` supports efficient user-scoped chronological queries.
