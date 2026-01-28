import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReferralWindowService } from './windows/windows.service';
import { FulfillmentsService } from './fulfillments/fulfillments.service';
import { FulfillmentStatus } from './fulfillments/entities/reward-fulfillment.entity';

@Controller('referrals')
@UseGuards(JwtAuthGuard)
export class ReferralsController {
    constructor(
        private readonly windowService: ReferralWindowService,
        private readonly fulfillmentService: FulfillmentsService,
    ) { }

    @Get('stats')
    async getStats(@Request() req) {
        // This is a simplified version of stats
        // In a real app, you might want to cache this or use a more optimized query
        const userId = req.user.id;

        // Use existing service methods where possible
        const progress = await this.windowService.getUserProgress(userId);
        const fulfillments = await this.fulfillmentService.findByUser(userId, { limit: 100 });

        // pendingRewards: count fulfillments with status PENDING
        const pendingRewards = fulfillments.data.filter(f => f.status === FulfillmentStatus.PENDING).length;

        // totalEarned: sum of DELIVERED rewards value (simplified)
        const totalEarned = fulfillments.data
            .filter(f => f.status === 'DELIVERED')
            .reduce((sum, f) => sum + (Number(f.reward?.value) || 0), 0);

        return {
            totalReferrals: 0, // Need UsersService to count this, skipping for now to avoid complexity
            totalEarned,
            pendingRewards,
        };
    }
}
