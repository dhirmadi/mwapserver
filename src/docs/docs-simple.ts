import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// Required dependencies
const REQUIRED_PACKAGES = [
  'swagger-ui-express',
  '@asteasolutions/zod-to-openapi'
];

/**
 * Check if a package is installed
 */
function isPackageInstalled(packageName: string): boolean {
  try {
    // Check in the project's node_modules directory
    const projectNodeModulesPath = path.resolve(__dirname, '../../node_modules', packageName);
    
    // Check in the parent directory's node_modules (for monorepo setups)
    const parentNodeModulesPath = path.resolve(__dirname, '../../../node_modules', packageName);
    
    // Check in the global node_modules directory
    const globalNodeModulesPath = path.resolve(process.env.NODE_PATH || '/usr/local/lib/node_modules', packageName);
    
    return fs.existsSync(projectNodeModulesPath) || 
           fs.existsSync(parentNodeModulesPath) || 
           fs.existsSync(globalNodeModulesPath);
  } catch (error) {
    return false;
  }
}

/**
 * Install missing packages
 */
async function installMissingPackages(): Promise<{ success: boolean, output: string }> {
  const missingPackages = REQUIRED_PACKAGES.filter(pkg => !isPackageInstalled(pkg));
  
  if (missingPackages.length === 0) {
    return { success: true, output: 'All packages already installed' };
  }
  
  try {
    // First try to install locally
    const projectRoot = path.resolve(__dirname, '../..');
    const command = `npm install ${missingPackages.join(' ')}`;
    
    try {
      const { stdout } = await execAsync(command, { cwd: projectRoot });
      return { 
        success: true, 
        output: `Installed packages: ${missingPackages.join(', ')}\n${stdout}` 
      };
    } catch (localError: any) {
      // If local installation fails due to permissions, try with --no-save
      if (localError.message.includes('EACCES') || localError.message.includes('permission')) {
        try {
          const fallbackCommand = `npm install --no-save ${missingPackages.join(' ')}`;
          const { stdout } = await execAsync(fallbackCommand, { cwd: projectRoot });
          return { 
            success: true, 
            output: `Installed packages (without saving to package.json): ${missingPackages.join(', ')}\n${stdout}\n\nNote: Due to permission restrictions, packages were installed without updating package.json.` 
          };
        } catch (fallbackError: any) {
          throw new Error(`Failed to install packages: ${fallbackError.message}\n\nYou may need to run the installation manually with elevated permissions.`);
        }
      } else {
        throw localError;
      }
    }
  } catch (error: any) {
    return { 
      success: false, 
      output: `Failed to install packages: ${error.message}\n\nYou can install them manually with:\nnpm install ${missingPackages.join(' ')}` 
    };
  }
}

/**
 * Create a simple OpenAPI document
 */
function createBasicOpenApiDocument() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'MWAP API',
      version: '1.0.0',
      description: 'API documentation for the Modular Web Application Platform',
    },
    paths: {
      '/api/v1/tenants': {
        get: {
          summary: 'Get all tenants',
          responses: {
            '200': {
              description: 'List of tenants',
            }
          }
        },
        post: {
          summary: 'Create a new tenant',
          responses: {
            '201': {
              description: 'Tenant created successfully',
            }
          }
        }
      },
      '/api/v1/projects': {
        get: {
          summary: 'Get all projects',
          responses: {
            '200': {
              description: 'List of projects',
            }
          }
        },
        post: {
          summary: 'Create a new project',
          responses: {
            '201': {
              description: 'Project created successfully',
            }
          }
        }
      }
    },
    components: {
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
}

// Create a basic OpenAPI document
const basicOpenApiDocument = createBasicOpenApiDocument();

/**
 * Create Express router for API documentation
 */
