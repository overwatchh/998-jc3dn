// nodemailer will be imported dynamically to avoid webpack bundling issues

export interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export interface AttendanceEmailData {
  studentName: string;
  studentEmail: string;
  subjectName: string;
  subjectCode: string;
  weekNumber: number;
  attendancePercentage: number;
  checkinCount: number; // 0, 1, or 2
  totalAttendancePercentage: number;
  classesCanMiss: number;
  isLowAttendance: boolean;
}

export interface QRCodeEmailData {
  studentName: string;
  studentEmail: string;
  subjectName: string;
  subjectCode: string;
  sessionType: string;
  weekNumber: number;
  qrCodeUrl: string;
  scanUrl?: string; // The actual URL to scan (not the data URL)
}

class EmailService {
  private transporter: unknown | null = null; // Transporter instance from nodemailer
  private config: EmailConfig | null = null;

  async initialize(config: EmailConfig) {
    this.config = config;
    const nodemailer = await import('nodemailer');
    this.transporter = nodemailer.default.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    });
  }

  private generateAttendanceEmailHtml(data: AttendanceEmailData): string {
    const attendanceColor = data.totalAttendancePercentage >= 80 ? '#22c55e' : '#ef4444';
    const statusMessage = data.totalAttendancePercentage >= 80 
      ? 'Your attendance is satisfactory' 
      : 'Your attendance is below the required threshold';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Reminder - ${data.subjectName}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .attendance-card { background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid ${attendanceColor}; }
    .attendance-percentage { font-size: 36px; font-weight: bold; color: ${attendanceColor}; text-align: center; margin-bottom: 10px; }
    .status-message { text-align: center; font-size: 16px; margin-bottom: 20px; color: ${attendanceColor}; font-weight: 500; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-item { background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
    .stat-value { font-size: 20px; font-weight: bold; color: #1f2937; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .week-attendance { background: #e0f2fe; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .week-attendance h3 { margin-top: 0; color: #0277bd; }
    .checkin-status { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .checkin-full { background: #dcfce7; color: #166534; }
    .checkin-partial { background: #fef3c7; color: #92400e; }
    .checkin-absent { background: #fecaca; color: #991b1b; }
    .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .warning h3 { color: #dc2626; margin-top: 0; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: 500; }
    .button:hover { background: #5a67d8; }
    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: 1fr; }
      .header { padding: 20px 15px; }
      .content { padding: 20px 15px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Attendance Update</h1>
      <p>Weekly attendance summary for ${data.subjectName}</p>
    </div>
    
    <div class="content">
      <div class="week-attendance">
        <h3>Week ${data.weekNumber} Attendance Summary</h3>
        <p><strong>Subject:</strong> ${data.subjectName} (${data.subjectCode})</p>
        <p><strong>Your attendance for this lecture:</strong> 
          <span class="checkin-status ${
            data.checkinCount === 2 ? 'checkin-full' : 
            data.checkinCount === 1 ? 'checkin-partial' : 
            'checkin-absent'
          }">
            ${data.checkinCount === 2 ? 'Full Attendance (100%)' : 
              data.checkinCount === 1 ? 'Partial Attendance (50%)' : 
              'Absent (0%)'}
          </span>
        </p>
        <p><strong>Check-ins:</strong> ${data.checkinCount} out of 2 required</p>
      </div>

      <div class="attendance-card">
        <div class="attendance-percentage">${data.totalAttendancePercentage.toFixed(1)}%</div>
        <div class="status-message">${statusMessage}</div>
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${data.classesCanMiss}</div>
            <div class="stat-label">Classes you can still miss</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">80%</div>
            <div class="stat-label">Required minimum</div>
          </div>
        </div>
      </div>

      ${data.isLowAttendance ? `
      <div class="warning">
        <h3>⚠️ Attendance Warning</h3>
        <p>Your attendance is below the required 80% threshold. Please ensure you attend the remaining classes to maintain the minimum attendance requirement.</p>
        <p><strong>Action needed:</strong> You can miss at most ${data.classesCanMiss} more class${data.classesCanMiss === 1 ? '' : 'es'} this semester.</p>
      </div>
      ` : `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <h3 style="color: #166534; margin-top: 0;">✅ Good Attendance!</h3>
        <p>Keep up the good work! You can still miss ${data.classesCanMiss} more class${data.classesCanMiss === 1 ? '' : 'es'} and maintain the 80% requirement.</p>
      </div>
      `}

      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.BASE_URL}/dashboard" class="button">View Full Attendance Record</a>
      </div>

      <div style="background: #f8fafc; padding: 15px; border-radius: 6px; font-size: 14px; color: #6b7280;">
        <p><strong>Remember:</strong></p>
        <ul>
          <li>Each lecture has 2 check-in periods</li>
          <li>Scanning both QR codes = 100% attendance for that lecture</li>
          <li>Scanning only 1 QR code = 50% attendance for that lecture</li>
          <li>Missing both scans = 0% attendance for that lecture</li>
          <li>Minimum 80% overall attendance is required to pass</li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p>This is an automated message from the QR Attendance System.</p>
      <p>Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateAttendanceEmailText(data: AttendanceEmailData): string {
    return `
ATTENDANCE REMINDER - ${data.subjectName}

Hello ${data.studentName},

This is your weekly attendance summary for ${data.subjectName} (${data.subjectCode}).

WEEK ${data.weekNumber} SUMMARY:
- Check-ins: ${data.checkinCount} out of 2 required
- Lecture attendance: ${data.attendancePercentage}%

OVERALL ATTENDANCE:
- Current attendance: ${data.totalAttendancePercentage.toFixed(1)}%
- Required minimum: 80%
- Classes you can still miss: ${data.classesCanMiss}

${data.isLowAttendance ? 
  'WARNING: Your attendance is below the required 80% threshold. Please attend remaining classes to meet the minimum requirement.' :
  'Good work! Your attendance is satisfactory.'
}

ATTENDANCE SYSTEM REMINDER:
- Each lecture has 2 QR code check-ins
- Both scans = 100% attendance
- 1 scan = 50% attendance  
- No scans = 0% attendance

Best regards,
QR Attendance System
    `.trim();
  }

  async sendAttendanceReminder(data: AttendanceEmailData): Promise<void> {
    if (!this.transporter || !this.config) {
      throw new Error('Email service not initialized');
    }

    const subject = `📊 Attendance Update: ${data.subjectCode} - Week ${data.weekNumber} ${
      data.isLowAttendance ? '⚠️ Action Required' : ''
    }`;

    const htmlContent = this.generateAttendanceEmailHtml(data);
    const textContent = this.generateAttendanceEmailText(data);

    const mailOptions = {
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: data.studentEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    try {
      await (this.transporter as any).sendMail(mailOptions);
      console.log(`Attendance reminder sent to ${data.studentEmail} for ${data.subjectCode} Week ${data.weekNumber}`);
    } catch (error) {
      console.error(`Failed to send attendance reminder to ${data.studentEmail}:`, error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    try {
      await (this.transporter as any).verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.transporter !== null && this.config !== null;
  }

  private generateQRCodeEmailHtml(data: QRCodeEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Code for ${data.subjectName} - Week ${data.weekNumber}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 30px 20px; }
    .qr-container { text-align: center; padding: 30px 20px; background-color: #f8fafc; border-radius: 12px; margin: 20px 0; }
    .qr-image { max-width: 300px; width: 100%; height: auto; border: 4px solid #667eea; border-radius: 8px; background: white; padding: 10px; }
    .info-card { background-color: #e0f2fe; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #0284c7; }
    .info-item { margin: 10px 0; }
    .info-label { font-weight: 600; color: #0c4a6e; }
    .info-value { color: #0369a1; }
    .instructions { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .instructions h3 { margin-top: 0; color: #92400e; }
    .instructions ol { margin: 10px 0; padding-left: 20px; }
    .instructions li { margin: 8px 0; color: #78350f; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: 500; }
    .button:hover { background: #5a67d8; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
    @media (max-width: 600px) {
      .header { padding: 20px 15px; }
      .content { padding: 20px 15px; }
      .qr-image { max-width: 250px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📱 Attendance QR Code</h1>
      <p>Scan to mark your attendance</p>
    </div>

    <div class="content">
      <p>Hello <strong>${data.studentName}</strong>,</p>
      <p>Here is your QR code for attendance check-in:</p>

      <div class="info-card">
        <div class="info-item">
          <span class="info-label">Subject:</span>
          <span class="info-value">${data.subjectCode} - ${data.subjectName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Session Type:</span>
          <span class="info-value">${data.sessionType.charAt(0).toUpperCase() + data.sessionType.slice(1)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Week:</span>
          <span class="info-value">Week ${data.weekNumber}</span>
        </div>
      </div>

      <div class="qr-container">
        <img src="${data.qrCodeUrl}" alt="QR Code" class="qr-image" />
        <p style="margin-top: 15px; color: #64748b; font-size: 14px;">Scan the QR code above or use the link below</p>
      </div>

      <div class="instructions">
        <h3>📋 How to Check In:</h3>
        <ol>
          <li>Open the QR code scanner on your phone</li>
          <li>Scan the QR code above</li>
          <li>Or click the "Check In Now" button below to open the link directly</li>
          <li>Remember: There are 2 check-in windows per session</li>
        </ol>
        <p><strong>Note:</strong> Make sure you're within the designated location when scanning if geolocation validation is enabled.</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.scanUrl || data.qrCodeUrl}" class="button">🔗 Check In Now</a>
        <p style="margin-top: 10px; font-size: 12px; color: #64748b;">Click this button to open the check-in page directly</p>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated message from the QR Attendance System.</p>
      <p>Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generateQRCodeEmailText(data: QRCodeEmailData): string {
    return `
QR CODE FOR ATTENDANCE - ${data.subjectName}

Hello ${data.studentName},

Here is your QR code for attendance check-in:

SUBJECT: ${data.subjectCode} - ${data.subjectName}
SESSION TYPE: ${data.sessionType.charAt(0).toUpperCase() + data.sessionType.slice(1)}
WEEK: Week ${data.weekNumber}

CHECK-IN LINK: ${data.scanUrl || data.qrCodeUrl}

HOW TO CHECK IN:
1. Open the QR code scanner on your phone and scan the QR code in the email
2. OR click the link above to check in directly
3. Follow the prompts to complete your check-in
4. Remember: There are 2 check-in windows per session

NOTE: Make sure you're within the designated location when scanning if geolocation validation is enabled.

Best regards,
QR Attendance System
    `.trim();
  }

  async sendQRCodeEmail(data: QRCodeEmailData): Promise<void> {
    if (!this.transporter || !this.config) {
      throw new Error('Email service not initialized');
    }

    const subject = `📱 QR Code: ${data.subjectCode} - ${data.sessionType.charAt(0).toUpperCase() + data.sessionType.slice(1)} Week ${data.weekNumber}`;

    // If qrCodeUrl is a data URL, extract the base64 data and use CID attachment
    let htmlContent = this.generateQRCodeEmailHtml(data);
    const textContent = this.generateQRCodeEmailText(data);

    const mailOptions: any = {
      from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
      to: data.studentEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    // If it's a data URL (base64 image), attach it as an inline image
    if (data.qrCodeUrl.startsWith('data:image')) {
      const base64Data = data.qrCodeUrl.split(',')[1];
      const imageType = data.qrCodeUrl.match(/data:image\/(.*?);/)?.[1] || 'png';

      mailOptions.attachments = [{
        filename: 'qrcode.' + imageType,
        content: base64Data,
        encoding: 'base64',
        cid: 'qrcode@attendance'
      }];

      // Replace the image src in HTML with CID reference
      htmlContent = htmlContent.replace(
        `src="${data.qrCodeUrl}"`,
        'src="cid:qrcode@attendance"'
      );
      mailOptions.html = htmlContent;
    }

    try {
      await (this.transporter as any).sendMail(mailOptions);
      console.log(`QR code email sent to ${data.studentEmail} for ${data.subjectCode} Week ${data.weekNumber}`);
    } catch (error) {
      console.error(`Failed to send QR code email to ${data.studentEmail}:`, error);
      throw error;
    }
  }
}

export const emailService = new EmailService();