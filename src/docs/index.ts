/**
 * Simplified API Documentation System
 * 
 * Single source of truth for API documentation.
 * Consolidates all previous documentation systems into one maintainable approach.
 */

import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';

// Simple, static OpenAPI document - no complex generation needed
const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'MWAP API',
    version: '1.0.0',
    description: 'Multi-tenant project management platform with cloud integrations'
  },
  servers: [
    {
      url: env.NODE_ENV === 'production' 
        ? 'https://api.mwap.dev/api/v1' 
        : 'http://localhost:3000/api/v1',
      description: env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Auth0 JWT token'
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'auth/unauthorized' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'resource/not-found' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/tenants/me': {
      get: {
        tags: ['Tenants'],
        summary: 'Get current user tenant',
        responses: {
          '200': {
            description: 'Tenant retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        ownerId: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '404': { $ref: '#/components/responses/NotFoundError' }
        }
      }
    },
    '/projects/{id}/members/me': {
      get: {
        tags: ['Projects'],
        summary: 'Get current user\'s membership in a project',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Membership retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        userId: { type: 'string' },
                        role: { type: 'string', enum: ['OWNER', 'DEPUTY', 'MEMBER'] }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '404': { description: 'Membership not found' }
        }
      }
    },
    '/tenants/{tenantId}/integrations': {
      get: {
        tags: ['Cloud Integrations'],
        summary: 'List cloud provider integrations for a tenant',
        parameters: [
          { in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'List returned' },
          '401': { $ref: '#/components/responses/UnauthorizedError' }
        }
      },
      post: {
        tags: ['Cloud Integrations'],
        summary: 'Create cloud provider integration',
        parameters: [
          { in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object' } } }
        },
        responses: {
          '201': { description: 'Created' },
          '401': { $ref: '#/components/responses/UnauthorizedError' }
        }
      }
    },
    '/tenants/{tenantId}/integrations/{integrationId}': {
      get: {
        tags: ['Cloud Integrations'],
        summary: 'Get integration by id',
        parameters: [
          { in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'integrationId', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'OK' },
          '404': { $ref: '#/components/responses/NotFoundError' }
        }
      },
      patch: {
        tags: ['Cloud Integrations'],
        summary: 'Update integration',
        parameters: [
          { in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'integrationId', required: true, schema: { type: 'string' } }
        ],
        requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          '200': { description: 'Updated' },
          '404': { $ref: '#/components/responses/NotFoundError' }
        }
      },
      delete: {
        tags: ['Cloud Integrations'],
        summary: 'Delete integration',
        parameters: [
          { in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'integrationId', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '204': { description: 'Deleted' },
          '404': { $ref: '#/components/responses/NotFoundError' }
        }
      }
    },
    '/tenants/{tenantId}/cloud-integrations': {
      get: {
        tags: ['Cloud Integrations'],
        summary: 'List cloud integrations (backward compatibility path)',
        parameters: [
          { in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'List returned' },
          '401': { $ref: '#/components/responses/UnauthorizedError' }
        }
      }
    },
    '/oauth/tenants/{tenantId}/integrations/{integrationId}/refresh': {
      post: {
        tags: ['OAuth'],
        summary: 'Refresh integration tokens',
        parameters: [
          { in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } },
          { in: 'path', name: 'integrationId', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  force: { type: 'boolean', default: false }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Refresh triggered' },
          '401': { $ref: '#/components/responses/UnauthorizedError' }
        }
      }
    }
  }
};

/**
 * Simple documentation router
 */
export function getDocsRouter(): Router {
  const router = Router();

  // Serve OpenAPI JSON
  router.get('/openapi.json', (req: Request, res: Response) => {
    res.json(openApiDocument);
  });

  // Simple HTML documentation page
  router.get('/', (req: Request, res: Response) => {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>MWAP API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: '/docs/openapi.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.presets.standalone]
        });
    </script>
</body>
</html>`;
    res.send(html);
  });

  return router;
}

// Export the OpenAPI document for other uses
export { openApiDocument };