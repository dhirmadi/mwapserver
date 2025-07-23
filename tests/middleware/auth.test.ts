/**
 * Unit Tests for Authentication Middleware
 * 
 * Tests the enhanced authentication middleware to ensure:
 * - Backward compatibility with existing protected routes
 * - Correct public route bypass behavior
 * - Comprehensive security logging
 * - No regression in JWT validation
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { authenticateJWT } from '../../src/middleware/auth.js';

// Extend Request interface for auth property
declare global {
  namespace Express {
    interface Request {
      auth?: any;
    }
  }
}

// Mock external dependencies
vi.mock('../../src/config/env', () => ({
  env: {
    AUTH0_AUDIENCE: 'test-audience',
    AUTH0_DOMAIN: 'test-domain.auth0.com'
  }
}));

vi.mock('../../src/config/auth0', () => ({
  jwksClient: {
    getSigningKey: vi.fn().mockResolvedValue({
      getPublicKey: () => 'mock-public-key'
    })
  }
}));

vi.mock('../../src/utils/logger.js', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logAudit: vi.fn()
}));

vi.mock('../../src/middleware/publicRoutes.js', () => ({
  isPublicRoute: vi.fn(),
  logPublicRouteAccess: vi.fn()
}));

// Mock express-jwt
vi.mock('express-jwt', () => ({
  expressjwt: vi.fn(() => {
    return (req: Request, res: Response, next: NextFunction) => {
      // Mock JWT middleware behavior
      if (req.headers.authorization?.includes('valid-token')) {
        req.auth = { sub: 'user123', email: 'test@example.com' };
        next();
      } else if (req.headers.authorization?.includes('invalid-token')) {
        const error = new Error('Invalid token') as any;
        error.name = 'UnauthorizedError';
        error.code = 'invalid_token';
        next(error);
      } else {
        const error = new Error('No token provided') as any;
        error.name = 'UnauthorizedError';
        error.code = 'missing_token';
        next(error);
      }
    };
  })
}));

describe('Authentication Middleware Tests', () => {
  let req: any;
  let res: Partial<Response>;
  let next: Mock;
  let mockIsPublicRoute: Mock;
  let mockLogPublicRouteAccess: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    
    req = {
      path: '/api/v1/tenants',
      method: 'GET',
      originalUrl: '/api/v1/tenants',
      headers: {},
      ip: '192.168.1.1',
      get: vi.fn().mockImplementation((header: string) => {
        if (header === 'User-Agent') return 'Mozilla/5.0 Test';
        return undefined;
      }),
      query: {}
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    next = vi.fn();

    // Get mocked functions
    const publicRoutes = require('../../src/middleware/publicRoutes.js');
    mockIsPublicRoute = publicRoutes.isPublicRoute;
    mockLogPublicRouteAccess = publicRoutes.logPublicRouteAccess;
  });

  describe('Public Route Handling', () => {
    it('should bypass authentication for public routes', async () => {
      // Setup
      req.path = '/api/v1/oauth/callback';
      req.method = 'GET';
      req.originalUrl = '/api/v1/oauth/callback?code=test&state=test';
      
      const mockRouteConfig = {
        path: '/api/v1/oauth/callback',
        methods: ['GET'],
        justification: 'OAuth callback',
        securityControls: ['state validation'],
        approvedDate: '2025-01-17',
        externalCallers: ['Google OAuth'],
        exposesData: false
      };

      mockIsPublicRoute.mockReturnValue(mockRouteConfig);

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Verify
      expect(mockIsPublicRoute).toHaveBeenCalledWith('/api/v1/oauth/callback', 'GET');
      expect(mockLogPublicRouteAccess).toHaveBeenCalledWith(
        mockRouteConfig,
        expect.objectContaining({
          path: '/api/v1/oauth/callback',
          method: 'GET',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test'
        }),
        true
      );
      expect(next).toHaveBeenCalledWith(); // Should proceed without error
      expect(res.status).not.toHaveBeenCalled(); // No error response
    });

    it('should log public route access with comprehensive details', async () => {
      // Setup
      req.path = '/api/v1/oauth/callback';
      req.query = { code: 'test123', state: 'state123' };
      
      const mockRouteConfig = {
        path: '/api/v1/oauth/callback',
        methods: ['GET'],
        justification: 'OAuth callback',
        securityControls: ['state validation'],
        approvedDate: '2025-01-17',
        externalCallers: ['Google OAuth'],
        exposesData: false
      };

      mockIsPublicRoute.mockReturnValue(mockRouteConfig);

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Verify logging details
      expect(mockLogPublicRouteAccess).toHaveBeenCalledWith(
        mockRouteConfig,
        expect.objectContaining({
          path: '/api/v1/oauth/callback',
          method: 'GET',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test',
          queryParams: { code: 'test123', state: 'state123' }
        }),
        true
      );
    });
  });

  describe('Protected Route Handling (Backward Compatibility)', () => {
    it('should require authentication for protected routes', async () => {
      // Setup
      mockIsPublicRoute.mockReturnValue(null); // Not a public route
      req.headers = {}; // No authorization header

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Verify
      expect(mockIsPublicRoute).toHaveBeenCalledWith('/api/v1/tenants', 'GET');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'auth/unauthorized',
          message: 'Invalid or expired token'
        }
      });
    });

    it('should authenticate valid JWT tokens', async () => {
      // Setup
      mockIsPublicRoute.mockReturnValue(null);
      req.headers = { authorization: 'Bearer valid-token' };

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Verify
      expect(next).toHaveBeenCalledWith(); // Should proceed
      expect(req.auth).toEqual({ sub: 'user123', email: 'test@example.com' });
      expect(res.status).not.toHaveBeenCalled(); // No error response
    });

    it('should reject invalid JWT tokens', async () => {
      // Setup
      mockIsPublicRoute.mockReturnValue(null);
      req.headers = { authorization: 'Bearer invalid-token' };

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Verify
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'auth/unauthorized',
          message: 'Invalid or expired token'
        }
      });
    });

    it('should handle various protected routes correctly', async () => {
      const protectedRoutes = [
        '/api/v1/tenants',
        '/api/v1/projects',
        '/api/v1/users',
        '/api/v1/cloud-providers',
        '/api/v1/oauth/tenants/123/integrations/456/refresh'
      ];

      for (const route of protectedRoutes) {
        // Reset mocks
        vi.clearAllMocks();
        mockIsPublicRoute.mockReturnValue(null);
        
        // Setup request for this route
        req.path = route;
        req.originalUrl = route;
        req.headers = { authorization: 'Bearer valid-token' };

        // Execute
        const middleware = authenticateJWT();
        await middleware(req as Request, res as Response, next);

        // Verify
        expect(mockIsPublicRoute).toHaveBeenCalledWith(route, 'GET');
        expect(next).toHaveBeenCalledWith(); // Should proceed with auth
        expect(req.auth).toEqual({ sub: 'user123', email: 'test@example.com' });
      }
    });
  });

  describe('Security Logging and Auditing', () => {
    it('should log authentication failures with comprehensive details', async () => {
      const { logError, logAudit } = require('../../src/utils/logger.js');
      
      // Setup
      mockIsPublicRoute.mockReturnValue(null);
      req.headers = { authorization: 'Bearer invalid-token' };

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Verify error logging
      expect(logError).toHaveBeenCalledWith(
        'Authentication failed',
        expect.objectContaining({
          error: 'Invalid token',
          code: 'invalid_token',
          endpoint: '/api/v1/tenants',
          method: 'GET',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test'
        })
      );

      // Verify audit logging
      expect(logAudit).toHaveBeenCalledWith(
        'auth.failed',
        '192.168.1.1',
        '/api/v1/tenants',
        expect.objectContaining({
          errorCode: 'invalid_token',
          errorMessage: 'Invalid token',
          method: 'GET',
          userAgent: 'Mozilla/5.0 Test'
        })
      );
    });

    it('should log successful authentication with audit trail', async () => {
      const { logInfo, logAudit } = require('../../src/utils/logger.js');
      
      // Setup
      mockIsPublicRoute.mockReturnValue(null);
      req.headers = { authorization: 'Bearer valid-token' };

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Verify success logging
      expect(logInfo).toHaveBeenCalledWith(
        'Authentication successful',
        expect.objectContaining({
          user: 'user123',
          endpoint: '/api/v1/tenants',
          method: 'GET'
        })
      );

      // Verify audit logging
      expect(logAudit).toHaveBeenCalledWith(
        'auth.success',
        'user123',
        '/api/v1/tenants',
        expect.objectContaining({
          method: 'GET',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test'
        })
      );
    });

    it('should log protected route processing', async () => {
      const { logInfo } = require('../../src/utils/logger.js');
      
      // Setup
      mockIsPublicRoute.mockReturnValue(null);
      req.headers = { authorization: 'Bearer valid-token' };

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Verify protected route logging
      expect(logInfo).toHaveBeenCalledWith(
        'Protected route - applying JWT authentication',
        expect.objectContaining({
          path: '/api/v1/tenants',
          method: 'GET',
          hasAuthHeader: true
        })
      );
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing User-Agent header gracefully', async () => {
      // Setup
      mockIsPublicRoute.mockReturnValue(null);
      req.get = vi.fn().mockReturnValue(undefined); // No User-Agent
      req.headers = { authorization: 'Bearer invalid-token' };

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Should not crash and should include default value
      const { logError } = require('../../src/utils/logger.js');
      expect(logError).toHaveBeenCalledWith(
        'Authentication failed',
        expect.objectContaining({
          userAgent: undefined
        })
      );
    });

    it('should handle missing IP address gracefully', async () => {
      // Setup
      mockIsPublicRoute.mockReturnValue(null);
      req.ip = undefined;
      req.headers = { authorization: 'Bearer invalid-token' };

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Should handle undefined IP
      const { logAudit } = require('../../src/utils/logger.js');
      expect(logAudit).toHaveBeenCalledWith(
        'auth.failed',
        undefined,
        '/api/v1/tenants',
        expect.anything()
      );
    });

    it('should handle non-UnauthorizedError exceptions', async () => {
      // Mock express-jwt to throw a different error
      const { expressjwt } = require('express-jwt');
      expressjwt.mockImplementation(() => {
        return (req: Request, res: Response, next: NextFunction) => {
          const error = new Error('Internal JWT error');
          error.name = 'InternalError';
          next(error);
        };
      });

      // Setup
      mockIsPublicRoute.mockReturnValue(null);
      req.headers = { authorization: 'Bearer some-token' };

      // Execute
      const middleware = authenticateJWT();
      await middleware(req as Request, res as Response, next);

      // Verify it passes the error to next()
      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        name: 'InternalError',
        message: 'Internal JWT error'
      }));
    });
  });

  describe('Route Method Handling', () => {
    it('should handle different HTTP methods correctly', async () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        // Reset mocks
        vi.clearAllMocks();
        mockIsPublicRoute.mockReturnValue(null);
        
        // Setup
        req.method = method;
        req.headers = { authorization: 'Bearer valid-token' };

        // Execute
        const middleware = authenticateJWT();
        await middleware(req as Request, res as Response, next);

        // Verify
        expect(mockIsPublicRoute).toHaveBeenCalledWith('/api/v1/tenants', method);
      }
    });
  });
}); 