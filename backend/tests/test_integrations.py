import os
import uuid
from datetime import datetime, timezone

import pytest
from beanie import init_beanie
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError
from pymongo import AsyncMongoClient

os.environ["MONGO_DB_NAME"] = "healthapp_test"

from src import main
from src.integrations import PROVIDERS, ProviderDefinition
from src.main import app, get_current_user
from src.models import (
    CURRENT_CONSENT_VERSION,
    ConnectionStatus,
    GenderEnum,
    ImportedMeasurement,
    IntegrationConnection,
    MeasurementType,
    User,
)


@pytest.fixture
async def test_db():
    client = AsyncMongoClient("mongodb://localhost:27017")
    database = client["healthapp_test"]

    await init_beanie(
        database=database,
        document_models=[User, IntegrationConnection, ImportedMeasurement],
    )

    yield database

    await database.client.drop_database("healthapp_test")
    await client.close()


def make_user(**overrides):
    fields = dict(
        id=uuid.uuid4(),
        username=f"integration-test-{uuid.uuid4()}",
        name="Integration Test",
        age=30,
        gender=GenderEnum.na,
        phone=f"555{uuid.uuid4().int % 10000000:07d}",
        password_hash="test-password",
        consent_given=True,
        data_usage=True,
        consent_version=CURRENT_CONSENT_VERSION,
        consent_timestamp=datetime.now(timezone.utc),
    )
    fields.update(overrides)
    return User(**fields)


@pytest.fixture
def test_user():
    return make_user()


@pytest.fixture(autouse=True)
def integrations_disabled_by_default(monkeypatch):
    # Tests must not depend on a developer's local .env; opt in with `integrations_enabled`.
    monkeypatch.setattr(main.settings, "INTEGRATIONS_ENABLED", False)


@pytest.fixture
def integrations_enabled(monkeypatch):
    monkeypatch.setattr(main.settings, "INTEGRATIONS_ENABLED", True)


@pytest.fixture
async def client_for(test_db):
    """Returns an async context manager that signs requests in as the given user."""

    def build(user):
        async def override_current_user():
            return user

        app.dependency_overrides[get_current_user] = override_current_user
        return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")

    yield build

    app.dependency_overrides.clear()


@pytest.fixture
async def client(client_for, test_user):
    async with client_for(test_user) as test_client:
        yield test_client


# --- Providers ---

@pytest.mark.anyio
async def test_providers_hidden_when_integrations_disabled(client):
    response = await client.get("/api/v1/integrations/providers")

    assert response.status_code == 200
    assert response.json()["data"] == {"enabled": False, "providers": []}


@pytest.mark.anyio
async def test_providers_listed_with_limitations_when_enabled(client, integrations_enabled):
    response = await client.get("/api/v1/integrations/providers")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["enabled"] is True
    assert {provider["id"] for provider in data["providers"]} == set(PROVIDERS)
    for provider in data["providers"]:
        assert provider["limitations"]
        assert provider["supported_types"]


@pytest.mark.anyio
async def test_integration_endpoints_require_authentication(test_db):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as anonymous:
        providers = await anonymous.get("/api/v1/integrations/providers")
        connections = await anonymous.get("/api/v1/users/me/connections")

    assert providers.status_code in (401, 403)
    assert connections.status_code in (401, 403)


# --- Granting a connection ---

