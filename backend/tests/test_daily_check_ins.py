
import unittest
from pydantic import BaseModel
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient
from pymongo.errors import DuplicateKeyError

from src.main import app, create_access_token
from src.models import DailyCheckIn, HealthEvent, User


def make_user(**overrides):
    values = {
        "id": uuid4(),
        "username": "check-in-user",
        "consent_given": True,
        "data_usage": True,
        "consent_version": "v1.0",
        "consent_timestamp": datetime(2026, 1, 1, tzinfo=timezone.utc),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class DailyCheckInEndpointTests(unittest.TestCase):
    url = "/api/v1/users/me/daily-check-in"
    today = date(2026, 11, 20)
    timezone_name = "America/Chicago"

    def setUp(self):
        self.user = make_user()

        for patcher in (
            patch.object(
                DailyCheckIn,
                "__init__",
                new=lambda self, **data: BaseModel.__init__(self, **data),
            ),
            patch.object(
                HealthEvent,
                "__init__",
                new=lambda self, **data: BaseModel.__init__(self, **data),
            ),
            patch.object(User, "get", new=AsyncMock(return_value=self.user)),
            patch(
                "src.main.is_token_revoked",
                new=AsyncMock(return_value=False),
            ),
            patch(
                "src.main._get_local_check_in_date",
                return_value=self.today,
            ),
            patch.object(DailyCheckIn, "find_one", new=AsyncMock(return_value=None)),
            patch.object(DailyCheckIn, "insert", new=AsyncMock()),
            patch.object(DailyCheckIn, "delete", new=AsyncMock()),
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

    def request_params(self):
        return {"timezone": self.timezone_name}

    def test_rejects_request_without_credentials(self):
        response = self.client.get(
            self.url,
            params=self.request_params(),
        )

        self.assertIn(response.status_code, (401, 403))

    def test_rejects_user_without_current_consent(self):
        user_without_consent = make_user(consent_given=False)

        with patch.object(
            User,
            "get",
            new=AsyncMock(return_value=user_without_consent),
        ):
            response = self.client.get(
                self.url,
                params=self.request_params(),
                headers=self.auth_header(user_without_consent),
            )

        self.assertEqual(response.status_code, 403)

    def test_returns_empty_state_when_no_check_in_exists(self):
        response = self.client.get(
            self.url,
            params=self.request_params(),
            headers=self.auth_header(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["data"]["completed"])
        self.assertIsNone(response.json()["data"]["check_in"])

        DailyCheckIn.find_one.assert_awaited_once_with(
            {
                "user_id": self.user.id,
                "check_in_date": self.today,
            }
        )

    def test_returns_existing_check_in(self):
        check_in = SimpleNamespace(
            id=uuid4(),
            check_in_date=self.today,
            feeling="good",
            created_at=datetime.now(timezone.utc),
        )

        with patch.object(
            DailyCheckIn,
            "find_one",
            new=AsyncMock(return_value=check_in),
        ):
            response = self.client.get(
                self.url,
                params=self.request_params(),
                headers=self.auth_header(),
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["data"]["completed"])
        self.assertEqual(
            response.json()["data"]["check_in"]["feeling"],
            "good",
        )

    def test_rejects_invalid_feeling(self):
        response = self.client.post(
            self.url,
            params=self.request_params(),
            json={"feeling": "excellent"},
            headers=self.auth_header(),
        )

        self.assertEqual(response.status_code, 422)
        DailyCheckIn.insert.assert_not_awaited()

    def test_rejects_client_owned_fields(self):
        response = self.client.post(
            self.url,
            params=self.request_params(),
            json={
                "feeling": "good",
                "user_id": str(uuid4()),
            },
            headers=self.auth_header(),
        )

        self.assertEqual(response.status_code, 422)
        DailyCheckIn.insert.assert_not_awaited()

    def test_creates_check_in_and_timeline_event(self):
        response = self.client.post(
            self.url,
            params=self.request_params(),
            json={"feeling": "okay"},
            headers=self.auth_header(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"]["feeling"], "okay")
        DailyCheckIn.insert.assert_awaited_once()
        HealthEvent.insert.assert_awaited_once()

    def test_rejects_duplicate_daily_check_in(self):
        with patch.object(
            DailyCheckIn,
            "insert",
            new=AsyncMock(side_effect=DuplicateKeyError("duplicate")),
        ):
            response = self.client.post(
                self.url,
                params=self.request_params(),
                json={"feeling": "good"},
                headers=self.auth_header(),
            )

        self.assertEqual(response.status_code, 409)
        self.assertIn("already completed", response.json()["error"]["message"])
        HealthEvent.insert.assert_not_awaited()

    def test_rolls_back_check_in_if_timeline_event_fails(self):
        with patch.object(
            HealthEvent,
            "insert",
            new=AsyncMock(side_effect=Exception("database details")),
        ):
            response = self.client.post(
                self.url,
                params=self.request_params(),
                json={"feeling": "not_well"},
                headers=self.auth_header(),
            )

        self.assertEqual(response.status_code, 500)
        self.assertNotIn("database details", response.text)
        DailyCheckIn.delete.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
