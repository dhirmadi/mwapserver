/**
 * Consolidated Authentication and Authorization Middleware
 * 
 * Simplified system that handles both JWT authentication and role-based authorization
 * in a single, maintainable module.
 */

import { expressjwt as jwt } from 'express-jwt';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { jwksClient } from '../config/auth0.js';
import { logInfo, logError, logAudit } from '../utils/logger.js';
import { PermissionError, AuthError } from '../utils/errors.js';
import { getUserFromToken } from '../utils/auth.js';
import { isPublicRoute, logPublicRouteAccess } from './publicRoutes.js';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

// Public routes registry moved to publicRoutes.ts

/**
 * Main JWT authentication middleware
 */
export const authenticateJWT = () => {
  const jwtMiddleware = jwt({
    secret: async (req) => {
      const token = req.headers.authorization?.split(' ')[1] || '';
      if (!token) throw new Error('Missing authorization token');
      
      const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64').toString());
      const key = await jwksClient.getSigningKey(header.kid);
      return key.getPublicKey();
    },
    audience: env.AUTH0_AUDIENCE,
    issuer: `https://${env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  });

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip authentication for public routes
    const publicRoute = isPublicRoute(req.path, req.method);
    if (publicRoute) {
      logPublicRouteAccess(publicRoute, {
        path: publicRoute.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent') as string,
        endpoint: req.originalUrl,
        queryParams: req.query as Record<string, unknown>
      }, true);
      return next();
    }

    jwtMiddleware(req, res, (err) => {
      if (err) {
        if ((err as any).name && (err as any).name !== 'UnauthorizedError') {
          return next(err);
        }
        logError('Authentication failed', {
          error: err.message,
          code: (err as any).code,
          endpoint: req.originalUrl,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent') as string
        });
        logAudit('auth.failed', (req.ip || 'unknown') as string, req.originalUrl, {
          errorCode: (err as any).code,
          errorMessage: err.message,
          method: req.method,
          userAgent: req.get('User-Agent') as string
        });
        
        return res.status(401).json({
          success: false,
          error: {
            code: 'auth/unauthorized',
            message: 'Invalid or expired token'
          }
        });
      }
      
      logInfo('Authentication successful', {
        user: req.auth?.sub,
        endpoint: req.originalUrl,
        method: req.method
      });
      logInfo('Protected route - applying JWT authentication', {
        path: req.path,
        method: req.method,
        hasAuthHeader: Boolean(req.headers.authorization)
      });
      logAudit('auth.success', req.auth?.sub as string, req.originalUrl, {
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent') as string
      });
      
      next();
    });
  };
};

/**
 * Require SuperAdmin role
 */
export function requireSuperAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      
      const superAdmin = await getDB().collection('superadmins').findOne({ 
        userId: user.sub 
      });
      
      if (!superAdmin) {
        throw new PermissionError('SuperAdmin access required');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require user to be a tenant owner for any tenant, or SuperAdmin
 */
export function requireAnyTenantOwnerOrSuperAdmin() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      // Superadmin allowed
      const superAdmin = await getDB().collection('superadmins').findOne({ userId: user.sub });
      if (superAdmin) {
        return next();
      }
      // Owner of any tenant allowed
      const ownsAnyTenant = await getDB().collection('tenants').findOne({ ownerId: user.sub });
      if (!ownsAnyTenant) {
        throw new PermissionError('Tenant owner access required');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require tenant owner access
 */
export function requireTenantOwner(tenantIdParam = 'tenantId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      const tenantId = req.params[tenantIdParam];
      
      if (!tenantId) {
        throw new PermissionError('Tenant ID is required');
      }
      
      // Check if user is SuperAdmin (bypass ownership check)
      const superAdmin = await getDB().collection('superadmins').findOne({ 
        userId: user.sub 
      });
      
      if (superAdmin) {
        return next();
      }
      
      // Check tenant ownership
      const tenant = await getDB().collection('tenants').findOne({
        _id: new ObjectId(tenantId),
        ownerId: user.sub
      });
      
      if (!tenant) {
        throw new PermissionError('Only tenant owners can access this resource');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Require project role access
 */
export function requireProjectRole(role: 'OWNER' | 'DEPUTY' | 'MEMBER') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      const projectId = req.params.id || req.params.projectId;
      
      if (!projectId) {
        throw new PermissionError('Project ID is required');
      }
      
      // Check if user is SuperAdmin (bypass role check)
      const superAdmin = await getDB().collection('superadmins').findOne({ 
        userId: user.sub 
      });
      
      if (superAdmin) {
        return next();
      }
      
      // Find project and check user's role
      const project = await getDB().collection('projects').findOne({
        _id: new ObjectId(projectId)
      });
      
      if (!project) {
        throw new PermissionError('Project not found');
      }
      
      const member = project.members?.find((m: any) => m.userId === user.sub);
      
      if (!member) {
        throw new PermissionError('Access denied to project');
      }
      
      // Check role hierarchy: OWNER > DEPUTY > MEMBER
      const roleHierarchy = { OWNER: 3, DEPUTY: 2, MEMBER: 1 };
      const requiredLevel = roleHierarchy[role];
      const userLevel = roleHierarchy[member.role as keyof typeof roleHierarchy];
      
      if (userLevel < requiredLevel) {
        throw new PermissionError(`${role} access required`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Flexible authorization - tenant owner OR superadmin
 */
export function requireTenantOwnerOrSuperAdmin(tenantIdParam = 'tenantId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      
      // Check if user is SuperAdmin first
      const superAdmin = await getDB().collection('superadmins').findOne({ 
        userId: user.sub 
      });
      
      if (superAdmin) {
        return next();
      }
      
      // Check tenant ownership
      const tenantId = req.params[tenantIdParam];
      
      if (!tenantId) {
        throw new PermissionError('Tenant ID is required');
      }
      
      const tenant = await getDB().collection('tenants').findOne({
        _id: new ObjectId(tenantId),
        ownerId: user.sub
      });
      
      if (!tenant) {
        throw new PermissionError('Access denied');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}