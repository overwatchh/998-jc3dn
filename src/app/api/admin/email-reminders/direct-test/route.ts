import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { headers } from "next/headers";
import { emailService } from "@/lib/services/emailService";

/**
 * Direct test endpoint for email reminders - creates a test scenario
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "lecturer") {
    return NextResponse.json(
      { message: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    console.log("🧪 TESTING EMAIL REMINDER SYSTEM");

    // Create a test partial attendance alert for your student account
    const testAlert = {
      student_id: "test-student-id",
      student_name: "Deepak Kumar Sunar",
      student_email: "sunard79@gmail.com", // Your student email
      subject_code: "MTS9307",
      subject_name: "Web server programming",
      week_number: 3,
      session_type: "lecture",
      attendance_percentage: 30,
      missing_windows: [2],
    };

    console.log("📧 Sending test email to:", testAlert.student_email);
    console.log("📚 Subject:", testAlert.subject_code, "-", testAlert.subject_name);
    console.log("📅 Week:", testAlert.week_number);

    // Send the email reminder
    const success = await emailService.sendPartialAttendanceReminder(testAlert);

    if (success) {
      console.log("✅ Email sent successfully!");
      return NextResponse.json({
        message: "Test email sent successfully",
        test_data: {
          student_name: testAlert.student_name,
          student_email: testAlert.student_email,
          subject: testAlert.subject_code,
          week: testAlert.week_number,
          attendance_percentage: testAlert.attendance_percentage,
        },
        status: "sent"
      });
    } else {
      console.log("❌ Email failed to send");
      return NextResponse.json(
        { message: "Failed to send test email" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("❌ Test email error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}