/**
 * Multi-Provider Email Service
 * Supports Gmail, Outlook, Yahoo, and custom SMTP providers
 */

import nodemailer from 'nodemailer';
import { getEmailConfigByAddress, detectEmailProvider, EMAIL_PROVIDERS, EmailProvider } from '@/config/emailProviders';

export class MultiProviderEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private currentConfig: EmailProvider | null = null;

  /**
   * Initialize email service with auto-detection
   */
  async initializeFromEnv(): Promise<boolean> {
    try {
      // Method 1: Auto-detect from SMTP_EMAIL
      if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        return await this.initializeWithEmail(
          process.env.SMTP_EMAIL,
          process.env.SMTP_PASSWORD
        );
      }

      // Method 2: Use specific provider configuration
      if (process.env.SMTP_PROVIDER) {
        return await this.initializeWithProvider(
          process.env.SMTP_PROVIDER as keyof typeof EMAIL_PROVIDERS,
          {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        );
      }

      // Method 3: Use custom configuration
      if (process.env.SMTP_HOST) {
        return await this.initializeWithCustom({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
          }
        });
      }

      console.error('❌ No email configuration found in environment variables');
      return false;

    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      return false;
    }
  }

  /**
   * Initialize with email address (auto-detect provider)
   */
  async initializeWithEmail(email: string, password: string, fromName?: string): Promise<boolean> {
    try {
      const config = getEmailConfigByAddress(email, password);
      const fromEmail = fromName ? `"${fromName}" <${email}>` : email;
      
      this.currentConfig = { ...config, from: fromEmail };
      this.transporter = nodemailer.createTransporter(this.currentConfig);

      console.log(`📧 Initialized ${config.name} email service for ${email}`);
      return await this.testConnection();

    } catch (error) {
      console.error('❌ Failed to initialize email service with email:', error);
      return false;
    }
  }

  /**
   * Initialize with specific provider
   */
  async initializeWithProvider(
    providerKey: keyof typeof EMAIL_PROVIDERS,
    auth: { user: string; pass: string },
    fromEmail?: string
  ): Promise<boolean> {
    try {
      const provider = EMAIL_PROVIDERS[providerKey];
      this.currentConfig = {
        ...provider,
        auth,
        from: fromEmail || auth.user
      };
      
      this.transporter = nodemailer.createTransporter(this.currentConfig);
      
      console.log(`📧 Initialized ${provider.name} email service`);
      return await this.testConnection();

    } catch (error) {
      console.error(`❌ Failed to initialize ${providerKey} email service:`, error);
      return false;
    }
  }

  /**
   * Initialize with custom SMTP configuration
   */
  async initializeWithCustom(config: EmailConfig): Promise<boolean> {
    try {
      this.currentConfig = {
        name: 'Custom SMTP',
        ...config,
        from: config.auth.user
      };
      
      this.transporter = nodemailer.createTransporter(config);
      
      console.log('📧 Initialized custom SMTP email service');
      return await this.testConnection();

    } catch (error) {
      console.error('❌ Failed to initialize custom email service:', error);
      return false;
    }
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      console.error('❌ Email transporter not initialized');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
  }): Promise<boolean> {
    if (!this.transporter || !this.currentConfig) {
      console.error('❌ Email service not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: options.from || this.currentConfig.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return true;

    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send bulk emails with provider optimization
   */
  async sendBulkEmails(emails: Array<{
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }>): Promise<{ sent: number; failed: number; errors: string[] }> {
    const result = { sent: 0, failed: 0, errors: [] as string[] };

    for (const email of emails) {
      try {
        const success = await this.sendEmail(email);
        if (success) {
          result.sent++;
        } else {
          result.failed++;
          result.errors.push(`Failed to send to ${email.to}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        result.failed++;
        result.errors.push(`Error sending to ${email.to}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Get current provider info
   */
  getCurrentProvider(): { name: string; email: string } | null {
    if (!this.currentConfig) return null;
    
    return {
      name: this.currentConfig.name,
      email: this.currentConfig.auth.user
    };
  }

  /**
   * Switch to different email provider
   */
  async switchProvider(email: string, password: string): Promise<boolean> {
    return await this.initializeWithEmail(email, password);
  }
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Create singleton instance
export const multiProviderEmailService = new MultiProviderEmailService();