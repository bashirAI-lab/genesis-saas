import { Injectable, Logger } from '@nestjs/common';
import { ModuleManifest } from '../shared/interfaces/pluggable-module.interface';
import { TenantConnectionManager } from '../tenant/tenant-connection.manager';

/**
 * Module Registry — discovers and tracks all registered plugin modules.
 *
 * Plugin modules call `register()` during their `forRoot()` initialization,
 * providing their manifest (permissions, entities, navigation items).
 *
 * The frontend queries /api/v1/modules to get the list of active modules
 * and their navigation items for dynamic sidebar rendering.
 */
@Injectable()
export class ModuleRegistryService {
  private readonly logger = new Logger(ModuleRegistryService.name);

  /** All registered module manifests */
  private readonly modules = new Map<string, ModuleManifest>();

  constructor(
    private readonly connectionManager: TenantConnectionManager,
  ) {}

  /**
   * Register a plugin module. Called during app initialization.
   */
  register(manifest: ModuleManifest): void {
    if (this.modules.has(manifest.code)) {
      this.logger.warn(`Module "${manifest.code}" is already registered. Skipping.`);
      return;
    }

    // Register entities with the connection manager so tenant DBs include them
    if (manifest.entities && manifest.entities.length > 0) {
      this.connectionManager.registerModuleEntities(manifest.entities);
    }

    this.modules.set(manifest.code, manifest);
    this.logger.log(
      `Module registered: ${manifest.name} (${manifest.code}) v${manifest.version} — ${manifest.permissions.length} permissions, ${manifest.entities.length} entities`,
    );
  }

  /**
   * Get all registered modules.
   */
  getAllModules(): ModuleManifest[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get a specific module by code.
   */
  getModule(code: string): ModuleManifest | undefined {
    return this.modules.get(code);
  }

  /**
   * Get navigation items for active modules (filtered by tenant's active modules).
   */
  getNavigationForTenant(activeModuleCodes: string[]): ModuleManifest['navigation'][] {
    const navigation: ModuleManifest['navigation'][] = [];

    for (const code of activeModuleCodes) {
      const mod = this.modules.get(code);
      if (mod) {
        navigation.push(mod.navigation);
      }
    }

    return navigation;
  }

  /**
   * Get all permissions defined by registered modules.
   */
  getAllModulePermissions(): Array<{ module: string; permissions: ModuleManifest['permissions'] }> {
    return Array.from(this.modules.values()).map((mod) => ({
      module: mod.code,
      permissions: mod.permissions,
    }));
  }
}
