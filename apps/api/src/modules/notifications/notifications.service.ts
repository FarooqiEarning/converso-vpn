/**
 * Converso VPN - Notifications Service
 * SendGrid email integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get('sendgrid.apiKey') || '';
    this.fromEmail = this.configService.get('sendgrid.emailFrom') || 'noreply@converso.vpn';
    this.fromName = this.configService.get('sendgrid.emailFromName') || 'Converso VPN';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      this.logger.warn('SendGrid API key not configured, skipping email');
      return false;
    }

    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.apiKey);

      await sgMail.send({
        to: options.to,
        from: { email: this.fromEmail, name: this.fromName },
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      });

      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error}`);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Welcome to Converso VPN',
      text: `Hi ${name},\n\nWelcome to Converso VPN! We're excited to have you on board.\n\nGet started by downloading our apps and connecting to any of our global servers.\n\nBest,\nThe Converso VPN Team`,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.configService.get('app.frontendUrl')}/reset-password?token=${resetToken}`;
    await this.sendEmail({
      to: email,
      subject: 'Reset your Converso VPN password',
      text: `Click here to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    });
  }

  async sendPaymentFailedEmail(email: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Payment failed - Action required',
      text: `Your payment for Converso VPN has failed. Please update your payment method to continue using our service.\n\nLog in to your account to resolve this issue.`,
    });
  }
}