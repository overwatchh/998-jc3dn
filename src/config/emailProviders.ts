/**
 * Multi-Provider Email Configuration
 * Supports Gmail, Outlook, Yahoo, and custom SMTP providers
 */

export interface EmailProvider {
  name: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from?: string;
}

export interface EmailProviderConfig {
  gmail: EmailProvider;
  outlook: EmailProvider;
  yahoo: EmailProvider;
  custom: EmailProvider;
}

/**
 * Email provider configurations
 */
export const EMAIL_PROVIDERS: Record<string, Omit<EmailProvider, 'auth' | 'from'>> = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
  },
  outlook: {
    name: 'Outlook/Hotmail',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
  },
  yahoo: {
    name: 'Yahoo',
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
  },
  zoho: {
    name: 'Zoho',
    host: 'smtp.zoho.com',
    port: 587,
    secure: false,
  },
  godaddy: {
    name: 'GoDaddy',
    host: 'smtpout.secureserver.net',
    port: 80,
    secure: false,
  },
  sendgrid: {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
  },
  mailgun: {
    name: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
  },
  custom: {
    name: 'Custom SMTP',
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
  }
};

/**
 * Auto-detect email provider based on email address
 */
export function detectEmailProvider(email: string): keyof typeof EMAIL_PROVIDERS {
  const domain = email.toLowerCase().split('@')[1];
  
  switch (domain) {
    case 'gmail.com':
    case 'googlemail.com':
      return 'gmail';
    
    case 'outlook.com':
    case 'hotmail.com':
    case 'live.com':
    case 'msn.com':
      return 'outlook';
    
    case 'yahoo.com':
    case 'yahoo.co.uk':
    case 'yahoo.ca':
    case 'yahoo.au':
      return 'yahoo';
    
    case 'zoho.com':
      return 'zoho';
    
    default:
      return 'custom';
  }
}

/**
 * Get email configuration for a specific provider
 */
export function getEmailConfig(
  providerKey: keyof typeof EMAIL_PROVIDERS,
  auth: { user: string; pass: string },
  fromEmail?: string
): EmailProvider {
  const provider = EMAIL_PROVIDERS[providerKey];
  
  return {
    ...provider,
    auth,
    from: fromEmail || auth.user
  };
}

/**
 * Get email configuration based on email address
 */
export function getEmailConfigByAddress(
  email: string,
  password: string,
  fromEmail?: string
): EmailProvider {
  const providerKey = detectEmailProvider(email);
  return getEmailConfig(providerKey, { user: email, pass: password }, fromEmail);
}

/**
 * Validate email configuration
 */
export function validateEmailConfig(config: EmailProvider): boolean {
  return !!(
    config.host &&
    config.port &&
    config.auth.user &&
    config.auth.pass
  );
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): Array<{ key: string; name: string }> {
  return Object.entries(EMAIL_PROVIDERS).map(([key, provider]) => ({
    key,
    name: provider.name
  }));
}