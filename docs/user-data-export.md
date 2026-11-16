# User data export

`GET /api/v1/users/me/data-export` returns a JSON copy of the signed-in user's stored data. It is available from **Account Settings → Privacy and your data**, which does not require health consent.

## Access

- Requires a valid, unrevoked access token. Requests without credentials, or with an invalid or revoked token, are rejected before any data is read.
- The user is taken only from the token. Query parameters such as `user_id` are ignored, and every database query is filtered by the signed-in user's ID.
- Responses are sent with `Cache-Control: no-store`. The app does not keep a copy of the export.

## What is included (schema 1.1)

| Section | Fields |
| --- | --- |
| `profile` | `username`, `name`, `date_of_birth`, `age`, `gender`, `phone`, `photo_url`, `photo`, `created_at`, `updated_at` |
| `profile.photo` | `url`, `content_type` and `data_base64`, which holds the stored image file, so the export does not depend on the server. `null` if no photo is set. If the file is missing, or the URL is outside the uploads folder, `content_type` and `data_base64` are `null`. |
| `consent` | `consent_given`, `data_usage`, `marketing`, `version`, `recorded_at`, plus `current_policy_version` and `valid_for_current_policy`. The last one uses the same rule as the backend `user_has_valid_consent`. |
| `questionnaires[]` | `id`, `submitted_at` (created), `updated_at`, and every answer field |
| `risk_assessments[]` | `id`, `assessed_at` and the full stored `result` |

## What is excluded, and why

| Field or data | Reason |
| --- | --- |
| `password_hash` | A credential. It is not personal data the user supplied in a usable form. |
| Internal user ID (`users._id`) and `user_id` on each record | Internal keys. Each record's own `id` is exported so it can be referenced in support or deletion requests. |
| Revoked token records (`revoked_tokens`) | Security bookkeeping (token IDs and expiry). They are not linked to profile data. |

## Changing the export

Add any new field on `User`, `Questionnaire` or `HealthRiskAssessment` to the export, or list it under exclusions above. If you change the shape, bump `schema_version`.
