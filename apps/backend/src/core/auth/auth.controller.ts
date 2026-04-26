import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { AuthService, RegisterDto, LoginDto, JwtPayload } from './auth.service';
import { TenantAwareRequest } from '../shared/interfaces/tenant-aware-request.interface';
import { JwtAuthGuard, IS_PUBLIC_KEY } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

/** Decorator to mark a route as public (no JWT required) */
const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Auth Controller — handles registration, login, token refresh, and logout.
 * Login and register are public; refresh and logout require authentication.
 *
 * Routes: /api/v1/auth
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Req() req: TenantAwareRequest,
    @Body() dto: RegisterDto,
  ) {
    const result = await this.authService.register(
      req.tenantDataSource,
      req.tenantId,
      req.tenantSlug,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'Registration successful.',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: TenantAwareRequest,
    @Body() dto: LoginDto,
  ) {
    const result = await this.authService.login(
      req.tenantDataSource,
      req.tenantId,
      req.tenantSlug,
      dto,
    );

    return {
      success: true,
      data: result,
      message: 'Login successful.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: TenantAwareRequest,
    @CurrentUser() user: JwtPayload,
    @Body('refreshToken') refreshToken: string,
  ) {
    const tokens = await this.authService.refreshTokens(
      req.tenantDataSource,
      req.tenantId,
      req.tenantSlug,
      user.userId,
      refreshToken,
    );

    return {
      success: true,
      data: tokens,
      message: 'Tokens refreshed successfully.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: TenantAwareRequest,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.authService.logout(req.tenantDataSource, user.userId);
    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }
}
