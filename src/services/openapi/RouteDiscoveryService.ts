/**
 * RouteDiscoveryService
 * 
 * Scans Express routes from all feature modules and extracts metadata
 * for OpenAPI documentation generation.
 */

import { Router } from 'express';
import { RouteMetadata, RouteParameter, SecurityRequirement, RouteDiscoveryService } from './types.js';
import { logInfo, logError } from '../../utils/logger.js';

export class RouteDiscoveryServiceImpl implements RouteDiscoveryService {
  private readonly featureModules = [
    'tenants',
    'projects', 
    'project-types',
    'cloud-providers',
    'cloud-integrations',
    'users',
    'oauth',
    'files'
  ];

  private readonly basePaths: Record<string, string> = {
    'tenants': '/api/v1/tenants',
    'projects': '/api/v1/projects',
    'project-types': '/api/v1/project-types',
    'cloud-providers': '/api/v1/cloud-providers',
    'cloud-integrations': '/api/v1/tenants/:tenantId/integrations',
    'users': '/api/v1/users',
    'oauth': '/api/v1/oauth',
    'files': '/api/v1/projects/:id/files'
  };

  /**
   * Scan all feature routes and extract metadata
   */
  async scanRoutes(): Promise<RouteMetadata[]> {
    logInfo('Starting route discovery scan');
    const allRoutes: RouteMetadata[] = [];

    for (const feature of this.featureModules) {
      try {
        const routes = await this.scanFeatureRoutes(feature);
        allRoutes.push(...routes);
        logInfo(`Discovered ${routes.length} routes for feature: ${feature}`);
      } catch (error) {
        logError(`Failed to scan routes for feature: ${feature}`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    logInfo(`Total routes discovered: ${allRoutes.length}`);
    return allRoutes;
  }

  /**
   * Scan routes for a specific feature module
   */
  private async scanFeatureRoutes(feature: string): Promise<RouteMetadata[]> {
    const routes: RouteMetadata[] = [];
    const basePath = this.basePaths[feature];

    // Get routes based on known patterns from Phase 1 analysis
    const featureRoutes = this.getKnownRoutes(feature, basePath);
    
    for (const route of featureRoutes) {
      const metadata: RouteMetadata = {
        path: route.path,
        method: route.method,
        feature,
        middleware: route.middleware,
        handler: route.handler,
        parameters: this.extractParameters(route.path),
        security: this.extractSecurity(route.middleware)
      };

      routes.push(metadata);
    }

    return routes;
  }

  /**
   * Get known routes for each feature based on Phase 1 analysis
   */
  private getKnownRoutes(feature: string, basePath: string): Array<{
    path: string;
    method: string;
    middleware: string[];
    handler: string;
  }> {
    switch (feature) {
      case 'tenants':
        return [
          { path: `${basePath}`, method: 'GET', middleware: ['authenticateJWT', 'requireSuperAdminRole'], handler: 'getAllTenants' },
          { path: `${basePath}`, method: 'POST', middleware: ['authenticateJWT'], handler: 'createTenant' },
          { path: `${basePath}/me`, method: 'GET', middleware: ['authenticateJWT'], handler: 'getTenant' },
          { path: `${basePath}/:id`, method: 'GET', middleware: ['authenticateJWT', 'requireTenantOwnerOrSuperAdmin'], handler: 'getTenantById' },
          { path: `${basePath}/:id`, method: 'PATCH', middleware: ['authenticateJWT', 'requireTenantOwnerOrSuperAdmin'], handler: 'updateTenant' },
          { path: `${basePath}/:id`, method: 'DELETE', middleware: ['authenticateJWT', 'requireSuperAdminRole'], handler: 'deleteTenant' }
        ];

      case 'projects':
        return [
          { path: `${basePath}`, method: 'GET', middleware: ['authenticateJWT'], handler: 'getProjects' },
          { path: `${basePath}`, method: 'POST', middleware: ['authenticateJWT'], handler: 'createProject' },
          { path: `${basePath}/:id`, method: 'GET', middleware: ['authenticateJWT'], handler: 'getProjectById' },
          { path: `${basePath}/:id`, method: 'PATCH', middleware: ['authenticateJWT', 'requireProjectRole:DEPUTY'], handler: 'updateProject' },
          { path: `${basePath}/:id`, method: 'DELETE', middleware: ['authenticateJWT', 'requireProjectRole:OWNER'], handler: 'deleteProject' },
          { path: `${basePath}/:id/members`, method: 'GET', middleware: ['authenticateJWT', 'requireProjectRole:MEMBER'], handler: 'getProjectMembers' },
          { path: `${basePath}/:id/members`, method: 'POST', middleware: ['authenticateJWT', 'requireProjectRole:DEPUTY'], handler: 'addProjectMember' },
          { path: `${basePath}/:id/members/:userId`, method: 'PATCH', middleware: ['authenticateJWT', 'requireProjectRole:OWNER'], handler: 'updateProjectMember' },
          { path: `${basePath}/:id/members/:userId`, method: 'DELETE', middleware: ['authenticateJWT', 'requireProjectRole:OWNER'], handler: 'removeProjectMember' }
        ];

      case 'project-types':
        return [
          { path: `${basePath}`, method: 'GET', middleware: ['authenticateJWT'], handler: 'getAllProjectTypes' },
          { path: `${basePath}`, method: 'POST', middleware: ['authenticateJWT'], handler: 'createProjectType' },
          { path: `${basePath}/:id`, method: 'GET', middleware: ['authenticateJWT'], handler: 'getProjectTypeById' },
          { path: `${basePath}/:id`, method: 'PATCH', middleware: ['authenticateJWT'], handler: 'updateProjectType' },
          { path: `${basePath}/:id`, method: 'DELETE', middleware: ['authenticateJWT'], handler: 'deleteProjectType' }
        ];

      case 'cloud-providers':
        return [
          { path: `${basePath}`, method: 'GET', middleware: ['authenticateJWT'], handler: 'getAllCloudProviders' },
          { path: `${basePath}`, method: 'POST', middleware: ['authenticateJWT'], handler: 'createCloudProvider' },
          { path: `${basePath}/:id`, method: 'GET', middleware: ['authenticateJWT'], handler: 'getCloudProviderById' },
          { path: `${basePath}/:id`, method: 'PATCH', middleware: ['authenticateJWT'], handler: 'updateCloudProvider' },
          { path: `${basePath}/:id`, method: 'DELETE', middleware: ['authenticateJWT'], handler: 'deleteCloudProvider' }
        ];

      case 'cloud-integrations':
        return [
          { path: `${basePath}`, method: 'GET', middleware: ['authenticateJWT', 'requireTenantOwner'], handler: 'getTenantIntegrations' },
          { path: `${basePath}`, method: 'POST', middleware: ['authenticateJWT', 'requireTenantOwner'], handler: 'createTenantIntegration' },
          { path: `${basePath}/:integrationId`, method: 'GET', middleware: ['authenticateJWT', 'requireTenantOwner'], handler: 'getTenantIntegrationById' },
          { path: `${basePath}/:integrationId`, method: 'PATCH', middleware: ['authenticateJWT', 'requireTenantOwner'], handler: 'updateTenantIntegration' },
          { path: `${basePath}/:integrationId`, method: 'DELETE', middleware: ['authenticateJWT', 'requireTenantOwner'], handler: 'deleteTenantIntegration' },
          { path: `${basePath}/:integrationId/refresh-token`, method: 'POST', middleware: ['authenticateJWT', 'requireTenantOwner'], handler: 'refreshIntegrationToken' },
          { path: `${basePath}/:integrationId/health`, method: 'GET', middleware: ['authenticateJWT', 'requireTenantOwner'], handler: 'checkIntegrationHealth' }
        ];

      case 'users':
        return [
          { path: `${basePath}/me/roles`, method: 'GET', middleware: ['authenticateJWT'], handler: 'getUserRoles' }
        ];

      case 'oauth':
        return [
          { path: `${basePath}/callback`, method: 'GET', middleware: [], handler: 'handleOAuthCallback' },
          { path: `${basePath}/tenants/:tenantId/integrations/:integrationId/refresh`, method: 'POST', middleware: ['authenticateJWT', 'requireTenantOwner'], handler: 'refreshIntegrationTokens' }
        ];

      case 'files':
        return [
          { path: `${basePath}`, method: 'GET', middleware: ['authenticateJWT', 'requireProjectRole:MEMBER'], handler: 'listProjectFiles' }
        ];

      default:
        return [];
    }
  }

  /**
   * Extract middleware information from a route
   */
  extractMiddleware(route: any): string[] {
    // This would be enhanced in a real implementation to inspect actual Express routes
    // For now, return the middleware array passed in
    return Array.isArray(route) ? route : [];
  }

  /**
   * Group routes by feature module
   */
  groupByFeature(routes: RouteMetadata[]): Record<string, RouteMetadata[]> {
    return routes.reduce((groups, route) => {
      if (!groups[route.feature]) {
        groups[route.feature] = [];
      }
      groups[route.feature].push(route);
      return groups;
    }, {} as Record<string, RouteMetadata[]>);
  }

  /**
   * Extract route parameters from path pattern
   */
  extractParameters(path: string): RouteParameter[] {
    const parameters: RouteParameter[] = [];
    const pathParams = path.match(/:([^/]+)/g);

    if (pathParams) {
      for (const param of pathParams) {
        const paramName = param.substring(1); // Remove the ':'
        parameters.push({
          name: paramName,
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: `${paramName} identifier`
        });
      }
    }

    return parameters;
  }

  /**
   * Analyze security requirements from middleware
   */
  extractSecurity(middleware: string[]): SecurityRequirement[] {
    const security: SecurityRequirement[] = [];

    for (const mw of middleware) {
      if (mw === 'authenticateJWT') {
        security.push({ type: 'jwt' });
      } else if (mw === 'requireSuperAdminRole') {
        security.push({ type: 'super-admin' });
      } else if (mw === 'requireTenantOwner' || mw === 'requireTenantOwnerOrSuperAdmin') {
        security.push({ type: 'tenant-owner' });
      } else if (mw.startsWith('requireProjectRole:')) {
        const role = mw.split(':')[1];
        security.push({ type: 'role', value: role });
      }
    }

    return security;
  }
}

// Export singleton instance
export const routeDiscoveryService = new RouteDiscoveryServiceImpl();