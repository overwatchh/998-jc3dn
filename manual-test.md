# Manual Test Plan: Lecturer and Student QR Generation/Check-in

## Lecturer: Generate and Manage QR Codes

- Preconditions: Login as lecturer with at least one course/session configured.

- Generate first QR for a session
  - Navigate to `/qr-generation`.
  - Select a course/session and week number.
  - Set room and radius; toggle geo validation on.
  - Configure time windows (entry/exit).
  - Click Generate. Expect toast success and a QR code appears.
  - Verify `dateLabel` shows the correct computed calendar date for the selected week/day.

- Update existing QR
  - With an existing QR for the session, change radius/validate geo/windows.
  - Click Update. Expect success and new validity windows.

- Week/day override and anchor
  - Generate QR for week N and later for week N+1.
  - Verify `dateLabel` changes according to `getQrDateForWeek()` and anchor logic (earliest QR in list).

- Real-time tracking
  - Navigate to Attendance Tracking.
  - Confirm a live session is detected when within a validity window.
  - Click through to real-time tracking and see active validity highlighted.

## Student: Scan and Check-in

- Preconditions: Login as student enrolled in the subject. A live QR exists.

- First check-in (in-person)
  - Navigate to `/scan?qr_code_id=<id>`.
  - Enable location and ensure location permission is granted.
  - Ensure you are within radius. Expect the primary button to enable.
  - Click Check-in; expect success and UI shows first check-in time.

- Second check-in (in-person)
  - After first validity ends and second begins, click Refresh.
  - If within radius, click Check-in again; expect success.

- Geo validation disabled
  - For a QR with `validate_geo = false`, ensure distance check is ignored and a default radius is applied.
  - Check-in should be allowed without accurate position.

- Online check-in path (if allowed)
  - Trigger online dialog, confirm, and ensure check-in recorded with type "Online".

- Already checked in
  - Attempt to check-in again in same validity; expect error/disabled.

- Error cases
  - Invalid/expired QR id: expect 404 message.
  - Not enrolled in subject: expect 403.
  - Out of radius with geo validation: expect disabled button or error.

## Reports and Analytics (Smoke)

- Day-of-week patterns
  - Navigate to analytics screen and select filters.
  - Verify loading skeleton then charts/empty state.

- Email attendance summary (if route enabled)
  - Trigger email sending; verify success response in UI logs.

## Notes

- Use browser devtools network tab to verify requests to `/api/student/attendance/checkin` and lecturer QR routes.
- For geolocation, use browser location overrides to simulate in/out of radius.
- Keep timestamps and week numbers consistent for predictable `getQrDateForWeek()` outputs.

