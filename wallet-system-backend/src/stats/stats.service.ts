import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Redis } from 'ioredis';

@Injectable()
export class StatsService implements OnModuleInit {
    private readonly logger = new Logger(StatsService.name);
    private readonly REDIS_KEY = 'metrics:data';

    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) { }

    async onModuleInit() {
        // Initialize if empty
        const exists = await this.redis.exists(this.REDIS_KEY);
        if (!exists) {
            await this.resetStats();
        }
    }

    private async resetStats() {
        const initialStats = {
            aum: 12.150,
            activeInvestors: 42000,
            marketsCovered: 63,
            averageYield: 8.42,
            lastUpdated: new Date().toISOString(),
        };
        await this.redis.set(this.REDIS_KEY, JSON.stringify(initialStats));
        this.logger.log('Stats initialized');
    }

    @Cron(CronExpression.EVERY_5_SECONDS)
    async updateStats() {
        const data = await this.redis.get(this.REDIS_KEY);
        if (!data) {
            await this.resetStats();
            return;
        }

        const stats = JSON.parse(data);

        // Apply logic similar to the frontend simulation

        // 1. AUM (Growth): Target 1.3M per day
        // 1 day = 86400 seconds = 17280 runs (at 5s interval)
        // Increment = 1.3 / 17280
        const aumIncrement = 1.3 / 17280;

        // Add tiny variance so it doesn't look purely linear, but stays close to target
        const aumVariance = aumIncrement * 0.1;
        const aumNoise = (Math.random() - 0.5) * 2 * aumVariance;
        stats.aum += aumIncrement + aumNoise;

        // 2. Active Investors (Growth): Increase by 1 every minute
        // 1 minute = 12 runs (at 5s interval)
        // Increment = 1 / 12
        stats.activeInvestors += 1 / 12;

        // 3. Markets Covered (Growth): Increase by 1 in 12 days
        // 12 days = 12 * 17280 runs
        // Increment = 1 / 207360
        stats.marketsCovered += 1 / 207360;

        // 4. Average Yield (Fluctuation): 0.04 variance
        stats.averageYield += (Math.random() - 0.5) * 0.04;

        // Clamp Yield to realistic bounds if needed (e.g. 5% to 15%)
        if (stats.averageYield < 5) stats.averageYield = 5;
        if (stats.averageYield > 15) stats.averageYield = 15;

        stats.lastUpdated = new Date().toISOString();

        await this.redis.set(this.REDIS_KEY, JSON.stringify(stats));
        // this.logger.debug('Stats updated via Cron');
    }

    async getStats() {
        const data = await this.redis.get(this.REDIS_KEY);
        return data ? JSON.parse(data) : null;
    }
}