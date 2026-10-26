from datetime import date, datetime, timezone
from typing import Any

from .models import HealthRiskAssessment, Questionnaire, User


def build_health_summary(
    user: User,
    questionnaires: list[Questionnaire],
    risk_assessments: list[HealthRiskAssessment],
    start_date: date | None,
    end_date: date | None,
) -> dict[str, Any]:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "period": {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
        },
        "profile": {
            "name": user.name,
            "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
            "gender": user.gender.value,
        },
        "questionnaires": [
            {
                "submitted_at": _utc_isoformat(item.created_at),
                "existing_conditions": item.existing_conditions,
                "allergies": item.allergies,
                "current_medications": item.current_medications,
                "family_history": item.family_history,
                "exercise_frequency": item.exercise_frequency,
                "diet_type": item.diet_type,
                "smoking_status": item.smoking_status,
                "alcohol_consumption": item.alcohol_consumption,
                "sleep_hours": item.sleep_hours,
                "stress_level": item.stress_level,
            }
            for item in questionnaires
        ],
        "risk_assessments": [
            {
                "assessed_at": _utc_isoformat(item.created_at),
                **item.result.model_dump(mode="json"),
            }
            for item in risk_assessments
        ],
    }


def _utc_isoformat(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.isoformat()