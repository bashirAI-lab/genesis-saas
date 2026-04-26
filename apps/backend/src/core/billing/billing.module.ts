import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { UsageService } from './usage.service';
import { TenantModule } from '../tenant/tenant.module';
import { ModuleRegistryModule } from '../module-registry/module-registry.module';

@Module({
  imports: [TenantModule, ModuleRegistryModule],
  controllers: [BillingController],
  providers: [BillingService, UsageService],
  exports: [UsageService],
})
export class BillingModule {}
