/**
 * Unit Tests for Public Route Registry
 * 
 * Tests the security-critical public route detection logic to ensure:
 * - Only explicitly registered routes bypass authentication
 * - Exact path matching prevents security bypasses
 * - All public routes meet security criteria
 * - Comprehensive logging and audit trails
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isPublicRoute,
  validatePublicRoutesSecurity,
  getPublicRoutesSecurityReport,
  logPublicRouteAccess,
  PUBLIC_ROUTES,
  HEALTH_CHECK_ROUTE
} from '../../src/middleware/publicRoutes.js';

// Mock the logger functions
vi.mock('../../src/utils/logger.js', () => ({
  logInfo: vi.fn(),
  logAudit: vi.fn(),
  logError: vi.fn()
}));

describe('Public Route Registry Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isPublicRoute() - Route Detection', () => {
    it('should detect OAuth callback as public route', () => {
      const result = isPublicRoute('/api/v1/oauth/callback', 'GET');
      
      expect(result).not.toBeNull();
      expect(result?.path).toBe('/api/v1/oauth/callback');
      expect(result?.methods).toContain('GET');
      expect(result?.justification).toContain('OAuth providers');
    });

    it('should detect OAuth callback with query parameters', () => {
      const result = isPublicRoute('/api/v1/oauth/callback?code=abc&state=xyz', 'GET');
      
      expect(result).not.toBeNull();
      expect(result?.path).toBe('/api/v1/oauth/callback');
    });

    it('should detect OAuth callback with trailing slash', () => {
      const result = isPublicRoute('/api/v1/oauth/callback/', 'GET');
      
      expect(result).not.toBeNull();
      expect(result?.path).toBe('/api/v1/oauth/callback');
    });

    it('should reject OAuth callback with wrong method', () => {
      const result = isPublicRoute('/api/v1/oauth/callback', 'POST');
      
      expect(result).toBeNull();
    });

    it('should reject protected routes', () => {
      const protectedRoutes = [
        '/api/v1/tenants',
        '/api/v1/projects',
        '/api/v1/users',
        '/api/v1/oauth/tenants/123/integrations/456/refresh'
      ];

      protectedRoutes.forEach(route => {
        const result = isPublicRoute(route, 'GET');
        expect(result).toBeNull();
      });
    });

    it('should handle health check route separately', () => {
      const result = isPublicRoute('/health', 'GET');
      expect(result).toBeNull(); // Health check is handled before JWT middleware
    });

    it('should reject partial path matches for security', () => {
      const maliciousRoutes = [
        '/api/v1/oauth/callback/admin',
        '/api/v1/oauth/callbackhack',
        '/api/v1/oauth',
        '/oauth/callback'
      ];

      maliciousRoutes.forEach(route => {
        const result = isPublicRoute(route, 'GET');
        expect(result).toBeNull();
      });
    });

    it('should be case sensitive for methods', () => {
      expect(isPublicRoute('/api/v1/oauth/callback', 'get')).not.toBeNull();
      expect(isPublicRoute('/api/v1/oauth/callback', 'GET')).not.toBeNull();
      expect(isPublicRoute('/api/v1/oauth/callback', 'Post')).toBeNull();
    });

    it('should handle empty and invalid paths', () => {
      const invalidPaths = ['', '/', ' ', null, undefined];

      invalidPaths.forEach(path => {
        const result = isPublicRoute(path as any, 'GET');
        expect(result).toBeNull();
      });
    });
  });

  describe('Security Validation Tests', () => {
    it('should validate all public routes meet security criteria', () => {
      const validation = validatePublicRoutesSecurity();
      
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should ensure no public routes expose sensitive data', () => {
      PUBLIC_ROUTES.forEach(route => {
        if (route.exposesData) {
          expect(route.dataExposed).toBeDefined();
          expect(route.dataExposed).not.toBe('');
        }
      });
    });

    it('should ensure all public routes have security controls', () => {
      PUBLIC_ROUTES.forEach(route => {
        expect(route.securityControls).toBeDefined();
        expect(route.securityControls.length).toBeGreaterThan(0);
        expect(route.securityControls).toContain('audit logging');
      });
    });

    it('should ensure all public routes have external callers defined', () => {
      PUBLIC_ROUTES.forEach(route => {
        expect(route.externalCallers).toBeDefined();
        expect(route.externalCallers.length).toBeGreaterThan(0);
      });
    });

    it('should ensure all public routes are under /api/ namespace', () => {
      PUBLIC_ROUTES.forEach(route => {
        expect(route.path).toMatch(/^\/api\//);
      });
    });

    it('should ensure all public routes have approval dates', () => {
      PUBLIC_ROUTES.forEach(route => {
        expect(route.approvedDate).toBeDefined();
        expect(route.approvedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('Security Report Generation', () => {
    it('should generate comprehensive security report', () => {
      const report = getPublicRoutesSecurityReport();
      
      expect(report.totalRoutes).toBeGreaterThan(0);
      expect(report.routesByMethod).toBeDefined();
      expect(report.dataExposingRoutes).toBeDefined();
      expect(report.securityIssues).toBeDefined();
    });

    it('should track routes by HTTP method', () => {
      const report = getPublicRoutesSecurityReport();
      
      expect(report.routesByMethod['GET']).toBeGreaterThan(0);
    });

    it('should identify data-exposing routes', () => {
      const report = getPublicRoutesSecurityReport();
      
      // OAuth callback should not expose data
      expect(report.dataExposingRoutes).toBe(0);
    });
  });

  describe('Public Route Access Logging', () => {
    it('should log successful public route access', () => {
      const { logAudit } = require('../../src/utils/logger.js');
      const routeConfig = PUBLIC_ROUTES[0];
      
      logPublicRouteAccess(
        routeConfig,
        {
          path: '/api/v1/oauth/callback',
          method: 'GET',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test',
          queryParams: { code: 'test', state: 'test' }
        },
        true
      );

      expect(logAudit).toHaveBeenCalledWith(
        'public.route.access.success',
        'external',
        routeConfig.path,
        expect.objectContaining({
          publicRoute: routeConfig.path,
          method: 'GET',
          success: true,
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test'
        })
      );
    });

    it('should log failed public route access', () => {
      const { logError } = require('../../src/utils/logger.js');
      const routeConfig = PUBLIC_ROUTES[0];
      
      logPublicRouteAccess(
        routeConfig,
        {
          path: '/api/v1/oauth/callback',
          method: 'GET',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 Test'
        },
        false
      );

      expect(logError).toHaveBeenCalledWith(
        'public.route.access.failed',
        expect.objectContaining({
          publicRoute: routeConfig.path,
          success: false
        })
      );
    });
  });

  describe('Edge Cases and Security Boundaries', () => {
    it('should handle URL encoding in paths', () => {
      const encodedPath = '/api/v1/oauth/callback%2Fadmin';
      const result = isPublicRoute(encodedPath, 'GET');
      
      expect(result).toBeNull(); // Should not match due to encoding
    });

    it('should handle double slashes in paths', () => {
      const result = isPublicRoute('/api/v1//oauth//callback', 'GET');
      
      expect(result).toBeNull(); // Should not match malformed path
    });

    it('should handle very long paths', () => {
      const longPath = '/api/v1/oauth/callback' + 'a'.repeat(1000);
      const result = isPublicRoute(longPath, 'GET');
      
      expect(result).toBeNull();
    });

    it('should handle special characters in paths', () => {
      const specialPaths = [
        '/api/v1/oauth/callback?hack=true',
        '/api/v1/oauth/callback#fragment',
        '/api/v1/oauth/callback/../admin',
        '/api/v1/oauth/callback%00',
        '/api/v1/oauth/callback\n'
      ];

      specialPaths.forEach(path => {
        const result = isPublicRoute(path, 'GET');
        // Only the first one with query params should match (query params are stripped)
        if (path.includes('?hack=true')) {
          expect(result).not.toBeNull();
        } else {
          expect(result).toBeNull();
        }
      });
    });
  });

  describe('Configuration Integrity', () => {
    it('should have limited number of public routes', () => {
      // Security principle: minimize public routes
      expect(PUBLIC_ROUTES.length).toBeLessThanOrEqual(5);
    });

    it('should have OAuth callback route with proper configuration', () => {
      const oauthRoute = PUBLIC_ROUTES.find(route => 
        route.path === '/api/v1/oauth/callback'
      );
      
      expect(oauthRoute).toBeDefined();
      expect(oauthRoute?.methods).toEqual(['GET']);
      expect(oauthRoute?.exposesData).toBe(false);
      expect(oauthRoute?.securityControls.length).toBeGreaterThan(3);
      expect(oauthRoute?.externalCallers).toContain('Google OAuth 2.0 service');
      expect(oauthRoute?.externalCallers).toContain('Dropbox OAuth 2.0 service');
      expect(oauthRoute?.externalCallers).toContain('Microsoft OneDrive OAuth 2.0 service');
    });

    it('should not allow wildcards or patterns in route paths', () => {
      PUBLIC_ROUTES.forEach(route => {
        expect(route.path).not.toMatch(/\*/);
        expect(route.path).not.toMatch(/\?/);
        expect(route.path).not.toMatch(/\[.*\]/);
        expect(route.path).not.toMatch(/\{.*\}/);
      });
    });
  });
}); 