@pytest.mark.anyio
async def test_grant_connection_stores_explicit_permissions(client, test_user, integrations_enabled):
    response = await client.post(
        "/api/v1/users/me/connections",
        json={
            "provider": "apple_health",
            "granted_types": ["heart_rate", "body_weight", "heart_rate"],
        },
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["provider"] == "apple_health"
    assert data["granted_types"] == ["heart_rate", "body_weight"]
    assert data["status"] == "connected"
    assert data["disconnected_at"] is None

    stored = await IntegrationConnection.get(uuid.UUID(data["id"]))
    assert stored.user_id == test_user.id
    assert stored.allows(MeasurementType.heart_rate)
    assert not stored.allows(MeasurementType.steps)


@pytest.mark.anyio
async def test_grant_connection_rejected_when_integrations_disabled(client):
    response = await client.post(
        "/api/v1/users/me/connections",
        json={"provider": "apple_health", "granted_types": ["heart_rate"]},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "INTEGRATIONS_DISABLED"
    assert await IntegrationConnection.count() == 0


@pytest.mark.anyio
async def test_grant_connection_requires_health_consent(client_for, integrations_enabled):
    user = make_user(consent_given=False)

    async with client_for(user) as test_client:
        response = await test_client.post(
            "/api/v1/users/me/connections",
            json={"provider": "apple_health", "granted_types": ["heart_rate"]},
        )

    assert response.status_code == 403
    assert await IntegrationConnection.count() == 0


@pytest.mark.anyio
async def test_grant_connection_rejects_unknown_provider(client, integrations_enabled):
    response = await client.post(
        "/api/v1/users/me/connections",
        json={"provider": "not_a_provider", "granted_types": ["heart_rate"]},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "UNKNOWN_PROVIDER"


@pytest.mark.anyio
async def test_grant_connection_rejects_types_the_provider_does_not_support(
    client, integrations_enabled, monkeypatch
):
    monkeypatch.setitem(
        PROVIDERS,
        "scale_only",
        ProviderDefinition(
            id="scale_only",
            name="Scale Only",
            supported_types=(MeasurementType.body_weight,),
            limitations="Weight only.",
        ),
    )

    response = await client.post(
        "/api/v1/users/me/connections",
        json={"provider": "scale_only", "granted_types": ["body_weight", "steps"]},
    )

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "UNSUPPORTED_MEASUREMENT_TYPE"
    assert error["details"] == ["steps"]


@pytest.mark.anyio
@pytest.mark.parametrize("granted_types", [[], ["not_a_type"]])
async def test_grant_connection_validates_measurement_types(client, integrations_enabled, granted_types):
    response = await client.post(
        "/api/v1/users/me/connections",
        json={"provider": "apple_health", "granted_types": granted_types},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.anyio
async def test_regranting_replaces_permissions_on_the_same_connection(client, test_user, integrations_enabled):
    first = await client.post(
        "/api/v1/users/me/connections",
        json={"provider": "apple_health", "granted_types": ["heart_rate", "steps"]},
    )
    connection = await IntegrationConnection.get(uuid.UUID(first.json()["data"]["id"]))
    connection.status = ConnectionStatus.disconnected
    connection.disconnected_at = datetime.now(timezone.utc)
    await connection.save()

    second = await client.post(
        "/api/v1/users/me/connections",
        json={"provider": "apple_health", "granted_types": ["body_weight"]},
    )

    assert second.status_code == 200
    data = second.json()["data"]
    assert data["id"] == first.json()["data"]["id"]
    assert data["granted_types"] == ["body_weight"]
    assert data["status"] == "connected"
    assert data["disconnected_at"] is None
    assert await IntegrationConnection.find(IntegrationConnection.user_id == test_user.id).count() == 1


# --- Listing connections ---

@pytest.mark.anyio
async def test_list_connections_empty(client):
    response = await client.get("/api/v1/users/me/connections")

    assert response.status_code == 200
    assert response.json()["data"] == []


@pytest.mark.anyio
async def test_list_connections_returns_only_own_connections(client, test_user):
    other_user = make_user()
    await IntegrationConnection(
        user_id=test_user.id,
        provider="apple_health",
        granted_types=[MeasurementType.heart_rate],
    ).insert()
    await IntegrationConnection(
        user_id=other_user.id,
        provider="health_connect",
        granted_types=[MeasurementType.steps],
    ).insert()

    response = await client.get("/api/v1/users/me/connections")

    assert response.status_code == 200
    data = response.json()["data"]
    assert [connection["provider"] for connection in data] == ["apple_health"]
    assert "user_id" not in data[0]


@pytest.mark.anyio
async def test_list_connections_available_without_consent_or_feature_flag(client_for):
    # Users who withdrew consent, or after integrations are switched off, must still see what is connected.
    user = make_user(consent_given=False, data_usage=False)
    await IntegrationConnection(
        user_id=user.id,
        provider="apple_health",
        granted_types=[MeasurementType.heart_rate],
    ).insert()

    async with client_for(user) as test_client:
        response = await test_client.get("/api/v1/users/me/connections")

    assert response.status_code == 200
    assert len(response.json()["data"]) == 1


# --- Disconnecting and deleting imported data (#207) ---

async def make_connection(user, provider="apple_health", **overrides):
    fields = dict(user_id=user.id, provider=provider, granted_types=[MeasurementType.heart_rate])
    fields.update(overrides)
    return await IntegrationConnection(**fields).insert()


async def import_measurements(connection, count):
    for index in range(count):
        await ImportedMeasurement(
            user_id=connection.user_id,
            connection_id=connection.id,
            provider=connection.provider,
            source_record_id=f"record-{index}",
            measurement_type=MeasurementType.heart_rate,
            value=60 + index,
            unit="count/min",
            recorded_at=datetime.now(timezone.utc),
        ).insert()


async def stored_count(connection):
    return await ImportedMeasurement.find(ImportedMeasurement.connection_id == connection.id).count()


@pytest.mark.anyio
async def test_list_connections_reports_imported_count(client, test_user):
    connection = await make_connection(test_user)
    await import_measurements(connection, 3)

    response = await client.get("/api/v1/users/me/connections")

    assert response.json()["data"][0]["imported_count"] == 3


@pytest.mark.anyio
async def test_disconnect_revokes_permission_and_keeps_imported_data(client, test_user):
    connection = await make_connection(test_user)
    await import_measurements(connection, 2)

    response = await client.post(f"/api/v1/users/me/connections/{connection.id}/disconnect")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["deleted_count"] == 0
    assert data["connection"]["status"] == "disconnected"
    assert data["connection"]["disconnected_at"]
    assert data["connection"]["imported_count"] == 2

    stored = await IntegrationConnection.get(connection.id)
    assert stored.status == ConnectionStatus.disconnected
    assert not stored.allows(MeasurementType.heart_rate)
    assert await stored_count(connection) == 2


@pytest.mark.anyio
async def test_disconnect_can_delete_imported_data_in_the_same_step(client, test_user):
    connection = await make_connection(test_user)
    await import_measurements(connection, 2)

    response = await client.post(
        f"/api/v1/users/me/connections/{connection.id}/disconnect",
        json={"delete_imported_data": True},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["deleted_count"] == 2
    assert data["connection"]["status"] == "disconnected"
    assert data["connection"]["imported_count"] == 0
    assert await stored_count(connection) == 0


@pytest.mark.anyio
async def test_disconnect_twice_keeps_the_original_disconnect_time(client, test_user):
    connection = await make_connection(test_user)
    url = f"/api/v1/users/me/connections/{connection.id}/disconnect"

    first = await client.post(url)
    second = await client.post(url)

    assert second.status_code == 200
    assert (
        second.json()["data"]["connection"]["disconnected_at"]
        == first.json()["data"]["connection"]["disconnected_at"]
    )


@pytest.mark.anyio
async def test_delete_imported_data_removes_only_that_connections_records(client, test_user):
    apple = await make_connection(test_user, "apple_health")
    android = await make_connection(test_user, "health_connect")
    await import_measurements(apple, 3)
    await import_measurements(android, 1)

    response = await client.delete(f"/api/v1/users/me/connections/{apple.id}/measurements")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["deleted_count"] == 3
    assert data["connection"]["imported_count"] == 0
    # Deleting data does not change whether the provider is connected.
    assert data["connection"]["status"] == "connected"
    assert await stored_count(apple) == 0
    assert await stored_count(android) == 1


@pytest.mark.anyio
async def test_delete_imported_data_when_there_is_none(client, test_user):
    connection = await make_connection(test_user)

    response = await client.delete(f"/api/v1/users/me/connections/{connection.id}/measurements")

    assert response.status_code == 200
    assert response.json()["data"]["deleted_count"] == 0


@pytest.mark.anyio
@pytest.mark.parametrize("action", ["disconnect", "delete"])
async def test_cannot_change_another_users_connection(client, action):
    other_user = make_user()
    connection = await make_connection(other_user)
    await import_measurements(connection, 1)

    if action == "disconnect":
        response = await client.post(
            f"/api/v1/users/me/connections/{connection.id}/disconnect",
            json={"delete_imported_data": True},
        )
    else:
        response = await client.delete(f"/api/v1/users/me/connections/{connection.id}/measurements")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CONNECTION_NOT_FOUND"
    stored = await IntegrationConnection.get(connection.id)
    assert stored.status == ConnectionStatus.connected
    assert await stored_count(connection) == 1


@pytest.mark.anyio
async def test_unknown_connection_returns_not_found(client):
    response = await client.post(f"/api/v1/users/me/connections/{uuid.uuid4()}/disconnect")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "CONNECTION_NOT_FOUND"


@pytest.mark.anyio
async def test_malformed_connection_id_is_a_validation_error(client):
    response = await client.post("/api/v1/users/me/connections/not-a-uuid/disconnect")

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.anyio
async def test_disconnect_and_delete_work_without_consent_or_feature_flag(client_for):
    # Withdrawing access and removing imported data must never depend on consent or the flag.
    user = make_user(consent_given=False, data_usage=False)
    connection = await make_connection(user)
    await import_measurements(connection, 1)

    async with client_for(user) as test_client:
        deleted = await test_client.delete(f"/api/v1/users/me/connections/{connection.id}/measurements")
        disconnected = await test_client.post(f"/api/v1/users/me/connections/{connection.id}/disconnect")

    assert deleted.status_code == 200
    assert deleted.json()["data"]["deleted_count"] == 1
    assert disconnected.status_code == 200
    assert disconnected.json()["data"]["connection"]["status"] == "disconnected"


@pytest.mark.anyio
async def test_disconnect_and_delete_require_authentication(test_db):
    connection_id = uuid.uuid4()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as anonymous:
        disconnect = await anonymous.post(f"/api/v1/users/me/connections/{connection_id}/disconnect")
        delete = await anonymous.delete(f"/api/v1/users/me/connections/{connection_id}/measurements")

    assert disconnect.status_code in (401, 403)
    assert delete.status_code in (401, 403)


@pytest.mark.anyio
async def test_reconnecting_after_disconnect_restores_access(client, test_user, integrations_enabled):
    connection = await make_connection(test_user)
    await client.post(f"/api/v1/users/me/connections/{connection.id}/disconnect")

    response = await client.post(
        "/api/v1/users/me/connections",
        json={"provider": "apple_health", "granted_types": ["steps"]},
    )

    data = response.json()["data"]
    assert data["id"] == str(connection.id)
    assert data["status"] == "connected"
    assert data["disconnected_at"] is None
    assert data["granted_types"] == ["steps"]


# --- Permission and provenance rules ---

def test_disconnected_connection_allows_nothing():
    connection = IntegrationConnection(
        user_id=uuid.uuid4(),
        provider="apple_health",
        granted_types=[MeasurementType.heart_rate],
        status=ConnectionStatus.disconnected,
    )

    assert not connection.allows(MeasurementType.heart_rate)


@pytest.mark.parametrize("missing_field", ["provider", "connection_id", "recorded_at", "unit"])
def test_imported_measurement_requires_provenance(missing_field):
    fields = dict(
        user_id=uuid.uuid4(),
        connection_id=uuid.uuid4(),
        provider="apple_health",
        measurement_type=MeasurementType.heart_rate,
        value=72,
        unit="count/min",
        recorded_at=datetime.now(timezone.utc),
    )
    del fields[missing_field]

    with pytest.raises(ValidationError):
        ImportedMeasurement(**fields)
