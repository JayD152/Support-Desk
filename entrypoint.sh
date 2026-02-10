#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --skip-generate 2>/dev/null || echo "DB push skipped"

exec "$@"
