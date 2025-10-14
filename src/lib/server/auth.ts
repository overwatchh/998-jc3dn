import { betterAuth } from "better-auth";
import { db } from "./db";
import { emailService, type EmailConfig } from "./email";

export const auth = betterAuth({
  database: db,
  baseURL:
    process.env.BASE_URL ||
    "https://jc3dn-qr-attendance-kosgs4isma-ts.a.run.app",
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    // Send password reset email using our SMTP service
    sendResetPassword: async ({ user, url }, _request) => {
      // Lazily initialize email service if needed
      if (!emailService.isInitialized()) {
        const emailConfig: EmailConfig = {
          smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
          smtpPort: parseInt(process.env.SMTP_PORT || "587"),
          smtpUser: process.env.SMTP_USER || "",
          smtpPass: process.env.SMTP_PASS || "",
          fromEmail: process.env.FROM_EMAIL || "",
          fromName: process.env.FROM_NAME || "QR Attendance System",
        };
        await emailService.initialize(emailConfig);
      }

      const html = `
        <div style="font-family:Segoe UI, Tahoma, Geneva, Verdana, sans-serif;">
          <h2>Reset your password</h2>
          <p>We received a request to reset the password for your account.</p>
          <p>Click the button below to choose a new password. This link will expire soon.</p>
          <p style="margin:24px 0;">
            <a href="${url}" style="background:#4f46e5;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Reset password</a>
          </p>
          <p>If you did not request this, you can safely ignore this email.</p>
        </div>
      `;

      await emailService.sendBasicEmail({
        to: user.email,
        subject: "Reset your password",
        html,
        text: `Reset your password: ${url}`,
      });
    },
    onPasswordReset: async ({ user }, _request) => {
      // Optional hook for auditing or notifications
      console.log(`Password reset for user ${user.email}`);
    },
  },
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      // Optional
      tenantId: "aab4897d-5f99-4439-b442-c204c65875b5", // UOW tenantId
      prompt: "select_account", // Forces account selection
    },
  },
  // custom field for user table
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: true,
      },
    },
  },
});
