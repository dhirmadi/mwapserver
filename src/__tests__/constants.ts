/**
 * Standard test authentication constants
 */
export const AUTH = {
  // Standard test token
  TOKEN: 'test-token',
  HEADER: 'Bearer test-token',
  
  // Standard test user
  USER: {
    sub: 'auth0|123',
    email: 'test@example.com'
  },

  // Standard test admin
  ADMIN: {
    sub: 'auth0|admin',
    email: 'admin@example.com'
  },

  // Auth0 configuration
  DOMAIN: 'test.auth0.com',
  AUDIENCE: 'https://api.test.com'
} as const;

/**
 * Standard error codes
 */
export const ERROR_CODES = {
  AUTH: {
    INVALID_TOKEN: 'auth/invalid-token',
    INSUFFICIENT_PERMISSIONS: 'auth/insufficient-permissions'
  },
  VALIDATION: {
    INVALID_INPUT: 'validation/invalid-input'
  },
  SERVER: {
    INTERNAL_ERROR: 'server/internal-error'
  },
  RESOURCE: {
    NOT_FOUND: 'resource/not-found'
  },
  TENANT: {
    NOT_FOUND: 'tenant/not-found',
    ALREADY_EXISTS: 'tenant/already-exists',
    NAME_EXISTS: 'tenant/name-exists',
    NOT_AUTHORIZED: 'tenant/not-authorized'
  }
} as const;