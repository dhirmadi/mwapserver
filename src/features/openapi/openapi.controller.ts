/**
 * OpenAPI Controller
 * 
 * Request handling and caching for OpenAPI documentation endpoints
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types/express.js';
import { OpenAPIFeatureService } from './openapi.service.js';
import { openAPIValidationService } from './validation.service.js';
import { openAPIPerformanceService } from './performance.service.js';
import { openAPISecurityService } from './security.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { jsonResponse, errorResponse } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { ERROR_CODES } from '../../utils/constants.js';
import { logInfo, logError, logAudit } from '../../utils/logger.js';
import { getUserFromToken } from '../../utils/auth.js';
import { openAPIQuerySchema } from './openapi.schemas.js';

const openAPIFeatureService = new OpenAPIFeatureService();

/**
 * Get complete OpenAPI specification
 * GET /api/v1/openapi.json
 */
export async function getOpenAPISpec(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const query = validateWithSchema(openAPIQuerySchema, req.query as unknown);
    
    logAudit('OpenAPI specification requested', user.sub, 'openapi_spec', {
      userEmail: user.email,
      format: query.format,
      includeExamples: query.includeExamples,
      minify: query.minify,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const specification = await openAPIFeatureService.getOpenAPISpecification({
      format: query.format as 'json' | 'yaml',
      includeExamples: !!query.includeExamples,
      minify: !!query.minify
    });
    
    // Set appropriate content type
    const contentType = query.format === 'yaml' 
      ? 'application/x-yaml' 
      : 'application/json';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    
    if (query.format === 'yaml') {
      return res.status(200).send(specification);
    }
    
    return jsonResponse(res, 200, specification);
  } catch (error) {
    logError('Failed to get OpenAPI specification', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub,
      query: req.query
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Get OpenAPI information summary
 * GET /api/v1/openapi/info
 */
export async function getOpenAPIInfo(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logAudit('OpenAPI info requested', user.sub, 'openapi_info', {
      userEmail: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const info = await openAPIFeatureService.getOpenAPIInfo();
    
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    
    return jsonResponse(res, 200, info);
  } catch (error) {
    logError('Failed to get OpenAPI info', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Get cache status
 * GET /api/v1/openapi/cache/status
 */
export async function getCacheStatus(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logInfo('Cache status requested', {
      userId: user.sub,
      userEmail: user.email
    });

    const status = openAPIFeatureService.getCacheStatus();
    
    return jsonResponse(res, 200, status);
  } catch (error) {
    logError('Failed to get cache status', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Invalidate cache (admin only)
 * POST /api/v1/openapi/cache/invalidate
 */
export async function invalidateCache(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logAudit('Cache invalidation requested', 'system', 'Cache invalidation requested', {
      userId: user.sub,
      userEmail: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    openAPIFeatureService.invalidateCache();
    
    return jsonResponse(res, 200, { 
      message: 'Cache invalidated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Failed to invalidate cache', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Validate OpenAPI specification with comprehensive checks
 * GET /api/v1/openapi/validate
 */
export async function validateSpecification(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logAudit('OpenAPI validation requested', 'system', 'OpenAPI validation requested', {
      userId: user.sub,
      userEmail: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Use enhanced validation service
    const validation = await openAPIValidationService.validateSpecification();
    
    const statusCode = validation.valid ? 200 : 400;
    
    return jsonResponse(res, statusCode, {
      valid: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      metrics: validation.metrics,
      timestamp: validation.timestamp
    });
  } catch (error) {
    logError('Failed to validate OpenAPI specification', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Health check for OpenAPI service
 * GET /api/v1/openapi/health
 */
export async function healthCheck(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logInfo('OpenAPI health check requested', {
      userId: user.sub
    });

    // Check if we can generate basic info
    const info = await openAPIFeatureService.getOpenAPIInfo();
    const cacheStatus = openAPIFeatureService.getCacheStatus();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'openapi',
      version: info.version,
      cache: {
        enabled: true,
        status: cacheStatus.cached ? 'hit' : 'miss',
        age: cacheStatus.age,
        ttl: cacheStatus.ttl
      },
      metrics: {
        pathCount: info.pathCount,
        schemaCount: info.schemaCount,
        tagCount: info.tagCount
      }
    };
    
    return jsonResponse(res, 200, health);
  } catch (error) {
    logError('OpenAPI health check failed', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    const health = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'openapi',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return jsonResponse(res, 503, health);
  }
}

/**
 * Get validation history
 * GET /api/v1/openapi/validation/history
 */
export async function getValidationHistory(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const limit = parseInt(req.query.limit as string) || 10;
    
    logAudit('OpenAPI validation history requested', 'system', 'OpenAPI validation history requested', {
      userId: user.sub,
      userEmail: user.email,
      limit,
      ip: req.ip
    });

    const history = openAPIValidationService.getValidationHistory(limit);
    
    return jsonResponse(res, 200, {
      history,
      count: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Failed to get validation history', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Generate CI/CD validation report
 * GET /api/v1/openapi/validation/ci-report
 */
export async function generateCIReport(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const format = (req.query.format as string) || 'text';
    const failOnErrors = req.query.failOnErrors === 'true';
    const failOnWarnings = req.query.failOnWarnings === 'true';
    
    logAudit('OpenAPI CI report requested', 'system', 'OpenAPI CI report requested', {
      userId: user.sub,
      userEmail: user.email,
      format,
      failOnErrors,
      failOnWarnings,
      ip: req.ip
    });

    const config = {
      enabled: true,
      failOnErrors,
      failOnWarnings,
      outputFormat: format as 'json' | 'junit' | 'text'
    };

    const report = await openAPIValidationService.generateCIReport(config);
    
    // Set appropriate content type
    let contentType = 'text/plain';
    if (format === 'json') {
      contentType = 'application/json';
    } else if (format === 'junit') {
      contentType = 'application/xml';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'no-cache');
    
    return res.status(200).send(report);
  } catch (error) {
    logError('Failed to generate CI report', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Monitor validation status
 * POST /api/v1/openapi/validation/monitor
 */
export async function monitorValidation(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logAudit('OpenAPI validation monitoring triggered', 'system', 'OpenAPI validation monitoring triggered', {
      userId: user.sub,
      userEmail: user.email,
      ip: req.ip
    });

    // Trigger monitoring (async)
    openAPIValidationService.monitorValidation().catch(error => {
      logError('Validation monitoring failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    });
    
    return jsonResponse(res, 202, {
      message: 'Validation monitoring triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Failed to trigger validation monitoring', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}
/**
 * Get performance metrics
 * GET /api/v1/openapi/performance/metrics
 */
export async function getPerformanceMetrics(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logAudit('OpenAPI performance metrics requested', 'system', 'OpenAPI performance metrics requested', {
      userId: user.sub,
      userEmail: user.email,
      ip: req.ip
    });

    const metrics = await openAPIPerformanceService.collectMetrics();
    
    return jsonResponse(res, 200, {
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Failed to get performance metrics', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Run performance benchmarks
 * POST /api/v1/openapi/performance/benchmark
 */
export async function runPerformanceBenchmarks(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const iterations = parseInt(req.body.iterations) || 10;
    
    logAudit('OpenAPI performance benchmarks requested', 'system', 'OpenAPI performance benchmarks requested', {
      userId: user.sub,
      userEmail: user.email,
      iterations,
      ip: req.ip
    });

    const benchmarks = await openAPIPerformanceService.runBenchmarks(iterations);
    
    return jsonResponse(res, 200, {
      benchmarks,
      iterations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Failed to run performance benchmarks', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Optimize cache configuration
 * POST /api/v1/openapi/performance/optimize-cache
 */
export async function optimizeCache(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logAudit('OpenAPI cache optimization requested', 'system', 'OpenAPI cache optimization requested', {
      userId: user.sub,
      userEmail: user.email,
      ip: req.ip
    });

    const optimizedConfig = await openAPIPerformanceService.optimizeCache();
    
    return jsonResponse(res, 200, {
      message: 'Cache configuration optimized',
      configuration: optimizedConfig,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Failed to optimize cache', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Perform security audit
 * POST /api/v1/openapi/security/audit
 */
export async function performSecurityAudit(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logAudit('OpenAPI security audit requested', 'system', 'OpenAPI security audit requested', {
      userId: user.sub,
      userEmail: user.email,
      ip: req.ip
    });

    const auditResult = await openAPISecurityService.performSecurityAudit();
    
    const statusCode = auditResult.secure ? 200 : 400;
    
    return jsonResponse(res, statusCode, auditResult);
  } catch (error) {
    logError('Failed to perform security audit', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Get sanitized OpenAPI specification
 * GET /api/v1/openapi/security/sanitized
 */
export async function getSanitizedSpecification(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    // Log access for security monitoring
    openAPISecurityService.logDocumentationAccess(
      user.sub,
      user.email,
      req.path,
      req.method as string,
      (req.ip || '') as string,
      (req.get('User-Agent') || '') as string,
      true
    );

    const rawDocument = await openAPIFeatureService.getOpenAPISpecification({
      format: 'json',
      includeExamples: false,
      minify: false
    });

    const sanitizedDocument = await openAPISecurityService.sanitizeDocument(rawDocument as any);
    
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
    
    return jsonResponse(res, 200, sanitizedDocument);
  } catch (error) {
    const user = getUserFromToken(req);
    
    // Log failed access
    openAPISecurityService.logDocumentationAccess(
      user.sub,
      user.email,
      req.path,
      req.method as string,
      (req.ip || '') as string,
      (req.get('User-Agent') || '') as string,
      false,
      '500'
    );

    logError('Failed to get sanitized specification', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}

/**
 * Get security access audit log
 * GET /api/v1/openapi/security/audit-log
 */
export async function getSecurityAuditLog(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const limit = parseInt(req.query.limit as string) || 100;
    
    logAudit('OpenAPI security audit log requested', 'system', 'OpenAPI security audit log requested', {
      userId: user.sub,
      userEmail: user.email,
      limit,
      ip: req.ip
    });

    const auditLog = openAPISecurityService.getAccessAuditLog(limit);
    
    return jsonResponse(res, 200, {
      auditLog,
      count: auditLog.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Failed to get security audit log', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error);
    }
    
    return errorResponse(res, new ApiError('Internal server error', 500, ERROR_CODES.SERVER.INTERNAL_ERROR));
  }
}
