/**
 * SchemaGenerationService
 * 
 * Converts Zod schemas to OpenAPI schemas and generates request/response
 * schemas for API routes.
 */

import { OpenAPIRegistry, OpenApiGeneratorV31, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI functionality
extendZodWithOpenApi(z);
import { RouteMetadata, SchemaGenerationService } from './types.js';
import { logInfo, logError } from '../../utils/logger.js';

// Import all Zod schemas
import { 
  tenantSchema, 
  createTenantSchema, 
  updateTenantSchema, 
  tenantResponseSchema 
} from '../../schemas/tenant.schema.js';

import { 
  projectSchema, 
  createProjectSchema, 
  updateProjectSchema 
} from '../../schemas/project.schema.js';

import { 
  projectTypeSchema, 
  createProjectTypeSchema, 
  projectTypeUpdateSchema 
} from '../../schemas/projectType.schema.js';

import { 
  cloudProviderSchema, 
  createCloudProviderSchema, 
  updateCloudProviderSchema 
} from '../../schemas/cloudProvider.schema.js';

import { 
  cloudProviderIntegrationSchema, 
  createCloudProviderIntegrationSchema, 
  updateCloudProviderIntegrationSchema 
} from '../../schemas/cloudProviderIntegration.schema.js';

import { 
  userRolesResponseSchema,
  projectRoleSchema
} from '../../schemas/user.schema.js';

import { 
  fileSchema,
  fileQuerySchema
} from '../../schemas/file.schema.js';

export class SchemaGenerationServiceImpl implements SchemaGenerationService {
  private registry: OpenAPIRegistry;
  private schemasRegistered = false;

  constructor() {
    this.registry = new OpenAPIRegistry();
  }

  /**
   * Convert a Zod schema to OpenAPI schema format
   */
  zodToOpenAPI(zodSchema: any, name?: string): any {
    try {
      if (name) {
        this.registry.register(name, zodSchema);
      }
      
      const generator = new OpenApiGeneratorV31(this.registry.definitions);
      const document = generator.generateDocument({
        openapi: '3.1.0',
        info: { title: 'Temp', version: '1.0.0' }
      });

      // Extract the schema from the generated document
      if (name && document.components?.schemas?.[name]) {
        return document.components.schemas[name];
      }

      // For inline schemas, generate directly
      return this.convertZodToOpenAPISchema(zodSchema);
    } catch (error) {
      logError('Failed to convert Zod schema to OpenAPI', {
        schemaName: name,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate request/response schemas for a route
   */
  generateRouteSchemas(route: RouteMetadata): {
    requestBody?: any;
    responses: Record<string, any>;
  } {
    const result: { requestBody?: any; responses: Record<string, any> } = {
      responses: {}
    };

    // Generate request body schema for POST/PATCH/PUT methods
    if (['POST', 'PATCH', 'PUT'].includes(route.method.toUpperCase())) {
      result.requestBody = this.generateRequestBodySchema(route);
    }

    // Generate response schemas
    result.responses = this.generateResponseSchemas(route);

    return result;
  }

  /**
   * Get all available Zod schemas from the schemas directory
   */
  async getAllSchemas(): Promise<Record<string, any>> {
    if (!this.schemasRegistered) {
      await this.registerAllSchemas();
      this.schemasRegistered = true;
    }

    const generator = new OpenApiGeneratorV31(this.registry.definitions);
    const document = generator.generateDocument({
      openapi: '3.1.0',
      info: { title: 'MWAP API', version: '1.0.0' }
    });

    return document.components?.schemas || {};
  }

  /**
   * Register all available Zod schemas with the OpenAPI registry
   */
  private async registerAllSchemas(): Promise<void> {
    logInfo('Registering all Zod schemas with OpenAPI registry');

    try {
      // Tenant schemas
      this.registry.register('Tenant', tenantResponseSchema.openapi('Tenant'));
      this.registry.register('CreateTenant', createTenantSchema.openapi('CreateTenant'));
      this.registry.register('UpdateTenant', updateTenantSchema.openapi('UpdateTenant'));

      // Project schemas
      this.registry.register('Project', projectSchema.openapi('Project'));
      this.registry.register('CreateProject', createProjectSchema.openapi('CreateProject'));
      this.registry.register('UpdateProject', updateProjectSchema.openapi('UpdateProject'));

      // Project Type schemas
      this.registry.register('ProjectType', projectTypeSchema.openapi('ProjectType'));
      this.registry.register('CreateProjectType', createProjectTypeSchema.openapi('CreateProjectType'));
      this.registry.register('UpdateProjectType', projectTypeUpdateSchema.openapi('UpdateProjectType'));

      // Cloud Provider schemas
      this.registry.register('CloudProvider', cloudProviderSchema.openapi('CloudProvider'));
      this.registry.register('CreateCloudProvider', createCloudProviderSchema.openapi('CreateCloudProvider'));
      this.registry.register('UpdateCloudProvider', updateCloudProviderSchema.openapi('UpdateCloudProvider'));

      // Cloud Provider Integration schemas
      this.registry.register('CloudProviderIntegration', cloudProviderIntegrationSchema.openapi('CloudProviderIntegration'));
      this.registry.register('CreateCloudProviderIntegration', createCloudProviderIntegrationSchema.openapi('CreateCloudProviderIntegration'));
      this.registry.register('UpdateCloudProviderIntegration', updateCloudProviderIntegrationSchema.openapi('UpdateCloudProviderIntegration'));

      // User schemas
      this.registry.register('UserRoles', userRolesResponseSchema.openapi('UserRoles'));
      this.registry.register('ProjectRole', projectRoleSchema.openapi('ProjectRole'));

      // File schemas
      this.registry.register('File', fileSchema.openapi('File'));
      this.registry.register('FileQuery', fileQuerySchema.openapi('FileQuery'));

      // Common response schemas
      this.registry.register('SuccessResponse', z.object({
        success: z.boolean(),
        data: z.any().optional(),
        message: z.string().optional()
      }).openapi('SuccessResponse'));

      this.registry.register('ErrorResponse', z.object({
        success: z.boolean().default(false),
        error: z.object({
          code: z.string(),
          message: z.string(),
          status: z.number()
        })
      }).openapi('ErrorResponse'));

      // Pagination schema
      this.registry.register('PaginationMeta', z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number()
      }).openapi('PaginationMeta'));

      logInfo('All Zod schemas registered successfully');
    } catch (error) {
      logError('Failed to register Zod schemas', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate request body schema based on route
   */
  private generateRequestBodySchema(route: RouteMetadata): any {
    const { feature, method, path } = route;

    // Determine the appropriate schema based on feature and method
    let schemaRef: string | null = null;

    if (method.toUpperCase() === 'POST') {
      switch (feature) {
        case 'tenants':
          schemaRef = '#/components/schemas/CreateTenant';
          break;
        case 'projects':
          if (path.includes('/members')) {
            // Project member creation - would need a specific schema
            return {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      userId: { type: 'string' },
                      role: { type: 'string', enum: ['MEMBER', 'DEPUTY', 'OWNER'] }
                    },
                    required: ['userId', 'role']
                  }
                }
              }
            };
          }
          schemaRef = '#/components/schemas/CreateProject';
          break;
        case 'project-types':
          schemaRef = '#/components/schemas/CreateProjectType';
          break;
        case 'cloud-providers':
          schemaRef = '#/components/schemas/CreateCloudProvider';
          break;
        case 'cloud-integrations':
          schemaRef = '#/components/schemas/CreateCloudProviderIntegration';
          break;
        case 'users':
          // Users don't have create operations in current schema
          return undefined;
        case 'files':
          // Files use query schema for listing
          return undefined;
      }
    } else if (method.toUpperCase() === 'PATCH') {
      switch (feature) {
        case 'tenants':
          schemaRef = '#/components/schemas/UpdateTenant';
          break;
        case 'projects':
          if (path.includes('/members')) {
            return {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      role: { type: 'string', enum: ['MEMBER', 'DEPUTY', 'OWNER'] }
                    },
                    required: ['role']
                  }
                }
              }
            };
          }
          schemaRef = '#/components/schemas/UpdateProject';
          break;
        case 'project-types':
          schemaRef = '#/components/schemas/UpdateProjectType';
          break;
        case 'cloud-providers':
          schemaRef = '#/components/schemas/UpdateCloudProvider';
          break;
        case 'cloud-integrations':
          schemaRef = '#/components/schemas/UpdateCloudProviderIntegration';
          break;
        case 'users':
          // Users don't have update operations in current schema
          return undefined;
        case 'files':
          // Files don't have update operations in current schema
          return undefined;
      }
    }

    if (schemaRef) {
      return {
        content: {
          'application/json': {
            schema: { $ref: schemaRef }
          }
        }
      };
    }

    return undefined;
  }

  /**
   * Generate response schemas for a route
   */
  private generateResponseSchemas(route: RouteMetadata): Record<string, any> {
    const responses: Record<string, any> = {};
    const { feature, method } = route;

    // Success responses
    if (method.toUpperCase() === 'POST') {
      responses['201'] = {
        description: 'Created successfully',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                {
                  type: 'object',
                  properties: {
                    data: { $ref: this.getEntitySchemaRef(feature) }
                  }
                }
              ]
            }
          }
        }
      };
    } else if (method.toUpperCase() === 'DELETE') {
      responses['200'] = {
        description: 'Deleted successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SuccessResponse' }
          }
        }
      };
    } else {
      // GET, PATCH responses
      const isListEndpoint = !route.path.includes('/:') || route.path.endsWith('/members');
      
      responses['200'] = {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              allOf: [
                { $ref: '#/components/schemas/SuccessResponse' },
                {
                  type: 'object',
                  properties: {
                    data: isListEndpoint ? {
                      type: 'array',
                      items: { $ref: this.getEntitySchemaRef(feature) }
                    } : { $ref: this.getEntitySchemaRef(feature) }
                  }
                }
              ]
            }
          }
        }
      };
    }

    // Error responses
    responses['400'] = {
      description: 'Bad Request',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    };

    responses['401'] = {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    };

    responses['403'] = {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    };

    responses['404'] = {
      description: 'Not Found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    };

    responses['500'] = {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    };

    return responses;
  }

  /**
   * Get the appropriate entity schema reference for a feature
   */
  private getEntitySchemaRef(feature: string): string {
    switch (feature) {
      case 'tenants':
        return '#/components/schemas/Tenant';
      case 'projects':
        return '#/components/schemas/Project';
      case 'project-types':
        return '#/components/schemas/ProjectType';
      case 'cloud-providers':
        return '#/components/schemas/CloudProvider';
      case 'cloud-integrations':
        return '#/components/schemas/CloudProviderIntegration';
      case 'users':
        return '#/components/schemas/UserRoles';
      case 'files':
        return '#/components/schemas/File';
      default:
        return '#/components/schemas/SuccessResponse';
    }
  }

  /**
   * Convert Zod schema to OpenAPI schema (fallback method)
   */
  private convertZodToOpenAPISchema(zodSchema: any): any {
    // This is a simplified conversion - the @asteasolutions/zod-to-openapi library
    // handles the complex conversion logic
    if (zodSchema._def) {
      const def = zodSchema._def;
      
      switch (def.typeName) {
        case 'ZodString':
          return { type: 'string' };
        case 'ZodNumber':
          return { type: 'number' };
        case 'ZodBoolean':
          return { type: 'boolean' };
        case 'ZodArray':
          return {
            type: 'array',
            items: this.convertZodToOpenAPISchema(def.type)
          };
        case 'ZodObject':
          const properties: Record<string, any> = {};
          const required: string[] = [];
          
          for (const [key, value] of Object.entries(def.shape())) {
            properties[key] = this.convertZodToOpenAPISchema(value);
            if (!def.unknownKeys && !(value as any).isOptional()) {
              required.push(key);
            }
          }
          
          return {
            type: 'object',
            properties,
            ...(required.length > 0 && { required })
          };
        default:
          return { type: 'string' }; // Fallback
      }
    }
    
    return { type: 'string' }; // Ultimate fallback
  }
}

// Export singleton instance
export const schemaGenerationService = new SchemaGenerationServiceImpl();