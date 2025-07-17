/**
 * OpenAPIDocumentBuilder
 * 
 * Combines route metadata with schemas to build complete OpenAPI 3.1.0 specification
 * documents that comply with the OpenAPI standard.
 */

import { RouteMetadata, OpenAPIDocumentBuilder } from './types.js';
import { schemaGenerationService } from './SchemaGenerationService.js';
import { logInfo, logError } from '../../utils/logger.js';
import { env } from '../../config/env.js';

export class OpenAPIDocumentBuilderImpl implements OpenAPIDocumentBuilder {
  /**
   * Build complete OpenAPI 3.1.0 specification
   */
  async buildDocument(routes: RouteMetadata[]): Promise<any> {
    logInfo('Building complete OpenAPI 3.1.0 document');

    try {
      const document = {
        openapi: '3.1.0',
        info: await this.generateInfo(),
        servers: this.generateServers(),
        paths: this.generatePaths(routes),
        components: await this.generateComponents(),
        security: this.generateGlobalSecurity(),
        tags: this.generateTags(routes)
      };

      logInfo('OpenAPI document built successfully', {
        pathCount: Object.keys(document.paths).length,
        schemaCount: Object.keys(document.components.schemas || {}).length
      });

      return document;
    } catch (error) {
      logError('Failed to build OpenAPI document', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate API information section
   */
  private async generateInfo(): Promise<any> {
    return {
      title: 'MWAP API',
      version: '1.0.0',
      description: `
# Modular Web Application Platform API

A comprehensive, secure, and scalable SaaS framework API built with Node.js, Express, and MongoDB Atlas.

## Features
- **Multi-tenant Architecture**: Secure tenant isolation and management
- **Project Management**: Complete project lifecycle with role-based access control
- **Cloud Integrations**: Support for multiple cloud providers and services
- **OAuth Integration**: Secure authentication and authorization flows
- **File Management**: Project-based file storage and management
- **User Management**: Role-based user management and permissions

## Authentication
All API endpoints require JWT authentication using Auth0. Include the JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rate Limiting
API requests are rate-limited to 100 requests per 15-minute window per IP address.

## Error Handling
All errors follow a consistent format with appropriate HTTP status codes and detailed error messages.
      `.trim(),
      contact: {
        name: 'MWAP Team',
        url: 'https://github.com/dhirmadi/mwapserver',
        email: 'support@mwap.dev'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      },
      termsOfService: 'https://mwap.dev/terms'
    };
  }

  /**
   * Generate server configurations
   */
  private generateServers(): any[] {
    const servers = [];

    try {
      if (env.NODE_ENV === 'production') {
        servers.push({
          url: 'https://api.mwap.dev',
          description: 'Production server'
        });
      } else {
        servers.push({
          url: `http://localhost:${env.PORT || 3000}`,
          description: 'Development server'
        });
      }
    } catch (error) {
      // Fallback if env is not available
      servers.push({
        url: 'http://localhost:3000',
        description: 'Development server'
      });
    }

    return servers;
  }

  /**
   * Generate paths section from routes
   */
  generatePaths(routes: RouteMetadata[]): any {
    const paths: any = {};

    for (const route of routes) {
      const pathKey = this.convertPathToOpenAPI(route.path);
      
      if (!paths[pathKey]) {
        paths[pathKey] = {};
      }

      const method = route.method.toLowerCase();
      const routeSchemas = schemaGenerationService.generateRouteSchemas(route);

      paths[pathKey][method] = {
        tags: [this.getTagForFeature(route.feature)],
        summary: this.generateSummary(route),
        description: this.generateDescription(route),
        operationId: this.generateOperationId(route),
        parameters: this.generateParameters(route),
        ...(routeSchemas.requestBody && { requestBody: routeSchemas.requestBody }),
        responses: routeSchemas.responses,
        security: this.generateRouteSecurity(route)
      };
    }

    return paths;
  }

  /**
   * Generate components section with schemas
   */
  async generateComponents(): Promise<any> {
    const schemas = await schemaGenerationService.getAllSchemas();
    
    return {
      schemas,
      securitySchemes: this.generateSecuritySchemes(),
      responses: this.generateCommonResponses(),
      parameters: this.generateCommonParameters()
    };
  }

  /**
   * Generate security schemes
   */
  generateSecuritySchemes(): any {
    return {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from Auth0'
      },
      superAdminRole: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Super-Admin',
        description: 'Super administrator role requirement'
      },
      tenantOwnerRole: {
        type: 'apiKey',
        in: 'header', 
        name: 'X-Tenant-Owner',
        description: 'Tenant owner role requirement'
      },
      projectRole: {
        type: 'apiKey',
        in: 'header',
        name: 'X-Project-Role',
        description: 'Project role requirement (MEMBER, DEPUTY, OWNER)'
      }
    };
  }

  /**
   * Generate global security requirements
   */
  private generateGlobalSecurity(): any[] {
    return [
      { bearerAuth: [] }
    ];
  }

  /**
   * Generate tags from routes
   */
  private generateTags(routes: RouteMetadata[]): any[] {
    const features = [...new Set(routes.map(route => route.feature))];
    
    return features.map(feature => ({
      name: this.getTagForFeature(feature),
      description: this.getTagDescription(feature)
    }));
  }

  /**
   * Convert Express path pattern to OpenAPI path pattern
   */
  private convertPathToOpenAPI(path: string): string {
    return path.replace(/:([^/]+)/g, '{$1}');
  }

  /**
   * Get tag name for a feature
   */
  private getTagForFeature(feature: string): string {
    const tagMap: Record<string, string> = {
      'tenants': 'Tenants',
      'projects': 'Projects',
      'project-types': 'Project Types',
      'cloud-providers': 'Cloud Providers',
      'cloud-integrations': 'Cloud Integrations',
      'users': 'Users',
      'oauth': 'OAuth',
      'files': 'Files'
    };

    return tagMap[feature] || feature.charAt(0).toUpperCase() + feature.slice(1);
  }

  /**
   * Get tag description for a feature
   */
  private getTagDescription(feature: string): string {
    const descriptions: Record<string, string> = {
      'tenants': 'Multi-tenant organization management',
      'projects': 'Project lifecycle and member management',
      'project-types': 'Project type definitions and templates',
      'cloud-providers': 'Cloud provider configurations',
      'cloud-integrations': 'Tenant-specific cloud service integrations',
      'users': 'User management and role assignments',
      'oauth': 'OAuth authentication and token management',
      'files': 'Project-based file storage and management'
    };

    return descriptions[feature] || `${feature} management operations`;
  }

  /**
   * Generate summary for a route
   */
  private generateSummary(route: RouteMetadata): string {
    const { method, feature, path } = route;
    const action = this.getActionFromMethod(method);
    const entity = this.getEntityFromFeature(feature);

    if (path.includes('/members')) {
      return `${action} project member${method === 'GET' ? 's' : ''}`;
    }

    if (path.includes('/integrations')) {
      return `${action} cloud integration${method === 'GET' && !path.includes('/:') ? 's' : ''}`;
    }

    if (path.includes('/files')) {
      return `${action} project file${method === 'GET' ? 's' : ''}`;
    }

    if (path.includes('/callback')) {
      return 'Handle OAuth callback';
    }

    if (path.includes('/refresh')) {
      return 'Refresh integration tokens';
    }

    if (path.includes('/health')) {
      return 'Check integration health';
    }

    if (path.includes('/roles')) {
      return 'Get user roles';
    }

    if (path.includes('/me')) {
      return `Get current user's ${entity}`;
    }

    const hasId = path.includes('/:');
    if (method === 'GET') {
      return hasId ? `Get ${entity} by ID` : `List all ${entity}s`;
    }

    return `${action} ${entity}`;
  }

  /**
   * Generate description for a route
   */
  private generateDescription(route: RouteMetadata): string {
    const summary = this.generateSummary(route);
    const securityDesc = this.getSecurityDescription(route);
    
    return `${summary}. ${securityDesc}`;
  }

  /**
   * Generate operation ID for a route
   */
  private generateOperationId(route: RouteMetadata): string {
    const { method, feature, path } = route;
    
    let operation = method.toLowerCase();
    let resource = feature.replace(/-/g, '');

    if (path.includes('/members')) {
      resource += 'Members';
    } else if (path.includes('/integrations')) {
      resource = 'integrations';
    } else if (path.includes('/files')) {
      resource += 'Files';
    } else if (path.includes('/callback')) {
      return 'handleOAuthCallback';
    } else if (path.includes('/refresh')) {
      return 'refreshIntegrationTokens';
    } else if (path.includes('/health')) {
      return 'checkIntegrationHealth';
    } else if (path.includes('/roles')) {
      return 'getUserRoles';
    }

    if (path.includes('/me')) {
      operation = 'getCurrent';
    } else if (path.includes('/:') && method === 'GET') {
      operation = 'getById';
    }

    return operation + resource.charAt(0).toUpperCase() + resource.slice(1);
  }

  /**
   * Generate parameters for a route
   */
  private generateParameters(route: RouteMetadata): any[] {
    const parameters: any[] = [];

    // Add path parameters
    if (route.parameters) {
      for (const param of route.parameters) {
        parameters.push({
          name: param.name,
          in: param.in,
          required: param.required,
          schema: param.schema,
          description: param.description
        });
      }
    }

    // Add common query parameters for list endpoints
    if (route.method === 'GET' && !route.path.includes('/:')) {
      parameters.push(
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Page number for pagination'
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          description: 'Number of items per page'
        }
      );

      if (route.feature === 'tenants') {
        parameters.push({
          name: 'includeArchived',
          in: 'query',
          required: false,
          schema: { type: 'boolean', default: false },
          description: 'Include archived tenants in results'
        });
      }
    }

    return parameters;
  }

