import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EmailService } from './email.service';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'verify':
        await this.emailService.sendVerificationEmail(
          job.data.email,
          job.data.token,
        );
        break;
      case 'otp':
        await this.emailService.sendLoginOtp(job.data.email, job.data.otp);
        break;
      case 'reset':
        await this.emailService.sendPasswordResetEmail(
          job.data.email,
          job.data.token,
        );
        break;
      case 'withdrawal-verify':
        await this.emailService.sendWithdrawalVerificationEmail(
          job.data.email,
          job.data.token,
          job.data.amount,
          job.data.currency,
        );
        break;
      case 'ticket-reply':
        await this.emailService.sendTicketReplyNotification(
          job.data.email,
          job.data.ticketNumber,
          job.data.subject,
        );
        break;
        await this.emailService.sendTicketStatusNotification(
          job.data.email,
          job.data.ticketNumber,
          job.data.subject,
          job.data.status,
        );
        break;
      case 'fulfillment-status':
        await this.emailService.sendFulfillmentStatusEmail(
          job.data.email,
          job.data.rewardName,
          job.data.status,
          job.data.rewardType,
          job.data.rewardValue,
        );
        break;
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }
}
