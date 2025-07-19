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
  healthCheck,
  getValidationHistory,
  generateCIReport,
  monitorValidation,
  getPerformanceMetrics,
  runPerformanceBenchmarks,
  optimizeCache,
  performSecurityAudit,
  getSanitizedSpecification,
  getSecurityAuditLog
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

  // ===== VALIDATION ROUTES =====
  
  /**
   * @swagger
   * /api/v1/openapi/validation/history:
   *   get:
   *     tags: [OpenAPI]
   *     summary: Get validation history
   *     description: Retrieve historical validation results
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Maximum number of history entries to return
   *     responses:
   *       200:
   *         description: Validation history retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 history:
   *                   type: array
   *                   items:
   *                     type: object
   *                 count:
   *                   type: integer
   *                 timestamp:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/validation/history', wrapAsyncHandler(getValidationHistory));

  /**
   * @swagger
   * /api/v1/openapi/validation/ci-report:
   *   get:
   *     tags: [OpenAPI]
   *     summary: Generate CI/CD validation report
   *     description: Generate validation report for CI/CD integration
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: format
   *         schema:
   *           type: string
   *           enum: [json, junit, text]
   *           default: text
   *         description: Report output format
   *       - in: query
   *         name: failOnErrors
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Whether to fail on validation errors
   *       - in: query
   *         name: failOnWarnings
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Whether to fail on validation warnings
   *     responses:
   *       200:
   *         description: CI report generated successfully
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *           application/json:
   *             schema:
   *               type: object
   *           application/xml:
   *             schema:
   *               type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/validation/ci-report', wrapAsyncHandler(generateCIReport));

  /**
   * @swagger
   * /api/v1/openapi/validation/monitor:
   *   post:
   *     tags: [OpenAPI]
   *     summary: Monitor validation status
   *     description: Trigger validation monitoring for error detection
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       202:
   *         description: Validation monitoring triggered
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
   *       500:
   *         description: Internal server error
   */
  router.post('/validation/monitor', wrapAsyncHandler(monitorValidation));

  // ===== PERFORMANCE ROUTES =====
  
  /**
   * @swagger
   * /api/v1/openapi/performance/metrics:
   *   get:
   *     tags: [OpenAPI]
   *     summary: Get performance metrics
   *     description: Retrieve comprehensive performance metrics for OpenAPI generation
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Performance metrics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 metrics:
   *                   type: object
   *                 timestamp:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/performance/metrics', wrapAsyncHandler(getPerformanceMetrics));

  /**
   * @swagger
   * /api/v1/openapi/performance/benchmark:
   *   post:
   *     tags: [OpenAPI]
   *     summary: Run performance benchmarks
   *     description: Execute performance benchmarks for OpenAPI generation
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               iterations:
   *                 type: integer
   *                 default: 10
   *     responses:
   *       200:
   *         description: Benchmarks completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 benchmarks:
   *                   type: array
   *                   items:
   *                     type: object
   *                 iterations:
   *                   type: integer
   *                 timestamp:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.post('/performance/benchmark', wrapAsyncHandler(runPerformanceBenchmarks));

  /**
   * @swagger
   * /api/v1/openapi/performance/optimize-cache:
   *   post:
   *     tags: [OpenAPI]
   *     summary: Optimize cache configuration
   *     description: Automatically optimize cache configuration for better performance
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cache configuration optimized successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                 configuration:
   *                   type: object
   *                 timestamp:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.post('/performance/optimize-cache', wrapAsyncHandler(optimizeCache));

  // ===== SECURITY ROUTES =====
  
  /**
   * @swagger
   * /api/v1/openapi/security/audit:
   *   post:
   *     tags: [OpenAPI]
   *     summary: Perform security audit
   *     description: Execute comprehensive security audit of OpenAPI documentation
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Security audit passed
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 secure:
   *                   type: boolean
   *                 vulnerabilities:
   *                   type: array
   *                   items:
   *                     type: object
   *                 warnings:
   *                   type: array
   *                   items:
   *                     type: object
   *                 timestamp:
   *                   type: string
   *       400:
   *         description: Security vulnerabilities found
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.post('/security/audit', wrapAsyncHandler(performSecurityAudit));

  /**
   * @swagger
   * /api/v1/openapi/security/sanitized:
   *   get:
   *     tags: [OpenAPI]
   *     summary: Get sanitized OpenAPI specification
   *     description: Retrieve OpenAPI specification with sensitive information removed
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Sanitized specification retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/security/sanitized', wrapAsyncHandler(getSanitizedSpecification));

  /**
   * @swagger
   * /api/v1/openapi/security/audit-log:
   *   get:
   *     tags: [OpenAPI]
   *     summary: Get security access audit log
   *     description: Retrieve audit log of documentation access attempts
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 100
   *         description: Maximum number of audit entries to return
   *     responses:
   *       200:
   *         description: Audit log retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 auditLog:
   *                   type: array
   *                   items:
   *                     type: object
   *                 count:
   *                   type: integer
   *                 timestamp:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  router.get('/security/audit-log', wrapAsyncHandler(getSecurityAuditLog));

  logInfo('OpenAPI router initialized with 15 endpoints', {
    publicEndpoints: 4,
    adminEndpoints: 1,
    cacheEndpoints: 2,
    validationEndpoints: 3,
    performanceEndpoints: 3,
    securityEndpoints: 3
  });

  return router;
}