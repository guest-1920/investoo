import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailProducer } from '../../common/email/email.producer';

@Injectable()
export class FulfillmentStatusListener {
    private readonly logger = new Logger(FulfillmentStatusListener.name);

    constructor(private readonly emailProducer: EmailProducer) { }

    @OnEvent('fulfillment.status.updated')
    async handleStatusUpdate(payload: {
        email: string;
        rewardName: string;
        status: string;
        rewardType: string;
        rewardValue: number;
    }) {
        try {
            await this.emailProducer.sendFulfillmentStatusEmail(
                payload.email,
                payload.rewardName,
                payload.status,
                payload.rewardType,
                payload.rewardValue,
            );
            this.logger.log(`Sent status update email for ${payload.rewardName} to ${payload.email}`);
        } catch (error) {
            this.logger.error(`Failed to send status update email`, error);
        }
    }
}
