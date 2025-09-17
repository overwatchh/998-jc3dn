#!/bin/bash

# Test script to create QR code with geo validation enabled for testing location-based check-in

echo "Setting up test QR code with geo validation enabled..."

# Get current timestamp
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
echo "Current time: $CURRENT_TIME"

# Calculate times (adjust these as needed)
FIRST_START=$(date '+%Y-%m-%d %H:%M:%S')
FIRST_END=$(date -d '+3 minutes' '+%Y-%m-%d %H:%M:%S')
SECOND_START=$(date -d '+4 minutes' '+%Y-%m-%d %H:%M:%S')
SECOND_END=$(date -d '+10 minutes' '+%Y-%m-%d %H:%M:%S')

echo "First window: $FIRST_START to $FIRST_END"
echo "Second window: $SECOND_START to $SECOND_END"

# Update the existing QR code with geo validation enabled
mariadb -h localhost -u root -p qr_attendance_app << EOF
-- First, add a Sydney room if it doesn't exist
INSERT IGNORE INTO room (building_number, room_number, description, latitude, longitude, campus_id) VALUES
('1', '101', 'Sydney CBD Room', -34.406826, 150.878589, 2);

-- Get the Sydney room ID
SET @sydney_room_id = (SELECT id FROM room WHERE campus_id = 2 AND building_number = '1' AND room_number = '101' LIMIT 1);

-- Enable geo validation for QR code 9999 with Sydney location
UPDATE qr_code 
SET validate_geo = 1, valid_radius = 5000.00, valid_room_id = @sydney_room_id
WHERE id = 9999;

UPDATE room
SET latitude = -34.406826, longitude = 150.878589
WHERE id = @sydney_room_id;

-- Update existing validity windows for QR code 9999
UPDATE validity 
SET start_time = '$FIRST_START', end_time = '$FIRST_END' 
WHERE qr_code_id = 9999 AND count = 1;

UPDATE validity 
SET start_time = '$SECOND_START', end_time = '$SECOND_END' 
WHERE qr_code_id = 9999 AND count = 2;

-- Show updated QR code configuration
SELECT 
    qc.id as qr_code_id,
    qc.validate_geo,
    qc.valid_radius,
    qc.valid_room_id,
    r.building_number,
    r.room_number,
    r.latitude,
    r.longitude
FROM qr_code qc
LEFT JOIN room r ON r.id = qc.valid_room_id
WHERE qc.id = 9999;

-- Show updated validity windows
SELECT 
    qr_code_id,
    count,
    start_time,
    end_time,
    CASE 
        WHEN NOW() BETWEEN start_time AND end_time THEN 'ACTIVE'
        WHEN NOW() < start_time THEN 'FUTURE'
        ELSE 'EXPIRED'
    END as status
FROM validity 
WHERE qr_code_id = 9999 
ORDER BY count;
EOF
