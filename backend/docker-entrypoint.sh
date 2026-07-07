#!/bin/sh
set -e

HOST="${POSTGRES_HOST:-db}"
PORT="${POSTGRES_PORT:-5432}"

echo "Waiting for PostgreSQL at ${HOST}:${PORT}..."
i=0
while ! nc -z "$HOST" "$PORT" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "PostgreSQL is not available after 60s" >&2
    exit 1
  fi
  sleep 1
done
echo "PostgreSQL is ready."

exec "$@"
