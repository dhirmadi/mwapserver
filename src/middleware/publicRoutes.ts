/**
 * Module: middleware/publicRoutes
 * Responsibility: Define and validate publicly accessible routes
 * Inputs: request path and method for checks; route configs for logging
 * Outputs: helpers for public route detection and basic security reporting
 * Security: Public endpoints only (health and OAuth callback)
 */

export type PublicRouteConfig = {
  path: string;
  methods: string[];
  exposesData?: boolean;
  approved?: boolean;
  justification?: string;
  securityControls?: string[];
  externalCallers?: string[];
  approvedDate?: string; // YYYY-MM-DD
};

export const HEALTH_CHECK_ROUTE: PublicRouteConfig = {
  path: '/health',
  methods: ['GET']
};

export const PUBLIC_ROUTES: PublicRouteConfig[] = [
  {
    path: '/api/v1/oauth/callback',
    methods: ['GET'],
    exposesData: false,
    approved: true,
    justification: 'OAuth providers must be able to call this callback endpoint for authorization code exchange',
    securityControls: [
      'state validation',
      'nonce validation',
      'HTTPS-only redirect URIs',
      'host/path allowlist',
      'rate limiting',
      'generic errors',
      'audit logging'
    ],
    externalCallers: [
      'Google OAuth 2.0 service',
      'Dropbox OAuth 2.0 service',
      'Microsoft OneDrive OAuth 2.0 service'
    ],
    approvedDate: '2025-01-17'
  },
  // OAuth Success/Error display pages (no sensitive data, user-facing)
  {
    path: '/api/v1/oauth/success',
    methods: ['GET'],
    exposesData: false,
    approved: true,
    justification: 'User-facing success page after OAuth completes; must be accessible without JWT',
    securityControls: [
      'generic success content',
      'no sensitive data exposure'
    ],
    approvedDate: '2025-10-07'
  },
  {
    path: '/api/v1/oauth/error',
    methods: ['GET'],
    exposesData: false,
    approved: true,
    justification: 'User-facing error page with generic messaging; must be accessible without JWT',
    securityControls: [
      'generic error content',
      'no sensitive data exposure'
    ],
    approvedDate: '2025-10-07'
  },
  // Also allow top-level variants in case frontend/browser is routed without the /api prefix
  {
    path: '/oauth/success',
    methods: ['GET'],
    exposesData: false,
    approved: true,
    justification: 'Compatibility route for success page without /api prefix',
    securityControls: [
      'generic success content',
      'no sensitive data exposure'
    ],
    approvedDate: '2025-10-07'
  },
  {
    path: '/oauth/error',
    methods: ['GET'],
    exposesData: false,
    approved: true,
    justification: 'Compatibility route for error page without /api prefix',
    securityControls: [
      'generic error content',
      'no sensitive data exposure'
    ],
    approvedDate: '2025-10-07'
  }
];

export function isPublicRoute(path: string, method: string): PublicRouteConfig | null {
  if (!path || !method) return null;
  const normalizedPath = path.split('?')[0].replace(/\/$/, '') || '/';
  const upper = method.toUpperCase();
  if (normalizedPath === HEALTH_CHECK_ROUTE.path) return null; // handled separately before auth
  return PUBLIC_ROUTES.find(r => r.path === normalizedPath && r.methods.includes(upper)) || null;
}

export async function logPublicRouteAccess(
  route: PublicRouteConfig,
  meta: Record<string, unknown>,
  success: boolean,
  loggerOverride?: { logAudit: Function; logError: Function }
): Promise<void> {
  const { logAudit, logError } = loggerOverride || await import('../utils/logger.js');
  const enriched = {
    publicRoute: route.path,
    success,
    ...(meta || {})
  } as Record<string, unknown>;
  if (success) {
    // expected shape in legacy tests
    logAudit('public.route.access.success', 'external', route.path, enriched);
  } else {
    logError('public.route.access.failed', enriched);
  }
}

export function validatePublicRoutesSecurity() {
  return {
    valid: PUBLIC_ROUTES.every(r => r.approved && r.methods.length > 0),
    issues: [] as string[]
  };
}

export function getPublicRoutesSecurityReport() {
  const routesByMethod: Record<string, number> = {};
  for (const r of PUBLIC_ROUTES) {
    for (const m of r.methods) routesByMethod[m] = (routesByMethod[m] || 0) + 1;
  }
  return {
    totalRoutes: PUBLIC_ROUTES.length,
    routesByMethod,
    dataExposingRoutes: PUBLIC_ROUTES.filter(r => r.exposesData).length,
    securityIssues: [] as string[]
  };
}


