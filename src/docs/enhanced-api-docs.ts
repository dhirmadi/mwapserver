/**
 * Enhanced API Documentation
 * 
 * Enhanced version of api-docs.ts that uses the new OpenAPI generation service
 * while maintaining backward compatibility with existing /docs endpoint
 */

import { Router, Request, Response, NextFunction } from 'express';
import { openAPIService } from '../services/openapi/index.js';
import { logInfo, logError } from '../utils/logger.js';
import { openApiDocument } from './api-docs.js'; // Fallback to static document

// Cache for the enhanced documentation
let cachedDocument: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get enhanced OpenAPI document with fallback to static document
 */
async function getEnhancedDocument(): Promise<any> {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedDocument && (now - cacheTimestamp) < CACHE_TTL) {
      logInfo('Returning cached enhanced OpenAPI document');
      return cachedDocument;
    }

    logInfo('Generating enhanced OpenAPI document');
    
    // Try to get the dynamic document
    const dynamicDocument = await openAPIService.generateDocument();
    
    // Cache the result
    cachedDocument = dynamicDocument;
    cacheTimestamp = now;
    
    logInfo('Enhanced OpenAPI document generated and cached successfully');
    return dynamicDocument;
    
  } catch (error) {
    logError('Failed to generate enhanced OpenAPI document, falling back to static', {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Fallback to static document
    return openApiDocument;
  }
}

/**
 * Check if a package is installed
 */
function isPackageInstalled(packageName: string): boolean {
  try {
    require.resolve(packageName);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Enhanced docs router with dynamic OpenAPI generation
 */
export function getEnhancedDocsRouter(): Router {
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
  
  // Serve the enhanced OpenAPI JSON
  router.get('/json', async (req: Request, res: Response) => {
    try {
      const document = await getEnhancedDocument();
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
      res.json(document);
    } catch (error) {
      logError('Failed to serve enhanced OpenAPI JSON', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to static document
      res.json(openApiDocument);
    }
  });

  // Serve enhanced API information
  router.get('/info', async (req: Request, res: Response) => {
    try {
      const info = await openAPIService.generateInfo();
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
      res.json(info);
    } catch (error) {
      logError('Failed to serve enhanced OpenAPI info', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback response
      res.json({
        title: 'MWAP API',
        version: '1.0.0',
        description: 'API documentation for the Modular Web Application Platform',
        pathCount: 0,
        schemaCount: 0,
        tagCount: 0
      });
    }
  });

  // Cache status endpoint
  router.get('/cache/status', (req: Request, res: Response) => {
    const now = Date.now();
    const age = cachedDocument ? now - cacheTimestamp : 0;
    const cached = cachedDocument && age < CACHE_TTL;
    
    res.json({
      cached,
      age,
      ttl: CACHE_TTL,
      lastGenerated: cached ? new Date(cacheTimestamp).toISOString() : null,
      coreServiceStatus: openAPIService.getCacheStatus()
    });
  });

  // Invalidate cache endpoint (for development)
  router.post('/cache/invalidate', (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: {
          message: 'Cache invalidation not allowed in production',
          code: 'FORBIDDEN',
          status: 403
        }
      });
    }

    cachedDocument = null;
    cacheTimestamp = 0;
    openAPIService.invalidateCache();
    
    logInfo('Enhanced docs cache invalidated');
    
    res.json({
      message: 'Cache invalidated successfully',
      timestamp: new Date().toISOString()
    });
  });
  
  // Serve the Swagger UI with enhanced document
  router.get('/', async (req: Request, res: Response) => {
    // Check if swagger-ui-express is installed
    if (!isPackageInstalled('swagger-ui-express')) {
      // Show enhanced HTML page with more options
      const document = await getEnhancedDocument();
      const info = document.info || { title: 'MWAP API', version: '1.0.0' };
      const pathCount = Object.keys(document.paths || {}).length;
      const schemaCount = Object.keys(document.components?.schemas || {}).length;
      
      return res.send(`
        <html>
          <head>
            <title>${info.title} - Documentation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 1000px; margin: 0 auto; }
              h1 { color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
              h2 { color: #555; margin-top: 30px; }
              .stats { display: flex; gap: 20px; margin: 20px 0; }
              .stat { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
              .stat-number { font-size: 24px; font-weight: bold; color: #0066cc; }
              .stat-label { color: #666; font-size: 14px; }
              pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
              a { color: #0066cc; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .button { display: inline-block; background: #0066cc; color: white; padding: 12px 20px; border-radius: 5px; text-decoration: none; margin: 5px; }
              .button:hover { background: #0052a3; }
              .button.secondary { background: #6c757d; }
              .button.secondary:hover { background: #545b62; }
              .info-box { background: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; }
              .warning-box { background: #fff8e1; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
              .endpoints { margin: 20px 0; }
              .endpoint { background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 5px; }
              .method { display: inline-block; padding: 2px 8px; border-radius: 3px; color: white; font-size: 12px; font-weight: bold; }
              .method.get { background: #28a745; }
              .method.post { background: #007bff; }
              .method.patch { background: #ffc107; color: #000; }
              .method.delete { background: #dc3545; }
            </style>
          </head>
          <body>
            <h1>${info.title}</h1>
            <p><strong>Version:</strong> ${info.version}</p>
            <p>${info.description || 'API documentation for the Modular Web Application Platform'}</p>
            
            <div class="stats">
              <div class="stat">
                <div class="stat-number">${pathCount}</div>
                <div class="stat-label">API Endpoints</div>
              </div>
              <div class="stat">
                <div class="stat-number">${schemaCount}</div>
                <div class="stat-label">Data Schemas</div>
              </div>
              <div class="stat">
                <div class="stat-number">${Object.keys(document.components?.securitySchemes || {}).length}</div>
                <div class="stat-label">Security Schemes</div>
              </div>
            </div>

            <div class="info-box">
              <h3>📚 Documentation Options</h3>
              <p>Choose how you want to explore the API documentation:</p>
              <a href="/docs/json" class="button">📄 OpenAPI JSON</a>
              <a href="/api/v1/openapi?format=yaml" class="button secondary">📝 OpenAPI YAML</a>
              <a href="/docs/info" class="button secondary">ℹ️ API Info</a>
              <a href="/api/v1/openapi/health" class="button secondary">🏥 Health Check</a>
            </div>

            <div class="warning-box">
              <h3>⚡ Enhanced Interactive Documentation</h3>
              <p>For the best experience with interactive API testing, install Swagger UI:</p>
              <pre>npm install swagger-ui-express</pre>
              <p>After installation, refresh this page to access the full interactive documentation.</p>
              <a href="/docs/install" class="button">🚀 Auto-Install Swagger UI</a>
            </div>

            <h2>🛣️ Available Endpoints</h2>
            <div class="endpoints">
              ${Object.entries(document.paths || {}).map(([path, methods]: [string, any]) => 
                Object.entries(methods).map(([method, details]: [string, any]) => `
                  <div class="endpoint">
                    <span class="method ${method.toLowerCase()}">${method.toUpperCase()}</span>
                    <strong>${path}</strong>
                    ${details.summary ? `- ${details.summary}` : ''}
                  </div>
                `).join('')
              ).join('')}
            </div>

            <h2>🔧 Developer Tools</h2>
            <p>Additional tools for API development and testing:</p>
            <a href="/docs/cache/status" class="button secondary">📊 Cache Status</a>
            <a href="/api/v1/openapi/validate" class="button secondary">✅ Validate Spec</a>
            ${process.env.NODE_ENV !== 'production' ? '<a href="/docs/cache/invalidate" class="button secondary">🗑️ Clear Cache</a>' : ''}

            <hr style="margin: 40px 0;">
            <p style="text-align: center; color: #666; font-size: 14px;">
              Generated by MWAP Enhanced OpenAPI Documentation System<br>
              Last updated: ${new Date().toLocaleString()}
            </p>
          </body>
        </html>
      `);
    }

    try {
      // Use swagger-ui-express with enhanced document
      const swaggerUi = require('swagger-ui-express');
      const document = await getEnhancedDocument();
      
      // Serve Swagger UI with the enhanced document
      const swaggerUiAssetHandler = swaggerUi.serveFiles(document, {
        customCss: `
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info .title { color: #0066cc; }
        `,
        customSiteTitle: `${document.info?.title || 'MWAP API'} - Documentation`
      });
      
      const swaggerUiHtml = swaggerUi.generateHTML(document, {
        customCss: `
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info .title { color: #0066cc; }
        `,
        customSiteTitle: `${document.info?.title || 'MWAP API'} - Documentation`
      });
      
      res.send(swaggerUiHtml);
      
    } catch (error) {
      logError('Failed to serve Swagger UI with enhanced document', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to basic HTML
      res.send(`
        <html>
          <head>
            <title>MWAP API Documentation - Error</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
              .error { background: #fff1f0; border-left: 4px solid #f5222d; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; background: #0066cc; color: white; padding: 10px 15px; border-radius: 5px; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1>Documentation Error</h1>
            <div class="error">
              <p>Unable to load enhanced documentation. Please try the JSON format:</p>
              <a href="/docs/json" class="button">View OpenAPI JSON</a>
            </div>
          </body>
        </html>
      `);
    }
  });

  // Auto-install endpoint for swagger-ui-express
  router.get('/install', async (req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: {
          message: 'Package installation not allowed in production',
          code: 'FORBIDDEN',
          status: 403
        }
      });
    }

    // Implementation would be similar to the original but with enhanced feedback
    res.send(`
      <html>
        <head>
          <title>Enhanced Documentation Setup</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            .info { background: #e7f3ff; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Enhanced Documentation Setup</h1>
          <div class="info">
            <p>To enable the full interactive documentation experience, please install swagger-ui-express manually:</p>
            <pre>npm install swagger-ui-express</pre>
            <p>After installation, the enhanced documentation will be available at <a href="/docs">/docs</a></p>
          </div>
        </body>
      </html>
    `);
  });

  return router;
}

/**
 * Invalidate the enhanced docs cache
 */
export function invalidateEnhancedDocsCache(): void {
  cachedDocument = null;
  cacheTimestamp = 0;
  logInfo('Enhanced docs cache invalidated');
}