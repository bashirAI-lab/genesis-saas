import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { ModuleRegistryService } from './module-registry.service';

/**
 * Module Registry Controller — exposes registered modules and their navigation.
 * The frontend uses this to dynamically build the sidebar.
 *
 * Routes: /api/v1/modules
 */
@Controller('modules')
export class ModuleRegistryController {
  constructor(private readonly registryService: ModuleRegistryService) {}

  /**
   * List all registered modules.
   */
  @Get()
  getAll() {
    const modules = this.registryService.getAllModules();
    return {
      success: true,
      data: modules.map((m) => ({
        code: m.code,
        name: m.name,
        version: m.version,
        description: m.description,
        permissionCount: m.permissions.length,
        entityCount: m.entities.length,
      })),
    };
  }

  /**
   * Get navigation items for the current tenant's active modules.
   */
  @Get('navigation')
  getNavigation(@Req() req: Request) {
    const tenantReq = req as any;
    const activeModules = tenantReq.tenantInfo?.settings?.activeModules || [];
    const navigation = this.registryService.getNavigationForTenant(activeModules);
    return {
      success: true,
      data: navigation,
    };
  }

  /**
   * Get all permissions defined across all modules.
   */
  @Get('permissions')
  getPermissions() {
    const permissions = this.registryService.getAllModulePermissions();
    return {
      success: true,
      data: permissions,
    };
  }
}
