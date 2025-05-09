export const ERROR_CODES = {
  SERVER: {
    INTERNAL_ERROR: 'server/internal-error'
  },
  VALIDATION: {
    INVALID_INPUT: 'validation/invalid-input'
  },
  RESOURCE: {
    NOT_FOUND: 'resource/not-found'
  },
  AUTH: {
    INVALID_TOKEN: 'auth/invalid-token',
    INSUFFICIENT_PERMISSIONS: 'auth/insufficient-permissions'
  },
  TENANT: {
    NOT_FOUND: 'tenant/not-found',
    NOT_AUTHORIZED: 'tenant/not-authorized',
    NAME_EXISTS: 'tenant/name-exists',
    ALREADY_EXISTS: 'tenant/already-exists',
    UPDATE_FAILED: 'tenant/update-failed'
  }
} as const;