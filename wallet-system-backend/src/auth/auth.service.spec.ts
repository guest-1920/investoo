import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      referralCode: this.generateReferralCode(),
      referredBy: await this.resolveReferral(dto.referralCode),
    });

    return this.generateToken(user.id, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateToken(user.id, user.role);
  }

  private generateToken(userId: string, role: string) {
    return {
      accessToken: this.jwtService.sign({
        sub: userId,
        role,
      }),
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
