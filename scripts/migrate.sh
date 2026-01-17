#!/bin/bash

# Database migration script that handles baselining for existing databases
# This script resolves Prisma error P3005 by marking the initial migration
# as applied when the database already has tables but no migration history.

echo "Running database migration..."

# Capture output and exit code from prisma migrate deploy
set +e
MIGRATE_OUTPUT=$(npx prisma migrate deploy 2>&1)
MIGRATE_EXIT_CODE=$?
set -e

echo "$MIGRATE_OUTPUT"

if [ $MIGRATE_EXIT_CODE -eq 0 ]; then
  echo "Migrations applied successfully."
  exit 0
fi

# Check if the error is P3005 (database not empty, needs baselining)
if echo "$MIGRATE_OUTPUT" | grep -q "P3005"; then
  echo ""
  echo "Detected P3005 error: Database schema is not empty but has no migration history."
  echo "Baselining database by marking initial migration as applied..."
  npx prisma migrate resolve --applied "20260117000000_init"

  echo "Running remaining migrations..."
  npx prisma migrate deploy

  echo "Database migration completed successfully."
  exit 0
fi

# Check if this is a migration already applied error (not a real failure)
if echo "$MIGRATE_OUTPUT" | grep -q "already been applied"; then
  echo "All migrations have already been applied."
  exit 0
fi

# Check if tables don't exist - this means we need to create them, not baseline
if echo "$MIGRATE_OUTPUT" | grep -q "does not exist"; then
  echo ""
  echo "Database tables don't exist. Attempting to create schema..."
  # Use db push to create tables when migrations can't be applied
  npx prisma db push --accept-data-loss

  # Mark the migration as applied so future deploys work correctly
  echo "Marking initial migration as applied..."
  npx prisma migrate resolve --applied "20260117000000_init"

  echo "Database schema created successfully."
  exit 0
fi

# For any other error, fail with the original error message
echo ""
echo "Migration failed with unexpected error. Exit code: $MIGRATE_EXIT_CODE"
exit $MIGRATE_EXIT_CODE
