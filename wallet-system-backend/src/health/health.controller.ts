import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheck,
} from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  /**
   * GET /health
   * PUBLIC: Application health check
   */
  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }

  /**
   * GET /health/db
   * PUBLIC: Database health check
   */
  @Public()
  @Get('db')
  @HealthCheck()
  checkDb() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