export function getDocsRouter(): Router {
  const router = Router();
  
  // Only enable in non-production environments
  if (env.NODE_ENV === 'production') {
    router.use('/', (req, res) => {
      res.status(404).json({
        error: {
          message: 'API documentation is not available in production',
          code: 'docs/not-available',
          status: 404
        }
      });
    });
    return router;
  }
  
  // Always provide the basic JSON endpoint
  router.get('/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(basicOpenApiDocument);
  });
  
  // Check dependencies and provide installation endpoint
  router.get('/check', async (req, res) => {
    const status = {
      packages: REQUIRED_PACKAGES.map(pkg => ({
        name: pkg,
        installed: isPackageInstalled(pkg)
      })),
      allInstalled: REQUIRED_PACKAGES.every(pkg => isPackageInstalled(pkg))
    };
    
    res.json(status);
  });
  
  // Install dependencies endpoint
  router.post('/install', async (req, res) => {
    const result = await installMissingPackages();
    res.json(result);
  });
  
  // Main documentation endpoint
  router.get('/', async (req, res) => {
    const allInstalled = REQUIRED_PACKAGES.every(pkg => isPackageInstalled(pkg));
    
    if (!allInstalled) {
      // If dependencies are missing, show installation page
      return res.send(`
        <html>
          <head>
            <title>MWAP API Documentation</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #333; }
              .message { background: #f8f9fa; padding: 20px; border-radius: 5px; }
              .links { margin-top: 30px; }
              a { color: #0366d6; text-decoration: none; margin-right: 20px; }
              a:hover { text-decoration: underline; }
              pre { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow-x: auto; }
              .note { color: #664d03; background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; }
              button { background: #0366d6; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
              button:hover { background: #0056b3; }
              #result { margin-top: 20px; padding: 15px; border-radius: 5px; display: none; }
              .success { background-color: #d4edda; color: #155724; }
              .error { background-color: #f8d7da; color: #721c24; }
              .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(0, 0, 0, 0.3); border-radius: 50%; border-top-color: #0366d6; animation: spin 1s ease-in-out infinite; margin-left: 10px; vertical-align: middle; }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <h1>MWAP API Documentation</h1>
            <div class="message">
              <p>Some required packages are missing. The following packages need to be installed:</p>
              <ul>
                ${REQUIRED_PACKAGES.map(pkg => `
                  <li>
                    <strong>${pkg}</strong>: 
                    ${isPackageInstalled(pkg) ? 
                      '<span style="color: green;">Installed</span>' : 
                      '<span style="color: red;">Missing</span>'}
                  </li>
                `).join('')}
              </ul>
              
              <p>You can install them manually with:</p>
              <pre>npm install ${REQUIRED_PACKAGES.join(' ')}</pre>
              
              <p>Or click the button below to install them automatically:</p>
              <button id="installBtn" onclick="installPackages()">Install Missing Packages</button>
              <span id="spinner" class="loading" style="display: none;"></span>
              
              <div id="result"></div>
              
              <div class="note">
                <strong>Note:</strong> This is an ESM-only project. Make sure you're using versions of these packages that support ESM.
              </div>
            </div>
            <div class="links">
              <a href="/docs/json">View Basic OpenAPI JSON</a>
              <a href="/docs/check">Check Dependencies</a>
            </div>
            
            <script>
              async function installPackages() {
                const button = document.getElementById('installBtn');
                const spinner = document.getElementById('spinner');
                const result = document.getElementById('result');
                
                button.disabled = true;
                spinner.style.display = 'inline-block';
                result.style.display = 'none';
                
                try {
                  const response = await fetch('/docs/install', { method: 'POST' });
                  const data = await response.json();
                  
                  result.textContent = data.output;
                  result.className = data.success ? 'success' : 'error';
                  result.style.display = 'block';
                  
                  if (data.success) {
                    setTimeout(() => {
                      window.location.reload();
                    }, 3000);
                  }
                } catch (error) {
                  result.textContent = 'Error: ' + error.message;
                  result.className = 'error';
                  result.style.display = 'block';
                } finally {
                  button.disabled = false;
                  spinner.style.display = 'none';
                }
              }
            </script>
          </body>
        </html>
      `);
    }
    
    // If all dependencies are installed, try to load the full documentation
    try {
      // First try to load the compatible version (without zod-to-openapi dependency)
      try {
        const compatibleModule = await import('./docs-full-compatible.js');
        if (typeof compatibleModule.getFullDocsRouter === 'function') {
          return compatibleModule.getFullDocsRouter()(req, res);
        }
      } catch (compatibleError) {
        console.warn('Could not load compatible docs module:', compatibleError.message);
      }
      
      // If compatible version fails, try the full version
      const fullDocsModule = await import('./docs-full.js');
      
      // If the module exports a router function, use it
      if (typeof fullDocsModule.getFullDocsRouter === 'function') {
        return fullDocsModule.getFullDocsRouter()(req, res);
      }
      
      // Fallback to basic JSON if the module doesn't export the expected function
      return res.redirect('/docs/json');
    } catch (error) {
      console.error('Error loading full documentation module:', error);
      
      // Show error page
      return res.send(`
        <html>
          <head>
            <title>MWAP API Documentation</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
              h1 { color: #333; }
              .error { background: #f8d7da; padding: 20px; border-radius: 5px; color: #721c24; }
              .links { margin-top: 30px; }
              a { color: #0366d6; text-decoration: none; margin-right: 20px; }
              a:hover { text-decoration: underline; }
              pre { background: #f1f1f1; padding: 10px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>MWAP API Documentation</h1>
            <div class="error">
              <h2>Error Loading Documentation</h2>
              <p>All required packages are installed, but there was an error loading the full documentation module.</p>
              <pre>${error instanceof Error ? error.stack : String(error)}</pre>
            </div>
            <div class="links">
              <a href="/docs/json">View Basic OpenAPI JSON</a>
              <a href="/docs/check">Check Dependencies</a>
            </div>
          </body>
        </html>
      `);
    }
  });
  
  return router;
}

// Export the basic OpenAPI document
export { basicOpenApiDocument };