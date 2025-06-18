import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';
import { getUserFromToken } from '../utils/auth.js';
import { PermissionError } from '../utils/errors.js';
import { logInfo, logError } from '../utils/logger.js';

/**
 * Middleware to require SuperAdmin role
 */
export const requireSuperAdminRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getUserFromToken(req);
    
    if (!user || !user.sub) {
      throw new PermissionError('Authentication required');
    }
    
    // Check if user has SuperAdmin role
    const isSuperAdmin = user.roles?.includes('SuperAdmin');
    
    if (!isSuperAdmin) {
      logInfo('Permission denied - SuperAdmin role required', { userId: user.sub });
      throw new PermissionError('SuperAdmin role required');
    }
    
    next();
  } catch (error) {
    logError('Error in requireSuperAdminRole middleware', error);
    next(error);
  }
};

/**
 * Middleware to require tenant owner permissions
 */
export const requireTenantOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getUserFromToken(req);
    
    if (!user || !user.sub) {
      throw new PermissionError('Authentication required');
    }
    
    const tenantId = req.params.tenantId;
    
    if (!tenantId) {
      throw new PermissionError('Tenant ID is required');
    }
    
    // Check if user is tenant owner
    try {
      const tenantObjectId = new ObjectId(tenantId);
      const tenant = await getDB().collection('tenants').findOne({
        _id: tenantObjectId,
        ownerId: user.sub
      });
      
      if (!tenant) {
        logInfo('Permission denied - Not tenant owner', { userId: user.sub, tenantId });
        throw new PermissionError('Only tenant owners can access this resource');
      }
      
      // Add tenant to request for downstream use
      req.tenant = tenant;
      
      next();
    } catch (error) {
      if (error instanceof PermissionError) {
        throw error;
      }
      logError('Error validating tenant ownership', error);
      throw new PermissionError('Invalid tenant ID or permission denied');
    }
  } catch (error) {
    logError('Error in requireTenantOwner middleware', error);
    next(error);
  }
};

/**
 * Middleware to require either tenant owner or SuperAdmin role
 */
export const requireTenantOwnerOrSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = getUserFromToken(req);
    
    if (!user || !user.sub) {
      throw new PermissionError('Authentication required');
    }
    
    // Check if user has SuperAdmin role
    const isSuperAdmin = user.roles?.includes('SuperAdmin');
    
    if (isSuperAdmin) {
      // SuperAdmins can access any tenant
      next();
      return;
    }
    
    // If not SuperAdmin, check if user is tenant owner
    const tenantId = req.params.tenantId;
    
    if (!tenantId) {
      throw new PermissionError('Tenant ID is required');
    }
    
    try {
      const tenantObjectId = new ObjectId(tenantId);
      const tenant = await getDB().collection('tenants').findOne({
        _id: tenantObjectId,
        ownerId: user.sub
      });
      
      if (!tenant) {
        logInfo('Permission denied - Not tenant owner or SuperAdmin', { userId: user.sub, tenantId });
        throw new PermissionError('Only tenant owners or SuperAdmins can access this resource');
      }
      
      // Add tenant to request for downstream use
      req.tenant = tenant;
      
      next();
    } catch (error) {
      if (error instanceof PermissionError) {
        throw error;
      }
      logError('Error validating tenant ownership', error);
      throw new PermissionError('Invalid tenant ID or permission denied');
    }
  } catch (error) {
    logError('Error in requireTenantOwnerOrSuperAdmin middleware', error);
    next(error);
  }
};

// Extend Express Request interface to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: any;
    }
  }
}