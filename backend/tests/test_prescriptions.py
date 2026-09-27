import os
import uuid
from datetime import datetime, timezone

import pytest
from beanie import init_beanie
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

os.environ["MONGO_DB_NAME"] = "healthapp_test"

from src.main import app, get_current_user, require_health_consent
from src.models import (
    CURRENT_CONSENT_VERSION,
    GenderEnum,
    Prescription,
    User,
)


@pytest.fixture
async def test_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    database = client["healthapp_test"]

    await init_beanie(
        database=database,
        document_models=[User, Prescription],
    )

    yield database

    await database.client.drop_database("healthapp_test")
    client.close()


@pytest.fixture
def test_user():
    return User(
        id=uuid.uuid4(),
        username=f"prescription-test-{uuid.uuid4()}",
        name="Prescription Test",
        age=25,
        gender=GenderEnum.na,
        phone=f"555{uuid.uuid4().int % 10000000:07d}",
        password_hash="test-password",
        consent_given=True,
        data_usage=True,
        consent_version=CURRENT_CONSENT_VERSION,
        consent_timestamp=datetime.now(timezone.utc),
    )


@pytest.fixture
def other_user():
    return User(
        id=uuid.uuid4(),
        username=f"other-user-{uuid.uuid4()}",
        name="Other User",
        age=30,
        gender=GenderEnum.na,
        phone=f"555{uuid.uuid4().int % 10000000:07d}",
        password_hash="test-password",
        consent_given=True,
        data_usage=True,
        consent_version=CURRENT_CONSENT_VERSION,
        consent_timestamp=datetime.now(timezone.utc),
    )


@pytest.fixture
async def client(test_db, test_user):
    async def override_current_user():
        return test_user

    app.dependency_overrides[require_health_consent] = override_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.mark.anyio
async def test_create_prescription(client, test_user):
    response = await client.post(
        "/api/v1/prescriptions",
        json={
            "medication_name": "Test Medication",
            "dosage": "10mg",
            "frequency": "Once daily",
        },
    )

    assert response.status_code == 200
    data = response.json()["data"]

    assert data["medication_name"] == "Test Medication"
    assert data["dosage"] == "10mg"
    assert data["frequency"] == "Once daily"
    assert data["archived"] is False

    prescription = await Prescription.get(uuid.UUID(data["id"]))
    assert prescription is not None
    assert prescription.user_id == test_user.id

@pytest.mark.anyio
async def test_create_prescription_requires_health_consent(
    test_db, test_user
):
    test_user.consent_given = False
    await test_user.insert()

    async def override_current_user():
        return test_user

    app.dependency_overrides[get_current_user] = override_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as test_client:
        response = await test_client.post(
            "/api/v1/prescriptions",
            json={
                "medication_name": "Test Medication",
                "dosage": "10mg",
                "frequency": "Once daily",
            },
        )

    app.dependency_overrides.clear()

    assert response.status_code == 403

@pytest.mark.anyio
async def test_create_prescription_with_next_dose(client):
    next_dose = "2026-10-01T13:00:00Z"

    response = await client.post(
        "/api/v1/prescriptions",
        json={
            "medication_name": "Test Medication",
            "dosage": "20mg",
            "frequency": "Twice daily",
            "next_dose": next_dose,
        },
    )

    assert response.status_code == 200
    assert response.json()["data"]["next_dose"] is not None


@pytest.mark.anyio
async def test_get_prescriptions_returns_only_active(client, test_user):
    active = Prescription(
        user_id=test_user.id,
        medication_name="Active Medication",
        dosage="10mg",
        frequency="Once daily",
        archived=False,
    )

    archived = Prescription(
        user_id=test_user.id,
        medication_name="Archived Medication",
        dosage="20mg",
        frequency="Once daily",
        archived=True,
        archived_at=datetime.now(timezone.utc),
    )

    await active.insert()
    await archived.insert()

    response = await client.get("/api/v1/prescriptions")

    assert response.status_code == 200

    medications = [
        item["medication_name"] for item in response.json()["data"]
    ]

    assert "Active Medication" in medications
    assert "Archived Medication" not in medications


@pytest.mark.anyio
async def test_update_prescription(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Old Medication",
        dosage="10mg",
        frequency="Once daily",
    )

    await prescription.insert()

    response = await client.put(
        f"/api/v1/prescriptions/{prescription.id}",
        json={
            "medication_name": "Updated Medication",
            "dosage": "20mg",
        },
    )

    assert response.status_code == 200

    data = response.json()["data"]

    assert data["medication_name"] == "Updated Medication"
    assert data["dosage"] == "20mg"
    assert data["frequency"] == "Once daily"


@pytest.mark.anyio
async def test_update_other_users_prescription_returns_404(
    client, other_user
):
    prescription = Prescription(
        user_id=other_user.id,
        medication_name="Other User Medication",
        dosage="10mg",
        frequency="Once daily",
    )

    await prescription.insert()

    response = await client.put(
        f"/api/v1/prescriptions/{prescription.id}",
        json={"dosage": "20mg"},
    )

    assert response.status_code == 404


@pytest.mark.anyio
async def test_archive_prescription(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Archive Medication",
        dosage="10mg",
        frequency="Once daily",
    )

    await prescription.insert()

    response = await client.patch(
        f"/api/v1/prescriptions/{prescription.id}/archive"
    )

    assert response.status_code == 200

    saved = await Prescription.get(prescription.id)

    assert saved is not None
    assert saved.archived is True
    assert saved.archived_at is not None


@pytest.mark.anyio
async def test_archive_other_users_prescription_returns_404(
    client, other_user
):
    prescription = Prescription(
        user_id=other_user.id,
        medication_name="Other User Medication",
        dosage="10mg",
        frequency="Once daily",
    )

    await prescription.insert()

    response = await client.patch(
        f"/api/v1/prescriptions/{prescription.id}/archive"
    )

    assert response.status_code == 404


@pytest.mark.anyio
@pytest.mark.parametrize(
    "field",
    ["medication_name", "dosage", "frequency"],
)
@pytest.mark.parametrize("value", ["", "   ", None])
async def test_create_rejects_invalid_required_values(client, field, value):
    payload = {
        "medication_name": "Medication",
        "dosage": "10mg",
        "frequency": "Once daily",
    }

    payload[field] = value

    response = await client.post(
        "/api/v1/prescriptions",
        json=payload,
    )

    assert response.status_code == 422

@pytest.mark.anyio
async def test_missing_prescription_returns_404(client):
    missing_id = uuid.uuid4()

    response = await client.put(
        f"/api/v1/prescriptions/{missing_id}",
        json={"dosage": "20mg"},
    )

    assert response.status_code == 404


@pytest.mark.anyio
async def test_archived_prescription_cannot_be_updated(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Archived Medication",
        dosage="10mg",
        frequency="Once daily",
        archived=True,
        archived_at=datetime.now(timezone.utc),
    )

    await prescription.insert()

    response = await client.put(
        f"/api/v1/prescriptions/{prescription.id}",
        json={"dosage": "20mg"},
    )

    assert response.status_code == 404


@pytest.mark.anyio
async def test_archived_prescription_cannot_be_archived_again(
    client, test_user
):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Archived Medication",
        dosage="10mg",
        frequency="Once daily",
        archived=True,
        archived_at=datetime.now(timezone.utc),
    )

    await prescription.insert()

    response = await client.patch(
        f"/api/v1/prescriptions/{prescription.id}/archive"
    )

    assert response.status_code == 404


