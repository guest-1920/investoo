import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
    ReferralWindowProgress,
    ReferralWindowProgressStatus,
} from './entities/referral-window-progress.entity';
import { WindowProgressExpiredEvent } from '../../common/events/domain-events';

@Injectable()
export class WindowsExpiryService {
    private readonly logger = new Logger(WindowsExpiryService.name);

    constructor(
        @InjectRepository(ReferralWindowProgress)
        private progressRepo: Repository<ReferralWindowProgress>,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    @Cron(CronExpression.EVERY_HOUR)
    async expireWindows() {
        try {
            const now = new Date();

            // Find windows in progress that have passed their end date
            const expiredProgresses = await this.progressRepo.find({
                where: {
                    status: ReferralWindowProgressStatus.IN_PROGRESS,
                    windowEnd: LessThan(now),
                },
            });

            if (expiredProgresses.length > 0) {
                this.logger.log(`Found ${expiredProgresses.length} expired window progresses`);

                for (const progress of expiredProgresses) {
                    progress.status = ReferralWindowProgressStatus.EXPIRED;
                    await this.progressRepo.save(progress);

                    this.eventEmitter.emit(
                        'window.progress.expired',
                        new WindowProgressExpiredEvent({
                            progressId: progress.id,
                            userId: progress.userId,
                            windowId: progress.windowId,
                        }),
                    );
                }
            }
        } catch (error) {
            this.logger.error('Failed to run window expiry job', error.stack);
        }
    }
}
