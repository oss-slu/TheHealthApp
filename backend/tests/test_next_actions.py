import unittest
from pydantic import BaseModel
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient

from src.main import app, create_access_token
from src.models import NextActionDismissal, Questionnaire, User


def make_user(**overrides):
    values = {
        "id": uuid4(),
        "username": "next-action-user",
        "consent_given": True,
        "data_usage": True,
        "consent_version": "v1.0",
        "consent_timestamp": datetime(2026, 1, 1, tzinfo=timezone.utc),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


class NextActionEndpointTests(unittest.TestCase):
    url = "/api/v1/users/me/next-action"
    dismiss_url = "/api/v1/users/me/next-action/dismiss"

    def setUp(self):
        self.user = make_user()
        self.created_dismissals = []

        def capture_dismissal(instance, **data):
            BaseModel.__init__(instance, **data)
            self.created_dismissals.append(instance)

        for patcher in (
            patch.object(
                NextActionDismissal,
                "__init__",
                new=capture_dismissal,
            ),
            patch.object(
                User,
                "get",
                new=AsyncMock(return_value=self.user),
            ),
            patch(
                "src.main.is_token_revoked",
                new=AsyncMock(return_value=False),
            ),
            patch.object(
                Questionnaire,
                "find_one",
                new=AsyncMock(return_value=None),
            ),
            patch.object(
                NextActionDismissal,
                "find_one",
                new=AsyncMock(return_value=None),
            ),
            patch.object(
                NextActionDismissal,
                "insert",
                new=AsyncMock(),
            ),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)

        self.client = TestClient(app)

    def auth_header(self, user=None):
        user = user or self.user
        return {
            "Authorization": f"Bearer {create_access_token(str(user.id))}"
        }

    def test_rejects_request_without_credentials(self):
        response = self.client.get(self.url)

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
                headers=self.auth_header(user_without_consent),
            )

        self.assertEqual(response.status_code, 403)

    def test_returns_questionnaire_action_when_incomplete(self):
        response = self.client.get(
            self.url,
            headers=self.auth_header(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["data"]["action"],
            {
                "key": "complete_questionnaire",
                "href": "/questionnaire",
            },
        )

    def test_returns_no_action_when_questionnaire_is_complete(self):
        questionnaire = SimpleNamespace(user_id=self.user.id)

        with patch.object(
            Questionnaire,
            "find_one",
            new=AsyncMock(return_value=questionnaire),
        ):
            response = self.client.get(
                self.url,
                headers=self.auth_header(),
            )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["data"]["action"])
        NextActionDismissal.find_one.assert_not_awaited()

    def test_returns_no_action_when_action_was_dismissed(self):
        dismissal = SimpleNamespace(
            user_id=self.user.id,
            action_key="complete_questionnaire",
        )

        with patch.object(
            NextActionDismissal,
            "find_one",
            new=AsyncMock(return_value=dismissal),
        ):
            response = self.client.get(
                self.url,
                headers=self.auth_header(),
            )

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["data"]["action"])

    def test_dismisses_action_for_authenticated_user(self):
        response = self.client.post(
            self.dismiss_url,
            json={"action_key": "complete_questionnaire"},
            headers=self.auth_header(),
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["data"]["dismissed"])
        NextActionDismissal.insert.assert_awaited_once()

        self.assertEqual(len(self.created_dismissals), 1)

        dismissal = self.created_dismissals[0]
        self.assertEqual(dismissal.user_id, self.user.id)
        self.assertEqual(
            dismissal.action_key,
            "complete_questionnaire",
        )

    def test_rejects_unsupported_action_key(self):
        response = self.client.post(
            self.dismiss_url,
            json={"action_key": "unsupported_action"},
            headers=self.auth_header(),
        )

        self.assertEqual(response.status_code, 422)
        NextActionDismissal.insert.assert_not_awaited()

    def test_rejects_client_owned_fields(self):
        response = self.client.post(
            self.dismiss_url,
            json={
                "action_key": "complete_questionnaire",
                "user_id": str(uuid4()),
            },
            headers=self.auth_header(),
        )

        self.assertEqual(response.status_code, 422)
        NextActionDismissal.insert.assert_not_awaited()

    def test_does_not_dismiss_action_after_questionnaire_completion(self):
        questionnaire = SimpleNamespace(user_id=self.user.id)

        with patch.object(
            Questionnaire,
            "find_one",
            new=AsyncMock(return_value=questionnaire),
        ):
            response = self.client.post(
                self.dismiss_url,
                json={"action_key": "complete_questionnaire"},
                headers=self.auth_header(),
            )

        self.assertEqual(response.status_code, 409)
        NextActionDismissal.insert.assert_not_awaited()

    def test_repeated_dismissal_is_safe(self):
        existing_dismissal = SimpleNamespace(
            user_id=self.user.id,
            action_key="complete_questionnaire",
        )

        with patch.object(
            NextActionDismissal,
            "find_one",
            new=AsyncMock(return_value=existing_dismissal),
        ):
            response = self.client.post(
                self.dismiss_url,
                json={"action_key": "complete_questionnaire"},
                headers=self.auth_header(),
            )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["data"]["dismissed"])
        NextActionDismissal.insert.assert_not_awaited()


if __name__ == "__main__":
    unittest.main()