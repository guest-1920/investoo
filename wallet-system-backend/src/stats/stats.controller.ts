import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    @Public()
    @Get()
    async getStats() {
        return this.statsService.getStats();
    }
}