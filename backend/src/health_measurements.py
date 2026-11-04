"""Supported manual health measurement definitions and validation rules."""

from decimal import Decimal, InvalidOperation
from datetime import date


# These definitions must match the contract in:
# docs/manual-health-measurements.md

METRIC_RULES = {
    "blood_pressure_systolic": {
        "unit": "mmHg",
        "minimum": 40,
        "maximum": 300,
        "decimal_places": 0,
    },
    "blood_pressure_diastolic": {
        "unit": "mmHg",
        "minimum": 20,
        "maximum": 200,
        "decimal_places": 0,
    },
    "weight": {
        "units": {
            "kg": {
                "minimum": 0.1,
                "maximum": 1000,
                "decimal_places": 1,
            },
            "lb": {
                "minimum": 0.2,
                "maximum": 2204.6,
                "decimal_places": 1,
            },
        }
    },
    "heart_rate": {
        "unit": "bpm",
        "minimum": 20,
        "maximum": 300,
        "decimal_places": 0,
    },
    "blood_glucose": {
        "units": {
            "mg/dL": {
                "minimum": 1,
                "maximum": 2000,
                "decimal_places": 1,
            },
            "mmol/L": {
                "minimum": 0.1,
                "maximum": 111.1,
                "decimal_places": 1,
            },
        }
    },
    "total_cholesterol": {
        "units": {
            "mg/dL": {
                "minimum": 1,
                "maximum": 1500,
                "decimal_places": 1,
            },
            "mmol/L": {
                "minimum": 0.03,
                "maximum": 38.8,
                "decimal_places": 2,
            },
        }
    },
    "sleep_duration": {
        "unit": "hours",
        "minimum": 0,
        "maximum": 24,
        "decimal_places": 1,
    },
    "mood": {
        "unit": "scale",
        "minimum": 1,
        "maximum": 5,
        "decimal_places": 0,
    },
    "stress": {
        "unit": "scale",
        "minimum": 1,
        "maximum": 5,
        "decimal_places": 0,
    },
}

TEXT_METRIC_RULES = {
    "symptoms": {
        "maximum_length": 1000,
    }
}

MAX_NOTES_LENGTH = 1000


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