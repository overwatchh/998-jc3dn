@echo off
echo Fixing SQL collation for XAMPP compatibility...
powershell -Command "(gc qr_attendance_app_dump.sql) -replace 'utf8mb4_0900_ai_ci', 'utf8mb4_general_ci' | Out-File -encoding ASCII qr_attendance_app_xampp.sql"
echo Fixed file saved as: qr_attendance_app_xampp.sql
pause