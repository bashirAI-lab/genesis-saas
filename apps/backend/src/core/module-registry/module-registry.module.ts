import { Module, Global } from '@nestjs/common';
import { ModuleRegistryService } from './module-registry.service';
import { ModuleRegistryController } from './module-registry.controller';

/**
 * Module Registry Module — global so all plugin modules can inject it.
 */
@Global()
@Module({
  providers: [ModuleRegistryService],
  controllers: [ModuleRegistryController],
  exports: [ModuleRegistryService],
})
export class ModuleRegistryModule {}
