#!/usr/bin/env bash
# Drop + recreate the dev database, re-apply migrations, re-seed.
# Local-only convenience script — never invoked in production.
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgresql://tervox:tervox_dev@localhost:5432/tervox_dev}"

url_no_query="${DATABASE_URL%%\?*}"
HOST="$(printf '%s' "$url_no_query" | sed -nE 's#.*://[^@]*@([^:/]+).*#\1#p')"
PORT="$(printf '%s' "$url_no_query" | sed -nE 's#.*://[^@]*@[^:/]+:([0-9]+).*#\1#p')"
if [ -z "$PORT" ]; then PORT=5432; fi
USER="$(printf '%s' "$url_no_query" | sed -nE 's#.*://([^:]+):.*#\1#p')"
DB="$(printf '%s' "$url_no_query" | sed -nE 's#.*://[^/]+/(.+)#\1#p')"

if [ -z "$HOST" ] || [ -z "$DB" ] || [ -z "$USER" ]; then
  echo "could not parse DATABASE_URL='$DATABASE_URL'" >&2
  exit 1
fi

echo "dropping $DB on $HOST:$PORT..."
PSQL_URL="postgresql://$USER@$HOST:$PORT/postgres"
psql "$PSQL_URL" -c "DROP DATABASE IF EXISTS \"$DB\"" >/dev/null
psql "$PSQL_URL" -c "CREATE DATABASE \"$DB\"" >/dev/null

echo "running migrations..."
npx drizzle-kit migrate

echo "seeding..."
npx tsx src/db/seed.ts
