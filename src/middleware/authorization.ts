import { Request, Response, NextFunction } from 'express';
import { PermissionError } from '../utils/errors.js';
import { getUserFromToken } from '../utils/auth.js';
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';
import { logger } from '../utils/logger.js';
import { Tenant } from '../types/tenant.js';

// Extend Express Request type to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

/**
 * Middleware to require that the user is the owner of the specified tenant
 * @param tenantIdParam The request parameter name that contains the tenant ID
 */
export function requireTenantOwner(tenantIdParam = 'tenantId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      const tenantId = req.params[tenantIdParam];
      
      if (!tenantId) {
        logger.warn(`No tenant ID found in request params for parameter: ${tenantIdParam}`);
        throw new PermissionError('Tenant ID is required');
      }
      
      logger.debug(`Checking if user ${user.sub} is owner of tenant ${tenantId}`);
      
      try {
        const tenant = await getDB().collection('tenants').findOne({
          _id: new ObjectId(tenantId),
          ownerId: user.sub
        });
        
        if (!tenant) {
          logger.warn(`User ${user.sub} attempted to access tenant ${tenantId} but is not the owner`);
          throw new PermissionError('Only tenant owners can access this resource');
        }
        
        logger.debug(`User ${user.sub} confirmed as owner of tenant ${tenantId}`);
        
        // Add tenant to request for downstream use
        req.tenant = tenant as Tenant;
        next();
      } catch (error) {
        if (error instanceof Error && error.name === 'BSONError') {
          logger.warn(`Invalid tenant ID format: ${tenantId}`);
          throw new PermissionError('Invalid tenant ID format');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to require that the user is either the owner of the specified tenant or a superadmin
 * @param tenantIdParam The request parameter name that contains the tenant ID
 */
export function requireTenantOwnerOrSuperAdmin(tenantIdParam = 'tenantId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      const tenantId = req.params[tenantIdParam];
      
      if (!tenantId) {
        logger.warn(`No tenant ID found in request params for parameter: ${tenantIdParam}`);
        throw new PermissionError('Tenant ID is required');
      }
      
      logger.debug(`Checking if user ${user.sub} is superadmin or owner of tenant ${tenantId}`);
      
      // Check if superadmin
      const superadmin = await getDB().collection('superadmins').findOne({ userId: user.sub });
      if (superadmin) {
        logger.debug(`User ${user.sub} is a superadmin, access granted`);
        return next();
      }
      
      // Check if tenant owner
      try {
        const tenant = await getDB().collection('tenants').findOne({
          _id: new ObjectId(tenantId),
          ownerId: user.sub
        });
        
        if (!tenant) {
          logger.warn(`User ${user.sub} attempted to access tenant ${tenantId} but is neither owner nor superadmin`);
          throw new PermissionError('Only tenant owners or superadmins can access this resource');
        }
        
        logger.debug(`User ${user.sub} confirmed as owner of tenant ${tenantId}`);
        
        // Add tenant to request for downstream use
        req.tenant = tenant as Tenant;
        next();
      } catch (error) {
        if (error instanceof Error && error.name === 'BSONError') {
          logger.warn(`Invalid tenant ID format: ${tenantId}`);
          throw new PermissionError('Invalid tenant ID format');
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to require that the user has superadmin role
 */
export function requireSuperAdminRole() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      logger.debug(`Checking superadmin role for user: ${user.sub}`);

      const superadmin = await getDB().collection('superadmins').findOne({ userId: user.sub });
      
      if (!superadmin) {
        logger.warn(`User ${user.sub} attempted to access superadmin-only resource but is not a superadmin`);
        throw new PermissionError('Requires superadmin role');
      }

      logger.debug(`User ${user.sub} is a superadmin, access granted`);
      next();
    } catch (error) {
      logger.error(`Superadmin check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      next(error);
    }
  };
}