  /**
   * Generate security requirements for a specific route
   */
  private generateRouteSecurity(route: RouteMetadata): any[] {
    const security: any[] = [];

    if (!route.security || route.security.length === 0) {
      // OAuth callback is public
      if (route.path.includes('/callback')) {
        return [];
      }
      // Default to JWT auth
      return [{ bearerAuth: [] }];
    }

    const hasJWT = route.security.some(s => s.type === 'jwt');
    if (hasJWT) {
      security.push({ bearerAuth: [] });
    }

    // Add role-based security
    for (const sec of route.security) {
      switch (sec.type) {
        case 'super-admin':
          security.push({ superAdminRole: [] });
          break;
        case 'tenant-owner':
          security.push({ tenantOwnerRole: [] });
          break;
        case 'role':
          security.push({ projectRole: [sec.value || ''] });
          break;
      }
    }

    return security.length > 0 ? security : [{ bearerAuth: [] }];
  }

  /**
   * Generate common response definitions
   */
  private generateCommonResponses(): any {
    return {
      UnauthorizedError: {
        description: 'Unauthorized - JWT token is missing or invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      ForbiddenError: {
        description: 'Forbidden - Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      },
      ValidationError: {
        description: 'Validation error - Invalid request data',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      }
    };
  }

  /**
   * Generate common parameter definitions
   */
  private generateCommonParameters(): any {
    return {
      PageParam: {
        name: 'page',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, default: 1 },
        description: 'Page number for pagination'
      },
      LimitParam: {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        description: 'Number of items per page'
      }
    };
  }

