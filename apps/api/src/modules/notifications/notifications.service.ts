/**
 * Converso VPN - Notifications Service
 * Resend email integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get('resend.apiKey') || '';
    this.fromEmail = this.configService.get('resend.emailFrom') || 'noreply@converso.vpn';
    this.fromName = this.configService.get('resend.emailFromName') || 'Converso VPN';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Resend API key not configured, skipping email');
      return false;
    }

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: options.to,
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

  async sendVerificationEmail(email: string, verificationToken: string): Promise<void> {
    const verifyUrl = `${this.configService.get('app.frontendUrl')}/verify-email?token=${verificationToken}`;
    await this.sendEmail({
      to: email,
      subject: 'Verify your Converso VPN email',
      text: `Click here to verify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    });
  }

  async sendSubscriptionConfirmationEmail(email: string, planName: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Subscription Confirmed - Converso VPN',
      text: `Your subscription to ${planName} has been confirmed! You now have access to all premium features.\n\nThank you for choosing Converso VPN!`,
    });
  }
}