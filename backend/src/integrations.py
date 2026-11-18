"""Integration boundary for connected-health providers (#202, part of #151).

Endpoints and pages talk to providers only through this module. Each provider is
declared once in PROVIDERS; provider-specific import code implements
IntegrationAdapter and is added in later issues.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Iterable, Optional, Protocol

from .models import IntegrationConnection, MeasurementType


@dataclass(frozen=True)
class ProviderDefinition:
    id: str
    name: str
    supported_types: tuple[MeasurementType, ...]
    limitations: str


@dataclass(frozen=True)
class RawMeasurement:
    """A value as an adapter read it, before normalization and storage."""

    measurement_type: MeasurementType
    value: float
    unit: str
    recorded_at: datetime
    source_record_id: Optional[str] = None


class IntegrationAdapter(Protocol):
    """Read-only access to one provider. Adapters never write to the provider."""

    provider_id: str

    def fetch_measurements(
        self,
        connection: IntegrationConnection,
        since: Optional[datetime] = None,
    ) -> Iterable[RawMeasurement]: ...


PROVIDERS: dict[str, ProviderDefinition] = {
    provider.id: provider
    for provider in (
        ProviderDefinition(
            id="apple_health",
            name="Apple Health",
            supported_types=(
                MeasurementType.heart_rate,
                MeasurementType.blood_pressure_systolic,
                MeasurementType.blood_pressure_diastolic,
                MeasurementType.body_weight,
                MeasurementType.blood_glucose,
                MeasurementType.steps,
            ),
            limitations=(
                "Apple Health has no web API. Data is imported from an export file "
                "you create on your iPhone, so it does not update automatically."
            ),
        ),
        ProviderDefinition(
            id="health_connect",
            name="Health Connect",
            supported_types=(
                MeasurementType.heart_rate,
                MeasurementType.blood_pressure_systolic,
                MeasurementType.blood_pressure_diastolic,
                MeasurementType.body_weight,
                MeasurementType.blood_glucose,
                MeasurementType.steps,
            ),
            limitations=(
                "Health Connect data stays on your Android device and is not "
                "available to web apps yet."
            ),
        ),
    )
}


def get_provider(provider_id: str) -> Optional[ProviderDefinition]:
    return PROVIDERS.get(provider_id)


def unsupported_types(
    provider: ProviderDefinition,
    requested: Iterable[MeasurementType],
) -> list[MeasurementType]:
    return [t for t in requested if t not in provider.supported_types]
