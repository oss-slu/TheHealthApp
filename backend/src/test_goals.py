import uuid
from datetime import datetime, timedelta
import pytest
from pydantic import ValidationError

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.models import (
    GoalCreate,
    GoalResponse,
    GoalTypeEnum,
    GoalFrequencyEnum,
)


def test_goal_create_valid():
    """Valid goal creation succeeds with required fields."""
    start = datetime.utcnow()
    end = start + timedelta(days=30)
    goal = GoalCreate(
        title="Walk 10,000 steps daily",
        goal_type=GoalTypeEnum.steps,
        target_value=10000.0,
        unit="steps",
        frequency=GoalFrequencyEnum.daily,
        start_date=start,
        end_date=end,
    )
    assert goal.title == "Walk 10,000 steps daily"
    assert goal.target_value == 10000.0
    assert goal.frequency == GoalFrequencyEnum.daily
    assert goal.goal_type == GoalTypeEnum.steps


def test_goal_create_invalid_dates_rejected():
    """end_date earlier than start_date must fail validation."""
    start = datetime.utcnow()
    end = start - timedelta(days=1)
    with pytest.raises(ValidationError) as exc_info:
        GoalCreate(
            title="Invalid date goal",
            goal_type=GoalTypeEnum.water,
            target_value=2000.0,
            unit="ml",
            frequency=GoalFrequencyEnum.daily,
            start_date=start,
            end_date=end,
        )
    assert "end_date must be greater than or equal to start_date" in str(exc_info.value)


def test_goal_create_invalid_target_rejected():
    """target_value must be strictly positive (> 0)."""
    with pytest.raises(ValidationError):
        GoalCreate(
            title="Zero target",
            goal_type=GoalTypeEnum.sleep,
            target_value=0.0,
            unit="hours",
            frequency=GoalFrequencyEnum.daily,
        )


def test_goal_response_progress_and_completion():
    """Progress percentage and completion flag calculate accurately."""
    start = datetime.utcnow()
    # 50% 진행 상태 검증
    resp_half = GoalResponse(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        title="Drink water",
        goal_type=GoalTypeEnum.water,
        target_value=2000.0,
        unit="ml",
        frequency=GoalFrequencyEnum.daily,
        start_date=start,
        current_value=1000.0,
        created_at=start,
        updated_at=start,
    )
    assert resp_half.progress_percentage == 50.0
    assert resp_half.is_completed is False

    # 100% 완료 상태 검증
    resp_full = GoalResponse(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        title="Drink water",
        goal_type=GoalTypeEnum.water,
        target_value=2000.0,
        unit="ml",
        frequency=GoalFrequencyEnum.daily,
        start_date=start,
        current_value=2500.0,
        created_at=start,
        updated_at=start,
    )
    assert resp_full.progress_percentage == 100.0
    assert resp_full.is_completed is True