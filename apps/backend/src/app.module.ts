import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Core modules
import { TenantModule } from './core/tenant/tenant.module';
import { AuthModule } from './core/auth/auth.module';
import { RbacModule } from './core/rbac/rbac.module';
import { ModuleRegistryModule } from './core/module-registry/module-registry.module';
import { BillingModule } from './core/billing/billing.module';

// Guards
import { SubscriptionGuard } from './core/billing/guards/subscription.guard';
import { UsageGuard } from './core/billing/guards/usage.guard';

// Plugin modules
import { MedicalModule } from './modules/medical/medical.module';

// Main DB entities
import { Tenant } from './core/tenant/tenant.entity';

// Interceptors
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './core/shared/interceptors/audit.interceptor';

/**
 * Root Application Module.
 */
@Module({
  imports: [
    // ─── Configuration ──────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ─── Event Emitter (Async tasks) ─────────────────────────
    EventEmitterModule.forRoot(),

    // ─── Rate Limiting (Hardening) ──────────────────────────
    ThrottlerModule.forRoot([{
        ttl: 60000,
        limit: 100, // max 100 requests per minute by default
    }]),

    // ─── Main Database (Tenant Registry) ────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('MAIN_DB_HOST', 'localhost'),
        port: configService.get<number>('MAIN_DB_PORT', 5432),
        username: configService.get<string>('MAIN_DB_USERNAME', 'postgres'),
        password: configService.get<string>('MAIN_DB_PASSWORD', 'postgres'),
        database: configService.get<string>('MAIN_DB_NAME', 'saas_main'),
        entities: [Tenant],
        synchronize: configService.get<string>('APP_ENV') === 'development',
        logging: configService.get<string>('APP_ENV') === 'development'
          ? ['error', 'warn', 'migration']
          : ['error'],
      }),
      inject: [ConfigService],
    }),

    // ─── Core Modules ───────────────────────────────────────
    TenantModule,
    AuthModule,
    RbacModule,
    ModuleRegistryModule,
    BillingModule,

    // ─── Plugin Modules (add here) ──────────────────────────
    MedicalModule.forRoot(),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: UsageGuard,
    },
  ],
})
export class AppModule {}
