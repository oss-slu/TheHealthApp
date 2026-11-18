import io
import os
import uuid
from datetime import date, datetime, timezone

import pytest
from beanie import init_beanie
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError
from pymongo import AsyncMongoClient

os.environ["MONGO_DB_NAME"] = "healthapp_test"

from scripts.migrate_phone_numbers import run_phone_preflight_and_migration
from src.main import app, create_access_token
from src.models import (
    CURRENT_CONSENT_VERSION,
    GenderEnum,
    RevokedToken,
    User,
    UserCreate,
    UserUpdate,
    normalize_phone,
)


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def test_db():
    client = AsyncMongoClient("mongodb://localhost:27017", uuidRepresentation="standard")
    database = client["healthapp_test"]

    await init_beanie(
        database=database,
        document_models=[User, RevokedToken],
    )

    yield database

    await database.client.drop_database("healthapp_test")
    await client.close()


@pytest.fixture
def make_user():
    def _create_user(phone: str, username: str | None = None) -> User:
        u_name = username or f"user-{uuid.uuid4().hex[:8]}"
        return User(
            id=uuid.uuid4(),
            username=u_name,
            name="Test User",
            date_of_birth=date(1990, 1, 1),
            gender=GenderEnum.na,
            phone=phone,
            password_hash="test-password-hash",
            consent_given=True,
            data_usage=True,
            consent_version=CURRENT_CONSENT_VERSION,
            consent_timestamp=datetime.now(timezone.utc),
        )

    return _create_user


# =============================================================================
# 1. Shared normalize_phone unit tests
# =============================================================================

def test_normalize_phone_canonical_values_unchanged():
    assert normalize_phone("5551234567") == "5551234567"
    assert normalize_phone("+12345678901") == "+12345678901"


def test_normalize_phone_strips_whitespace():
    assert normalize_phone("  5551234567  ") == "5551234567"
    assert normalize_phone("   +12345678901   ") == "+12345678901"
    assert normalize_phone("\t+1 (234) 567-8901\n") == "+12345678901"


def test_normalize_phone_removes_formatting_characters():
    # Spaces, hyphens, parentheses, dots
    assert normalize_phone("+1 234-567-8901") == "+12345678901"
    assert normalize_phone("(555) 123-4567") == "5551234567"
    assert normalize_phone("  +1 (234) 567-8901  ") == "+12345678901"
    assert normalize_phone("555.123.4567") == "5551234567"
    assert normalize_phone("+44 20 7946 0958") == "+442079460958"
    assert normalize_phone("+81-3-1234-5678") == "+81312345678"


def test_normalize_phone_removes_middle_plus_characters():
    # Must not accidentally preserve '+' in the middle of a number
    assert normalize_phone("123+456+7890") == "1234567890"
    assert normalize_phone("+123+456+7890") == "+1234567890"
    assert normalize_phone("++12345678901") == "+12345678901"


def test_normalize_phone_leaves_non_string_values_unchanged():
    assert normalize_phone(1234567890) == 1234567890
    assert normalize_phone(None) is None
    assert normalize_phone(["5551234567"]) == ["5551234567"]
    assert normalize_phone({}) == {}


def test_normalize_phone_empty_and_blank_strings():
    assert normalize_phone("") == ""
    assert normalize_phone("   ") == ""


# =============================================================================
# 2. UserCreate Pydantic model validation tests
# =============================================================================

def test_user_create_normalizes_formatted_phone():
    payload = {
        "username": "alice",
        "name": "Alice User",
        "date_of_birth": date(1995, 5, 20),
        "gender": GenderEnum.female,
        "phone": "+1 (234) 567-8901",
        "password": "Password123",
    }
    user = UserCreate(**payload)
    assert user.phone == "+12345678901"


@pytest.mark.parametrize(
    "raw_phone,expected_canonical",
    [
        ("(555) 123-4567", "5551234567"),
        ("  +1 (234) 567-8901  ", "+12345678901"),
        ("555.123.4567", "5551234567"),
        ("+44 20 7946 0958", "+442079460958"),
        ("555-123-4567", "5551234567"),
        ("5551234567", "5551234567"),
        ("+12345678901", "+12345678901"),
    ],
)
def test_user_create_phone_formats(raw_phone, expected_canonical):
    user = UserCreate(
        username="testuser",
        name="Test User",
        date_of_birth=date(1995, 5, 20),
        gender=GenderEnum.other,
        phone=raw_phone,
        password="Password123",
    )
    assert user.phone == expected_canonical


