import { Router, Request, Response, NextFunction } from 'express';
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { env } from '../config/env.js';
import swaggerUi from 'swagger-ui-express';

// Import schemas
import { 
  createTenantSchema, 
  updateTenantSchema, 
  tenantResponseSchema 
} from '../schemas/tenant.schema.js';

import { 
  createProjectSchema, 
  updateProjectSchema, 
  projectResponseSchema,
  projectMemberOperationSchema,
  updateProjectMemberSchema
} from '../schemas/project.schema.js';

import {
  createProjectTypeSchema,
  projectTypeResponseSchema
} from '../schemas/projectType.schema.js';

import {
  createCloudProviderSchema,
  cloudProviderResponseSchema
} from '../schemas/cloudProvider.schema.js';

import {
  createCloudProviderIntegrationSchema,
  cloudProviderIntegrationResponseSchema
} from '../schemas/cloudProviderIntegration.schema.js';

// Create OpenAPI registry
const registry = new OpenAPIRegistry();

// Define common responses
const unauthorizedResponse = registry.registerComponent(
  'responses',
  'UnauthorizedError',
  {
    description: 'Unauthorized',
    content: {
      'application/json': {
        schema: z.object({
          error: z.object({
            message: z.string(),
            code: z.string(),
            status: z.number()
          })
        })
      }
    }
  }
);

const forbiddenResponse = registry.registerComponent(
  'responses',
  'ForbiddenError',
  {
    description: 'Forbidden',
    content: {
      'application/json': {
        schema: z.object({
          error: z.object({
            message: z.string(),
            code: z.string(),
            status: z.number()
          })
        })
      }
    }
  }
);

const notFoundResponse = registry.registerComponent(
  'responses',
  'NotFoundError',
  {
    description: 'Not Found',
    content: {
      'application/json': {
        schema: z.object({
          error: z.object({
            message: z.string(),
            code: z.string(),
            status: z.number()
          })
        })
      }
    }
  }
);

const badRequestResponse = registry.registerComponent(
  'responses',
  'BadRequestError',
  {
    description: 'Bad Request',
    content: {
      'application/json': {
        schema: z.object({
          error: z.object({
            message: z.string(),
            code: z.string(),
            status: z.number(),
            details: z.array(z.object({
              path: z.array(z.string()),
              message: z.string()
            })).optional()
          })
        })
      }
    }
  }
);

// Define security scheme
registry.registerComponent(
  'securitySchemes',
  'bearerAuth',
  {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
  }
);

// Register schemas
const tenantSchema = registry.register('Tenant', tenantResponseSchema);
const createTenantSchemaRef = registry.register('CreateTenant', createTenantSchema);
const updateTenantSchemaRef = registry.register('UpdateTenant', updateTenantSchema);

const projectSchema = registry.register('Project', projectResponseSchema);
const createProjectSchemaRef = registry.register('CreateProject', createProjectSchema);
const updateProjectSchemaRef = registry.register('UpdateProject', updateProjectSchema);
const projectMemberOperationSchemaRef = registry.register('ProjectMemberOperation', projectMemberOperationSchema);
const updateProjectMemberSchemaRef = registry.register('UpdateProjectMember', updateProjectMemberSchema);

const projectTypeSchema = registry.register('ProjectType', projectTypeResponseSchema);
const createProjectTypeSchemaRef = registry.register('CreateProjectType', createProjectTypeSchema);

const cloudProviderSchema = registry.register('CloudProvider', cloudProviderResponseSchema);
const createCloudProviderSchemaRef = registry.register('CreateCloudProvider', createCloudProviderSchema);

const cloudProviderIntegrationSchema = registry.register('CloudProviderIntegration', cloudProviderIntegrationResponseSchema);
const createCloudProviderIntegrationSchemaRef = registry.register('CreateCloudProviderIntegration', createCloudProviderIntegrationSchema);

// Define API paths
// Tenant endpoints
registry.registerPath({
  method: 'get',
  path: '/api/v1/tenants',
  tags: ['Tenants'],
  summary: 'Get all tenants',
  security: [{ bearerAuth: [] }],
  responses: {
    '200': {
      description: 'List of tenants',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(tenantSchema)
          })
        }
      }
    },
    '401': unauthorizedResponse
  }
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/tenants',
  tags: ['Tenants'],
  summary: 'Create a new tenant',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createTenantSchemaRef
        }
      }
    }
  },
  responses: {
    '201': {
      description: 'Tenant created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: tenantSchema
          })
        }
      }
    },
    '400': badRequestResponse,
    '401': unauthorizedResponse
  }
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/tenants/me',
  tags: ['Tenants'],
  summary: 'Get current user\'s tenant',
  security: [{ bearerAuth: [] }],
  responses: {
    '200': {
      description: 'Current user\'s tenant',
      content: {
        'application/json': {
          schema: z.object({
            data: tenantSchema
          })
        }
      }
    },
    '401': unauthorizedResponse,
    '404': notFoundResponse
  }
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/tenants/{id}',
  tags: ['Tenants'],
  summary: 'Get a tenant by ID',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe('Tenant ID')
    })
  },
  responses: {
    '200': {
      description: 'Tenant details',
      content: {
        'application/json': {
          schema: z.object({
            data: tenantSchema
          })
        }
      }
    },
    '401': unauthorizedResponse,
    '403': forbiddenResponse,
    '404': notFoundResponse
  }
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/tenants/{id}',
  tags: ['Tenants'],
  summary: 'Update a tenant',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe('Tenant ID')
    }),
    body: {
      content: {
        'application/json': {
          schema: updateTenantSchemaRef
        }
      }
    }
  },
  responses: {
    '200': {
      description: 'Tenant updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: tenantSchema
          })
        }
      }
    },
    '400': badRequestResponse,
    '401': unauthorizedResponse,
    '403': forbiddenResponse,
    '404': notFoundResponse
  }
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/tenants/{id}',
  tags: ['Tenants'],
  summary: 'Delete a tenant',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe('Tenant ID')
    })
  },
  responses: {
    '200': {
      description: 'Tenant deleted successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              success: z.boolean()
            })
          })
        }
      }
    },
    '401': unauthorizedResponse,
    '403': forbiddenResponse,
    '404': notFoundResponse
  }
});

// Generate OpenAPI document
const generator = new OpenApiGeneratorV3(registry.definitions);

const openApiDocument = generator.generateDocument({
  info: {
    title: 'MWAP API',
    version: '1.0.0',
    description: 'API documentation for the Modular Web Application Platform',
    contact: {
      name: 'MWAP Team',
      url: 'https://github.com/dhirmadi/mwapserver'
    }
  },
  servers: [
    {
      url: env.NODE_ENV === 'production' 
        ? 'https://api.mwap.dev' 
        : 'http://localhost:3000',
      description: env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ]
});

/**
 * Create a handler function for the full documentation
 */
export function getFullDocsRouter() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Setup Swagger UI
    const middlewares = [
      ...swaggerUi.serve,
      swaggerUi.setup(openApiDocument, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'MWAP API Documentation',
        customfavIcon: '/favicon.ico',
        swaggerOptions: {
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
          docExpansion: 'list'
        }
      })
    ];
    
    // Apply all middlewares in sequence
    let idx = 0;
    const runMiddleware = () => {
      if (idx < middlewares.length) {
        middlewares[idx](req, res, () => {
          idx++;
          runMiddleware();
        });
      } else {
        next();
      }
    };
    
    runMiddleware();
  };
}

// Export the OpenAPI document
export { openApiDocument };