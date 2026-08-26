#!/usr/bin/env bash
# Poll Postgres until it accepts connections (or timeout). Used by `npm
# start` and the db:up flow so the first `docker compose up` doesn't race
# the migration runner.
set -euo pipefail

DATABASE_URL="${DATABASE_URL:-postgresql://tervox:tervox_dev@localhost:5432/tervox_dev}"

# Strip a query string and translate to psql-style flags for pg_isready.
parse_url() {
  local url="$1"
  url="${url%%\?*}"
  local host port user db
  host="$(printf '%s' "$url" | sed -nE 's#.*://([^:/]+).*#\1#p')"
  port="$(printf '%s' "$url" | sed -nE 's#.*://[^:/]+:([0-9]+).*#\1#p')"
  if [ -z "$port" ]; then port=5432; fi
  user="$(printf '%s' "$url" | sed -nE 's#.*://[^:/]+:[^@]*@[^/]+/([^/]+)$#\1#p')"
  db="$(printf '%s' "$url" | sed -nE 's#.*://[^/]+/(.+)$#\1#p')"
  if [ -z "$host" ] || [ -z "$db" ]; then
    echo "could not parse DATABASE_URL='$DATABASE_URL'" >&2
    return 1
  fi
  echo "$host $port $user $db"
}

read -r HOST PORT USER DB < <(parse_url "$DATABASE_URL")

ATTEMPTS=30
SLEEP=1
for i in $(seq 1 "$ATTEMPTS"); do
  if pg_isready -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" >/dev/null 2>&1; then
    echo "postgres ready at $HOST:$PORT/$DB"
    exit 0
  fi
  sleep "$SLEEP"
done

echo "postgres not ready after $ATTEMPTS seconds" >&2
exit 1
