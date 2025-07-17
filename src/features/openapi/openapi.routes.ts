/**
 * OpenAPI Routes
 * 
 * Express router configuration for OpenAPI documentation endpoints
 */

import { Router } from 'express';
import { 
  getOpenAPISpec, 
  getOpenAPIInfo, 
  getCacheStatus, 
  invalidateCache, 
  validateSpecification,
  healthCheck 
} from './openapi.controller.js';
import { wrapAsyncHandler } from '../../utils/response.js';
import { requireSuperAdminRole } from '../../middleware/authorization.js';
import { logInfo } from '../../utils/logger.js';

export function getOpenAPIRouter(): Router {
  const router = Router();

  // JWT authentication is already applied globally in app.ts
  // No need to apply it again here
  
  logInfo('Initializing OpenAPI router with authentication and caching');

  // ===== PUBLIC ROUTES (JWT auth only) =====
  
  /**
   * @swagger
   * /api/v1/openapi.json:
   *   get:
   *     summary: Get complete OpenAPI specification
   *     description: Returns the complete OpenAPI 3.1.0 specification for the MWAP API
   *     tags:
   *       - OpenAPI
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: format
   *         schema:
   *           type: string
   *           enum: [json, yaml]
   *           default: json
   *         description: Response format (JSON or YAML)
   *       - in: query
   *         name: includeExamples
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include examples in the specification
   *       - in: query
   *         name: minify
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Return minified specification
   *     responses:
   *       200:
   *         description: OpenAPI specification
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *           application/x-yaml:
   *             schema:
   *               type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/', wrapAsyncHandler(getOpenAPISpec));

  /**
   * @swagger
   * /api/v1/openapi/info:
   *   get:
   *     summary: Get OpenAPI information summary
   *     description: Returns a summary of the OpenAPI specification including metadata and statistics
   *     tags:
   *       - OpenAPI
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: OpenAPI information summary
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 title:
   *                   type: string
   *                 version:
   *                   type: string
   *                 description:
   *                   type: string
   *                 pathCount:
   *                   type: number
   *                 schemaCount:
   *                   type: number
   *                 tagCount:
   *                   type: number
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/info', wrapAsyncHandler(getOpenAPIInfo));

  /**
   * @swagger
   * /api/v1/openapi/validate:
   *   get:
   *     summary: Validate OpenAPI specification
   *     description: Validates the generated OpenAPI specification for completeness and correctness
   *     tags:
   *       - OpenAPI
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Validation successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 valid:
   *                   type: boolean
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: string
   *                 timestamp:
   *                   type: string
   *       400:
   *         description: Validation failed
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/validate', wrapAsyncHandler(validateSpecification));

  /**
   * @swagger
   * /api/v1/openapi/health:
   *   get:
   *     summary: OpenAPI service health check
   *     description: Returns the health status of the OpenAPI documentation service
   *     tags:
   *       - OpenAPI
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *                 service:
   *                   type: string
   *                 version:
   *                   type: string
   *                 cache:
   *                   type: object
   *                 metrics:
   *                   type: object
   *       503:
   *         description: Service is unhealthy
   *       401:
   *         description: Unauthorized
   */
  router.get('/health', wrapAsyncHandler(healthCheck));

  // ===== CACHE MANAGEMENT ROUTES =====
  
  /**
   * @swagger
   * /api/v1/openapi/cache/status:
   *   get:
   *     summary: Get cache status
   *     description: Returns the current status of the OpenAPI documentation cache
   *     tags:
   *       - OpenAPI
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cache status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 cached:
   *                   type: boolean
   *                 age:
   *                   type: number
   *                 ttl:
   *                   type: number
   *                 lastGenerated:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/cache/status', wrapAsyncHandler(getCacheStatus));

  // ===== ADMIN-ONLY ROUTES =====
  
  /**
   * @swagger
   * /api/v1/openapi/cache/invalidate:
   *   post:
   *     summary: Invalidate OpenAPI cache (admin only)
   *     description: Invalidates the OpenAPI documentation cache, forcing regeneration on next request
   *     tags:
   *       - OpenAPI
   *     security:
   *       - bearerAuth: []
   *       - superAdminRole: []
   *     responses:
   *       200:
   *         description: Cache invalidated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 timestamp:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Super admin role required
   *       500:
   *         description: Internal server error
   */
  router.post('/cache/invalidate', requireSuperAdminRole, wrapAsyncHandler(invalidateCache));

  logInfo('OpenAPI router initialized with 6 endpoints', {
    publicEndpoints: 4,
    adminEndpoints: 1,
    cacheEndpoints: 2
  });

  return router;
}