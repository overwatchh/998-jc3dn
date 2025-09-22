#!/usr/bin/env bash
set -euo pipefail

# Optional: allow overriding client (mariadb or mysql). Default to mariadb.
MYSQL_CLIENT=${MYSQL_CLIENT:-mariadb}
USER=${DB_USER:-root}
HOST=${DB_HOST:-127.0.0.1}
PORT=${DB_PORT:-3306}

echo "Dropping database qr_attendance_app (if exists)..."
echo "DROP DATABASE IF EXISTS qr_attendance_app;" | "$MYSQL_CLIENT" -h "$HOST" -P "$PORT" -u "$USER"

echo "Creating schema..."
"$MYSQL_CLIENT" -h "$HOST" -P "$PORT" -u "$USER" <"$(dirname "$0")/../src/lib/server/db_schema/db_create.sql"

echo "Loading seed data..."
"$MYSQL_CLIENT" -h "$HOST" -P "$PORT" -u "$USER" <"$(dirname "$0")/../src/lib/server/db_schema/db_load.sql"

echo "Database initialization completed."
