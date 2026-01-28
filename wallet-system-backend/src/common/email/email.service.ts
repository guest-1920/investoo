import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
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
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
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

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Verify your email address',
        html,
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }

  async sendLoginOtp(email: string, otp: string) {
    const ttl = this.configService.get<number>('AUTH_OTP_TTL') || 300;
    const expiresIn = this.formatDuration(ttl);

    const html = otpTemplate(otp, expiresIn);

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Your Login OTP',
        html,
      });
      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error);
      throw error;
    }
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

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Reset your password',
        html,
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw error;
    }
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

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Confirm your Withdrawal Request',
        html,
      });
      this.logger.log(`Withdrawal verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send withdrawal verification email to ${email}`,
        error,
      );
      throw error;
    }
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

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `New Reply on Ticket ${ticketNumber}`,
        html,
      });
      this.logger.log(`Ticket reply notification sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send ticket reply notification to ${email}`,
        error,
      );
      throw error;
    }
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

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Ticket ${ticketNumber} Status Updated`,
        html,
      });
      this.logger.log(`Ticket status notification sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send ticket status notification to ${email}`,
        error,
      );
      throw error;
    }
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

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `Reward Update: ${rewardName}`,
        html,
      });
      this.logger.log(`Fulfillment status email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send fulfillment status email to ${email}`,
        error,
      );
      throw error;
    }
  }
}
