/**
 * Public Route Registry
 * 
 * This module maintains a strictly controlled registry of routes that can bypass
 * JWT authentication. Each route must meet stringent security criteria and be
 * explicitly documented for security review.
 * 
 * SECURITY REQUIREMENTS:
 * - Routes must be called by external services only (never by authenticated users)
 * - Routes must not expose any sensitive user or tenant data
 * - Routes must contain internal validation mechanisms (e.g., state parameters)
 * - All access attempts must be audit logged for security monitoring
 * 
 * ZERO TRUST PRINCIPLE:
 * Public routes are the exception, not the rule. Every public route represents
 * a potential security risk and must be justified by business necessity.
 */

import { logInfo, logAudit, logError } from '../utils/logger.js';

/**
 * Public route configuration interface
 */
export interface PublicRouteConfig {
  /** The exact route path that should be public */
  path: string;
  /** HTTP methods allowed for this public route */
  methods: string[];
  /** Business justification for making this route public */
  justification: string;
  /** Security controls implemented in this route */
  securityControls: string[];
  /** Date when this public route was approved for security review */
  approvedDate: string;
  /** Expected external callers for this route */
  externalCallers: string[];
  /** Whether this route exposes any data (should always be false or minimal) */
  exposesData: boolean;
  /** Description of what data (if any) is exposed */
  dataExposed?: string;
}

/**
 * Registry of routes that are explicitly allowed to bypass JWT authentication
 * 
 * IMPORTANT: Adding routes to this registry requires security approval.
 * Each route must meet ALL security criteria defined above.
 */
export const PUBLIC_ROUTES: PublicRouteConfig[] = [
  {
    path: '/api/v1/oauth/callback',
    methods: ['GET'],
    justification: 'OAuth providers (Google, Dropbox, OneDrive) must complete authorization flow without JWT tokens',
    securityControls: [
      'State parameter cryptographic validation',
      'Integration ownership verification',
      'Timestamp validation to prevent replay attacks',
      'Comprehensive audit logging of all attempts',
      'Generic error messages to prevent information disclosure',
      'Redirect URI validation'
    ],
    approvedDate: '2025-01-17',
    externalCallers: [
      'Google OAuth 2.0 service',
      'Dropbox OAuth 2.0 service', 
      'Microsoft OneDrive OAuth 2.0 service'
    ],
    exposesData: false,
    dataExposed: 'None - only redirects to success/error pages with minimal information'
  }
];

/**
 * Health check endpoint configuration
 * Note: This is handled separately in app.ts before JWT middleware
 */
export const HEALTH_CHECK_ROUTE = '/health';

/**
 * Check if a route should bypass JWT authentication
 * 
 * Uses exact path matching for security - no wildcards or patterns allowed.
 * This prevents accidental exposure of protected routes through path manipulation.
 * 
 * @param path - The request path to check
 * @param method - The HTTP method
 * @returns Configuration object if route is public, null otherwise
 */
export function isPublicRoute(path: string, method: string): PublicRouteConfig | null {
  // Normalize path by removing trailing slashes and query parameters
  const normalizedPath = path.split('?')[0].replace(/\/$/, '') || '/';
  const upperMethod = method.toUpperCase();

  logInfo('Checking if route is public', {
    originalPath: path,
    normalizedPath,
    method: upperMethod,
    timestamp: new Date().toISOString()
  });

  // Check health endpoint first (handled separately)
  if (normalizedPath === HEALTH_CHECK_ROUTE) {
    logInfo('Health check route detected - handled separately');
    return null; // Health check is handled before JWT middleware
  }

  // Check against public route registry
  for (const route of PUBLIC_ROUTES) {
    if (route.path === normalizedPath && route.methods.includes(upperMethod)) {
      logAudit('public.route.matched', 'system', route.path, {
        matchedRoute: route.path,
        method: upperMethod,
        justification: route.justification,
        securityControls: route.securityControls.length,
        timestamp: new Date().toISOString()
      });

      return route;
    }
  }

  // Log non-public routes for security monitoring
  logInfo('Route requires JWT authentication', {
    path: normalizedPath,
    method: upperMethod,
    publicRoutesCount: PUBLIC_ROUTES.length
  });

  return null;
}

/**
 * Log public route access for security monitoring
 * 
 * This function should be called whenever a public route is accessed
 * to maintain comprehensive audit logs for security review.
 * 
 * @param routeConfig - The public route configuration
 * @param request - Request details for logging
 * @param success - Whether the request was successful
 */
export function logPublicRouteAccess(
  routeConfig: PublicRouteConfig,
  request: {
    path: string;
    method: string;
    ip?: string;
    userAgent?: string;
    queryParams?: Record<string, any>;
  },
  success: boolean
): void {
  const logData = {
    publicRoute: routeConfig.path,
    method: request.method,
    success,
    ip: request.ip || 'unknown',
    userAgent: request.userAgent || 'unknown',
    queryParams: request.queryParams || {},
    securityControls: routeConfig.securityControls,
    externalCallers: routeConfig.externalCallers,
    timestamp: new Date().toISOString(),
    exposesData: routeConfig.exposesData
  };

  if (success) {
    logAudit('public.route.access.success', 'external', routeConfig.path, logData);
  } else {
    logError('public.route.access.failed', logData);
  }
}

/**
 * Validate that all public routes meet security criteria
 * 
 * This function can be used in tests or startup validation to ensure
 * all public routes have proper security documentation.
 */
export function validatePublicRoutesSecurity(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  for (const route of PUBLIC_ROUTES) {
    // Check required fields
    if (!route.path) issues.push(`Route missing path: ${JSON.stringify(route)}`);
    if (!route.methods || route.methods.length === 0) {
      issues.push(`Route missing methods: ${route.path}`);
    }
    if (!route.justification) issues.push(`Route missing justification: ${route.path}`);
    if (!route.securityControls || route.securityControls.length === 0) {
      issues.push(`Route missing security controls: ${route.path}`);
    }
    if (!route.approvedDate) issues.push(`Route missing approval date: ${route.path}`);
    if (!route.externalCallers || route.externalCallers.length === 0) {
      issues.push(`Route missing external callers: ${route.path}`);
    }

    // Security validations
    if (route.exposesData && !route.dataExposed) {
      issues.push(`Route exposes data but doesn't specify what: ${route.path}`);
    }

    // Path validation
    if (!route.path.startsWith('/api/')) {
      issues.push(`Public route should be under /api/ namespace: ${route.path}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Get security report for all public routes
 * 
 * Returns a comprehensive security report for audit purposes.
 */
export function getPublicRoutesSecurityReport(): {
  totalRoutes: number;
  routesByMethod: Record<string, number>;
  dataExposingRoutes: number;
  securityIssues: string[];
} {
  const validation = validatePublicRoutesSecurity();
  const routesByMethod: Record<string, number> = {};
  let dataExposingRoutes = 0;

  for (const route of PUBLIC_ROUTES) {
    if (route.exposesData) dataExposingRoutes++;
    
    for (const method of route.methods) {
      routesByMethod[method] = (routesByMethod[method] || 0) + 1;
    }
  }

  return {
    totalRoutes: PUBLIC_ROUTES.length,
    routesByMethod,
    dataExposingRoutes,
    securityIssues: validation.issues
  };
} 