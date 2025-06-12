import { env } from '../config/env';
import swaggerUi from 'swagger-ui-express';
// Create a basic OpenAPI document without using zod-to-openapi
const openApiDocument = {
    openapi: '3.0.0',
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
    paths: {
        '/api/v1/tenants': {
            get: {
                tags: ['Tenants'],
                summary: 'Get all tenants',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'List of tenants',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: {
                                                $ref: '#/components/schemas/Tenant'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    }
                }
            },
            post: {
                tags: ['Tenants'],
                summary: 'Create a new tenant',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateTenant'
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Tenant created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            $ref: '#/components/schemas/Tenant'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        $ref: '#/components/responses/BadRequestError'
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    }
                }
            }
        },
        '/api/v1/tenants/me': {
            get: {
                tags: ['Tenants'],
                summary: 'Get current user\'s tenant',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'Current user\'s tenant',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            $ref: '#/components/schemas/Tenant'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    },
                    '404': {
                        $ref: '#/components/responses/NotFoundError'
                    }
                }
            }
        },
        '/api/v1/tenants/{id}': {
            get: {
                tags: ['Tenants'],
                summary: 'Get a tenant by ID',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string'
                        },
                        description: 'Tenant ID'
                    }
                ],
                responses: {
                    '200': {
                        description: 'Tenant details',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            $ref: '#/components/schemas/Tenant'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    },
                    '403': {
                        $ref: '#/components/responses/ForbiddenError'
                    },
                    '404': {
                        $ref: '#/components/responses/NotFoundError'
                    }
                }
            },
            patch: {
                tags: ['Tenants'],
                summary: 'Update a tenant',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string'
                        },
                        description: 'Tenant ID'
                    }
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/UpdateTenant'
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Tenant updated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            $ref: '#/components/schemas/Tenant'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        $ref: '#/components/responses/BadRequestError'
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    },
                    '403': {
                        $ref: '#/components/responses/ForbiddenError'
                    },
                    '404': {
                        $ref: '#/components/responses/NotFoundError'
                    }
                }
            },
            delete: {
                tags: ['Tenants'],
                summary: 'Delete a tenant',
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string'
                        },
                        description: 'Tenant ID'
                    }
                ],
                responses: {
                    '200': {
                        description: 'Tenant deleted successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                success: {
                                                    type: 'boolean'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    },
                    '403': {
                        $ref: '#/components/responses/ForbiddenError'
                    },
                    '404': {
                        $ref: '#/components/responses/NotFoundError'
                    }
                }
            }
        },
        '/api/v1/projects': {
            get: {
                tags: ['Projects'],
                summary: 'Get all projects',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'List of projects',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: {
                                                $ref: '#/components/schemas/Project'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    }
                }
            },
            post: {
                tags: ['Projects'],
                summary: 'Create a new project',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/CreateProject'
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Project created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            $ref: '#/components/schemas/Project'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        $ref: '#/components/responses/BadRequestError'
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    }
                }
            }
        },
        '/api/v1/project-types': {
            get: {
                tags: ['Project Types'],
                summary: 'Get all project types',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'List of project types',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: {
                                                $ref: '#/components/schemas/ProjectType'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    }
                }
            }
        },
        '/api/v1/cloud-providers': {
            get: {
                tags: ['Cloud Providers'],
                summary: 'Get all cloud providers',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'List of cloud providers',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: {
                                                $ref: '#/components/schemas/CloudProvider'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    }
                }
            }
        },
        '/api/v1/cloud-provider-integrations': {
            get: {
                tags: ['Cloud Provider Integrations'],
                summary: 'Get all cloud provider integrations',
                security: [{ bearerAuth: [] }],
                responses: {
                    '200': {
                        description: 'List of cloud provider integrations',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'array',
                                            items: {
                                                $ref: '#/components/schemas/CloudProviderIntegration'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '401': {
                        $ref: '#/components/responses/UnauthorizedError'
                    }
                }
            }
        }
    },
    components: {
        schemas: {
            Tenant: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            CreateTenant: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true }
                }
            },
            UpdateTenant: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true }
                }
            },
            Project: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    tenantId: { type: 'string' },
                    projectTypeId: { type: 'string' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            CreateProject: {
                type: 'object',
                required: ['name', 'tenantId', 'projectTypeId'],
                properties: {
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    tenantId: { type: 'string' },
                    projectTypeId: { type: 'string' }
                }
            },
            ProjectType: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            CloudProvider: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            },
            CloudProviderIntegration: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    tenantId: { type: 'string' },
                    cloudProviderId: { type: 'string' },
                    credentials: { type: 'object' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
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
                                error: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        code: { type: 'string' },
                                        status: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            ForbiddenError: {
                description: 'Forbidden',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        code: { type: 'string' },
                                        status: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            NotFoundError: {
                description: 'Not Found',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        code: { type: 'string' },
                                        status: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            BadRequestError: {
                description: 'Bad Request',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                error: {
                                    type: 'object',
                                    properties: {
                                        message: { type: 'string' },
                                        code: { type: 'string' },
                                        status: { type: 'number' },
                                        details: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    path: {
                                                        type: 'array',
                                                        items: { type: 'string' }
                                                    },
                                                    message: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        }
    },
    security: [
        {
            bearerAuth: []
        }
    ]
};
/**
 * Create a handler function for the full documentation
 */
export function getFullDocsRouter() {
    return (req, res, next) => {
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
            }
            else {
                next();
            }
        };
        runMiddleware();
    };
}
// Export the OpenAPI document
export { openApiDocument };
