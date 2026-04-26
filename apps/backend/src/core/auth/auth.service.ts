import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../rbac/entities/user.entity';
import { Role } from '../rbac/entities/role.entity';
import { RbacService } from '../rbac/rbac.service';

export interface JwtPayload {
  userId: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  roles: string[];
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Auth Service — handles registration, login, token issuance, and refresh.
 * Operates on the TENANT DataSource provided by the middleware.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly rbacService: RbacService,
  ) {}

  /**
   * Register a new user in the tenant's database.
   */
  async register(
    dataSource: DataSource,
    tenantId: string,
    tenantSlug: string,
    dto: RegisterDto,
  ): Promise<{ user: Partial<User>; tokens: AuthTokens }> {
    const userRepo = dataSource.getRepository(User);

    // Check if email already exists
    const existing = await userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new HttpException('Email already registered', HttpStatus.CONFLICT);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = userRepo.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || null,
      isActive: true,
    });

    const saved = await userRepo.save(user);

    // Assign default 'viewer' role
    const roleRepo = dataSource.getRepository(Role);
    const viewerRole = await roleRepo.findOne({ where: { name: 'viewer' } });
    if (viewerRole) {
      await this.rbacService.assignRole(dataSource, saved.id, viewerRole.id);
    }

    // Generate tokens
    const tokens = await this.generateTokens(saved, tenantId, tenantSlug, dataSource);

    // Store refresh token hash
    saved.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    saved.lastLogin = new Date();
    await userRepo.save(saved);

    this.logger.log(`User registered: ${saved.email} in tenant: ${tenantSlug}`);

    return {
      user: {
        id: saved.id,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
      },
      tokens,
    };
  }

  /**
   * Authenticate a user and issue tokens.
   */
  async login(
    dataSource: DataSource,
    tenantId: string,
    tenantSlug: string,
    dto: LoginDto,
  ): Promise<{ user: Partial<User>; tokens: AuthTokens }> {
    const userRepo = dataSource.getRepository(User);

    const user = await userRepo.findOne({
      where: { email: dto.email },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new HttpException('Account is deactivated', HttpStatus.FORBIDDEN);
    }

    // Verify password
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, tenantId, tenantSlug, dataSource);

    // Update refresh token hash and last login
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    user.lastLogin = new Date();
    await userRepo.save(user);

    this.logger.log(`User logged in: ${user.email} in tenant: ${tenantSlug}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshTokens(
    dataSource: DataSource,
    tenantId: string,
    tenantSlug: string,
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    const userRepo = dataSource.getRepository(User);

    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) {
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }

    const tokens = await this.generateTokens(user, tenantId, tenantSlug, dataSource);

    // Rotate refresh token
    user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await userRepo.save(user);

    return tokens;
  }

  /**
   * Logout — invalidate refresh token.
   */
  async logout(dataSource: DataSource, userId: string): Promise<void> {
    const userRepo = dataSource.getRepository(User);
    await userRepo.update(userId, { refreshTokenHash: null });
  }

  // ─── Private Methods ──────────────────────────────────────

  private async generateTokens(
    user: User,
    tenantId: string,
    tenantSlug: string,
    dataSource: DataSource,
  ): Promise<AuthTokens> {
    // Get user roles
    const roles = user.userRoles?.map((ur) => ur.role?.name).filter(Boolean) as string[] || [];

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      tenantId,
      tenantSlug,
      roles,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET')!;
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '15m');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');

    const accessToken = this.jwtService.sign(payload as any, {
      secret: jwtSecret,
      expiresIn: expiresIn as any,
    });

    const refreshToken = this.jwtService.sign(
      { userId: user.id, tenantId } as any,
      {
        secret: jwtRefreshSecret,
        expiresIn: refreshExpiresIn as any,
      },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}
