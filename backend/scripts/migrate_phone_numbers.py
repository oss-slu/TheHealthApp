"""Safe phone number normalization migration and preflight verification tool.

Checks existing MongoDB user records for phone numbers that require normalization.
Detects collisions where two or more records would normalize to the same canonical phone number.
Exits non-zero with detailed collision report if any collisions exist, performing NO writes.
When no collisions exist:
- In dry-run mode (default, without --apply): reports records that would be updated, performs NO writes.
- In apply mode (--apply): updates non-canonical records to their canonical format safely.
"""

from __future__ import annotations

import argparse
import asyncio
import collections
import os
import sys
from pathlib import Path
from typing import Any, TextIO

from pymongo import AsyncMongoClient

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from src.models import normalize_phone


def _mongo_connection_string(mongo_url: str, db_name: str) -> str:
    url = mongo_url.rstrip("/")
    if "?" in url:
        base, qs = url.split("?", 1)
        return f"{base}/{db_name}?authSource=admin&{qs}"
    return f"{url}/{db_name}?authSource=admin"


async def run_phone_preflight_and_migration(
    database: Any,
    apply_changes: bool = False,
    stdout: TextIO = sys.stdout,
) -> tuple[bool, int, list[dict[str, Any]]]:
    """Execute preflight collision check and optional safe migration.

    Returns:
        (success: bool, updated_count: int, collisions: list[dict])
    """
    users_collection = database["users"]
    cursor = users_collection.find({"phone": {"$exists": True, "$ne": None}})
    records = await cursor.to_list(length=None)

    canonical_groups: dict[str, list[dict[str, Any]]] = collections.defaultdict(list)
    for record in records:
        raw_phone = record.get("phone")
        if raw_phone is None:
            continue
        canonical = normalize_phone(raw_phone)
        canonical_groups[canonical].append(record)

    collisions: list[dict[str, Any]] = []
    for canonical, group in canonical_groups.items():
        if len(group) > 1:
            collisions.append({
                "canonical": canonical,
                "count": len(group),
                "records": [
                    {
                        "id": str(rec.get("_id") or rec.get("id")),
                        "username": rec.get("username"),
                        "original_phone": rec.get("phone"),
                    }
                    for rec in group
                ],
            })

    if collisions:
        stdout.write("=" * 60 + "\n")
        stdout.write("ERROR: CANONICAL PHONE COLLISIONS DETECTED!\n")
        stdout.write("=" * 60 + "\n")
        stdout.write(
            f"Found {len(collisions)} canonical phone collision(s) across existing records.\n"
            "No database writes will be performed.\n"
            "Collisions must be resolved manually before normalization can proceed.\n\n"
        )
        for c in collisions:
            stdout.write(f"Canonical Phone: {c['canonical']} ({c['count']} accounts):\n")
            for r in c["records"]:
                stdout.write(
                    f"  - User ID: {r['id']}, Username: {r['username']}, Original: {r['original_phone']}\n"
                )
            stdout.write("\n")
        return False, 0, collisions

    # Identify records needing update
    needs_update = [
        rec for rec in records
        if rec.get("phone") is not None and rec.get("phone") != normalize_phone(rec.get("phone"))
    ]

    stdout.write("=" * 60 + "\n")
    stdout.write("PREFLIGHT CHECK PASSED: NO PHONE COLLISIONS FOUND\n")
    stdout.write("=" * 60 + "\n")
    stdout.write(f"Total user records scanned: {len(records)}\n")
    stdout.write(f"Records requiring normalization: {len(needs_update)}\n\n")

    if not needs_update:
        stdout.write("All phone numbers are already in canonical format. Nothing to do.\n")
        return True, 0, []

    if not apply_changes:
        stdout.write("DRY RUN MODE (no writes performed):\n")
        for rec in needs_update:
            rec_id = str(rec.get("_id") or rec.get("id"))
            orig = rec.get("phone")
            canon = normalize_phone(orig)
            stdout.write(f"  - User ID: {rec_id}, Username: {rec.get('username')}: '{orig}' -> '{canon}'\n")
        stdout.write("\nTo apply these updates to the database, run with: --apply\n")
        return True, len(needs_update), []

    stdout.write("APPLYING MIGRATION...\n")
    updated_count = 0
    for rec in needs_update:
        rec_id = rec["_id"]
        canonical = normalize_phone(rec["phone"])
        result = await users_collection.update_one(
            {"_id": rec_id},
            {"$set": {"phone": canonical}},
        )
        if result.modified_count > 0:
            updated_count += 1

    stdout.write(f"SUCCESS: Normalized {updated_count} phone number(s) in database.\n")
    return True, updated_count, []


async def main() -> int:
    parser = argparse.ArgumentParser(
        description="Preflight check and migration tool for user phone number normalization."
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Apply normalization updates to the database. Without this flag, runs in dry-run mode.",
    )
    parser.add_argument(
        "--mongo-url",
        default=os.getenv("MONGO_URL", "mongodb://localhost:27017"),
        help="MongoDB connection URL (default: from MONGO_URL env or mongodb://localhost:27017)",
    )
    parser.add_argument(
        "--db-name",
        default=os.getenv("MONGO_DB_NAME", "healthapp"),
        help="MongoDB database name (default: from MONGO_DB_NAME env or healthapp)",
    )

    args = parser.parse_args()

    connection_string = _mongo_connection_string(args.mongo_url, args.db_name)
    client = AsyncMongoClient(connection_string, uuidRepresentation="standard")
    try:
        database = client[args.db_name]
        success, _, _ = await run_phone_preflight_and_migration(
            database=database,
            apply_changes=args.apply,
        )
        return 0 if success else 1
    finally:
        await client.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
