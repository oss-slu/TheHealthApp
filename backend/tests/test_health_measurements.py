import math

import pytest

from src.health_measurements import (
    CONTRACT_PATH,
    DATE_RULE,
    HEALTH_MEASUREMENT_CONTRACT,
    METRIC_RULES,
    TEXT_METRIC_RULES,
    _find_contract_path,
    validate_blood_pressure,
    validate_measurement_date,
    validate_measurement_notes,
    validate_measurement_value,
    validate_text_measurement,
)

from datetime import date, datetime, timedelta

def test_all_numeric_metrics_have_validation_rules():
    assert len(METRIC_RULES) == 9


def test_shared_contract_loading_and_date_rules():
    assert CONTRACT_PATH.is_file()
    assert len(METRIC_RULES) == 9
    assert DATE_RULE["format"] == "YYYY-MM-DD"
    assert DATE_RULE["pattern"] == r"^\d{4}-\d{2}-\d{2}$"
    assert DATE_RULE["allow_future"] is False


def test_find_contract_path_finds_valid_contract():
    resolved_path = _find_contract_path()
    assert resolved_path.is_file()
    assert resolved_path.name == "health_measurements.json"


@pytest.mark.parametrize(
    "metric,value,unit",
    [
        ("blood_pressure_systolic", 120, "mmHg"),
        ("blood_pressure_diastolic", 80, "mmHg"),
        ("weight", 70.5, "kg"),
        ("weight", 155.5, "lb"),
        ("heart_rate", 72, "bpm"),
        ("blood_glucose", 100, "mg/dL"),
        ("blood_glucose", 5.5, "mmol/L"),
        ("total_cholesterol", 180, "mg/dL"),
        ("total_cholesterol", 4.5, "mmol/L"),
        ("sleep_duration", 8, "hours"),
        ("mood", 3, "scale"),
        ("stress", 2, "scale"),
    ],
)
def test_valid_measurement_values(metric, value, unit):
    validate_measurement_value(metric, value, unit)


@pytest.mark.parametrize(
    "metric,value,unit",
    [
        ("blood_pressure_systolic", 39, "mmHg"),
        ("blood_pressure_systolic", 301, "mmHg"),
        ("blood_pressure_diastolic", 19, "mmHg"),
        ("blood_pressure_diastolic", 201, "mmHg"),
        ("weight", 0, "kg"),
        ("weight", 2205, "lb"),
        ("heart_rate", 19, "bpm"),
        ("heart_rate", 301, "bpm"),
        ("blood_glucose", 0, "mg/dL"),
        ("blood_glucose", 2001, "mg/dL"),
        ("total_cholesterol", 0, "mg/dL"),
        ("total_cholesterol", 1501, "mg/dL"),
        ("sleep_duration", -1, "hours"),
        ("sleep_duration", 25, "hours"),
        ("mood", 0, "scale"),
        ("mood", 6, "scale"),
        ("stress", 0, "scale"),
        ("stress", 6, "scale"),
    ],
)
def test_out_of_range_values_are_rejected(metric, value, unit):
    with pytest.raises(ValueError):
        validate_measurement_value(metric, value, unit)


def test_unsupported_metric_is_rejected():
    with pytest.raises(ValueError, match="Unsupported measurement metric"):
        validate_measurement_value("temperature", 98, "F")


def test_unsupported_unit_is_rejected():
    with pytest.raises(ValueError, match="Unsupported unit"):
        validate_measurement_value("weight", 70, "stones")


@pytest.mark.parametrize("value", [float("nan"), float("inf"), float("-inf")])
def test_non_finite_values_are_rejected(value):
    with pytest.raises(ValueError, match="finite"):
        validate_measurement_value("weight", value, "kg")


def test_boolean_values_are_rejected():
    with pytest.raises(ValueError, match="numeric"):
        validate_measurement_value("heart_rate", True, "bpm")

def test_numeric_strings_are_rejected():
    with pytest.raises(ValueError, match="numeric"):
        validate_measurement_value("weight", "70", "kg")


def test_excess_decimal_places_are_rejected():
    with pytest.raises(ValueError, match="decimal places"):
        validate_measurement_value("weight", 70.55, "kg")


