import unittest
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient
from pydantic import BaseModel

from src.main import app, create_access_token
from src.models import (
    HealthEvent,
    HealthEventCategory,
    HealthEventSource,
    Questionnaire,
    User,
)


def make_user(**overrides):
    values = {
        "id": uuid4(),
        "username": "questionnaire-user",
        "date_of_birth": date(1990, 1, 1),
        "age": 36,
        "consent_given": True,
        "data_usage": True,
        "consent_version": "v1.0",
        "consent_timestamp": datetime(2026, 1, 1, tzinfo=timezone.utc),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class QuestionnaireSubmissionTests(unittest.TestCase):
    url = "/api/v1/questionnaire/submit"

    def setUp(self):
        self.user = make_user()
        self.created_events = []

        def capture_health_event_init(event, **data):
            BaseModel.__init__(event, **data)
            self.created_events.append(event)

        for patcher in (
            patch.object(
                Questionnaire,
                "__init__",
                new=lambda self, **data: BaseModel.__init__(self, **data),
            ),
            patch.object(
                HealthEvent,
                "__init__",
                new=capture_health_event_init,
            ),
            patch.object(User, "get", new=AsyncMock(return_value=self.user)),
            patch(
                "src.main.is_token_revoked",
                new=AsyncMock(return_value=False),
            ),
            patch.object(Questionnaire, "insert", new=AsyncMock()),
            patch.object(Questionnaire, "delete", new=AsyncMock()),
            patch.object(HealthEvent, "insert", new=AsyncMock()),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)

        self.client = TestClient(app)

    def auth_header(self, user=None):
        user = user or self.user
        return {
            "Authorization": f"Bearer {create_access_token(str(user.id))}"
        }

    def valid_payload(self):
        return {
            "firstName": "Test",
            "lastName": "User",
            "dateOfBirth": "1990-01-01",
            "gender": "female",
            "email": "test@example.com",
            "phone": "1234567890",
            "existingConditions": [],
            "allergies": "",
            "currentMedications": "",
            "familyHistory": "",
            "exerciseFrequency": "moderate",
            "dietType": "balanced",
            "smokingStatus": "never",
            "alcoholConsumption": "none",
            "sleepHours": "8",
            "stressLevel": "low",
        }

    def test_rejects_request_without_credentials(self):
        response = self.client.post(
            self.url,
            json=self.valid_payload(),
        )

        self.assertIn(response.status_code, (401, 403))
        Questionnaire.insert.assert_not_awaited()

    def test_rejects_user_without_current_consent(self):
        user_without_consent = make_user(consent_given=False)

        with patch.object(
            User,
            "get",
            new=AsyncMock(return_value=user_without_consent),
        ):
            response = self.client.post(
                self.url,
                json=self.valid_payload(),
                headers=self.auth_header(user_without_consent),
            )

        self.assertEqual(response.status_code, 403)
        Questionnaire.insert.assert_not_awaited()

    def test_creates_questionnaire_and_timeline_event(self):
        response = self.client.post(
            self.url,
            json=self.valid_payload(),
            headers=self.auth_header(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["data"]["message"],
            "Questionnaire submitted successfully",
        )

        Questionnaire.insert.assert_awaited_once()
        HealthEvent.insert.assert_awaited_once()

        self.assertEqual(len(self.created_events), 1)

        event = self.created_events[0]

        self.assertEqual(event.user_id, self.user.id)
        self.assertEqual(event.category, HealthEventCategory.assessment)
        self.assertEqual(event.source, HealthEventSource.questionnaire)
        self.assertEqual(
            event.detail_reference.entity_type,
            "questionnaire",
        )
        self.assertIsInstance(event.detail_reference.entity_id, type(uuid4()))


    def test_rolls_back_questionnaire_when_timeline_event_fails(self):
        with patch.object(
            HealthEvent,
            "insert",
            new=AsyncMock(side_effect=RuntimeError("Timeline unavailable")),
        ):
            response = self.client.post(
                self.url,
                json=self.valid_payload(),
                headers=self.auth_header(),
            )

        self.assertEqual(response.status_code, 500)
        Questionnaire.insert.assert_awaited_once()
        Questionnaire.delete.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()