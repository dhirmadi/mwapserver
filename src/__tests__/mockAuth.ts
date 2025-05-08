import { vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';

// Mock JWT validation
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: (token: string) => {
      if (token === 'test-token') {
        return {
          sub: 'auth0|123',
          email: 'test@example.com'
        };
      }
      throw new Error('Invalid token');
    }
  }
}));

// Mock Auth0 JWKS client
vi.mock('../config/auth0', () => ({
  jwksClient: {
    getSigningKey: vi.fn().mockResolvedValue({
      getPublicKey: () => 'mock-public-key'
    })
  }
}));

// Mock auth middleware
vi.mock('../middleware/auth', () => {
  const { AUTH } = vi.importActual('../__tests__/constants') as typeof import('../__tests__/constants');
  
  return {
    authenticateJWT: () => (req: Request, res: Response, next: NextFunction) => {
      try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          throw new ApiError('No token provided', 401, 'auth/invalid-token');
        }

        const token = authHeader.split(' ')[1];
        if (token === 'test-token') {
          // Set the auth property that express-jwt would set
          (req as any).auth = {
            sub: 'auth0|123',
            email: 'test@example.com',
            name: 'Test User',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            aud: AUTH.AUDIENCE,
            iss: `https://${AUTH.DOMAIN}/`
          };
          next();
        } else if (token === AUTH.ADMIN.sub) {
          // Handle admin token
          (req as any).auth = {
            sub: AUTH.ADMIN.sub,
            email: AUTH.ADMIN.email,
            name: 'Admin User',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600,
            aud: AUTH.AUDIENCE,
            iss: `https://${AUTH.DOMAIN}/`
          };
          next();
        } else {
          throw new ApiError('Invalid token', 401, 'auth/invalid-token');
        }
      } catch (error) {
        // Pass error to error handler middleware
        next(error);
      }
    }
  };
});