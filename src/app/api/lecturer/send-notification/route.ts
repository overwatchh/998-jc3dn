import { auth } from "@/lib/server/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "lecturer") {
      return NextResponse.json(
        { error: "Forbidden: Only lecturers can send notifications" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { studentEmail, studentName, attendancePercentage } = body;

    if (!studentEmail || !studentName) {
      return NextResponse.json(
        { error: "Student email and name are required" },
        { status: 400 }
      );
    }

    // Send email notification
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();

    const lecturerName = session.user.name || 'Your Lecturer';
    const lecturerEmail = session.user.email || '';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Notification</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px 20px; text-align: center; }
    .content { padding: 30px 20px; }
    .warning-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-box { background: #f8fafc; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: 500; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .attendance-stat { font-size: 36px; font-weight: bold; color: #ef4444; text-align: center; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Attendance Alert</h1>
      <p>Important Notice About Your Attendance</p>
    </div>

    <div class="content">
      <p>Dear ${studentName},</p>

      <div class="warning-box">
        <h3 style="margin: 0 0 10px 0; color: #dc2626;">Your Attendance Needs Attention</h3>
        <p style="margin: 0; color: #374151;">
          We've noticed that your attendance has fallen below the expected level. Consistent attendance is crucial for your academic success.
        </p>
      </div>

      <div class="attendance-stat">
        ${attendancePercentage !== undefined ? `${attendancePercentage.toFixed(1)}%` : 'Low'}
      </div>
      <p style="text-align: center; color: #6b7280; margin-top: -10px;">Current Attendance Rate</p>

      <div class="info-box">
        <h4 style="margin: 0 0 10px 0; color: #374151;">What You Should Do:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
          <li>Review your schedule and prioritize attending classes</li>
          <li>If you're facing challenges, reach out for support</li>
          <li>Make up any missed work or assignments</li>
          <li>Contact your lecturer if you need assistance</li>
        </ul>
      </div>

      <p>
        If you have any concerns or need to discuss your attendance, please don't hesitate to contact me.
        I'm here to help you succeed.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="mailto:${lecturerEmail}" class="button">Contact ${lecturerName}</a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        <strong>Lecturer:</strong> ${lecturerName}<br>
        <strong>Email:</strong> ${lecturerEmail}
      </p>
    </div>

    <div class="footer">
      <p>This is an automated notification from the QR Attendance System.</p>
      <p>Please do not reply to this email. Contact your lecturer directly using the information above.</p>
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
ATTENDANCE ALERT

Dear ${studentName},

We've noticed that your attendance has fallen below the expected level.

Current Attendance Rate: ${attendancePercentage !== undefined ? `${attendancePercentage.toFixed(1)}%` : 'Low'}

What You Should Do:
- Review your schedule and prioritize attending classes
- If you're facing challenges, reach out for support
- Make up any missed work or assignments
- Contact your lecturer if you need assistance

If you have any concerns or need to discuss your attendance, please contact:

Lecturer: ${lecturerName}
Email: ${lecturerEmail}

---
This is an automated notification from the QR Attendance System.
    `.trim();

    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'QR Attendance System'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: studentEmail,
      subject: `⚠️ Attendance Alert - Action Required`,
      text: textContent,
      html: htmlContent,
    };

    console.log('📧 Sending attendance notification to:', studentEmail);
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Notification sent successfully:', result.messageId);

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${studentName} at ${studentEmail}`
    });

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return NextResponse.json({
      error: 'Failed to send notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}