  /**
   * Helper methods
   */
  private getActionFromMethod(method: string): string {
    const actions: Record<string, string> = {
      'GET': 'Get',
      'POST': 'Create',
      'PATCH': 'Update',
      'PUT': 'Update',
      'DELETE': 'Delete'
    };
    return actions[method.toUpperCase()] || 'Process';
  }

  private getEntityFromFeature(feature: string): string {
    const entities: Record<string, string> = {
      'tenants': 'tenant',
      'projects': 'project',
      'project-types': 'project type',
      'cloud-providers': 'cloud provider',
      'cloud-integrations': 'integration',
      'users': 'user',
      'oauth': 'oauth',
      'files': 'file'
    };
    return entities[feature] || feature;
  }

  private getSecurityDescription(route: RouteMetadata): string {
    if (!route.security || route.security.length === 0) {
      if (route.path.includes('/callback')) {
        return 'This is a public endpoint for OAuth callbacks.';
      }
      return 'Requires JWT authentication.';
    }

    const requirements: string[] = ['Requires JWT authentication'];
    
    for (const sec of route.security) {
      switch (sec.type) {
        case 'super-admin':
          requirements.push('super administrator privileges');
          break;
        case 'tenant-owner':
          requirements.push('tenant owner or super administrator privileges');
          break;
        case 'role':
          requirements.push(`project ${sec.value} role or higher`);
          break;
      }
    }

    return requirements.join(' and ') + '.';
  }
}

// Export singleton instance
export const openAPIDocumentBuilder = new OpenAPIDocumentBuilderImpl();