#!/bin/bash

# Debug script to test the second check-in API directly

echo "🔧 Testing Second Check-in API Call..."
echo "======================================"

# Get current user session info
echo "📱 Testing API call to /api/student/attendance/checkin"

# Make the API call with sample data
curl -X POST http://localhost:3000/api/student/attendance/checkin \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  -d '{
    "qr_code_id": 9999,
    "lat": -33.8688,
    "long": 151.2093,
    "checkin_type": "In-person"
  }' \
  -v

echo ""
echo ""
echo "💡 If you see a 401 Unauthorized, you need to:"
echo "1. Open browser developer tools"
echo "2. Go to Application > Cookies > localhost:3000"
echo "3. Copy the 'better-auth.session_token' value"
echo "4. Replace YOUR_SESSION_TOKEN in this script"
echo ""
echo "Or just check the browser console for errors while doing the second check-in."