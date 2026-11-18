# Phone Number Normalization: Preflight and Data Migration Guide

## Overview

Issue #163 enforces phone number normalization before schema validation and storage in MongoDB:
- Leading/trailing whitespace is stripped.
- Exactly one leading `+` is preserved when present for international numbers.
- Formatting characters (spaces, hyphens, parentheses, and dots) are removed.
- Canonical phone numbers are stored as digits (or leading `+` followed by digits).

Because MongoDB unique indexes evaluate exact stored strings, older un-normalized records (such as `"(555) 123-4567"` and `"5551234567"`) could potentially coexist in an existing database.

A preflight and migration script is provided at `backend/scripts/migrate_phone_numbers.py` to inspect existing records, detect collisions, and safely normalize existing phone numbers.

---

## 1. Backup Before Migration

Always take a MongoDB database dump before applying any schema or data migrations:

```bash
# Dump the healthapp database
mongodump --uri="mongodb://localhost:27017" --db=healthapp --out=/backup/healthapp_$(date +%Y%m%d_%H%M%S)
```

For dockerized MongoDB environments:

```bash
docker exec -t healthapp_mongo_db mongodump --db=healthapp --out=/data/backup_$(date +%Y%m%d_%H%M%S)
```

---

## 2. Preflight / Dry-Run Mode

By default, running the migration tool executes in **dry-run** mode. No writes are performed:

```bash
cd backend
python scripts/migrate_phone_numbers.py
```

Or from the repository root:

```bash
python backend/scripts/migrate_phone_numbers.py
```

You can customize the connection URL and database name via environment variables or flags:

```bash
python backend/scripts/migrate_phone_numbers.py --mongo-url="mongodb://localhost:27017" --db-name="healthapp"
```

### Dry-Run Output Example

```
============================================================
PREFLIGHT CHECK PASSED: NO PHONE COLLISIONS FOUND
============================================================
Total user records scanned: 142
Records requiring normalization: 3

DRY RUN MODE (no writes performed):
  - User ID: 507f1f77bcf86cd799439011, Username: jdoe: '(555) 123-4567' -> '5551234567'
  - User ID: 507f1f77bcf86cd799439012, Username: asmith: '+1 (234) 567-8901' -> '+12345678901'
  - User ID: 507f1f77bcf86cd799439013, Username: blee: '555.234.5678' -> '5552345678'

To apply these updates to the database, run with: --apply
```

---

## 3. Handling Collisions

If two or more existing accounts have phone numbers that would normalize to the same canonical value, the tool **fails fast, exits non-zero (code 1), and makes zero writes**:

```
============================================================
ERROR: CANONICAL PHONE COLLISIONS DETECTED!
============================================================
Found 1 canonical phone collision(s) across existing records.
No database writes will be performed.
Collisions must be resolved manually before normalization can proceed.

Canonical Phone: 5551234567 (2 accounts):
  - User ID: 507f1f77bcf86cd799439011, Username: jdoe, Original: (555) 123-4567
  - User ID: 507f1f77bcf86cd799439099, Username: jdoe2, Original: 555-123-4567
```

### Collision Resolution Procedure
1. Inspect the reported user IDs and usernames to identify duplicate or conflicting accounts.
2. Coordinate with account owners or support to determine which account retains the phone number, or update the conflicting account to an alternate valid number.
3. Once all collisions are resolved, re-run the dry-run check until `PREFLIGHT CHECK PASSED` is reported.

---

## 4. Applying the Migration

When the preflight check reports zero collisions, apply the migration by passing the `--apply` flag:

```bash
cd backend
python scripts/migrate_phone_numbers.py --apply
```

The script will update the non-canonical phone values in place, preserving existing MongoDB document IDs and all other user profile fields. The unique MongoDB index is never dropped or recreated blindly.

---

## 5. Rollback Procedure

If you need to roll back to the pre-migration state, restore from the backup taken in Step 1:

```bash
mongorestore --uri="mongodb://localhost:27017" --drop --db=healthapp /backup/healthapp_YYYYMMDD_HHMMSS/healthapp
```

For dockerized MongoDB environments:

```bash
docker exec -t healthapp_mongo_db mongorestore --drop --db=healthapp /data/backup_YYYYMMDD_HHMMSS/healthapp
```

The `--drop` option ensures collections are dropped before restoring from the backup, returning the data and index state to the exact pre-migration state.
