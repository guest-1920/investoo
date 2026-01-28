import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { EmailProducer } from '../common/email/email.producer';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly emailProducer: EmailProducer,
    private readonly configService: ConfigService,
  ) {}

  /**
   * STEP 1: REGISTER
   * Caches registration data in Redis and sends verification email.
   * Does NOT create a user in the database yet.
   */
  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Generate Token
    const token = randomUUID();
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Cache Data in Redis (TTL: 24 hours)
    const redisKey = `auth:register:${token}`;
    const registrationData = {
      ...dto,
      password: hashedPassword,
    };
    const ttl =
      this.configService.get<number>('AUTH_VERIFICATION_TOKEN_TTL') || 3600;
    await this.redis.set(redisKey, JSON.stringify(registrationData), 'EX', ttl);

    // Send Email
    await this.emailProducer.sendVerificationEmail(dto.email, token);

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  /**
   * STEP 2: VERIFY EMAIL
   * Retrieves data from Redis and creates the user in the database.
   */
  async verifyEmail(token: string) {
    const redisKey = `auth:register:${token}`;
    const dataString = await this.redis.get(redisKey);

    if (!dataString) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const dto = JSON.parse(dataString);

    // Create User
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password, // Already hashed
      referralCode: this.generateReferralCode(),
      referredBy: await this.resolveReferral(dto.referralCode),
    });

    // Cleanup Redis
    await this.redis.del(redisKey);

    // Auto-Login
    return this.signToken(user.id, user.role);
  }

  /**
   * LOGIN
   * Supports optional 2FA.
   */
  async login(email: string, pass: string) {
    const user = await this.usersService.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.role);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Return success even if user not found to prevent enumeration
      // But verify if that's desired. User wants "production practices", so YES.
      return { message: 'If an account exists, a reset link has been sent.' };
    }

    const token = randomUUID();
    const redisKey = `auth:reset_password:${token}`;

    // Store userId in Redis with 15 mins expiry
    // Store userId in Redis with 15 mins expiry (or configured)
    const ttl = this.configService.get<number>('AUTH_RESET_TOKEN_TTL') || 900;
    await this.redis.set(redisKey, user.id, 'EX', ttl);

    // Send Email
    await this.emailProducer.sendPasswordResetEmail(user.email, token);

    return { message: 'If an account exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const redisKey = `auth:reset_password:${token}`;
    const userId = await this.redis.get(redisKey);

    if (!userId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.update(userId, { password: hashedPassword });

    // cleanup
    await this.redis.del(redisKey);

    return { message: 'Password reset successfully. You can now login.' };
  }

  private signToken(userId: string, role: string) {
    return {
      access_token: this.jwtService.sign({
        // consistent naming snake_case or camelCase? Controller expects access_token
        sub: userId,
        role,
      }),
      role,
      user: { id: userId, role }, // Helpful for frontend
    };
  }

  private generateReferralCode(): string {
    return randomUUID().slice(0, 8);
  }

  private async resolveReferral(code?: string): Promise<string | undefined> {
    if (!code) return undefined;
    const referrer = await this.usersService.findByReferralCode(code);
    return referrer ? referrer.id : undefined;
  }
}
