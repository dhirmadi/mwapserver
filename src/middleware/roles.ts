import { Request, Response, NextFunction } from 'express';
import { PermissionError } from '../utils/errors.js';
import { getUserFromToken } from '../utils/auth.js';
import { getDB } from '../config/db.js';

export type Role = 'OWNER' | 'DEPUTY' | 'MEMBER' | 'SUPERADMIN';

export function requireTenantRole(role: 'OWNER' | 'SUPERADMIN') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      // Role check logic will be implemented in Phase 2
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireProjectRole(role: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      // Role check logic will be implemented in Phase 3
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireSuperAdminRole() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = getUserFromToken(req);
      console.log('[MWAP] Checking superadmin role for user:', user);

      const superadmin = await getDB().collection('superadmins').findOne({ userId: user.sub });
      
      if (!superadmin) {
        console.log('[MWAP] User is not a superadmin:', user.sub);
        throw new PermissionError('Requires superadmin role');
      }

      console.log('[MWAP] User is a superadmin:', user.sub);
      next();
    } catch (error) {
      console.log('[MWAP] Superadmin check failed:', error instanceof Error ? error.message : 'Unknown error');
      next(error);
    }
  };
}