@pytest.mark.parametrize(
    "invalid_phone",
    [
        "123-456",  # too few digits
        "1234567890123456",  # too many digits (16)
        "555-123-ABCD",  # invalid letters
        "phone-number",
        "",
        "   ",
        1234567890,  # non-string
        None,
    ],
)
def test_user_create_rejects_invalid_phones(invalid_phone):
    with pytest.raises(ValidationError):
        UserCreate(
            username="testuser",
            name="Test User",
            date_of_birth=date(1995, 5, 20),
            gender=GenderEnum.other,
            phone=invalid_phone,
            password="Password123",
        )


# =============================================================================
# 3. UserUpdate Pydantic model validation tests
# =============================================================================

def test_user_update_normalizes_formatted_phone():
    update = UserUpdate(phone="(555) 123-4567")
    assert update.phone == "5551234567"

    update_intl = UserUpdate(phone="  +1 (234) 567-8901  ")
    assert update_intl.phone == "+12345678901"

    update_dots = UserUpdate(phone="555.123.4567")
    assert update_dots.phone == "5551234567"


def test_user_update_omitted_or_none_phone():
    update_empty = UserUpdate()
    assert update_empty.phone is None

    update_none = UserUpdate(phone=None)
    assert update_none.phone is None


@pytest.mark.parametrize(
    "invalid_phone",
    [
        "123-456",  # too short
        "1234567890123456",  # too long
        "invalid-phone",
        1234567890,
    ],
)
def test_user_update_rejects_invalid_phones(invalid_phone):
    with pytest.raises(ValidationError):
        UserUpdate(phone=invalid_phone)


# =============================================================================
# 4. API Endpoints: Signup & Profile Update with duplicate handling
# =============================================================================

@pytest.mark.anyio
async def test_signup_stores_canonical_phone(test_db):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/auth/signup",
            json={
                "username": "newuser1",
                "name": "New User",
                "date_of_birth": "1995-05-20",
                "gender": "na",
                "phone": "+1 (234) 567-8901",
                "password": "Password123",
            },
        )
        assert res.status_code == 200
        data = res.json()["data"]["user"]
        assert data["phone"] == "+12345678901"

        # Verify stored in database as canonical
        stored_user = await User.find_one(User.username == "newuser1")
        assert stored_user is not None
        assert stored_user.phone == "+12345678901"


@pytest.mark.anyio
async def test_duplicate_signup_with_differently_formatted_phone(test_db, make_user):
    # Existing user in db has canonical phone
    user1 = make_user("5551234567", username="user1")
    await user1.insert()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Attempt signup with formatted version
        res = await client.post(
            "/api/v1/auth/signup",
            json={
                "username": "user2",
                "name": "User Two",
                "date_of_birth": "1995-05-20",
                "gender": "na",
                "phone": "  (555) 123-4567  ",
                "password": "Password123",
            },
        )
        assert res.status_code == 409
        err = res.json()["error"]
        assert err["code"] == "DUPLICATE_PHONE"
        assert "Phone number is already in use" in err["message"]


@pytest.mark.anyio
async def test_successful_profile_update_stores_canonical_phone(test_db, make_user):
    user = make_user("5551112222", username="updateuser")
    await user.insert()

    token = create_access_token(str(user.id))
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.patch(
            "/api/v1/users/me",
            headers=headers,
            json={"phone": "(555) 987-6543"},
        )
        assert res.status_code == 200
        updated_data = res.json()["data"]
        assert updated_data["phone"] == "5559876543"

        # Verify persistence
        reloaded = await User.get(user.id)
        assert reloaded.phone == "5559876543"


