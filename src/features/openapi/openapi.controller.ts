/**
 * OpenAPI Controller
 * 
 * Request handling and caching for OpenAPI documentation endpoints
 */

import { Request, Response } from 'express';
import { OpenAPIFeatureService } from './openapi.service.js';
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
    const query = validateWithSchema(openAPIQuerySchema, req.query);
    
    logAudit('OpenAPI specification requested', {
      userId: user.sub,
      userEmail: user.email,
      format: query.format,
      includeExamples: query.includeExamples,
      minify: query.minify,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const specification = await openAPIFeatureService.getOpenAPISpecification(query);
    
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
      return errorResponse(res, error.statusCode, error.message, error.code);
    }
    
    return errorResponse(res, 500, 'Internal server error', ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Get OpenAPI information summary
 * GET /api/v1/openapi/info
 */
export async function getOpenAPIInfo(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logAudit('OpenAPI info requested', {
      userId: user.sub,
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
      return errorResponse(res, error.statusCode, error.message, error.code);
    }
    
    return errorResponse(res, 500, 'Internal server error', ERROR_CODES.INTERNAL_ERROR);
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
      return errorResponse(res, error.statusCode, error.message, error.code);
    }
    
    return errorResponse(res, 500, 'Internal server error', ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Invalidate cache (admin only)
 * POST /api/v1/openapi/cache/invalidate
 */
export async function invalidateCache(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logAudit('Cache invalidation requested', {
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
      return errorResponse(res, error.statusCode, error.message, error.code);
    }
    
    return errorResponse(res, 500, 'Internal server error', ERROR_CODES.INTERNAL_ERROR);
  }
}

/**
 * Validate OpenAPI specification
 * GET /api/v1/openapi/validate
 */
export async function validateSpecification(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    
    logAudit('OpenAPI validation requested', {
      userId: user.sub,
      userEmail: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const validation = await openAPIFeatureService.validateSpecification();
    
    const statusCode = validation.valid ? 200 : 400;
    
    return jsonResponse(res, statusCode, {
      valid: validation.valid,
      errors: validation.errors,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logError('Failed to validate OpenAPI specification', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.sub
    });
    
    if (error instanceof ApiError) {
      return errorResponse(res, error.statusCode, error.message, error.code);
    }
    
    return errorResponse(res, 500, 'Internal server error', ERROR_CODES.INTERNAL_ERROR);
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