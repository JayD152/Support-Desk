#!/bin/sh
set -e

echo "Pushing database schema..."
npx prisma db push --skip-generate 2>&1 || {
  echo "ERROR: Failed to push database schema"
  exit 1
}
echo "Database schema ready."

exec "$@"
