import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailProducer {
  constructor(@InjectQueue('email') private emailQueue: Queue) { }

  async sendVerificationEmail(email: string, token: string) {
    await this.emailQueue.add(
      'verify',
      { email, token },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendLoginOtp(email: string, otp: string) {
    await this.emailQueue.add(
      'otp',
      { email, otp },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendPasswordResetEmail(email: string, token: string) {
    await this.emailQueue.add(
      'reset',
      { email, token },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendWithdrawalVerificationEmail(
    email: string,
    token: string,
    amount: number,
    currency: string,
  ) {
    await this.emailQueue.add(
      'withdrawal-verify',
      { email, token, amount, currency },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendTicketReplyNotification(
    email: string,
    ticketNumber: string,
    subject: string,
  ) {
    await this.emailQueue.add(
      'ticket-reply',
      { email, ticketNumber, subject },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendTicketStatusNotification(
    email: string,
    ticketNumber: string,
    subject: string,
    status: string,
  ) {
    await this.emailQueue.add(
      'ticket-status',
      { email, ticketNumber, subject, status },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  async sendFulfillmentStatusEmail(
    email: string,
    rewardName: string,
    status: string,
    rewardType: string,
    rewardValue: number,
  ) {
    await this.emailQueue.add(
      'fulfillment-status',
      { email, rewardName, status, rewardType, rewardValue },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }
}
