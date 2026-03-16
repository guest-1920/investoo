import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { verificationTemplate } from './templates/verification';
import { otpTemplate } from './templates/otp';
import { resetPasswordTemplate } from './templates/reset-password';
import { withdrawalVerificationTemplate } from './templates/withdrawal-verification';
import { ticketReplyTemplate } from './templates/ticket-reply';
import { ticketStatusTemplate } from './templates/ticket-status';
import { fulfillmentStatusTemplate } from './templates/fulfillment-status';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: Number(this.configService.get<number | string>('SMTP_PORT')) || 587,
      secure: this.configService.get<string | boolean>('SMTP_SECURE') === 'true' || this.configService.get<string | boolean>('SMTP_SECURE') === true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
          rejectUnauthorized: false,
      },
      family: 4, // Forces IPv4 to prevent ETIMEOUT on some networks
    } as any);
  }

  private async sendEmail(to: string, subject: string, htmlBody: string) {
    try {
      const senderEmail = process.env.SMTP_FROM || 'no-reply@investoo.net';
      const fromName = 'Investoo';

      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${senderEmail}>`,
        to: to,
        subject: subject,
        html: htmlBody,
      });

      this.logger.log(`Email sent to ${to}, MessageId: ${info.messageId} with subject "${subject}"`);
      return info;

    } catch (error: any) {
      this.logger.error(`Error sending email to ${to}: ${error?.message || error}`, error?.stack);
      throw error;
    }

  }


  private formatDuration(seconds: number): string {
    if (seconds >= 3600) {
      const hours = Math.round(seconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (seconds >= 60) {
      const minutes = Math.round(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    return `${seconds} seconds`;
  }

  async sendVerificationEmail(email: string, token: string) {
    const baseUrl = (
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');
    const url = `${baseUrl}/verify-email?token=${token}`;

    const ttl =
      this.configService.get<number>('AUTH_VERIFICATION_TOKEN_TTL') || 3600;
    const expiresIn = this.formatDuration(ttl);

    const html = verificationTemplate(url, expiresIn);

    await this.sendEmail(email, 'Verify your email address', html);
  }

  async sendLoginOtp(email: string, otp: string) {
    const ttl = this.configService.get<number>('AUTH_OTP_TTL') || 300;
    const expiresIn = this.formatDuration(ttl);

    const html = otpTemplate(otp, expiresIn);

    await this.sendEmail(email, 'Your Login OTP', html);
  }

  async sendPasswordResetEmail(email: string, token: string) {
    // Remove trailing slash if present to avoid double slashes
    const baseUrl = (
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');
    const url = `${baseUrl}/reset-password?token=${token}`;

    const ttl = this.configService.get<number>('AUTH_RESET_TOKEN_TTL') || 900;
    const expiresIn = this.formatDuration(ttl);

    const html = resetPasswordTemplate(url, expiresIn);

    await this.sendEmail(email, 'Reset your password', html);
  }

  async sendWithdrawalVerificationEmail(
    email: string,
    token: string,
    amount: number,
    currency: string,
  ) {
    const baseUrl = (
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');
    const url = `${baseUrl}/dashboard/withdraw/verify?token=${token}`;

    const html = withdrawalVerificationTemplate(url, amount, currency);

    await this.sendEmail(
      email,
      'Confirm your withdrawal request',
      html,
    );
  }

  async sendTicketReplyNotification(
    email: string,
    ticketNumber: string,
    subject: string,
  ) {
    const baseUrl = (
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');
    const dashboardUrl = `${baseUrl}/dashboard/support`;

    const html = ticketReplyTemplate(ticketNumber, subject, dashboardUrl);

    await this.sendEmail(
      email,
      `New Reply on Ticket ${ticketNumber}`,
      html,
    );
  }

  async sendTicketStatusNotification(
    email: string,
    ticketNumber: string,
    subject: string,
    status: string,
  ) {
    const baseUrl = (
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');
    const dashboardUrl = `${baseUrl}/dashboard/support`;

    const html = ticketStatusTemplate(
      ticketNumber,
      subject,
      status,
      dashboardUrl,
    );

    await this.sendEmail(
      email,
      `Ticket ${ticketNumber} Status Updated to ${status}`,
      html,
    );
  }

  async sendFulfillmentStatusEmail(
    email: string,
    rewardName: string,
    status: string,
    rewardType: string,
    rewardValue: number,
  ) {
    const baseUrl = (
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');
    const dashboardUrl = `${baseUrl}/dashboard/referrals`;

    const html = fulfillmentStatusTemplate(
      rewardName,
      status,
      rewardType,
      rewardValue,
      dashboardUrl,
    );

    await this.sendEmail(
      email,
      `Reward update: "${rewardName}"`,
      html,
    );
  }
}
