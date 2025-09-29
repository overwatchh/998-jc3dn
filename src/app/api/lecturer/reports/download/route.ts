import { auth } from "@/lib/server/auth";
import { rawQuery } from "@/lib/server/query";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Reuse the same report generation logic from the email route
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
    case 'session':
    case 'detailed':
      return await generateOverviewReport(params, subjectFilter);
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
      COUNT(DISTINCT CASE
        WHEN c.student_id IS NOT NULL
        THEN CONCAT(c.student_id, '-', qrss.week_number)
      END) as total_checkins,
      ROUND(
        COALESCE(
          (COUNT(DISTINCT CASE
            WHEN c.student_id IS NOT NULL
            THEN CONCAT(c.student_id, '-', qrss.week_number)
          END) * 100.0) /
          NULLIF(COUNT(DISTINCT e.student_id) * COUNT(DISTINCT qrss.week_number), 0),
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
    LEFT JOIN checkin c ON qrss.id = c.qr_code_study_session_id
                       AND c.student_id = e.student_id
                       AND DATE(c.checkin_time) BETWEEN ? AND ?
    WHERE lss.lecturer_id = ? ${subjectFilter}
    GROUP BY s.id, s.name, s.code
    HAVING COUNT(DISTINCT qrss.week_number) > 0
    ORDER BY average_attendance DESC
  `, params);

  return {
    type: 'overview',
    summary: Array.isArray(summaryData) ? summaryData : [],
    generatedAt: new Date().toISOString(),
    dateRange: `${params[1]} to ${params[2]}`
  };
}

// Generate downloadable HTML report
function generateDownloadableHtml(reportData: any, {
  lecturerName,
  reportTypeName,
  dateRange,
  recipientEmail
}: {
  lecturerName: string;
  reportTypeName: string;
  dateRange: string;
  recipientEmail: string;
}) {
  const summary = reportData.summary || [];

  if (!summary || summary.length === 0) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Attendance Report - ${reportTypeName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; }
    .no-data { text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 ${reportTypeName}</h1>
      <p>Date Range: ${dateRange}</p>
      <p>Generated for: ${recipientEmail}</p>
    </div>
    <div class="no-data">
      <h3>No Data Available</h3>
      <p>No attendance records found for the selected period.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  // Calculate statistics
  const totalStudents = summary.reduce((sum: any, s: any) => sum + (parseInt(s.total_students) || 0), 0);
  const avgAttendanceOverall = summary.length > 0
    ? summary.reduce((sum: any, s: any) => sum + (parseFloat(s.average_attendance) || 0), 0) / summary.length
    : 0;
  const subjectsAbove80 = summary.filter((s: any) => (parseFloat(s.average_attendance) || 0) >= 80).length;
  const subjectsBelow70 = summary.filter((s: any) => (parseFloat(s.average_attendance) || 0) < 70).length;

  const subjectsList = summary.map((subject: any) => {
    const attendance = parseFloat(subject.average_attendance || '0');
    const attendanceColor = attendance >= 80 ? '#22c55e' : attendance >= 70 ? '#f59e0b' : '#ef4444';
    const status = attendance >= 80 ? '✅' : attendance >= 70 ? '⚠️' : '❌';

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
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Report - ${reportTypeName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
    .stats-overview { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-top: 15px; }
    .stat-item { text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; }
    .stat-label { font-size: 13px; opacity: 0.9; }
    .section-title { color: #374151; font-size: 18px; margin: 25px 0 15px 0; font-weight: bold; }
    .email-actions { background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px; font-weight: 500; }
    .button:hover { background: #5a67d8; }
    @media print { body { background: white; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 ${reportTypeName}</h1>
      <p>Date Range: ${dateRange}</p>
      <p>Generated by: ${lecturerName}</p>
      <p>Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
    </div>

    <div class="email-actions">
      <h3>📧 Email This Report</h3>
      <p>Send this report to: <strong>${recipientEmail}</strong></p>
      <a href="mailto:${recipientEmail}?subject=📊 ${reportTypeName} - ${dateRange}&body=Please find the attendance report attached or in the content below." class="button">Open Mail Client</a>
      <button onclick="window.print()" class="button">Print Report</button>
    </div>

    <div class="stats-overview">
      <h3 style="margin: 0 0 15px 0;">📈 Quick Analytics Overview</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${summary.length}</div>
          <div class="stat-label">Subjects</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalStudents}</div>
          <div class="stat-label">Students</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${avgAttendanceOverall.toFixed(1)}%</div>
          <div class="stat-label">Avg Attendance</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${subjectsAbove80}</div>
          <div class="stat-label">Above 80%</div>
        </div>
      </div>
    </div>

    ${subjectsBelow70 > 0 ? `
    <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <h4 style="color: #dc2626; margin: 0 0 8px 0;">⚠️ ${subjectsBelow70} Subject${subjectsBelow70 > 1 ? 's' : ''} Need Attention</h4>
      <p style="margin: 0; color: #dc2626; font-size: 14px;">Attendance below 70% - consider improvement strategies</p>
    </div>
    ` : ''}

    <div style="margin: 20px 0;">
      <h3 class="section-title">📋 Subject Performance</h3>
      ${subjectsList}
    </div>

    ${avgAttendanceOverall >= 80 ? `
    <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #16a34a; font-weight: 500;">🎉 Excellent overall performance! Keep up the great work.</p>
    </div>
    ` : avgAttendanceOverall < 70 ? `
    <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #dc2626; font-weight: 500;">📈 Focus on boosting attendance with engagement strategies.</p>
    </div>
    ` : `
    <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <p style="margin: 0; color: #d97706; font-weight: 500;">👍 Good progress! A few improvements could reach excellence.</p>
    </div>
    `}
  </div>
</body>
</html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "lecturer") {
      return NextResponse.json(
        { error: "Forbidden: Only lecturers can download reports" },
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

    // Calculate date range (reuse same logic as email route)
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

    const reportTypeNames = {
      overview: 'Overview Report',
      student: 'Student Performance Report',
      session: 'Session Analysis Report',
      detailed: 'Detailed Attendance Report'
    };

    const reportTypeName = reportTypeNames[reportType as keyof typeof reportTypeNames] || 'Attendance Report';

    // Generate HTML content
    const htmlContent = generateDownloadableHtml(reportData, {
      lecturerName: session.user.name || 'Lecturer',
      reportTypeName,
      dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      recipientEmail: email || 'recipient@example.com'
    });

    // Return HTML content as downloadable file
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="attendance-report-${Date.now()}.html"`
      }
    });

  } catch (error) {
    console.error('Report download error:', error);
    return NextResponse.json({
      error: 'Failed to generate downloadable report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}