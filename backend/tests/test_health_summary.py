import base64
import json
import tempfile
import unittest
from datetime import date, datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi import HTTPException
from fastapi.testclient import TestClient
from starlette.requests import Request

from src.health_summary import build_health_summary
from src.main import app, calculate_risk_assessment, create_access_token, export_own_data, get_health_summary
from src.models import (
    GenderEnum,
    HealthRiskAssessment,
    HealthRiskInput,
    HealthRiskOutput,
    Questionnaire,
    User,
)


class FakeQuery:
    def __init__(self, records):
        self.records = records

    def sort(self, *_args):
        return self

    async def to_list(self):
        return self.records


class HealthSummaryTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.user = SimpleNamespace(
            id=uuid4(),
            name="Demo User",
            date_of_birth=date(1990, 1, 2),
            gender=GenderEnum.female,
        )

    async def test_endpoint_scopes_both_collections_to_current_user_and_inclusive_dates(self):
        queries = {}

        def questionnaire_find(query):
            queries["questionnaire"] = query
            return FakeQuery([])

        def risk_find(query):
            queries["risk"] = query
            return FakeQuery([])

        with (
            patch.object(Questionnaire, "find", side_effect=questionnaire_find),
            patch.object(HealthRiskAssessment, "find", side_effect=risk_find),
        ):
            result = await get_health_summary(
                self.user,
                date(2026, 3, 7),
                date(2026, 3, 9),
                datetime(2026, 3, 7, 6, tzinfo=timezone.utc),
                datetime(2026, 3, 10, 5, tzinfo=timezone.utc),
            )

        for collection in ("questionnaire", "risk"):
            self.assertEqual(queries[collection]["user_id"], self.user.id)
            self.assertEqual(queries[collection]["created_at"]["$gte"], datetime(2026, 3, 7, 6))
            self.assertEqual(queries[collection]["created_at"]["$lt"], datetime(2026, 3, 10, 5))
        self.assertEqual(result.data["questionnaires"], [])
        self.assertEqual(result.data["risk_assessments"], [])

    async def test_rejects_reversed_date_range_before_querying(self):
        with (
            patch.object(Questionnaire, "find") as questionnaire_find,
            patch.object(HealthRiskAssessment, "find") as risk_find,
        ):
            with self.assertRaises(HTTPException) as raised:
                await get_health_summary(self.user, date(2026, 10, 12), date(2026, 10, 11))

        self.assertEqual(raised.exception.status_code, 422)
        questionnaire_find.assert_not_called()
        risk_find.assert_not_called()

    def test_summary_contains_results_and_excludes_questionnaire_contact_fields(self):
        questionnaire = SimpleNamespace(
            created_at=datetime(2026, 10, 10),
            existing_conditions=["asthma"],
            allergies="None",
            current_medications="None",
            family_history="None",
            exercise_frequency="weekly",
            diet_type="mixed",
            smoking_status="never",
            alcohol_consumption="none",
            sleep_hours="8",
            stress_level="low",
            email="private@example.test",
            phone="+15555550123",
        )
        assessment = SimpleNamespace(
            created_at=datetime(2026, 10, 11),
            result=HealthRiskOutput(
                risk_score=4.2,
                risk_category="low",
                risk_category_description="Low estimated risk",
                factor_breakdown={
                    "age_factor": 1,
                    "cholesterol_factor": 1,
                    "blood_pressure_factor": 1,
                    "smoking_factor": 1,
                    "diabetes_factor": 0,
                },
                recommendations=["Discuss the result with a clinician"],
            ),
        )

        result = build_health_summary(
            self.user,
            [questionnaire],
            [assessment],
            date(2026, 1, 1),
            date(2026, 10, 11),
        )

        self.assertEqual(result["risk_assessments"][0]["risk_score"], 4.2)
        self.assertNotIn("email", result["questionnaires"][0])
        self.assertNotIn("phone", result["questionnaires"][0])

    async def test_authenticated_framingham_result_is_saved_to_current_user(self):
        saved = []
        result = HealthRiskOutput(
            risk_score=4.2,
            risk_category="low",
            risk_category_description="Low estimated risk",
            factor_breakdown={
                "age_factor": 1,
                "cholesterol_factor": 1,
                "blood_pressure_factor": 1,
                "smoking_factor": 1,
                "diabetes_factor": 0,
            },
            recommendations=["Discuss the result with a clinician"],
        )

        class FakeAssessment:
            def __init__(self, **values):
                self.__dict__.update(values)

            async def insert(self):
                saved.append(self)

        request = Request({
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "POST",
            "scheme": "http",
            "path": "/api/v1/health/risk-assessment",
            "raw_path": b"/api/v1/health/risk-assessment",
            "query_string": b"",
            "headers": [],
            "client": ("127.0.0.1", 1234),
            "server": ("testserver", 80),
            "app": app,
        })
        payload = HealthRiskInput(
            gender="female",
            total_cholesterol=200,
            hdl_cholesterol=50,
            systolic_blood_pressure=120,
            blood_pressure_treatment="no",
            smoking_status="never",
            diabetes_status="no",
        )

        with (
            patch("src.main.HealthRiskAssessment", FakeAssessment),
            patch("src.main.calculate_health_risk", return_value=result),
        ):
            response = await calculate_risk_assessment(request, payload, self.user)

        self.assertEqual(len(saved), 1)
        self.assertEqual(saved[0].user_id, self.user.id)
        self.assertEqual(saved[0].result.risk_score, result.risk_score)
        self.assertEqual(response.data, result)


