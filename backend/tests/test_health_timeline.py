import unittest
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient

from src.main import app, create_access_token
from src.models import HealthEvent, User


class FakeTimelineQuery:
    """Mimics the Beanie query methods used by the timeline endpoint."""

    def __init__(self, records):
        self.records = records
        self.offset = 0
        self.page_limit = None
        self.sort_order = None

    async def count(self):
        return len(self.records)

    def sort(self, *args):
        self.sort_order = args
        return self

    def skip(self, offset):
        self.offset = offset
        return self

    def limit(self, limit):
        self.page_limit = limit
        return self

    async def to_list(self):
        records = self.records[self.offset:]
        if self.page_limit is not None:
            records = records[:self.page_limit]
        return records


def make_timeline_user(**overrides):
    values = {
        "id": uuid4(),
        "username": "timeline-user",
        "consent_given": True,
        "data_usage": True,
        "consent_version": "v1.0",
        "consent_timestamp": datetime(2026, 1, 1, tzinfo=timezone.utc),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def make_event(user_id, occurred_at, category="measurement"):
    return SimpleNamespace(
        id=uuid4(),
        user_id=user_id,
        category=category,
        source="manual_measurement",
        occurred_at=occurred_at,
        created_at=occurred_at,
        detail_reference={
            "entity_type": "measurement",
            "entity_id": uuid4(),
        },
    )


class HealthTimelineEndpointTests(unittest.TestCase):
    url = "/api/v1/users/me/health-timeline"

    def setUp(self):
        self.signed_in = make_timeline_user()
        self.other = make_timeline_user(username="other-user")
        self.queries = []
        self.fake_queries = []
        self.records = []

        users = {
            self.signed_in.id: self.signed_in,
            self.other.id: self.other,
        }

        def find(query):
            self.queries.append(query)
            fake_query = FakeTimelineQuery(self.records)
            self.fake_queries.append(fake_query)
            return fake_query

        for patcher in (
            patch.object(User, "get", new=AsyncMock(side_effect=users.get)),
            patch("src.main.is_token_revoked", new=AsyncMock(return_value=False)),
            patch.object(HealthEvent, "find", side_effect=find),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)

        self.client = TestClient(app)

    def auth_header(self, user):
        return {
            "Authorization": f"Bearer {create_access_token(str(user.id))}"
        }

    
    def test_rejects_request_without_credentials(self):
        response = self.client.get(self.url)

        self.assertIn(response.status_code, (401, 403))
        self.assertEqual(self.queries, [])

    def test_rejects_user_without_current_consent(self):
        user_without_consent = make_timeline_user(
            consent_given=False,
        )

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
        self.assertEqual(self.queries, [])

    
    def test_returns_only_authenticated_users_events(self):
        event = make_event(
            self.signed_in.id,
            datetime(2026, 11, 16, 12, tzinfo=timezone.utc),
        )
        self.records = [event]

        response = self.client.get(
            self.url,
            params={"user_id": str(self.other.id)},
            headers=self.auth_header(self.signed_in),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["data"]["events"]), 1)
        self.assertEqual(
            self.queries[0]["user_id"],
            self.signed_in.id,
        )
        self.assertNotEqual(
            self.queries[0]["user_id"],
            self.other.id,
        )

    
    def test_returns_successful_empty_timeline(self):
        response = self.client.get(
            self.url,
            headers=self.auth_header(self.signed_in),
        )

        self.assertEqual(response.status_code, 200)

        data = response.json()["data"]
        self.assertEqual(data["events"], [])
        self.assertEqual(data["total"], 0)
        self.assertEqual(data["limit"], 20)
        self.assertEqual(data["offset"], 0)
        self.assertFalse(data["has_more"])

    
    def test_applies_pagination(self):
        self.records = [
            make_event(
                self.signed_in.id,
                datetime(2026, 11, day, 12, tzinfo=timezone.utc),
            )
            for day in range(1, 6)
        ]

        response = self.client.get(
            self.url,
            params={"limit": 2, "offset": 2},
            headers=self.auth_header(self.signed_in),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.fake_queries[0].sort_order, ("-occurred_at",))

        data = response.json()["data"]
        self.assertEqual(len(data["events"]), 2)
        self.assertEqual(data["total"], 5)
        self.assertEqual(data["limit"], 2)
        self.assertEqual(data["offset"], 2)
        self.assertTrue(data["has_more"])

    
    def test_filters_by_category(self):
        self.records = [
            make_event(
                self.signed_in.id,
                datetime(2026, 11, 16, 12, tzinfo=timezone.utc),
            )
        ]

        response = self.client.get(
            self.url,
            params={"category": "measurement"},
            headers=self.auth_header(self.signed_in),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            self.queries[0]["category"],
            "measurement",
        )

    
    def test_filters_by_date_range(self):
        start_at = "2026-11-01T00:00:00Z"
        end_before = "2026-11-16T00:00:00Z"

        response = self.client.get(
            self.url,
            params={
                "start_at": start_at,
                "end_before": end_before,
            },
            headers=self.auth_header(self.signed_in),
        )

        self.assertEqual(response.status_code, 200)

        date_filter = self.queries[0]["occurred_at"]
        self.assertEqual(
            date_filter["$gte"],
            datetime(2026, 11, 1),
        )
        self.assertEqual(
            date_filter["$lt"],
            datetime(2026, 11, 16),
        )

    
    def test_rejects_incomplete_date_range(self):
        response = self.client.get(
            self.url,
            params={"start_at": "2026-11-01T00:00:00Z"},
            headers=self.auth_header(self.signed_in),
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.queries, [])

    def test_rejects_reversed_date_range(self):
        response = self.client.get(
            self.url,
            params={
                "start_at": "2026-11-16T00:00:00Z",
                "end_before": "2026-11-01T00:00:00Z",
            },
            headers=self.auth_header(self.signed_in),
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.queries, [])

    
    def test_rejects_invalid_pagination_parameters(self):
        invalid_requests = [
            {"limit": 0},
            {"limit": 101},
            {"offset": -1},
        ]

        for params in invalid_requests:
            with self.subTest(params=params):
                response = self.client.get(
                    self.url,
                    params=params,
                    headers=self.auth_header(self.signed_in),
                )

                self.assertEqual(response.status_code, 422)

        self.assertEqual(self.queries, [])

    
    def test_rejects_invalid_category(self):
        response = self.client.get(
            self.url,
            params={"category": "invalid-category"},
            headers=self.auth_header(self.signed_in),
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.queries, [])

    
    def test_returns_generic_error_when_database_fails(self):
        with patch.object(
            HealthEvent,
            "find",
            side_effect=Exception("Database connection details"),
        ):
            response = self.client.get(
                self.url,
                headers=self.auth_header(self.signed_in),
            )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.json()["error"]["message"],
            "An error occurred while retrieving the health timeline",
        )
        self.assertNotIn("Database connection details", response.text)

if __name__ == "__main__":
    unittest.main()    
