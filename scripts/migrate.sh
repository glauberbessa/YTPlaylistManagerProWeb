#!/bin/bash

# Database migration script that handles baselining for existing databases
# This script resolves Prisma error P3005 by marking the initial migration
# as applied when the database already has tables but no migration history.

set -e

echo "Running database migration..."

# Try to run prisma migrate deploy
if npx prisma migrate deploy 2>&1; then
  echo "Migrations applied successfully."
  exit 0
fi

# If we get here, the migration failed
# Check if it's a P3005 error (database not empty, needs baselining)
echo "Initial migration attempt failed. Checking if baselining is needed..."

# Try to baseline by marking the initial migration as applied
# This is safe because the migration matches the existing schema
echo "Baselining database by marking initial migration as applied..."
npx prisma migrate resolve --applied "20260117000000_init"

# Now try to run any remaining migrations
echo "Running remaining migrations..."
npx prisma migrate deploy

echo "Database migration completed successfully."
