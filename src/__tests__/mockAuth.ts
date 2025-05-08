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
  const { authenticateJWT: originalAuthenticateJWT } = vi.importActual('../middleware/auth');
  return {
    authenticateJWT: () => async (req: Request, res: Response, next: NextFunction) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          throw new ApiError('No token provided', 401, 'auth/invalid-token');
        }
        if (token === 'test-token') {
          req.user = { sub: 'auth0|123', email: 'test@example.com' };
          next();
        } else {
          throw new ApiError('Invalid token', 401, 'auth/invalid-token');
        }
      } catch (error) {
        next(error);
      }
    }
  };
});