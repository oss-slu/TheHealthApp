import os
import uuid
from datetime import datetime, timezone

import pytest
from beanie import init_beanie
from httpx import ASGITransport, AsyncClient
from pymongo import AsyncMongoClient

os.environ["MONGO_DB_NAME"] = "healthapp_test"

from src.main import app, get_current_user, require_health_consent
from src.models import (
    CURRENT_CONSENT_VERSION,
    GenderEnum,
    Prescription,
    User,
    MedicationDose,
    DoseStatus,
    MedicationReminder,
)


@pytest.fixture
async def test_db():
    client = AsyncMongoClient("mongodb://localhost:27017")
    database = client["healthapp_test"]

    await init_beanie(
        database=database,
        document_models=[User, Prescription, MedicationDose, MedicationReminder],
    )

    yield database

    await database.client.drop_database("healthapp_test")
    await client.close()


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

    original_updated_at = prescription.updated_at
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

    saved = await Prescription.get(prescription.id)
    assert saved is not None
    assert saved.updated_at > original_updated_at

@pytest.mark.anyio
async def test_update_prescription_requires_health_consent(
    test_db, test_user
):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Original Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    test_user.consent_given = False
    await test_user.insert()

    async def override_current_user():
        return test_user

    app.dependency_overrides[get_current_user] = override_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as test_client:
        response = await test_client.put(
            f"/api/v1/prescriptions/{prescription.id}",
            json={"dosage": "20mg"},
        )

    app.dependency_overrides.clear()

    assert response.status_code == 403

    saved = await Prescription.get(prescription.id)
    assert saved is not None
    assert saved.dosage == "10mg"

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

    saved = await Prescription.get(prescription.id)
    assert saved is not None
    assert saved.archived is False

@pytest.mark.anyio
async def test_archive_prescription(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Archive Medication",
        dosage="10mg",
        frequency="Once daily",
    )

    await prescription.insert()

    original_updated_at = prescription.updated_at

    response = await client.patch(
        f"/api/v1/prescriptions/{prescription.id}/archive"
    )

    assert response.status_code == 200

    saved = await Prescription.get(prescription.id)

    assert saved is not None
    assert saved.archived is True
    assert saved.archived_at is not None
    assert saved.updated_at > original_updated_at

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
@pytest.mark.parametrize(
    "field",
    ["medication_name", "dosage", "frequency"],
)
@pytest.mark.parametrize("value", ["", "   ", None])
async def test_update_rejects_invalid_required_values(
    client, test_user, field, value
):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Test Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.put(
        f"/api/v1/prescriptions/{prescription.id}",
        json={field: value},
    )

    assert response.status_code == 422

    saved = await Prescription.get(prescription.id)
    assert saved is not None
    assert getattr(saved, field) == {
        "medication_name": "Test Medication",
        "dosage": "10mg",
        "frequency": "Once daily",
    }[field]

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


