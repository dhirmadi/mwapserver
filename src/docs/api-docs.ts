import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify exec
const execAsync = promisify(exec);

// Define the OpenAPI document
const openApiDocument = {
  openapi: '3.0.3',
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
      url: process.env.NODE_ENV === 'production' 
        ? 'https://api.mwap.dev' 
        : 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
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
 * Check if a package is installed
 */
function isPackageInstalled(packageName: string): boolean {
  try {
    // Check in the project's node_modules directory
    const projectNodeModulesPath = path.resolve(__dirname, '../../node_modules', packageName);
    
    // Check in the parent directory's node_modules (for monorepo setups)
    const parentNodeModulesPath = path.resolve(__dirname, '../../../node_modules', packageName);
    
    return fs.existsSync(projectNodeModulesPath) || fs.existsSync(parentNodeModulesPath);
  } catch (error) {
    return false;
  }
}

/**
 * Install missing packages
 */
async function installSwaggerUI(): Promise<{ success: boolean, output: string }> {
  if (isPackageInstalled('swagger-ui-express')) {
    return { success: true, output: 'swagger-ui-express is already installed' };
  }
  
  try {
    const command = 'npm install swagger-ui-express';
    const { stdout } = await execAsync(command, { cwd: path.resolve(__dirname, '../..') });
    return { 
      success: true, 
      output: `Installed swagger-ui-express\n${stdout}` 
    };
  } catch (error: any) {
    return { 
      success: false, 
      output: `Failed to install swagger-ui-express: ${error.message}\n\nYou can install it manually with:\nnpm install swagger-ui-express` 
    };
  }
}

/**
 * Create a router for the API documentation
 * 
 * SECURITY NOTE:
 * This router should be mounted AFTER authentication middleware in production
 * to prevent unauthorized access to API structure and implementation details.
 * 
 * In development environments, you may choose to make it available without
 * authentication for easier development, but this is not recommended for
 * production deployments.
 */
export function getDocsRouter(): Router {
  const router = Router();
  
  // Security middleware to check environment
  router.use((req: Request, res: Response, next: NextFunction) => {
    // In production, ensure the user is authenticated
    if (process.env.NODE_ENV === 'production') {
      // The authentication check should happen at the app level
      // This is just an additional security check
      if (!req.user) {
        return res.status(401).json({
          error: {
            message: 'Authentication required to access API documentation',
            code: 'UNAUTHORIZED',
            status: 401
          }
        });
      }
    }
    next();
  });
  
  // Serve the OpenAPI JSON
  router.get('/json', (req: Request, res: Response) => {
    res.json(openApiDocument);
  });
  
  // Serve the Swagger UI
  router.get('/', async (req: Request, res: Response) => {
    // Check if swagger-ui-express is installed
    if (!isPackageInstalled('swagger-ui-express')) {
      // Show a simple HTML page with a link to the JSON and an option to install swagger-ui-express
      return res.send(`
        <html>
          <head>
            <title>MWAP API Documentation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
              h1 { color: #333; }
              pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
              a { color: #0066cc; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .button { display: inline-block; background: #0066cc; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; }
              .button:hover { background: #0052a3; }
              .info { background: #e6f7ff; border-left: 4px solid #1890ff; padding: 10px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <h1>MWAP API Documentation</h1>
            <p>The Swagger UI is not available because the <code>swagger-ui-express</code> package is not installed.</p>
            
            <div class="info">
              <p>You can view the raw OpenAPI specification in JSON format:</p>
              <p><a href="/docs/json" class="button">View OpenAPI JSON</a></p>
            </div>
            
            <h2>Install Swagger UI</h2>
            <p>To install the Swagger UI and get a better documentation experience, run:</p>
            <pre>npm install swagger-ui-express</pre>
            
            <p>Or click the button below to install it automatically:</p>
            <p><a href="/docs/install-swagger" class="button">Install Swagger UI</a></p>
          </body>
        </html>
      `);
    }
    
    try {
      // Dynamically import swagger-ui-express
      const swaggerUi = await import('swagger-ui-express');
      
      // Setup Swagger UI options
      const options = {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'MWAP API Documentation',
        swaggerOptions: {
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
          docExpansion: 'list'
        }
      };
      
      // Serve Swagger UI
      return swaggerUi.serve(req, res, () => {
        swaggerUi.setup(openApiDocument, options)(req, res);
      });
    } catch (error) {
      console.error('Error loading swagger-ui-express:', error);
      return res.redirect('/docs/json');
    }
  });
  
  // Install swagger-ui-express
  router.get('/install-swagger', async (req: Request, res: Response) => {
    const result = await installSwaggerUI();
    
    if (result.success) {
      return res.send(`
        <html>
          <head>
            <title>Installation Successful</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
              h1 { color: #333; }
              pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
              .success { background: #f6ffed; border-left: 4px solid #52c41a; padding: 10px; margin: 20px 0; }
              a { color: #0066cc; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .button { display: inline-block; background: #0066cc; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; }
            </style>
            <meta http-equiv="refresh" content="3;url=/docs" />
          </head>
          <body>
            <h1>Installation Successful</h1>
            <div class="success">
              <p>Successfully installed swagger-ui-express!</p>
              <p>You will be redirected to the documentation in 3 seconds...</p>
            </div>
            <p>If you are not redirected automatically, click here: <a href="/docs" class="button">Go to Documentation</a></p>
            <h2>Installation Output</h2>
            <pre>${result.output}</pre>
          </body>
        </html>
      `);
    } else {
      return res.send(`
        <html>
          <head>
            <title>Installation Failed</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
              h1 { color: #333; }
              pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
              .error { background: #fff1f0; border-left: 4px solid #f5222d; padding: 10px; margin: 20px 0; }
              a { color: #0066cc; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .button { display: inline-block; background: #0066cc; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1>Installation Failed</h1>
            <div class="error">
              <p>Failed to install swagger-ui-express.</p>
              <p>You can still view the raw OpenAPI specification in JSON format:</p>
              <p><a href="/docs/json" class="button">View OpenAPI JSON</a></p>
            </div>
            <h2>Error Output</h2>
            <pre>${result.output}</pre>
            <p>You can try installing it manually by running:</p>
            <pre>npm install swagger-ui-express</pre>
          </body>
        </html>
      `);
    }
  });
  
  return router;
}

// Export the OpenAPI document
export { openApiDocument };