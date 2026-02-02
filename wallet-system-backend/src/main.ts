import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // ============================================
  // SECURITY CONFIGURATION
  // ============================================

  // Helmet - Security headers with CSP configured for images
  app.use((req, res, next) => {
    // Skip Helmet entirely for file viewing (allows images to render in cross-origin contexts)
    if (req.path.includes('/upload/view')) {
      return next();
    }
    // Use Helmet for all other routes with relaxed CSP for images
    return helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Disable CSP for now (can be fine-tuned later)
    })(req, res, next);
  });

  // Cookie parser
  app.use(cookieParser());

  // CORS - Restrict to allowed origins
  const allowedOrigins =
    configService.get<string>('ALLOWED_ORIGINS')?.split(',') || [];
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, mobile apps)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (
        allowedOrigins.includes(origin) ||
        configService.get('NODE_ENV') === 'development'
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // ============================================
  // GLOBAL PIPES (BEFORE listen)
  // ============================================

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ============================================
  // GLOBAL INTERCEPTORS (BEFORE listen)
  // ============================================

  app.useGlobalInterceptors(new AuditInterceptor());

  // ============================================
  // API VERSIONING
  // ============================================

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'health/db'],
  });

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================

  app.enableShutdownHooks();

  // ============================================
  // START SERVER
  // ============================================

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  logger.log(`🚀 Application running on port ${port}`);
  logger.log(
    `📍 Environment: ${configService.get('NODE_ENV') || 'development'}`,
  );
  logger.log(
    `🌐 CORS origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'development mode (all origins)'}`,
  );
}

bootstrap();