def make_export_user(**overrides):
    values = dict(
        id=uuid4(),
        username="export-user",
        name="Export User",
        date_of_birth=date(1990, 1, 2),
        age=36,
        gender=GenderEnum.female,
        phone="+15555550123",
        password_hash="must-not-export",
        consent_given=True,
        data_usage=True,
        marketing=False,
        consent_version="v1.0",
        consent_timestamp=datetime(2026, 1, 1, tzinfo=timezone.utc),
        photo_url=None,
        created_at=datetime(2025, 1, 1, tzinfo=timezone.utc),
        updated_at=datetime(2026, 1, 1, tzinfo=timezone.utc),
    )
    values.update(overrides)
    return SimpleNamespace(**values)


def no_health_records():
    return (
        patch.object(Questionnaire, "find", return_value=FakeQuery([])),
        patch.object(HealthRiskAssessment, "find", return_value=FakeQuery([])),
    )


class UserDataExportTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.user = make_export_user()

    async def test_export_scopes_records_to_current_user_and_excludes_credentials(self):
        queries = {}
        questionnaire = SimpleNamespace(
            id="65f000000000000000000001",
            created_at=datetime(2026, 2, 1, tzinfo=timezone.utc),
            updated_at=datetime(2026, 2, 3, tzinfo=timezone.utc),
            first_name="Export",
            last_name="User",
            date_of_birth="1990-01-02",
            gender=GenderEnum.female,
            email="export@example.test",
            phone=None,
            existing_conditions=["asthma"],
            allergies="None",
            current_medications="None",
            family_history="None",
            exercise_frequency="weekly",
            diet_type="mixed",
            smoking_status="never",
            alcohol_consumption="none",
            sleep_hours="8",
            stress_level="low",
        )
        risk_result = HealthRiskOutput(
            risk_score=4.2,
            risk_category="low",
            risk_category_description="Low estimated risk",
            factor_breakdown={
                "age_factor": 1,
                "cholesterol_factor": 1,
                "blood_pressure_factor": 1,
                "smoking_factor": 1,
                "diabetes_factor": 0,
            },
            recommendations=["Discuss results with a healthcare professional"],
        )
        assessment = SimpleNamespace(
            id="65f000000000000000000002",
            created_at=datetime(2026, 2, 2, tzinfo=timezone.utc),
            result=risk_result,
        )

        def find_for(collection, records):
            def find(query):
                queries[collection] = query
                return FakeQuery(records)
            return find

        with (
            patch.object(Questionnaire, "find", side_effect=find_for("questionnaire", [questionnaire])),
            patch.object(HealthRiskAssessment, "find", side_effect=find_for("risk", [assessment])),
        ):
            response = await export_own_data(self.user)

        data = json.loads(response.body)
        self.assertEqual(queries["questionnaire"], {"user_id": self.user.id})
        self.assertEqual(queries["risk"], {"user_id": self.user.id})
        self.assertEqual(data["questionnaires"][0]["existing_conditions"], ["asthma"])
        self.assertEqual(data["questionnaires"][0]["id"], "65f000000000000000000001")
        self.assertEqual(data["questionnaires"][0]["updated_at"], "2026-02-03T00:00:00+00:00")
        self.assertEqual(data["risk_assessments"][0]["id"], "65f000000000000000000002")
        self.assertEqual(data["profile"]["age"], 36)
        self.assertIsNone(data["profile"]["photo"])
        self.assertTrue(data["consent"]["valid_for_current_policy"])
        self.assertEqual(data["risk_assessments"][0]["result"]["risk_score"], 4.2)
        self.assertNotIn("password_hash", response.body.decode())
        self.assertEqual(response.headers["cache-control"], "no-store")

    async def test_export_succeeds_with_empty_health_history(self):
        self.user.consent_given = False
        self.user.data_usage = False
        with (
            patch.object(Questionnaire, "find", return_value=FakeQuery([])),
            patch.object(HealthRiskAssessment, "find", return_value=FakeQuery([])),
        ):
            response = await export_own_data(self.user)

        data = json.loads(response.body)
        self.assertFalse(data["consent"]["consent_given"])
        self.assertEqual(data["questionnaires"], [])
        self.assertEqual(data["risk_assessments"], [])
        self.assertEqual(data["profile"]["username"], self.user.username)

    async def test_export_reports_invalid_consent_using_backend_rule(self):
        cases = {
            "data usage declined": {"data_usage": False},
            "stale policy version": {"consent_version": "v0.9"},
            "withdrawn": {"consent_given": False},
        }
        for label, overrides in cases.items():
            with self.subTest(label):
                questionnaire_find, risk_find = no_health_records()
                with questionnaire_find, risk_find:
                    response = await export_own_data(make_export_user(**overrides))

                consent = json.loads(response.body)["consent"]
                self.assertFalse(consent["valid_for_current_policy"])
                self.assertEqual(consent["current_policy_version"], "v1.0")

    async def test_export_embeds_stored_profile_photo(self):
        photo_bytes = b"\x89PNG\r\n\x1a\nfake-image"
        with tempfile.TemporaryDirectory() as base_dir:
            upload_dir = Path(base_dir) / "uploads"
            upload_dir.mkdir()
            (upload_dir / "photo.png").write_bytes(photo_bytes)
            questionnaire_find, risk_find = no_health_records()

            with (
                patch("src.main.BASE_DIR", Path(base_dir)),
                patch("src.main.UPLOAD_DIR", upload_dir),
                questionnaire_find,
                risk_find,
            ):
                response = await export_own_data(make_export_user(photo_url="/uploads/photo.png"))

        photo = json.loads(response.body)["profile"]["photo"]
        self.assertEqual(photo["url"], "/uploads/photo.png")
        self.assertEqual(photo["content_type"], "image/png")
        self.assertEqual(base64.b64decode(photo["data_base64"]), photo_bytes)

    async def test_export_does_not_read_photo_paths_outside_uploads(self):
        questionnaire_find, risk_find = no_health_records()
        with questionnaire_find, risk_find:
            response = await export_own_data(make_export_user(photo_url="/uploads/../.env"))

        photo = json.loads(response.body)["profile"]["photo"]
        self.assertEqual(photo, {"url": "/uploads/../.env", "content_type": None, "data_base64": None})


