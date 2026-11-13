"""Supported manual health measurement definitions and validation rules."""
import json
from datetime import date
from decimal import Decimal, InvalidOperation
from pathlib import Path


# The authoritative measurement definitions are in:
# shared/health_measurements.json

# Load the shared health measurement contract.
CONTRACT_PATH = (
    Path(__file__).resolve().parents[2]
    / "shared"
    / "health_measurements.json"
)

with CONTRACT_PATH.open(encoding="utf-8") as contract_file:
    HEALTH_MEASUREMENT_CONTRACT = json.load(contract_file)

METRIC_RULES = HEALTH_MEASUREMENT_CONTRACT["metrics"]
TEXT_METRIC_RULES = HEALTH_MEASUREMENT_CONTRACT["text_metrics"]
MAX_NOTES_LENGTH = HEALTH_MEASUREMENT_CONTRACT["maximum_notes_length"]


def validate_measurement_value(
    metric: str,
    value: int | float | str,
    unit: str,
) -> None:
    """Validate a numeric measurement against its supported range and unit."""

    if metric not in METRIC_RULES:
        raise ValueError(f"Unsupported measurement metric: {metric}")

    rule = METRIC_RULES[metric]

    if "units" in rule:
        unit_rule = rule["units"].get(unit)
    else:
        unit_rule = rule if rule["unit"] == unit else None

    if unit_rule is None:
        raise ValueError(f"Unsupported unit for {metric}: {unit}")

    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("Measurement value must be numeric.")

    try:
        numeric_value = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError("Measurement value must be numeric.")

    if not numeric_value.is_finite():
        raise ValueError("Measurement value must be finite.")

    minimum = Decimal(str(unit_rule["minimum"]))
    maximum = Decimal(str(unit_rule["maximum"]))

    if numeric_value < minimum or numeric_value > maximum:
        raise ValueError(
            f"{metric} must be between {minimum} and {maximum} {unit}."
        )

    decimal_places = max(0, -numeric_value.as_tuple().exponent)

    if decimal_places > unit_rule["decimal_places"]:
        raise ValueError(
            f"{metric} supports at most "
            f"{unit_rule['decimal_places']} decimal places."
        )


def validate_blood_pressure(systolic: int, diastolic: int) -> None:
    """Validate the relationship between systolic and diastolic pressure."""

    validate_measurement_value(
        "blood_pressure_systolic", systolic, "mmHg"
    )
    validate_measurement_value(
        "blood_pressure_diastolic", diastolic, "mmHg"
    )

    if systolic <= diastolic:
        raise ValueError(
            "Systolic pressure must be greater than diastolic pressure."
        )


def validate_text_measurement(metric: str, value: str) -> None:
    """Validate a supported text-based measurement."""

    if metric not in TEXT_METRIC_RULES:
        raise ValueError(f"Unsupported text measurement: {metric}")

    if not isinstance(value, str) or not value.strip():
        raise ValueError("This field cannot be blank.")

    maximum_length = TEXT_METRIC_RULES[metric]["maximum_length"]

    if len(value) > maximum_length:
        raise ValueError(
            f"{metric} cannot exceed {maximum_length} characters."
        )


def validate_measurement_notes(notes: str | None) -> None:
    """Validate optional measurement notes."""

    if notes is not None and not isinstance(notes, str):
        raise ValueError("Notes must be text.")

    if notes is not None and len(notes) > MAX_NOTES_LENGTH:
        raise ValueError(
            f"Notes cannot exceed {MAX_NOTES_LENGTH} characters."
        )

def validate_measurement_date(value: date | str) -> None:
    """Reject invalid measurement dates and dates in the future."""

    if isinstance(value, str):
        try:
            value = date.fromisoformat(value)
        except ValueError:
            raise ValueError("Measurement date must be a valid ISO date.")

    if not isinstance(value, date):
        raise ValueError("Measurement date must be a valid date.")

    if value > date.today():
        raise ValueError("Measurement date cannot be in the future.")