import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { WalletModule } from './wallet/wallet.module';
import { RechargeModule } from './recharge/recharge.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { HealthModule } from './health/health.module';
import { SchemaModule } from './common/schema';
import { DashboardModule } from './dashboard/dashboard.module';
import { RedisModule } from './common/redis/redis.module';
import { EmailQueueModule } from './common/email/email-queue.module';
import { UploadModule } from './upload/upload.module';
import { SettingsModule } from './common/settings/settings.module';
import { SupportModule } from './support/support.module';
import { ReferralsModule } from './referrals/referrals.module';
import { EventsModule } from './common/events/events.module';
import { StatsModule } from './stats/stats.module';
import { BullModule } from '@nestjs/bullmq';

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // ============================================
    // CONFIGURATION
    // ============================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ============================================
    // RATE LIMITING
    // ============================================
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') || 60000, // 1 minute
          limit: config.get<number>('THROTTLE_LIMIT') || 60, // 60 requests per minute
        },
      ],
    }),

    // ============================================
    // SCHEDULED TASKS
    // ============================================
    ScheduleModule.forRoot(),

    // ============================================
    // HEALTH CHECKS
    // ============================================
    TerminusModule,

    // ============================================
    // DATABASE
    // ============================================
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.get<number>('DB_PORT') || 5432,
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASS'),
        database: config.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        // Connection pool settings for production
        extra: {
          max: config.get<number>('DB_POOL_SIZE') || 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
        // logging: config.get('NODE_ENV') === 'development' ? ['query', 'error'] : ['error'],
        logging: ['error'],
      }),
    }),

    // ============================================
    // FEATURE MODULES
    // ============================================
    AuthModule,
    UsersModule,
    PlansModule,
    WalletModule,
    RechargeModule,
    SubscriptionsModule,
    WithdrawalsModule,
    HealthModule,
    SchemaModule,
    DashboardModule,
    RedisModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    EmailQueueModule,
    UploadModule,
    SettingsModule,
    SupportModule,
    ReferralsModule,
    EventsModule,
    StatsModule,
  ],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT authentication guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}