import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SubscriptionPurchasedEvent } from '../../common/events/domain-events';
import { ReferralWindowService } from './windows.service';

@Injectable()
export class ReferralWindowListener {
    constructor(private readonly windowService: ReferralWindowService) { }

    @OnEvent('subscription.purchased')
    async handleSubscriptionPurchased(event: SubscriptionPurchasedEvent) {
        const { referrerId, userId, subscriptionId, planPrice } = event.payload;

        if (!referrerId) return; // No referrer, nothing to do

        // Update all active window progress for this referrer
        await this.windowService.processQualifiedReferral({
            referrerId,
            refereeId: userId,
            subscriptionId,
            planPrice,
        });
    }
}
