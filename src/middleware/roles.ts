import { Request, Response, NextFunction } from 'express';
import { PermissionError } from '../utils/errors.js';
import { getUserFromToken } from '../utils/auth.js';

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