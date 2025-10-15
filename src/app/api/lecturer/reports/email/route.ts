import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface SummaryData {
  subject_name: string;
  subject_code: string;
  total_students: string | number;
  total_weeks: string | number;
  total_checkins: string | number;
  average_attendance: string | number;
}

interface StudentData {
  student_name: string;
  student_email: string;
  subject_code: string;
  subject_name: string;
  total_weeks: string | number;
  weeks_attended: string | number;
  attendance_percentage: string | number;
  performance_category: string;
  trend: string;
}

interface ReportData {
  type: string;
  summary?: SummaryData[];
  students?: StudentData[];
  sessions?: unknown[];
  details?: unknown[];
  overview?: SummaryData[];
}

/**
 * @openapi
 * /api/lecturer/reports/email:
 *   post:
 *     summary: Send attendance report via email
 *     description: Generate and send comprehensive attendance reports to specified email address
 *     tags:
 *       - Reports
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [overview, student, session, detailed]
 *                 example: overview
 *               dateRange:
 *                 type: string
 *                 enum: [this_week, last_week, this_month, last_month, this_semester]
 *                 example: this_month
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "lecturer@university.edu"
 *               subjectIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Report sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Report sent successfully"
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "lecturer") {
      return NextResponse.json(
        { error: "Forbidden: Only lecturers can generate reports" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      reportType = "overview",
      dateRange = "this_month",
      email,
      subjectIds = [],
    } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    // Calculate date range based on selection
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    switch (dateRange) {
      case "this_week":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = startOfWeek;
        endDate = new Date(now);
        break;

      case "last_week":
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
        startDate = startOfLastWeek;
        endDate = new Date(startOfLastWeek);
        endDate.setDate(endDate.getDate() + 6);
        break;

      case "this_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
        break;

      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;

      case "this_semester":
        // Assuming semester starts in February (adjust as needed)
        const semesterStart =
          now.getMonth() >= 7
            ? new Date(now.getFullYear(), 7, 1)
            : new Date(now.getFullYear(), 1, 1);
        startDate = semesterStart;
        endDate = new Date(now);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid date range specified" },
          { status: 400 }
        );
    }

    // Generate report data
    const reportData = await generateReportData({
      lecturerId: session.user.id,
      reportType,
      startDate,
      endDate,
      subjectIds,
    });

    // Send email with report data using nodemailer
    await sendReportEmail({
      recipientEmail: email,
      lecturerName: session.user.name!,
      lecturerEmail: session.user.email!,
      reportType,
      dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      reportData,
    });

    return NextResponse.json({
      success: true,
      message: "Report sent successfully to " + email,
    });
  } catch (error) {
    console.error("Email report generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to send report email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function generateReportData({
  lecturerId,
  reportType,
  startDate,
  endDate,
  subjectIds,
}: {
  lecturerId: string;
  reportType: string;
  startDate: Date;
  endDate: Date;
  subjectIds: number[];
}) {
  const subjectFilter =
    subjectIds.length > 0
      ? `AND s.id IN (${subjectIds.map(() => "?").join(",")})`
      : "";

  const params = [
    startDate.toISOString().split("T")[0],
    endDate.toISOString().split("T")[0],
    lecturerId,
    ...subjectIds,
  ];

  switch (reportType) {
    case "overview":
      return await generateOverviewReport(params, subjectFilter);
    case "student":
      return await generateStudentReport(params, subjectFilter);
    case "session":
      return await generateSessionReport(params, subjectFilter);
    case "detailed":
      return await generateDetailedReport(params, subjectFilter);
    default:
      throw new Error("Invalid report type");
  }
}

async function generateOverviewReport(
  params: (string | number)[],
  subjectFilter: string
) {
  console.log("📊 DEBUG: generateOverviewReport params:", params);
  console.log("📊 DEBUG: subjectFilter:", subjectFilter);
  // Using EMAIL CALCULATOR METHOD: 2+ checkins = 100 points, 1 checkin = 50 points, 0 checkins = 0 points
  const summaryData = await rawQuery(
    `
    SELECT
      s.name as subject_name,
      s.code as subject_code,
      COUNT(DISTINCT e.student_id) as total_students,
      COUNT(DISTINCT qrss.id) as total_weeks,
      ROUND(
        COALESCE(
          (SUM(
            CASE
              WHEN checkin_counts.checkin_count >= 2 THEN 100
              WHEN checkin_counts.checkin_count = 1 THEN 50
              ELSE 0
            END
          ) / (COUNT(DISTINCT qrss.id) * COUNT(DISTINCT e.student_id) * 100)) * 100,
          0
        ),
        1
      ) as average_attendance
    FROM subject s
    JOIN subject_study_session sss ON s.id = sss.subject_id
    JOIN study_session ss ON sss.study_session_id = ss.id
    JOIN lecturer_study_session lss ON ss.id = lss.study_session_id
    JOIN qr_code_study_session qrss ON ss.id = qrss.study_session_id
    JOIN qr_code qr ON qrss.qr_code_id = qr.id
    JOIN enrolment e ON s.id = e.subject_id
    LEFT JOIN (
      SELECT
        qr_code_study_session_id,
        student_id,
        COUNT(*) as checkin_count
      FROM checkin
      WHERE DATE(checkin_time) BETWEEN ? AND ?
      GROUP BY qr_code_study_session_id, student_id
    ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                     AND checkin_counts.student_id = e.student_id
    WHERE lss.lecturer_id = ? ${subjectFilter}
    GROUP BY s.id, s.name, s.code
    HAVING COUNT(DISTINCT qrss.id) > 0
    ORDER BY average_attendance DESC
  `,
    params
  );

  console.log("📊 DEBUG: summaryData result:", summaryData);
  console.log(
    "📊 DEBUG: summaryData length:",
    Array.isArray(summaryData) ? summaryData.length : "not array"
  );

  // Ensure summaryData is always an array
  let summaryArray = [];
  if (Array.isArray(summaryData)) {
    summaryArray = summaryData;
  } else if (summaryData && typeof summaryData === "object") {
    // Single result, wrap in array
    summaryArray = [summaryData];
  }

  return {
    type: "overview",
    summary: summaryArray,
    generatedAt: new Date().toISOString(),
    dateRange: `${params[0]} to ${params[1]}`,
  };
}

async function generateStudentReport(
  params: (string | number)[],
  subjectFilter: string
) {
  // Using EMAIL CALCULATOR METHOD: 2+ checkins = 100 points, 1 checkin = 50 points, 0 checkins = 0 points
  const studentData = await rawQuery(
    `
    SELECT
      u.name as student_name,
      u.email as student_email,
      s.name as subject_name,
      s.code as subject_code,
      COUNT(DISTINCT qrss.id) as total_weeks,
      COUNT(DISTINCT CASE WHEN checkin_counts.checkin_count > 0 THEN qrss.id END) as attended_weeks,
      ROUND(
        COALESCE(
          (SUM(
            CASE
              WHEN checkin_counts.checkin_count >= 2 THEN 100
              WHEN checkin_counts.checkin_count = 1 THEN 50
              ELSE 0
            END
          ) / (COUNT(DISTINCT qrss.id) * 100)) * 100,
          0
        ),
        1
      ) as attendance_percentage
    FROM user u
    JOIN enrolment e ON u.id = e.student_id
    JOIN subject s ON e.subject_id = s.id
    JOIN subject_study_session sss ON s.id = sss.subject_id
    JOIN study_session ss ON sss.study_session_id = ss.id
    JOIN lecturer_study_session lss ON ss.id = lss.study_session_id
    JOIN qr_code_study_session qrss ON ss.id = qrss.study_session_id
    LEFT JOIN (
      SELECT
        qr_code_study_session_id,
        student_id,
        COUNT(*) as checkin_count
      FROM checkin
      WHERE DATE(checkin_time) BETWEEN ? AND ?
      GROUP BY qr_code_study_session_id, student_id
    ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                     AND checkin_counts.student_id = u.id
    WHERE lss.lecturer_id = ?
      AND u.role = 'student'
      ${subjectFilter}
    GROUP BY u.id, u.name, u.email, s.id, s.name, s.code
    HAVING COUNT(DISTINCT qrss.id) > 0
    ORDER BY s.name, attendance_percentage DESC
  `,
    params
  );

  // Ensure studentData is always an array
  let studentsArray = [];
  if (Array.isArray(studentData)) {
    studentsArray = studentData;
  } else if (studentData && typeof studentData === "object") {
    studentsArray = [studentData];
  }

  return {
    type: "student",
    students: studentsArray,
    generatedAt: new Date().toISOString(),
    dateRange: `${params[0]} to ${params[1]}`,
  };
}

async function generateSessionReport(
  params: (string | number)[],
  subjectFilter: string
) {
  // Using EMAIL CALCULATOR METHOD: 2+ checkins = 100 points, 1 checkin = 50 points, 0 checkins = 0 points
  const sessionData = await rawQuery(
    `
    SELECT
      s.name as subject_name,
      s.code as subject_code,
      ss.day_of_week,
      ss.start_time,
      ss.end_time,
      ss.type as session_type,
      qrss.week_number,
      COUNT(DISTINCT e.student_id) as enrolled_students,
      COUNT(DISTINCT CASE WHEN checkin_counts.checkin_count > 0 THEN e.student_id END) as present_students,
      ROUND(
        COALESCE(
          (SUM(
            CASE
              WHEN checkin_counts.checkin_count >= 2 THEN 100
              WHEN checkin_counts.checkin_count = 1 THEN 50
              ELSE 0
            END
          ) / (COUNT(DISTINCT e.student_id) * 100)) * 100,
          0
        ),
        1
      ) as attendance_rate
    FROM subject s
    JOIN subject_study_session sss ON s.id = sss.subject_id
    JOIN study_session ss ON sss.study_session_id = ss.id
    JOIN lecturer_study_session lss ON ss.id = lss.study_session_id
    JOIN qr_code_study_session qrss ON ss.id = qrss.study_session_id
    JOIN enrolment e ON s.id = e.subject_id
    LEFT JOIN (
      SELECT
        qr_code_study_session_id,
        student_id,
        COUNT(*) as checkin_count
      FROM checkin
      WHERE DATE(checkin_time) BETWEEN ? AND ?
      GROUP BY qr_code_study_session_id, student_id
    ) checkin_counts ON checkin_counts.qr_code_study_session_id = qrss.id
                     AND checkin_counts.student_id = e.student_id
    WHERE lss.lecturer_id = ? ${subjectFilter}
    GROUP BY s.id, s.name, s.code, ss.id, ss.day_of_week, ss.start_time, ss.end_time, ss.type, qrss.week_number, qrss.id
    HAVING COUNT(DISTINCT e.student_id) > 0
    ORDER BY s.name, qrss.week_number, ss.day_of_week
  `,
    params
  );

  // Ensure sessionData is always an array
  let sessionsArray = [];
  if (Array.isArray(sessionData)) {
    sessionsArray = sessionData;
  } else if (sessionData && typeof sessionData === "object") {
    sessionsArray = [sessionData];
  }

  return {
    type: "session",
    sessions: sessionsArray,
    generatedAt: new Date().toISOString(),
    dateRange: `${params[0]} to ${params[1]}`,
  };
}

async function generateDetailedReport(
  params: (string | number)[],
  subjectFilter: string
) {
  const overview = await generateOverviewReport(params, subjectFilter);
  const students = await generateStudentReport(params, subjectFilter);
  const sessions = await generateSessionReport(params, subjectFilter);

  return {
    type: "detailed",
    overview: overview.summary,
    students: students.students,
    sessions: sessions.sessions,
    generatedAt: new Date().toISOString(),
    dateRange: `${params[0]} to ${params[1]}`,
  };
}

interface ReportEmailData {
  recipientEmail: string;
  lecturerName: string;
  lecturerEmail: string;
  reportType: string;
  dateRange: string;
  reportData: ReportData;
}

async function sendReportEmail({
  recipientEmail,
  lecturerName,
  lecturerEmail: _lecturerEmail,
  reportType,
  dateRange,
  reportData,
}: ReportEmailData) {
  const reportTypeNames = {
    overview: "Overview Report",
    student: "Student Performance Report",
    session: "Session Analysis Report",
    detailed: "Detailed Attendance Report",
  };

  const reportTypeName =
    reportTypeNames[reportType as keyof typeof reportTypeNames] ||
    "Attendance Report";
  const subject = `📊 ${reportTypeName} - ${dateRange}`;

  const htmlContent = generateCompleteReportHtml(reportData, {
    lecturerName,
    reportTypeName,
    dateRange,
  });

  const textContent = generateReportEmailText({
    lecturerName,
    reportTypeName,
    dateRange,
    reportData,
  });

  // Use nodemailer for sending emails
  try {
    // Import nodemailer dynamically to avoid potential client-side issues
    const nodemailer = await import("nodemailer");

    // Configure email transporter
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify the connection
    await transporter.verify();

    const mailOptions = {
      from: `"${process.env.FROM_NAME || "QR Attendance System"}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    console.log("📧 Sending email report to:", recipientEmail);
    console.log("📊 Subject:", subject);
    console.log("📈 Data included:", {
      summaryCount: reportData.summary?.length || 0,
      studentsCount: reportData.students?.length || 0,
      sessionsCount: reportData.sessions?.length || 0,
    });

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", result.messageId);

    return result;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw new Error(
      `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

function generateCompleteReportHtml(
  reportData: ReportData,
  {
    lecturerName,
    reportTypeName,
    dateRange,
  }: {
    lecturerName: string;
    reportTypeName: string;
    dateRange: string;
  }
) {
  let reportContent = "";

  // Generate content based on report type
  if (reportData.type === "overview" && reportData.summary) {
    reportContent = generateOverviewHtml(reportData.summary);
  } else if (reportData.type === "student" && reportData.students) {
    reportContent = generateStudentHtml(reportData.students);
  } else if (reportData.type === "session" && reportData.sessions) {
    reportContent = generateSessionHtml(reportData.sessions);
  } else if (reportData.type === "detailed") {
    reportContent = generateDetailedHtml(reportData);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Report - ${reportTypeName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .report-info { background-color: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 20px; border-left: 4px solid #667eea; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th { background-color: #f5f5f5; font-weight: bold; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
    .table td { padding: 10px; border-bottom: 1px solid #eee; }
    .table tr:nth-child(even) { background-color: #f9f9f9; }
    .attendance-good { color: #22c55e; font-weight: bold; }
    .attendance-warning { color: #f59e0b; font-weight: bold; }
    .attendance-danger { color: #ef4444; font-weight: bold; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: 500; }
    .section-title { font-size: 18px; font-weight: bold; color: #374151; margin: 25px 0 15px 0; padding-bottom: 5px; border-bottom: 2px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 ${reportTypeName}</h1>
      <p>Date Range: ${dateRange}</p>
    </div>

    <div class="content">
      <div class="report-info">
        <strong>Generated by:</strong> ${lecturerName}<br>
        <strong>Generated on:</strong> ${new Date().toLocaleDateString("en-GB")} at ${new Date().toLocaleTimeString("en-GB")}
      </div>

      ${reportContent}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.BASE_URL || "http://localhost:3000"}/lecturer/analytics" class="button">View Live Analytics Dashboard</a>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated message from the QR Attendance System.</p>
      <p>If you have any questions about this report, please contact the system administrator.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateOverviewHtml(summary: SummaryData[]): string {
  if (!summary || summary.length === 0) {
    return `
      <div style="padding: 20px; background: #f8fafc; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="color: #374151; margin: 0 0 10px 0;">📊 No Analytics Data</h3>
        <p style="color: #6b7280; margin: 0;">
          No attendance records found for the selected period. This could mean:<br>
          • No sessions scheduled • Students haven't checked in • Different date range needed
        </p>
      </div>
    `;
  }

  // Calculate overall statistics
  const totalStudents = summary.reduce(
    (sum, s) => sum + (parseInt(String(s.total_students)) || 0),
    0
  );
  const avgAttendanceOverall =
    summary.length > 0
      ? summary.reduce(
          (sum, s) => sum + (parseFloat(String(s.average_attendance)) || 0),
          0
        ) / summary.length
      : 0;
  const subjectsAbove80 = summary.filter(
    s => (parseFloat(String(s.average_attendance)) || 0) >= 80
  ).length;
  const subjectsBelow70 = summary.filter(
    s => (parseFloat(String(s.average_attendance)) || 0) < 70
  ).length;

  // Brief Analytics Summary - More concise format
  const briefSummary = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: white;">📈 Quick Analytics Overview</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold;">${summary.length}</div>
          <div style="font-size: 13px; opacity: 0.9;">Subjects</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold;">${totalStudents}</div>
          <div style="font-size: 13px; opacity: 0.9;">Students</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold;">${avgAttendanceOverall.toFixed(1)}%</div>
          <div style="font-size: 13px; opacity: 0.9;">Avg Attendance</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold;">${subjectsAbove80}</div>
          <div style="font-size: 13px; opacity: 0.9;">Above 80%</div>
        </div>
      </div>
    </div>
  `;

  // Compact subject performance list
  const subjectsList = summary
    .map(subject => {
      const attendance = parseFloat(String(subject.average_attendance || "0"));
      const attendanceColor =
        attendance >= 80 ? "#22c55e" : attendance >= 70 ? "#f59e0b" : "#ef4444";
      const status = attendance >= 80 ? "✅" : attendance >= 70 ? "⚠️" : "❌";

      return `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin: 8px 0; background: #f8fafc; border-radius: 8px; border-left: 4px solid ${attendanceColor};">
        <div>
          <strong style="color: #374151;">${subject.subject_code}</strong>
          <div style="font-size: 13px; color: #6b7280;">${subject.total_students} students • ${subject.total_weeks} weeks</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 18px; font-weight: bold; color: ${attendanceColor};">${attendance.toFixed(1)}% ${status}</div>
        </div>
      </div>
    `;
    })
    .join("");

  return `
    ${briefSummary}

    ${
      subjectsBelow70 > 0
        ? `
    <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <h4 style="color: #dc2626; margin: 0 0 8px 0;">⚠️ ${subjectsBelow70} Subject${subjectsBelow70 > 1 ? "s" : ""} Need Attention</h4>
      <p style="margin: 0; color: #dc2626; font-size: 14px;">Attendance below 70% - consider improvement strategies</p>
    </div>
    `
        : ""
    }

    <div style="margin: 20px 0;">
      <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">📋 Subject Performance</h3>
      ${subjectsList}
    </div>

    ${
      avgAttendanceOverall >= 80
        ? `
    <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #16a34a; font-weight: 500;">🎉 Excellent overall performance! Keep up the great work.</p>
    </div>
    `
        : avgAttendanceOverall < 70
          ? `
    <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #dc2626; font-weight: 500;">📈 Focus on boosting attendance with engagement strategies.</p>
    </div>
    `
          : `
    <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #d97706; font-weight: 500;">👍 Good progress! A few improvements could reach excellence.</p>
    </div>
    `
    }
  `;
}

function generateStudentHtml(students: StudentData[]): string {
  if (!students || students.length === 0) {
    return "<p>No student data available for the selected period.</p>";
  }

  const tableRows = students
    .map(student => {
      const attendance = parseFloat(
        String(student.attendance_percentage || "0")
      );
      const attendanceClass =
        attendance >= 80
          ? "attendance-good"
          : attendance >= 70
            ? "attendance-warning"
            : "attendance-danger";
      return `
      <tr>
        <td>${student.student_name}</td>
        <td>${student.student_email}</td>
        <td>${student.subject_code} - ${student.subject_name}</td>
        <td style="text-align: center;" class="${attendanceClass}">${attendance.toFixed(1)}%</td>
      </tr>
    `;
    })
    .join("");

  return `
    <div class="section-title">Student Performance</div>
    <table class="table">
      <thead>
        <tr>
          <th>Student Name</th>
          <th>Email</th>
          <th>Subject</th>
          <th style="text-align: center;">Attendance</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
}

function generateSessionHtml(sessions: unknown[]): string {
  if (!sessions || sessions.length === 0) {
    return "<p>No session data available for the selected period.</p>";
  }

  const tableRows = sessions
    .map(session => {
      const attendanceRate = parseFloat(
        String((session as any).attendance_rate || "0")
      );
      const attendanceClass =
        attendanceRate >= 80
          ? "attendance-good"
          : attendanceRate >= 70
            ? "attendance-warning"
            : "attendance-danger";
      return `
      <tr>
        <td><strong>${(session as any).subject_code}</strong></td>
        <td>Week ${(session as any).week_number}</td>
        <td>${(session as any).day_of_week}</td>
        <td>${(session as any).start_time} - ${(session as any).end_time}</td>
        <td style="text-align: center;">${(session as any).present_students}/${(session as any).enrolled_students}</td>
        <td style="text-align: center;" class="${attendanceClass}">${attendanceRate.toFixed(1)}%</td>
      </tr>
    `;
    })
    .join("");

  return `
    <div class="section-title">Session Analysis</div>
    <table class="table">
      <thead>
        <tr>
          <th>Subject</th>
          <th>Week</th>
          <th>Day</th>
          <th>Time</th>
          <th style="text-align: center;">Present/Total</th>
          <th style="text-align: center;">Rate</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
}

function generateDetailedHtml(reportData: ReportData): string {
  let content = "";

  if (reportData.overview) {
    content += generateOverviewHtml(reportData.overview);
  }

  if (reportData.students) {
    content += generateStudentHtml(reportData.students);
  }

  if (reportData.sessions) {
    content += generateSessionHtml(reportData.sessions);
  }

  return content || "<p>No data available for the selected period.</p>";
}

function generateReportEmailText({
  lecturerName,
  reportTypeName,
  dateRange,
  reportData,
}: {
  lecturerName: string;
  reportTypeName: string;
  dateRange: string;
  reportData: ReportData;
}) {
  let detailedContent = "";

  if (reportData.type === "overview" && reportData.summary) {
    const totalSubjects = reportData.summary.length;
    const totalStudents = reportData.summary.reduce(
      (sum: number, s: SummaryData) =>
        sum + (parseInt(String(s.total_students)) || 0),
      0
    );
    const avgAttendance =
      totalSubjects > 0
        ? reportData.summary.reduce(
            (sum: number, s: SummaryData) =>
              sum + parseFloat(String(s.average_attendance) || "0"),
            0
          ) / totalSubjects
        : 0;
    const subjectsAbove80 = reportData.summary.filter(
      (s: SummaryData) => (parseFloat(String(s.average_attendance)) || 0) >= 80
    ).length;
    const subjectsBelow70 = reportData.summary.filter(
      (s: SummaryData) => (parseFloat(String(s.average_attendance)) || 0) < 70
    ).length;

    detailedContent = `
📊 ANALYTICS SUMMARY:
• ${totalSubjects} Subjects | ${totalStudents} Students | ${avgAttendance.toFixed(1)}% Overall
• ${subjectsAbove80}/${totalSubjects} subjects performing excellently (≥80%)
${subjectsBelow70 > 0 ? `• ⚠️  ${subjectsBelow70} subjects need attention (<70%)` : ""}

📋 SUBJECT PERFORMANCE:
${reportData.summary
  .map((subject: SummaryData) => {
    const attendance = parseFloat(String(subject.average_attendance || "0"));
    const status = attendance >= 80 ? "✅" : attendance >= 70 ? "⚠️" : "❌";
    return `${status} ${subject.subject_code}: ${attendance.toFixed(1)}% (${subject.total_students} students)`;
  })
  .join("\n")}

${
  avgAttendance >= 80
    ? "🎉 EXCELLENT performance across all subjects!"
    : avgAttendance < 70
      ? "📈 FOCUS needed on attendance improvement strategies."
      : "👍 GOOD progress - a few improvements could reach excellence."
}`;
  } else if (reportData.type === "student" && reportData.students) {
    const totalStudents = reportData.students.length;
    const studentsAbove80 = reportData.students.filter(
      (s: StudentData) =>
        (parseFloat(String(s.attendance_percentage)) || 0) >= 80
    ).length;
    const studentsBelow70 = reportData.students.filter(
      (s: StudentData) =>
        (parseFloat(String(s.attendance_percentage)) || 0) < 70
    ).length;

    detailedContent = `
STUDENT PERFORMANCE SUMMARY:
- Total Student Records: ${totalStudents}
- Students with ≥80% attendance: ${studentsAbove80}
- Students needing support (<70%): ${studentsBelow70}

TOP PERFORMERS:
${reportData.students
  .sort(
    (a: StudentData, b: StudentData) =>
      parseFloat(String(b.attendance_percentage) || "0") -
      parseFloat(String(a.attendance_percentage) || "0")
  )
  .slice(0, 5)
  .map(
    (student: StudentData) =>
      `- ${student.student_name}: ${parseFloat(String(student.attendance_percentage) || "0").toFixed(1)}%`
  )
  .join("\n")}`;
  } else if (reportData.type === "session" && reportData.sessions) {
    const totalSessions = reportData.sessions.length;
    const totalRate: number = (reportData.sessions as unknown[]).reduce(
      (sum: number, s: unknown) => {
        const rate = parseFloat(
          String(
            (s as { attendance_rate?: string | number })?.attendance_rate
          ) || "0"
        );
        return sum + (isNaN(rate) ? 0 : rate);
      },
      0
    ) as number;
    const avgSessionAttendance: number =
      totalSessions > 0 ? totalRate / totalSessions : 0;

    detailedContent = `
SESSION ANALYSIS SUMMARY:
- Total Sessions Analyzed: ${totalSessions}
- Average Session Attendance: ${avgSessionAttendance.toFixed(1)}%

RECENT SESSIONS:
${reportData.sessions
  ?.slice(0, 10)
  .map((session: unknown) => {
    const rate = parseFloat(String((session as any).attendance_rate || "0"));
    return `- ${(session as any).subject_code} Week ${(session as any).week_number}: ${(session as any).present_students}/${(session as any).enrolled_students} (${rate.toFixed(1)}%)`;
  })
  .join("\n")}`;
  }

  return `
ATTENDANCE REPORT - ${reportTypeName.toUpperCase()}

Hello ${lecturerName},

Your requested attendance report has been generated successfully.

REPORT DETAILS:
- Report Type: ${reportTypeName}
- Date Range: ${dateRange}
- Generated By: ${lecturerName}
- Generated On: ${new Date().toLocaleDateString("en-GB")} at ${new Date().toLocaleTimeString("en-GB")}

${detailedContent}

QUICK ACCESS:
📊 View Live Analytics Dashboard: ${process.env.BASE_URL || "http://localhost:3000"}/lecturer/analytics
📧 This report includes detailed charts and visualizations in the HTML version

NEXT STEPS:
${
  reportData.type === "overview" && reportData.summary
    ? reportData.summary.some(
        (s: SummaryData) => (parseFloat(String(s.average_attendance)) || 0) < 70
      )
      ? "• Review subjects with low attendance and consider intervention strategies\n• Monitor student engagement and participation\n• Consider additional support for struggling subjects"
      : "• Continue monitoring attendance trends\n• Maintain current engagement strategies\n• Celebrate good attendance with students"
    : "• Review the detailed analytics for actionable insights\n• Consider scheduling follow-up discussions with relevant stakeholders"
}

Best regards,
QR Attendance System

---
This automated report helps you track and improve student attendance.
For technical support or questions, please contact your system administrator.
  `.trim();
}
