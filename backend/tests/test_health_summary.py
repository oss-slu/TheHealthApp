import unittest
import json
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException
from starlette.requests import Request

from src.health_summary import build_health_summary
from src.main import app, calculate_risk_assessment, export_own_data, get_health_summary
from src.models import HealthRiskAssessment, HealthRiskInput, HealthRiskOutput, GenderEnum, Questionnaire


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


class UserDataExportTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.user = SimpleNamespace(
            id=uuid4(),
            username="export-user",
            name="Export User",
            date_of_birth=date(1990, 1, 2),
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

    async def test_export_scopes_records_to_current_user_and_excludes_credentials(self):
        queries = {}
        questionnaire = SimpleNamespace(
            created_at=datetime(2026, 2, 1, tzinfo=timezone.utc),
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
        assessment = SimpleNamespace(created_at=datetime(2026, 2, 2, tzinfo=timezone.utc), result=risk_result)

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


if __name__ == "__main__":
    unittest.main()