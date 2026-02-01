import { Controller, Post, Body, Res, Get, UseGuards, Req, HttpCode, HttpStatus, Headers, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /auth/register
   * Register a new user account (PUBLIC)
   */
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   * Login for both USER and ADMIN (PUBLIC)
   * Returns role in response so frontend can redirect appropriately
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: any,
  ) {
    const authResult = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );

    this.setCookie(response, authResult.access_token, req);
    return {
      message: 'Login successful',
      user: authResult.user,
      access_token: authResult.access_token,
      role: authResult.role,
    };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() body: { token: string },
    @Res({ passthrough: true }) response: Response,
    @Req() req: any,
  ) {
    const result = await this.authService.verifyEmail(body.token);

    // Auto-login after verification
    this.setCookie(response, result.access_token, req);
    return {
      message: 'Email verified successfully',
      user: result.user,
      access_token: result.access_token,
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  /**
   * POST /auth/logout
   * Clear auth cookie (requires authentication - handled by global guard)
   */
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return { message: 'Logged out successfully' };
  }

  private setCookie(res: Response, token: string, req?: any) {
    // Intelligent Security
    // If strict production AND not a VPN request -> Use Secure Cookie
    // If VPN (admin/ internal IP) -> Allow HTTP Cookie

    const host = req?.headers?.host || '';
    const isVpnRequest = host.includes('admin') || host.includes('10.10.10');
    const isSecure = process.env.NODE_ENV === 'production' && !isVpnRequest;
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: this.configService.get<number>('JWT_COOKIE_MAX_AGE') || 3600000,
    });
  }
}
