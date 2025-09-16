#!/bin/bash

# Quick test - set second window to be active now

echo "🚀 Setting second validity window to be active NOW..."

CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
PAST_TIME=$(date -d '-5 minutes' '+%Y-%m-%d %H:%M:%S')
FUTURE_TIME=$(date -d '+10 minutes' '+%Y-%m-%d %H:%M:%S')

mariadb -h localhost -u root -p qr_attendance_app << EOF
-- Set first window to past (already expired)
UPDATE validity 
SET start_time = '$PAST_TIME', end_time = '$PAST_TIME' 
WHERE qr_code_id = 9999 AND count = 1;

-- Set second window to be active now
UPDATE validity 
SET start_time = '$CURRENT_TIME', end_time = '$FUTURE_TIME' 
WHERE qr_code_id = 9999 AND count = 2;

-- Show current status
SELECT 
    count,
    start_time,
    end_time,
    CASE 
        WHEN NOW() BETWEEN start_time AND end_time THEN '🟢 ACTIVE'
        WHEN NOW() < start_time THEN '🟡 FUTURE'
        ELSE '🔴 EXPIRED'
    END as status
FROM validity 
WHERE qr_code_id = 9999 
ORDER BY count;
EOF

echo ""
echo "✅ Second window is now active!"
echo "📱 Go to: http://localhost:3000/scan?qr_code_id=9999"
echo "🔄 You should see the 'Second Check-in' screen"