class UserDataExportEndpointAuthTests(unittest.TestCase):
    """Exercises the real route and auth dependency over HTTP, without the database lifespan."""

    url = "/api/v1/users/me/data-export"

    def setUp(self):
        self.signed_in = make_export_user(username="signed-in-user")
        self.other = make_export_user(username="other-user", phone="+15555550199")
        users = {self.signed_in.id: self.signed_in, self.other.id: self.other}
        self.queries = []

        def find(query):
            self.queries.append(query)
            return FakeQuery([])

        for patcher in (
            patch.object(User, "get", new=AsyncMock(side_effect=users.get)),
            patch("src.main.is_token_revoked", new=AsyncMock(return_value=False)),
            patch.object(Questionnaire, "find", side_effect=find),
            patch.object(HealthRiskAssessment, "find", side_effect=find),
        ):
            patcher.start()
            self.addCleanup(patcher.stop)
        self.client = TestClient(app)

    def auth_header(self, user):
        return {"Authorization": f"Bearer {create_access_token(str(user.id))}"}

    def test_rejects_request_without_credentials(self):
        response = self.client.get(self.url)

        self.assertIn(response.status_code, (401, 403))
        self.assertEqual(self.queries, [])

    def test_rejects_invalid_token(self):
        response = self.client.get(self.url, headers={"Authorization": "Bearer not-a-real-token"})

        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.queries, [])

    def test_rejects_revoked_token(self):
        with patch("src.main.is_token_revoked", new=AsyncMock(return_value=True)):
            response = self.client.get(self.url, headers=self.auth_header(self.signed_in))

        self.assertEqual(response.status_code, 401)
        self.assertEqual(self.queries, [])

    def test_export_is_limited_to_signed_in_user(self):
        response = self.client.get(
            self.url,
            params={"user_id": str(self.other.id), "username": self.other.username},
            headers=self.auth_header(self.signed_in),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["profile"]["username"], "signed-in-user")
        self.assertEqual(self.queries, [{"user_id": self.signed_in.id}, {"user_id": self.signed_in.id}])
        self.assertNotIn("other-user", response.text)
        self.assertNotIn("must-not-export", response.text)


if __name__ == "__main__":
    unittest.main()