def test_whole_valued_floats_accepted_for_zero_decimal_metrics():
    # heart_rate: 72.0 is accepted, 72.5 is rejected
    validate_measurement_value("heart_rate", 72.0, "bpm")
    with pytest.raises(ValueError, match="decimal places"):
        validate_measurement_value("heart_rate", 72.5, "bpm")

    # blood pressure: whole-valued floats accepted, fractional rejected
    validate_measurement_value("blood_pressure_systolic", 120.0, "mmHg")
    validate_measurement_value("blood_pressure_diastolic", 80.0, "mmHg")
    validate_blood_pressure(120.0, 80.0)
    with pytest.raises(ValueError, match="decimal places"):
        validate_blood_pressure(120.5, 80.0)
    with pytest.raises(ValueError, match="decimal places"):
        validate_blood_pressure(120.0, 80.5)

    # mood and stress: whole-valued floats accepted, fractional rejected
    validate_measurement_value("mood", 3.0, "scale")
    with pytest.raises(ValueError, match="decimal places"):
        validate_measurement_value("mood", 3.5, "scale")

    validate_measurement_value("stress", 2.0, "scale")
    with pytest.raises(ValueError, match="decimal places"):
        validate_measurement_value("stress", 2.5, "scale")


def test_blood_pressure_accepts_valid_values():
    validate_blood_pressure(120, 80)


def test_blood_pressure_rejects_systolic_equal_to_diastolic():
    with pytest.raises(ValueError, match="greater than"):
        validate_blood_pressure(80, 80)


def test_blood_pressure_rejects_systolic_below_diastolic():
    with pytest.raises(ValueError, match="greater than"):
        validate_blood_pressure(70, 90)


def test_valid_symptoms_are_accepted():
    validate_text_measurement("symptoms", "Headache")


def test_blank_symptoms_are_rejected():
    with pytest.raises(ValueError, match="blank"):
        validate_text_measurement("symptoms", "   ")


def test_symptoms_over_character_limit_are_rejected():
    with pytest.raises(ValueError, match="1000 characters"):
        validate_text_measurement("symptoms", "a" * 1001)


def test_symptoms_at_character_limit_are_accepted():
    validate_text_measurement("symptoms", "a" * 1000)


def test_optional_notes_can_be_empty():
    validate_measurement_notes(None)
    validate_measurement_notes("")


def test_notes_over_character_limit_are_rejected():
    with pytest.raises(ValueError, match="1000 characters"):
        validate_measurement_notes("a" * 1001)

def test_non_text_notes_are_rejected():
    with pytest.raises(ValueError, match="Notes must be text"):
        validate_measurement_notes(123)


def test_notes_at_character_limit_are_accepted():
    validate_measurement_notes("a" * 1000)

def test_measurement_date_accepts_today():
    validate_measurement_date(date.today())


def test_measurement_date_accepts_past_date():
    validate_measurement_date(date.today() - timedelta(days=1))


def test_measurement_date_rejects_future_date():
    with pytest.raises(ValueError, match="cannot be in the future"):
        validate_measurement_date(date.today() + timedelta(days=1))


def test_measurement_date_accepts_iso_string():
    validate_measurement_date(date.today().isoformat())


def test_measurement_date_rejects_invalid_string():
    with pytest.raises(ValueError, match="valid ISO date"):
        validate_measurement_date("not-a-date")


def test_measurement_date_rejects_compact_date():
    with pytest.raises(ValueError, match="YYYY-MM-DD"):
        validate_measurement_date("20261104")


def test_measurement_date_rejects_slash_formatted_date():
    with pytest.raises(ValueError, match="YYYY-MM-DD"):
        validate_measurement_date("11/04/2026")


def test_measurement_date_rejects_calendar_invalid_date():
    with pytest.raises(ValueError, match="valid ISO date"):
        validate_measurement_date("2026-02-30")


def test_measurement_date_rejects_future_iso_string():
    with pytest.raises(ValueError, match="cannot be in the future"):
        validate_measurement_date((date.today() + timedelta(days=1)).isoformat())


@pytest.mark.parametrize("invalid_value", [12345, True, False, None, [], {}])
def test_measurement_date_rejects_non_date_types(invalid_value):
    with pytest.raises(ValueError, match="valid date"):
        validate_measurement_date(invalid_value)


def test_measurement_date_accepts_and_normalizes_datetime():
    validate_measurement_date(datetime.now())
    validate_measurement_date(datetime.now() - timedelta(days=1))
    validate_measurement_date(datetime(2020, 1, 1, 12, 0, 0))


def test_measurement_date_rejects_future_datetime():
    with pytest.raises(ValueError, match="cannot be in the future"):
        validate_measurement_date(datetime.now() + timedelta(days=2))
