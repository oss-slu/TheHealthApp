from datetime import date, timedelta
from uuid import uuid4

import pytest
from pydantic import ValidationError

from src.models import (
    GenderEnum,
    UserCreate,
    UserResponse,
    age_from_date_of_birth,
)


def test_age_calculation_is_boundary_safe():
    today = date(2026, 10, 11)

    assert age_from_date_of_birth(date(2013, 10, 11), today) == 13
    assert age_from_date_of_birth(date(2013, 10, 12), today) == 12
    assert age_from_date_of_birth(date(1906, 10, 11), today) == 120


def test_age_calculation_rejects_future_dates():
    with pytest.raises(ValueError, match="future"):
        age_from_date_of_birth(date(2026, 10, 12), date(2026, 10, 11))


def test_user_create_requires_a_valid_canonical_date_of_birth():
    payload = {
        "username": "dob-test",
        "name": "DOB Test",
        "gender": GenderEnum.na,
        "phone": "5551234567",
        "password": "Password1",
    }

    with pytest.raises(ValidationError):
        UserCreate(**payload)

    for invalid_date in (
        date.today() + timedelta(days=1),
        date(date.today().year - 12, date.today().month, date.today().day),
        date(date.today().year - 121, date.today().month, date.today().day),
    ):
        with pytest.raises(ValidationError):
            UserCreate(**{**payload, "date_of_birth": invalid_date})


def test_user_response_preserves_legacy_age_only_users():
    response = UserResponse.model_validate(
        {
            "id": uuid4(),
            "username": "legacy-user",
            "name": "Legacy User",
            "age": 45,
            "gender": GenderEnum.na,
            "phone": "5551234568",
        }
    )

    assert response.date_of_birth is None
    assert response.age == 45


def test_user_response_derives_age_from_date_string():
    response = UserResponse.model_validate(
        {
            "id": uuid4(),
            "username": "dob-user",
            "name": "DOB User",
            "date_of_birth": "2000-01-01",
            "age": 1,
            "gender": GenderEnum.na,
            "phone": "5551234569",
        }
    )

    assert response.date_of_birth == date(2000, 1, 1)
    assert response.age == age_from_date_of_birth(date(2000, 1, 1))
