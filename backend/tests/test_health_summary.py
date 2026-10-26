import unittest
from datetime import date, datetime, timezone
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException
from starlette.requests import Request

from src.health_summary import build_health_summary
from src.main import app, calculate_risk_assessment, get_health_summary
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


if __name__ == "__main__":
    unittest.main()