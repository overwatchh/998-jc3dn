#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# trigger-second-validity.sh
# Purpose: Manually force QR code id=9999 into its SECOND validity window so
#          that visiting /scan?qr_code_id=9999 shows the second check-in UI.
#
# Strategy:
#   1. End (deactivate) the first validity window (count=1) if it's still active
#   2. Create or refresh a second validity window (count=2) surrounding NOW()
#
# Result: The API logic checks for an active count=1 window first, then count=2.
#         By ensuring count=1 is NOT active and count=2 IS active, the API will
#         return validity_count = 2.
#
# Requirements:
#   * MySQL/MariaDB client available (uses MYSQL_CLIENT like db-init.sh, default 'mariadb')
#   * User has sufficient privileges on the target DB (defaults to qr_attendance_app)
#   * NO need to manually export env vars; sensible defaults mirror db-init.sh:
#         DB_USER (default root)
#         DB_HOST (default 127.0.0.1)
#         DB_PORT (default 3306)
#         DB_NAME (default qr_attendance_app)
#         DB_PASS (optional; if set, passed to client)
#
# Flags:
#   --qr-id <ID>   QR code id to modify (default 9999)
#   --duration-min <N>  (default 30) length of second window
#   --lookback-min <N>  (default 5) start window N minutes before now so it's active
#   -h | --help     Show this help text
#
# Typical usage:
#   ./scripts/trigger-second-validity.sh
#   MYSQL_CLIENT=mysql DB_USER=app ./scripts/trigger-second-validity.sh --qr-id 1234
# ---------------------------------------------------------------------------

MYSQL_CLIENT=${MYSQL_CLIENT:-mariadb}
DB_USER=${DB_USER:-root}
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-qr_attendance_app}

# Window config (kept configurable, but with defaults)
DURATION_MIN=30 # minutes ahead of now
LOOKBACK_MIN=5  # minutes behind now (ensures active immediately)
QR_ID=9999      # target QR code id

while [[ $# -gt 0 ]]; do
	case "$1" in
	--duration-min)
		DURATION_MIN="$2"
		shift 2
		;;
	--lookback-min)
		LOOKBACK_MIN="$2"
		shift 2
		;;
	--qr-id)
		QR_ID="$2"
		shift 2
		;;
	-h | --help)
		grep '^#' "$0" | sed 's/^# \{0,1\}//'
		exit 0
		;;
	*)
		echo "Unknown argument: $1" >&2
		exit 1
		;;
	esac
done

PASS_FLAG=""
if [[ -n "${DB_PASS:-}" ]]; then
	# Intentionally no space after -p (mysql|mariadb convention)
	PASS_FLAG="-p${DB_PASS}"
fi

echo "--- Triggering second validity window for QR code ${QR_ID} ---"
echo "Client: ${MYSQL_CLIENT}  DB: ${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "Window: start=NOW()-${LOOKBACK_MIN}m end=NOW()+${DURATION_MIN}m"

SQL=$(
	cat <<EOF
START TRANSACTION;
-- 1. Deactivate first validity (count=1) if currently active
UPDATE validity
SET end_time = (NOW() - INTERVAL 1 MINUTE)
WHERE qr_code_id = ${QR_ID}
  AND count = 1
  AND NOW() BETWEEN start_time AND end_time;

-- 2. Upsert second validity window (count=2) so it is active now
--    Window spans: NOW() - LOOKBACK  => NOW() + DURATION
INSERT INTO validity (qr_code_id, count, start_time, end_time)
VALUES (
  ${QR_ID},
  2,
  (NOW() - INTERVAL ${LOOKBACK_MIN} MINUTE),
  (NOW() + INTERVAL ${DURATION_MIN} MINUTE)
)
ON DUPLICATE KEY UPDATE
  start_time = VALUES(start_time),
  end_time   = VALUES(end_time);

COMMIT;

-- Show resulting rows for verification
SELECT id, qr_code_id, count, start_time, end_time
FROM validity
WHERE qr_code_id = ${QR_ID}
ORDER BY count ASC;
EOF
)

# Execute
set +e
RESULT=$("$MYSQL_CLIENT" -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" $PASS_FLAG "$DB_NAME" -N -e "$SQL" 2>&1)
STATUS=$?
set -e

if [[ $STATUS -ne 0 ]]; then
	echo "MySQL ERROR:" >&2
	echo "$RESULT" >&2
	exit $STATUS
fi

echo "$RESULT" | awk 'BEGIN {print "--- Updated validity windows ---"} {print}'

echo "SUCCESS: Second validity window is now active (count=2) for QR ${QR_ID}."
echo "Visit: /scan?qr_code_id=${QR_ID} to verify the UI shows the second window."
