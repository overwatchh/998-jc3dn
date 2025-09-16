#!/bin/bash

# Monitor script to check current validity window status

echo "🔍 Current Validity Window Status for QR Code 9999:"
echo "=================================================="

mariadb -h localhost -u root -p qr_attendance_app -e "
SELECT 
    count as 'Window',
    start_time as 'Start Time',
    end_time as 'End Time',
    CASE 
        WHEN NOW() BETWEEN start_time AND end_time THEN '🟢 ACTIVE'
        WHEN NOW() < start_time THEN '🟡 FUTURE'
        ELSE '🔴 EXPIRED'
    END as 'Status',
    TIMESTAMPDIFF(MINUTE, NOW(), start_time) as 'Minutes Until Start',
    TIMESTAMPDIFF(MINUTE, NOW(), end_time) as 'Minutes Until End'
FROM validity 
WHERE qr_code_id = 9999 
ORDER BY count;
"

echo ""
echo "📱 Check the app at: http://localhost:3000/scan?qr_code_id=9999"