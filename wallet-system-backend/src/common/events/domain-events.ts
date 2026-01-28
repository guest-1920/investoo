// Base event class
export abstract class DomainEvent {
    readonly occurredAt: Date = new Date();
    abstract readonly eventType: string;
}

// ==========================================
// SUBSCRIPTION EVENTS
// ==========================================
export class SubscriptionPurchasedEvent extends DomainEvent {
    readonly eventType = 'subscription.purchased';
    constructor(
        public readonly payload: {
            subscriptionId: string;
            userId: string;
            planId: string;
            planPrice: number; // Added for convenience
            referrerId?: string;
        },
    ) {
        super();
    }
}

// ==========================================
// REFERRAL WINDOW EVENTS
// ==========================================
export class ReferralQualifiedEvent extends DomainEvent {
    readonly eventType = 'referral.qualified';
    constructor(
        public readonly payload: {
            referrerId: string;
            refereeId: string;
            subscriptionId: string;
            windowId: string;
            progressId: string;
            newCount: number;
            targetCount: number;
        },
    ) {
        super();
    }
}

export class WindowProgressCompletedEvent extends DomainEvent {
    readonly eventType = 'window.progress.completed';
    constructor(
        public readonly payload: {
            progressId: string;
            userId: string;
            windowId: string;
            rewardIds: string[];
        },
    ) {
        super();
    }
}

export class WindowProgressExpiredEvent extends DomainEvent {
    readonly eventType = 'window.progress.expired';
    constructor(
        public readonly payload: {
            progressId: string;
            userId: string;
            windowId: string;
        },
    ) {
        super();
    }
}

// ==========================================
// FULFILLMENT EVENTS
// ==========================================
export class FulfillmentCreatedEvent extends DomainEvent {
    readonly eventType = 'fulfillment.created';
    constructor(
        public readonly payload: {
            fulfillmentId: string;
            userId: string;
            rewardId: string;
            rewardType: 'DIGITAL' | 'PHYSICAL';
        },
    ) {
        super();
    }
}

export class FulfillmentStatusChangedEvent extends DomainEvent {
    readonly eventType = 'fulfillment.status.changed';
    constructor(
        public readonly payload: {
            fulfillmentId: string;
            userId: string;
            previousStatus: string;
            newStatus: string;
            trackingNumber?: string;
        },
    ) {
        super();
    }
}
// ==========================================
// REWARD EVENTS
// ==========================================
export class RewardClaimRequestedEvent extends DomainEvent {
    readonly eventType = 'reward.claim.requested';
    constructor(
        public readonly payload: {
            userId: string;
            rewardId: string;
            claimType: 'WALLET' | 'PHYSICAL';
            addressId?: string;
            sourceId: string;
            sourceType: 'PLAN' | 'WINDOW';
        },
    ) {
        super();
    }
}
