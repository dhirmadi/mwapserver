export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = ERROR_CODES.SERVER.INTERNAL_ERROR) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends ApiError {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 400, ERROR_CODES.VALIDATION.INVALID_INPUT);
    this.details = details;
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404, ERROR_CODES.RESOURCE.NOT_FOUND);
  }
}

export class PermissionError extends ApiError {
  constructor(message: string) {
    super(message, 403, ERROR_CODES.AUTH.INSUFFICIENT_PERMISSIONS);
  }
}

export class AuthError extends ApiError {
  constructor(message: string) {
    super(message, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
  }
}

// Error codes
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