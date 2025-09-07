/**
 * Simple SendGrid Email Service
 * No SMTP, no passwords, no 2FA hassle!
 */

import sgMail from '@sendgrid/mail';

export class SendGridEmailService {
  private initialized = false;
  private fromEmail = '';

  /**
   * Initialize SendGrid with API key
   */
  async initialize(apiKey: string, fromEmail: string): Promise<boolean> {
    try {
      sgMail.setApiKey(apiKey);
      this.fromEmail = fromEmail;
      this.initialized = true;
      
      console.log('✅ SendGrid initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ SendGrid initialization failed:', error);
      return false;
    }
  }

  /**
   * Send email using SendGrid API
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
  }): Promise<boolean> {
    if (!this.initialized) {
      console.error('❌ SendGrid not initialized');
      return false;
    }

    try {
      const msg = {
        to: options.to,
        from: this.fromEmail,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await sgMail.send(msg);
      console.log('✅ Email sent successfully via SendGrid');
      return true;

    } catch (error: any) {
      console.error('❌ Failed to send email via SendGrid:', error.message);
      return false;
    }
  }

  /**
   * Test the service
   */
  async testService(): Promise<boolean> {
    if (!this.initialized) {
      console.error('❌ SendGrid not initialized');
      return false;
    }

    try {
      // Send a simple test email
      const success = await this.sendEmail({
        to: 'sunard79@gmail.com',
        subject: '🧪 SendGrid Test - QR Attendance System',
        text: 'SendGrid email service test successful!',
        html: `
          <h2>🎉 SendGrid Working!</h2>
          <p>This email was sent using SendGrid API - no SMTP hassles!</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        `
      });

      return success;
    } catch (error) {
      console.error('❌ SendGrid test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const sendGridEmailService = new SendGridEmailService();