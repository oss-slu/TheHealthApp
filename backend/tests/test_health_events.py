import uuid
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from src.models import (
    HealthEvent,
    HealthEventCategory,
    HealthEventCreate,
    HealthEventReference,
    HealthEventSource,
)


@pytest.mark.parametrize(
    ("category", "source"),
    [
        (HealthEventCategory.assessment, HealthEventSource.health_risk_assessment),
        (HealthEventCategory.assessment, HealthEventSource.questionnaire),
        (HealthEventCategory.measurement, HealthEventSource.manual_measurement),
        (HealthEventCategory.medication, HealthEventSource.prescription),
        (HealthEventCategory.medication, HealthEventSource.medication_dose),
        (HealthEventCategory.symptom, HealthEventSource.manual_symptom),
        (HealthEventCategory.goal, HealthEventSource.user_goal),
        (HealthEventCategory.note, HealthEventSource.user_note),
    ],
)
def test_health_event_accepts_valid_category_source(category, source):
    expected_reference_type = {
        HealthEventSource.health_risk_assessment: "health_risk_assessment",
        HealthEventSource.questionnaire: "questionnaire",
        HealthEventSource.manual_measurement: "measurement",
        HealthEventSource.prescription: "prescription",
        HealthEventSource.medication_dose: "medication_dose",
        HealthEventSource.manual_symptom: "symptom",
        HealthEventSource.user_goal: "goal",
        HealthEventSource.user_note: "note",
    }[source]

    event = HealthEventCreate(
        category=category,
        source=source,
        occurred_at=datetime.now(timezone.utc),
        detail_reference=HealthEventReference(
            entity_type=expected_reference_type,
            entity_id=uuid.uuid4(),
        ),
    )

    assert event.category == category
    assert event.source == source
    assert event.detail_reference.entity_type == expected_reference_type


@pytest.mark.parametrize(
    ("category", "source"),
    [
        (HealthEventCategory.measurement, HealthEventSource.prescription),
        (HealthEventCategory.assessment, HealthEventSource.manual_symptom),
        (HealthEventCategory.goal, HealthEventSource.medication_dose),
        (HealthEventCategory.note, HealthEventSource.questionnaire),
    ],
)
def test_health_event_rejects_invalid_category_source(category, source):
    with pytest.raises(ValidationError):
        HealthEventCreate(
            category=category,
            source=source,
            occurred_at=datetime.now(timezone.utc),
            detail_reference=HealthEventReference(
                entity_type=source.value,
                entity_id=uuid.uuid4(),
            ),
        )


def test_health_event_requires_detail_reference():
    with pytest.raises(ValidationError):
        HealthEventCreate(
            category=HealthEventCategory.measurement,
            source=HealthEventSource.manual_measurement,
            occurred_at=datetime.now(timezone.utc),
        )


def test_health_event_create_rejects_client_owned_user_id():
    with pytest.raises(ValidationError):
        HealthEventCreate(
            category=HealthEventCategory.medication,
            source=HealthEventSource.prescription,
            occurred_at=datetime.now(timezone.utc),
            detail_reference=HealthEventReference(
                entity_type="prescription",
                entity_id=uuid.uuid4(),
            ),
            user_id=uuid.uuid4(),
        )

def test_health_event_rejects_timestamp_without_timezone():
    with pytest.raises(ValidationError):
        HealthEventCreate(
            category=HealthEventCategory.measurement,
            source=HealthEventSource.manual_measurement,
            occurred_at=datetime(2026, 11, 16, 10, 0),
            detail_reference=HealthEventReference(
                entity_type="measurement",
                entity_id=uuid.uuid4(),
            ),
        )


def test_health_event_normalizes_timestamp_to_utc():
    event = HealthEventCreate(
        category=HealthEventCategory.measurement,
        source=HealthEventSource.manual_measurement,
        occurred_at=datetime.fromisoformat("2026-11-16T10:00:00-06:00"),
        detail_reference=HealthEventReference(
            entity_type="measurement",
            entity_id=uuid.uuid4(),
        ),
    )

    assert event.occurred_at.tzinfo == timezone.utc
    assert event.occurred_at.hour == 16

@pytest.mark.parametrize(
    ("source", "entity_type"),
    [
        (HealthEventSource.prescription, "symptom"),
        (HealthEventSource.manual_measurement, "prescription"),
        (HealthEventSource.user_goal, "note"),
    ],
)
def test_health_event_rejects_mismatched_detail_reference(
    source, entity_type
):
    category = {
        HealthEventSource.prescription: HealthEventCategory.medication,
        HealthEventSource.manual_measurement: HealthEventCategory.measurement,
        HealthEventSource.user_goal: HealthEventCategory.goal,
    }[source]

    with pytest.raises(ValidationError):
        HealthEventCreate(
            category=category,
            source=source,
            occurred_at=datetime.now(timezone.utc),
            detail_reference=HealthEventReference(
                entity_type=entity_type,
                entity_id=uuid.uuid4(),
            ),
        )

def test_health_event_model_rejects_mismatched_detail_reference():
    with pytest.raises(ValidationError):
        HealthEvent(
            user_id=uuid.uuid4(),
            category=HealthEventCategory.medication,
            source=HealthEventSource.prescription,
            occurred_at=datetime.now(timezone.utc),
            detail_reference=HealthEventReference(
                entity_type="symptom",
                entity_id=uuid.uuid4(),
            ),
        )
