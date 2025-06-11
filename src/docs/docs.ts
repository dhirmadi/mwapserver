import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { env } from '../config/env.js';

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

// Cloud Integration endpoints
registry.registerPath({
  method: 'post',
  path: '/api/v1/tenants/{tenantId}/integrations',
  tags: ['Cloud Integrations'],
  summary: 'Create a new cloud provider integration for a tenant',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      tenantId: z.string().describe('Tenant ID')
    }),
    body: {
      content: {
        'application/json': {
          schema: createCloudProviderIntegrationSchemaRef
        }
      }
    }
  },
  responses: {
    '201': {
      description: 'Cloud provider integration created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: cloudProviderIntegrationSchema
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

// Project endpoints
registry.registerPath({
  method: 'post',
  path: '/api/v1/projects',
  tags: ['Projects'],
  summary: 'Create a new project',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createProjectSchemaRef
        }
      }
    }
  },
  responses: {
    '201': {
      description: 'Project created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: projectSchema
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
  method: 'patch',
  path: '/api/v1/projects/{id}',
  tags: ['Projects'],
  summary: 'Update a project',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe('Project ID')
    }),
    body: {
      content: {
        'application/json': {
          schema: updateProjectSchemaRef
        }
      }
    }
  },
  responses: {
    '200': {
      description: 'Project updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: projectSchema
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
  path: '/api/v1/projects/{id}',
  tags: ['Projects'],
  summary: 'Delete a project',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().describe('Project ID')
    })
  },
  responses: {
    '200': {
      description: 'Project deleted successfully',
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

// Project Type endpoints
registry.registerPath({
  method: 'post',
  path: '/api/v1/project-types',
  tags: ['Project Types'],
  summary: 'Create a new project type',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createProjectTypeSchemaRef
        }
      }
    }
  },
  responses: {
    '201': {
      description: 'Project type created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: projectTypeSchema
          })
        }
      }
    },
    '400': badRequestResponse,
    '401': unauthorizedResponse,
    '403': forbiddenResponse
  }
});

// Cloud Provider endpoints
registry.registerPath({
  method: 'post',
  path: '/api/v1/cloud-providers',
  tags: ['Cloud Providers'],
  summary: 'Create a new cloud provider',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCloudProviderSchemaRef
        }
      }
    }
  },
  responses: {
    '201': {
      description: 'Cloud provider created successfully',
      content: {
        'application/json': {
          schema: z.object({
            data: cloudProviderSchema
          })
        }
      }
    },
    '400': badRequestResponse,
    '401': unauthorizedResponse,
    '403': forbiddenResponse
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

// Create Express router for Swagger UI
export function getDocsRouter(): Router {
  const router = Router();
  
  // Only enable in non-production environments
  if (env.NODE_ENV !== 'production') {
    router.use('/', swaggerUi.serve);
    router.get('/', swaggerUi.setup(openApiDocument, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'MWAP API Documentation',
      customfavIcon: '/favicon.ico',
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'list'
      }
    }));
  } else {
    // In production, return a 404 or redirect
    router.use('/', (req, res) => {
      res.status(404).json({
        error: {
          message: 'API documentation is not available in production',
          code: 'docs/not-available',
          status: 404
        }
      });
    });
  }
  
  return router;
}

// Export the OpenAPI document for testing or other purposes
export { openApiDocument };