@pytest.mark.anyio
async def test_record_taken_dose(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Test Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.post(
        f"/api/v1/prescriptions/{prescription.id}/doses",
        json={"status": "taken"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "taken"
    assert data["prescription_id"] == str(prescription.id)
    assert data["recorded_at"] is not None

    doses = await MedicationDose.find(
        MedicationDose.user_id == test_user.id,
        MedicationDose.prescription_id == prescription.id,
    ).to_list()
    assert len(doses) == 1
    assert doses[0].status == DoseStatus.taken


@pytest.mark.anyio
async def test_record_skipped_dose(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Test Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.post(
        f"/api/v1/prescriptions/{prescription.id}/doses",
        json={"status": "skipped"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "skipped"


@pytest.mark.anyio
async def test_invalid_dose_status_is_rejected(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Test Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.post(
        f"/api/v1/prescriptions/{prescription.id}/doses",
        json={"status": "maybe"},
    )

    assert response.status_code == 422


@pytest.mark.anyio
async def test_cannot_record_dose_for_another_users_prescription(
    client, other_user
):
    prescription = Prescription(
        user_id=other_user.id,
        medication_name="Other User Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.post(
        f"/api/v1/prescriptions/{prescription.id}/doses",
        json={"status": "taken"},
    )

    assert response.status_code == 404

    doses = await MedicationDose.find(
        MedicationDose.prescription_id == prescription.id,
    ).to_list()
    assert doses == []


@pytest.mark.anyio
async def test_get_dose_history(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Test Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    for dose_status in (DoseStatus.taken, DoseStatus.skipped):
        await MedicationDose(
            user_id=test_user.id,
            prescription_id=prescription.id,
            status=dose_status,
        ).insert()

    response = await client.get(
        f"/api/v1/prescriptions/{prescription.id}/doses"
    )

    assert response.status_code == 200
    records = response.json()["data"]
    assert len(records) == 2
    assert {record["status"] for record in records} == {"taken", "skipped"}


@pytest.mark.anyio
async def test_cannot_get_dose_history_for_another_users_prescription(
    client, other_user
):
    prescription = Prescription(
        user_id=other_user.id,
        medication_name="Other User Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.get(
        f"/api/v1/prescriptions/{prescription.id}/doses"
    )

    assert response.status_code == 404



@pytest.mark.anyio
async def test_create_medication_reminder_starts_disabled(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Reminder Test Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.post(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"reminder_time": "09:30"},
    )

    assert response.status_code == 201
    reminder = response.json()["data"]
    assert reminder["reminder_time"] == "09:30"
    assert reminder["enabled"] is False
    assert reminder["paused"] is False


@pytest.mark.anyio
async def test_get_medication_reminder_empty_state(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="No Reminder Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.get(
        f"/api/v1/prescriptions/{prescription.id}/reminder"
    )

    assert response.status_code == 200
    assert response.json()["data"] is None


@pytest.mark.anyio
async def test_update_medication_reminder_settings(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Update Reminder Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    create_response = await client.post(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"reminder_time": "09:30"},
    )
    assert create_response.status_code == 201

    response = await client.patch(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"reminder_time": "10:45", "enabled": True},
    )

    assert response.status_code == 200
    reminder = response.json()["data"]
    assert reminder["reminder_time"] == "10:45"
    assert reminder["enabled"] is True


@pytest.mark.anyio
async def test_pause_and_resume_medication_reminder(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Pause Reminder Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    await client.post(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"reminder_time": "09:30"},
    )

    enable_response = await client.patch(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"enabled": True},
    )
    assert enable_response.status_code == 200

    pause_response = await client.patch(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"paused": True},
    )
    assert pause_response.status_code == 200
    assert pause_response.json()["data"]["paused"] is True

    resume_response = await client.patch(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"paused": False},
    )
    assert resume_response.status_code == 200
    assert resume_response.json()["data"]["paused"] is False
    assert resume_response.json()["data"]["enabled"] is True


@pytest.mark.anyio
async def test_disable_medication_reminder(client, test_user):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Disable Reminder Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    await client.post(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"reminder_time": "09:30"},
    )
    await client.patch(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"enabled": True},
    )

    response = await client.patch(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"enabled": False, "paused": False},
    )

    assert response.status_code == 200
    assert response.json()["data"]["enabled"] is False
    assert response.json()["data"]["paused"] is False


@pytest.mark.anyio
async def test_invalid_medication_reminder_time_is_rejected(
    client, test_user
):
    prescription = Prescription(
        user_id=test_user.id,
        medication_name="Invalid Reminder Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.post(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"reminder_time": "25:90"},
    )

    assert response.status_code == 422


@pytest.mark.anyio
async def test_cannot_create_reminder_for_another_users_prescription(
    client, other_user
):
    prescription = Prescription(
        user_id=other_user.id,
        medication_name="Other User Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.post(
        f"/api/v1/prescriptions/{prescription.id}/reminder",
        json={"reminder_time": "09:30"},
    )

    assert response.status_code == 404


@pytest.mark.anyio
async def test_cannot_get_reminder_for_another_users_prescription(
    client, other_user
):
    prescription = Prescription(
        user_id=other_user.id,
        medication_name="Other User Medication",
        dosage="10mg",
        frequency="Once daily",
    )
    await prescription.insert()

    response = await client.get(
        f"/api/v1/prescriptions/{prescription.id}/reminder"
    )

    assert response.status_code == 404