@pytest.mark.anyio
async def test_duplicate_profile_update_with_differently_formatted_phone(
    test_db, make_user
):
    user1 = make_user("5551234567", username="firstuser")
    await user1.insert()

    user2 = make_user("5559998888", username="seconduser")
    await user2.insert()

    token = create_access_token(str(user2.id))
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # user2 attempts to change their phone to user1's phone in formatted representation
        res = await client.patch(
            "/api/v1/users/me",
            headers=headers,
            json={"phone": " (555) 123-4567 "},
        )
        assert res.status_code == 409
        err = res.json()["error"]
        assert err["code"] == "DUPLICATE_PHONE"

        # Verify user2's phone remains unchanged
        reloaded = await User.get(user2.id)
        assert reloaded.phone == "5559998888"


@pytest.mark.anyio
async def test_profile_update_with_own_differently_formatted_phone(test_db, make_user):
    # Updating one's own phone with a formatted version of the SAME number should succeed
    user = make_user("5551234567", username="ownuser")
    await user.insert()

    token = create_access_token(str(user.id))
    headers = {"Authorization": f"Bearer {token}"}

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.patch(
            "/api/v1/users/me",
            headers=headers,
            json={"phone": "(555) 123-4567"},
        )
        assert res.status_code == 200
        assert res.json()["data"]["phone"] == "5551234567"


# =============================================================================
# 5. Migration script tests: collisions, dry-run, and application
# =============================================================================

@pytest.mark.anyio
async def test_migration_detects_collision_and_performs_no_writes(test_db):
    users_coll = test_db["users"]
    # Insert two records with different formats of the same canonical number
    id1 = uuid.uuid4()
    id2 = uuid.uuid4()
    await users_coll.insert_many([
        {
            "_id": id1,
            "username": "collision1",
            "name": "User 1",
            "phone": "(555) 123-4567",
        },
        {
            "_id": id2,
            "username": "collision2",
            "name": "User 2",
            "phone": "555-123-4567",
        },
    ])

    out = io.StringIO()
    success, updated, collisions = await run_phone_preflight_and_migration(
        database=test_db,
        apply_changes=True,
        stdout=out,
    )
    assert success is False
    assert updated == 0
    assert len(collisions) == 1
    assert collisions[0]["canonical"] == "5551234567"
    assert collisions[0]["count"] == 2

    # Verify no writes occurred
    doc1 = await users_coll.find_one({"_id": id1})
    doc2 = await users_coll.find_one({"_id": id2})
    assert doc1["phone"] == "(555) 123-4567"
    assert doc2["phone"] == "555-123-4567"


@pytest.mark.anyio
async def test_migration_dry_run_performs_no_writes(test_db):
    users_coll = test_db["users"]
    id1 = uuid.uuid4()
    await users_coll.insert_one({
        "_id": id1,
        "username": "dryrunuser",
        "name": "Dry Run User",
        "phone": "+1 (234) 567-8901",
    })

    out = io.StringIO()
    success, count, collisions = await run_phone_preflight_and_migration(
        database=test_db,
        apply_changes=False,
        stdout=out,
    )
    assert success is True
    assert count == 1
    assert len(collisions) == 0

    # Verify dry-run did not alter MongoDB document
    doc = await users_coll.find_one({"_id": id1})
    assert doc["phone"] == "+1 (234) 567-8901"


@pytest.mark.anyio
async def test_migration_apply_normalizes_records(test_db):
    users_coll = test_db["users"]
    id1 = uuid.uuid4()
    id2 = uuid.uuid4()
    await users_coll.insert_many([
        {
            "_id": id1,
            "username": "apply1",
            "name": "User 1",
            "phone": "(555) 123-4567",
        },
        {
            "_id": id2,
            "username": "apply2",
            "name": "User 2",
            "phone": "+1 (234) 567-8901",
        },
    ])

    out = io.StringIO()
    success, updated, collisions = await run_phone_preflight_and_migration(
        database=test_db,
        apply_changes=True,
        stdout=out,
    )
    assert success is True
    assert updated == 2
    assert len(collisions) == 0

    # Verify updates in MongoDB
    doc1 = await users_coll.find_one({"_id": id1})
    doc2 = await users_coll.find_one({"_id": id2})
    assert doc1["phone"] == "5551234567"
    assert doc2["phone"] == "+12345678901"
