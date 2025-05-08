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
  }
} as const;

/**
 * Standard error codes
 */
export const ERROR_CODES = {
  AUTH: {
    UNAUTHORIZED: 'auth/unauthorized',
    INVALID_TOKEN: 'auth/invalid-token'
  }
} as const;