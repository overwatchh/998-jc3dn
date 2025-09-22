import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { emailService } from "@/lib/server/email";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
      reportType = 'overview',
      dateRange = 'this_month',
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
      case 'this_week':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = startOfWeek;
        endDate = new Date(now);
        break;

      case 'last_week':
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
        startDate = startOfLastWeek;
        endDate = new Date(startOfLastWeek);
        endDate.setDate(endDate.getDate() + 6);
        break;

      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now);
        break;

      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;

      case 'this_semester':
        // Assuming semester starts in February (adjust as needed)
        const semesterStart = now.getMonth() >= 7 ? new Date(now.getFullYear(), 7, 1) : new Date(now.getFullYear(), 1, 1);
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
      subjectIds
    });

    // Send email with report data
    await sendReportEmail({
      recipientEmail: email,
      lecturerName: session.user.name!,
      lecturerEmail: session.user.email!,
      reportType,
      dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      reportData
    });

    return NextResponse.json({
      success: true,
      message: "Report sent successfully to " + email
    });

  } catch (error) {
    console.error('Email report generation error:', error);
    return NextResponse.json({
      error: 'Failed to send report email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function generateReportData({
  lecturerId,
  reportType,
  startDate,
  endDate,
  subjectIds
}: {
  lecturerId: string;
  reportType: string;
  startDate: Date;
  endDate: Date;
  subjectIds: number[];
}) {
  const subjectFilter = subjectIds.length > 0
    ? `AND s.id IN (${subjectIds.map(() => '?').join(',')})`
    : '';

  const params = [
    lecturerId,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    ...subjectIds
  ];

  switch (reportType) {
    case 'overview':
      return await generateOverviewReport(params, subjectFilter);
    case 'student':
      return await generateStudentReport(params, subjectFilter);
    case 'session':
      return await generateSessionReport(params, subjectFilter);
    case 'detailed':
      return await generateDetailedReport(params, subjectFilter);
    default:
      throw new Error('Invalid report type');
  }
}

async function generateOverviewReport(params: any[], subjectFilter: string) {
  const [summaryData] = await rawQuery(`
    SELECT
      s.name as subject_name,
      s.code as subject_code,
      COUNT(DISTINCT e.student_id) as total_students,
      COUNT(DISTINCT qrss.week_number) as total_weeks,
      COUNT(DISTINCT c.student_id) as total_checkins,
      ROUND(
        (COUNT(DISTINCT c.student_id) /
         (COUNT(DISTINCT e.student_id) * COUNT(DISTINCT qrss.week_number))) * 100,
        1
      ) as average_attendance
    FROM subject s
    JOIN subject_study_session sss ON s.id = sss.subject_id
    JOIN study_session ss ON sss.study_session_id = ss.id
    JOIN lecturer_study_session lss ON ss.id = lss.study_session_id
    JOIN qr_code_study_session qrss ON ss.id = qrss.study_session_id
    JOIN qr_code qr ON qrss.qr_code_id = qr.id
    JOIN enrolment e ON s.id = e.subject_id
    LEFT JOIN checkin c ON qrss.id = c.qr_code_study_session_id
                       AND c.student_id = e.student_id
                       AND DATE(c.checkin_time) BETWEEN ? AND ?
    WHERE lss.lecturer_id = ? ${subjectFilter}
    GROUP BY s.id, s.name, s.code
    ORDER BY average_attendance DESC
  `, params);

  return {
    type: 'overview',
    summary: Array.isArray(summaryData) ? summaryData : [],
    generatedAt: new Date().toISOString(),
    dateRange: `${params[1]} to ${params[2]}`
  };
}

async function generateStudentReport(params: any[], subjectFilter: string) {
  const [studentData] = await rawQuery(`
    SELECT
      u.name as student_name,
      u.email as student_email,
      s.name as subject_name,
      s.code as subject_code,
      COUNT(DISTINCT qrss.week_number) as total_weeks,
      COUNT(DISTINCT c.student_id) as attended_weeks,
      ROUND(
        (COUNT(DISTINCT c.student_id) / COUNT(DISTINCT qrss.week_number)) * 100,
        1
      ) as attendance_percentage
    FROM user u
    JOIN enrolment e ON u.id = e.student_id
    JOIN subject s ON e.subject_id = s.id
    JOIN subject_study_session sss ON s.id = sss.subject_id
    JOIN study_session ss ON sss.study_session_id = ss.id
    JOIN lecturer_study_session lss ON ss.id = lss.study_session_id
    JOIN qr_code_study_session qrss ON ss.id = qrss.study_session_id
    LEFT JOIN checkin c ON qrss.id = c.qr_code_study_session_id
                       AND c.student_id = u.id
                       AND DATE(c.checkin_time) BETWEEN ? AND ?
    WHERE lss.lecturer_id = ?
      AND u.role = 'student'
      ${subjectFilter}
    GROUP BY u.id, u.name, u.email, s.id, s.name, s.code
    ORDER BY s.name, attendance_percentage DESC
  `, params);

  return {
    type: 'student',
    students: Array.isArray(studentData) ? studentData : [],
    generatedAt: new Date().toISOString(),
    dateRange: `${params[1]} to ${params[2]}`
  };
}

async function generateSessionReport(params: any[], subjectFilter: string) {
  const [sessionData] = await rawQuery(`
    SELECT
      s.name as subject_name,
      s.code as subject_code,
      ss.day_of_week,
      ss.start_time,
      ss.end_time,
      ss.type as session_type,
      qrss.week_number,
      COUNT(DISTINCT e.student_id) as enrolled_students,
      COUNT(DISTINCT c.student_id) as present_students,
      ROUND(
        (COUNT(DISTINCT c.student_id) / COUNT(DISTINCT e.student_id)) * 100,
        1
      ) as attendance_rate
    FROM subject s
    JOIN subject_study_session sss ON s.id = sss.subject_id
    JOIN study_session ss ON sss.study_session_id = ss.id
    JOIN lecturer_study_session lss ON ss.id = lss.study_session_id
    JOIN qr_code_study_session qrss ON ss.id = qrss.study_session_id
    JOIN enrolment e ON s.id = e.subject_id
    LEFT JOIN checkin c ON qrss.id = c.qr_code_study_session_id
                       AND c.student_id = e.student_id
                       AND DATE(c.checkin_time) BETWEEN ? AND ?
    WHERE lss.lecturer_id = ? ${subjectFilter}
    GROUP BY s.id, ss.id, qrss.week_number
    ORDER BY s.name, qrss.week_number, ss.day_of_week
  `, params);

  return {
    type: 'session',
    sessions: Array.isArray(sessionData) ? sessionData : [],
    generatedAt: new Date().toISOString(),
    dateRange: `${params[1]} to ${params[2]}`
  };
}

async function generateDetailedReport(params: any[], subjectFilter: string) {
  const overview = await generateOverviewReport(params, subjectFilter);
  const students = await generateStudentReport(params, subjectFilter);
  const sessions = await generateSessionReport(params, subjectFilter);

  return {
    type: 'detailed',
    overview: overview.summary,
    students: students.students,
    sessions: sessions.sessions,
    generatedAt: new Date().toISOString(),
    dateRange: `${params[1]} to ${params[2]}`
  };
}

interface ReportEmailData {
  recipientEmail: string;
  lecturerName: string;
  lecturerEmail: string;
  reportType: string;
  dateRange: string;
  reportData: any;
}

async function sendReportEmail({
  recipientEmail,
  lecturerName,
  lecturerEmail,
  reportType,
  dateRange,
  reportData
}: ReportEmailData) {
  // Initialize email service with environment variables
  emailService.initialize({
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER || '',
    fromName: process.env.FROM_NAME || 'QR Attendance System'
  });

  const reportTypeNames = {
    overview: 'Overview Report',
    student: 'Student Performance Report',
    session: 'Session Analysis Report',
    detailed: 'Detailed Attendance Report'
  };

  const reportTypeName = reportTypeNames[reportType as keyof typeof reportTypeNames] || 'Attendance Report';
  const subject = `📊 ${reportTypeName} - ${dateRange}`;

  const htmlContent = generateCompleteReportHtml(reportData, {
    lecturerName,
    reportTypeName,
    dateRange
  });

  const textContent = generateReportEmailText({
    lecturerName,
    reportTypeName,
    dateRange,
    reportData
  });

  // Use the existing email service's transporter directly
  if (!emailService['transporter']) {
    throw new Error('Email service not properly initialized');
  }

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'QR Attendance System'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  try {
    await emailService['transporter'].sendMail(mailOptions);
    console.log(`Report email sent to ${recipientEmail} - ${reportTypeName}`);
  } catch (error) {
    console.error(`Failed to send report email to ${recipientEmail}:`, error);
    throw error;
  }
}

function generateCompleteReportHtml(reportData: any, {
  lecturerName,
  reportTypeName,
  dateRange
}: {
  lecturerName: string;
  reportTypeName: string;
  dateRange: string;
}) {
  let reportContent = '';

  // Generate content based on report type
  if (reportData.type === 'overview' && reportData.summary) {
    reportContent = generateOverviewHtml(reportData.summary);
  } else if (reportData.type === 'student' && reportData.students) {
    reportContent = generateStudentHtml(reportData.students);
  } else if (reportData.type === 'session' && reportData.sessions) {
    reportContent = generateSessionHtml(reportData.sessions);
  } else if (reportData.type === 'detailed') {
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
        <strong>Generated on:</strong> ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}
      </div>

      ${reportContent}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.BASE_URL || 'http://localhost:3000'}/lecturer/analytics" class="button">View Live Analytics Dashboard</a>
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

function generateOverviewHtml(summary: any[]): string {
  if (!summary || summary.length === 0) {
    return '<p>No data available for the selected period.</p>';
  }

  // Calculate overall statistics
  const totalStudents = summary.reduce((sum, s) => sum + (parseInt(s.total_students) || 0), 0);
  const avgAttendanceOverall = summary.length > 0
    ? summary.reduce((sum, s) => sum + (parseFloat(s.average_attendance) || 0), 0) / summary.length
    : 0;
  const subjectsAbove80 = summary.filter(s => (parseFloat(s.average_attendance) || 0) >= 80).length;
  const subjectsBelow70 = summary.filter(s => (parseFloat(s.average_attendance) || 0) < 70).length;

  const statsCards = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 20px 0;">
      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #0369a1;">${summary.length}</div>
        <div style="font-size: 12px; color: #0369a1; text-transform: uppercase;">Total Subjects</div>
      </div>
      <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${totalStudents}</div>
        <div style="font-size: 12px; color: #16a34a; text-transform: uppercase;">Total Students</div>
      </div>
      <div style="background: ${avgAttendanceOverall >= 80 ? '#f0fdf4' : avgAttendanceOverall >= 70 ? '#fffbeb' : '#fef2f2'}; border: 1px solid ${avgAttendanceOverall >= 80 ? '#22c55e' : avgAttendanceOverall >= 70 ? '#f59e0b' : '#ef4444'}; border-radius: 8px; padding: 15px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: ${avgAttendanceOverall >= 80 ? '#16a34a' : avgAttendanceOverall >= 70 ? '#d97706' : '#dc2626'};">${avgAttendanceOverall.toFixed(1)}%</div>
        <div style="font-size: 12px; color: ${avgAttendanceOverall >= 80 ? '#16a34a' : avgAttendanceOverall >= 70 ? '#d97706' : '#dc2626'}; text-transform: uppercase;">Overall Average</div>
      </div>
      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; text-align: center;">
        <div style="font-size: 24px; font-weight: bold; color: #0369a1;">${subjectsAbove80}/${summary.length}</div>
        <div style="font-size: 12px; color: #0369a1; text-transform: uppercase;">Above 80%</div>
      </div>
    </div>
  `;

  const tableRows = summary.map(subject => {
    const attendance = parseFloat(subject.average_attendance || '0');
    const attendanceClass = attendance >= 80 ? 'attendance-good' :
                           attendance >= 70 ? 'attendance-warning' :
                           'attendance-danger';
    const attendanceColor = attendance >= 80 ? '#22c55e' : attendance >= 70 ? '#f59e0b' : '#ef4444';

    return `
      <tr>
        <td><strong>${subject.subject_code}</strong></td>
        <td>${subject.subject_name}</td>
        <td style="text-align: center;">${subject.total_students}</td>
        <td style="text-align: center;">${subject.total_weeks}</td>
        <td style="text-align: center; color: ${attendanceColor}; font-weight: bold;">${attendance.toFixed(1)}%</td>
        <td style="text-align: center;">
          <div style="width: 100%; background: #e5e7eb; border-radius: 4px; height: 8px;">
            <div style="width: ${Math.min(attendance, 100)}%; background: ${attendanceColor}; border-radius: 4px; height: 8px;"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="section-title">📊 Key Performance Metrics</div>
    ${statsCards}

    ${subjectsBelow70 > 0 ? `
    <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <h4 style="color: #dc2626; margin: 0 0 10px 0;">⚠️ Attention Required</h4>
      <p style="margin: 0; color: #dc2626;">${subjectsBelow70} subject(s) have attendance below 70%. Consider implementing attendance improvement strategies.</p>
    </div>
    ` : ''}

    <div class="section-title">📋 Subject Performance Details</div>
    <table class="table">
      <thead>
        <tr>
          <th>Subject Code</th>
          <th>Subject Name</th>
          <th style="text-align: center;">Students</th>
          <th style="text-align: center;">Weeks</th>
          <th style="text-align: center;">Attendance</th>
          <th style="text-align: center;">Progress</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #667eea;">
      <h4 style="margin: 0 0 10px 0; color: #374151;">📈 Performance Insights</h4>
      <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
        <li><strong>${subjectsAbove80}</strong> out of <strong>${summary.length}</strong> subjects maintain excellent attendance (≥80%)</li>
        <li>Total student enrollment across all subjects: <strong>${totalStudents}</strong></li>
        <li>Overall attendance average: <strong>${avgAttendanceOverall.toFixed(1)}%</strong></li>
        ${avgAttendanceOverall < 75 ? '<li style="color: #dc2626;"><strong>Recommendation:</strong> Consider implementing attendance improvement initiatives</li>' : ''}
      </ul>
    </div>
  `;
}

function generateStudentHtml(students: any[]): string {
  if (!students || students.length === 0) {
    return '<p>No student data available for the selected period.</p>';
  }

  const tableRows = students.map(student => {
    const attendance = parseFloat(student.attendance_percentage || '0');
    const attendanceClass = attendance >= 80 ? 'attendance-good' :
                           attendance >= 70 ? 'attendance-warning' :
                           'attendance-danger';
    return `
      <tr>
        <td>${student.student_name}</td>
        <td>${student.student_email}</td>
        <td>${student.subject_code} - ${student.subject_name}</td>
        <td style="text-align: center;" class="${attendanceClass}">${attendance.toFixed(1)}%</td>
      </tr>
    `;
  }).join('');

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

function generateSessionHtml(sessions: any[]): string {
  if (!sessions || sessions.length === 0) {
    return '<p>No session data available for the selected period.</p>';
  }

  const tableRows = sessions.map(session => {
    const attendanceRate = parseFloat(session.attendance_rate || '0');
    const attendanceClass = attendanceRate >= 80 ? 'attendance-good' :
                           attendanceRate >= 70 ? 'attendance-warning' :
                           'attendance-danger';
    return `
      <tr>
        <td><strong>${session.subject_code}</strong></td>
        <td>Week ${session.week_number}</td>
        <td>${session.day_of_week}</td>
        <td>${session.start_time} - ${session.end_time}</td>
        <td style="text-align: center;">${session.present_students}/${session.enrolled_students}</td>
        <td style="text-align: center;" class="${attendanceClass}">${attendanceRate.toFixed(1)}%</td>
      </tr>
    `;
  }).join('');

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

function generateDetailedHtml(reportData: any): string {
  let content = '';

  if (reportData.overview) {
    content += generateOverviewHtml(reportData.overview);
  }

  if (reportData.students) {
    content += generateStudentHtml(reportData.students);
  }

  if (reportData.sessions) {
    content += generateSessionHtml(reportData.sessions);
  }

  return content || '<p>No data available for the selected period.</p>';
}

function generateReportEmailText({
  lecturerName,
  reportTypeName,
  dateRange,
  reportData
}: {
  lecturerName: string;
  reportTypeName: string;
  dateRange: string;
  reportData: any;
}) {
  let detailedContent = '';

  if (reportData.type === 'overview' && reportData.summary) {
    const totalSubjects = reportData.summary.length;
    const totalStudents = reportData.summary.reduce((sum: number, s: any) => sum + (parseInt(s.total_students) || 0), 0);
    const avgAttendance = totalSubjects > 0
      ? reportData.summary.reduce((sum: number, s: any) => sum + parseFloat(s.average_attendance || '0'), 0) / totalSubjects
      : 0;
    const subjectsAbove80 = reportData.summary.filter((s: any) => (parseFloat(s.average_attendance) || 0) >= 80).length;
    const subjectsBelow70 = reportData.summary.filter((s: any) => (parseFloat(s.average_attendance) || 0) < 70).length;

    detailedContent = `
KEY METRICS:
- Total Subjects: ${totalSubjects}
- Total Students: ${totalStudents}
- Overall Average Attendance: ${avgAttendance.toFixed(1)}%
- Subjects with ≥80% attendance: ${subjectsAbove80}/${totalSubjects}
- Subjects needing attention (<70%): ${subjectsBelow70}

SUBJECT BREAKDOWN:
${reportData.summary.map((subject: any) => {
  const attendance = parseFloat(subject.average_attendance || '0');
  const status = attendance >= 80 ? '✅ Excellent' : attendance >= 70 ? '⚠️  Moderate' : '❌ Needs Attention';
  return `- ${subject.subject_code}: ${subject.subject_name}
  Students: ${subject.total_students} | Attendance: ${attendance.toFixed(1)}% ${status}`;
}).join('\n')}

${subjectsBelow70 > 0 ? `
⚠️  ATTENTION REQUIRED:
${subjectsBelow70} subject(s) have attendance below 70%. Consider implementing attendance improvement strategies.
` : ''}`;

  } else if (reportData.type === 'student' && reportData.students) {
    const totalStudents = reportData.students.length;
    const studentsAbove80 = reportData.students.filter((s: any) => (parseFloat(s.attendance_percentage) || 0) >= 80).length;
    const studentsBelow70 = reportData.students.filter((s: any) => (parseFloat(s.attendance_percentage) || 0) < 70).length;

    detailedContent = `
STUDENT PERFORMANCE SUMMARY:
- Total Student Records: ${totalStudents}
- Students with ≥80% attendance: ${studentsAbove80}
- Students needing support (<70%): ${studentsBelow70}

TOP PERFORMERS:
${reportData.students
  .sort((a: any, b: any) => parseFloat(b.attendance_percentage || '0') - parseFloat(a.attendance_percentage || '0'))
  .slice(0, 5)
  .map((student: any) => `- ${student.student_name}: ${parseFloat(student.attendance_percentage || '0').toFixed(1)}%`)
  .join('\n')}`;

  } else if (reportData.type === 'session' && reportData.sessions) {
    const totalSessions = reportData.sessions.length;
    const avgSessionAttendance = totalSessions > 0
      ? reportData.sessions.reduce((sum: number, s: any) => sum + parseFloat(s.attendance_rate || '0'), 0) / totalSessions
      : 0;

    detailedContent = `
SESSION ANALYSIS SUMMARY:
- Total Sessions Analyzed: ${totalSessions}
- Average Session Attendance: ${avgSessionAttendance.toFixed(1)}%

RECENT SESSIONS:
${reportData.sessions.slice(0, 10).map((session: any) => {
  const rate = parseFloat(session.attendance_rate || '0');
  return `- ${session.subject_code} Week ${session.week_number}: ${session.present_students}/${session.enrolled_students} (${rate.toFixed(1)}%)`;
}).join('\n')}`;
  }

  return `
ATTENDANCE REPORT - ${reportTypeName.toUpperCase()}

Hello ${lecturerName},

Your requested attendance report has been generated successfully.

REPORT DETAILS:
- Report Type: ${reportTypeName}
- Date Range: ${dateRange}
- Generated By: ${lecturerName}
- Generated On: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}

${detailedContent}

QUICK ACCESS:
📊 View Live Analytics Dashboard: ${process.env.BASE_URL || 'http://localhost:3000'}/lecturer/analytics
📧 This report includes detailed charts and visualizations in the HTML version

NEXT STEPS:
${reportData.type === 'overview' && reportData.summary ?
  reportData.summary.some((s: any) => (parseFloat(s.average_attendance) || 0) < 70) ?
    '• Review subjects with low attendance and consider intervention strategies\n• Monitor student engagement and participation\n• Consider additional support for struggling subjects' :
    '• Continue monitoring attendance trends\n• Maintain current engagement strategies\n• Celebrate good attendance with students'
  : '• Review the detailed analytics for actionable insights\n• Consider scheduling follow-up discussions with relevant stakeholders'
}

Best regards,
QR Attendance System

---
This automated report helps you track and improve student attendance.
For technical support or questions, please contact your system administrator.
  `.trim();
}