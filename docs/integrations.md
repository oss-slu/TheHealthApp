# Connected-health integrations

Implements [#202](https://github.com/oss-slu/TheHealthApp/issues/202), part of [#151](https://github.com/oss-slu/TheHealthApp/issues/151). This page sets out the architecture, provenance and permission rules that every provider integration must follow.

## Principles

- **Optional.** Integrations are off unless `INTEGRATIONS_ENABLED=true`. No core feature reads imported data unless the user has chosen to connect a provider, and manual entry always keeps working.
- **Read-only.** Adapters only read from a provider. The app never writes back.
- **Explicit permission.** Users grant each measurement type one by one. Nothing outside those types is imported.
- **Provenance.** Every imported value records which provider it came from, when it was measured and when it was imported.
- **User control.** Users can always see their connections, even after withdrawing health consent or after integrations are switched off. Disconnecting and deleting imported data are handled by the "disconnect, delete-imported-data, privacy, and test flows" issue.

## Architecture

```
pages / endpoints ──► src/integrations.py ──► provider adapters (later issues)
                         │  PROVIDERS registry
                         │  IntegrationAdapter protocol
                         ▼
          IntegrationConnection, ImportedMeasurement (src/models.py)
```

- **Registry (`PROVIDERS`).** The one place providers are declared, with their ID, display name, supported measurement types and a plain-language `limitations` message for the UI.
- **Adapter (`IntegrationAdapter`).** `fetch_measurements(connection, since)` returns `RawMeasurement` values. Normalization, deduplication and storage happen outside the adapter, so adapters contain only provider-specific code.
- Pages and endpoints never import adapter code directly.

## Data model

### `integration_connections`

One document per user and provider (unique on `user_id`, `provider`).

| Field | Meaning |
| --- | --- |
| `provider` | Registry ID, e.g. `apple_health` |
| `granted_types` | Measurement types the user explicitly allowed |
| `status` | `connected` or `disconnected` |
| `connected_at`, `disconnected_at`, `updated_at` | When the latest grant was made and when it was revoked |

`IntegrationConnection.allows(type)` is the permission check. It is true only when the connection is `connected` and the type was granted. Importers must call it for every value.

Connecting again replaces `granted_types` with the new choice and reuses the same document.

### `imported_measurements`

| Field | Meaning |
| --- | --- |
| `provider`, `connection_id` | Where the value came from |
| `source_record_id` | The provider's own ID, if it has one. Used for deduplication. |
| `measurement_type`, `value`, `unit` | The measurement |
| `recorded_at` | When it was measured, according to the provider |
| `imported_at` | When the app stored it |

`provider`, `connection_id`, `recorded_at` and `unit` are required. A value without provenance cannot be saved.

## API

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/v1/integrations/providers` | Signed in | `{ enabled, providers }`. `providers` is empty while integrations are disabled. |
| `GET` | `/api/v1/users/me/connections` | Signed in | The user's own connections. Not gated by consent or the feature flag. |
| `POST` | `/api/v1/users/me/connections` | Signed in, health consent | Body `{ provider, granted_types }`. Creates or replaces the grant. |

Errors from `POST`:

| Status | `error.code` | When |
| --- | --- | --- |
| 403 | `INTEGRATIONS_DISABLED` | The feature flag is off |
| 403 | `HTTP_ERROR` | No valid health consent |
| 422 | `UNKNOWN_PROVIDER` | The provider is not in the registry |
| 422 | `UNSUPPORTED_MEASUREMENT_TYPE` | A requested type is not supported by that provider. `details` lists them. |
| 422 | `VALIDATION_ERROR` | `granted_types` is empty or has an unknown value |

## Providers

| ID | Status | Limitation shown to users |
| --- | --- | --- |
| `apple_health` | Registered, adapter pending | No web API. Data comes from an export file, so it does not update automatically. |
| `health_connect` | Registered, adapter pending | Data stays on the Android device and is not available to web apps. |

## Adding a provider

1. Add a `ProviderDefinition` to `PROVIDERS` with an honest `limitations` message.
2. Implement `IntegrationAdapter` for it. It reads only, and returns `RawMeasurement` values with `recorded_at` and, where possible, `source_record_id`.
3. Check `connection.allows(type)` before storing any value.
4. Add tests for the adapter, using recorded sample data rather than live provider calls.
