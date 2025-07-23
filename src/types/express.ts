/**
 * Express Type Extensions
 * 
 * Extends Express types to include authentication and application-specific properties
 */

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email?: string;
        aud: string;
        iss: string;
        iat: number;
        exp: number;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email?: string;
    aud: string;
    iss: string;
    iat: number;
    exp: number;
  };
}

export interface RequestWithOptionalAuth extends Request {
  user?: {
    sub: string;
    email?: string;
    aud: string;
    iss: string;
    iat: number;
    exp: number;
  };
} 