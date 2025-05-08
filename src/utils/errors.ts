export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = 'server/internal-error') {
    super(message);
    this.status = status;
    this.code = code;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends ApiError {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 400, 'validation/invalid-input');
    this.details = details;
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404, 'resource/not-found');
  }
}

export class PermissionError extends ApiError {
  constructor(message: string) {
    super(message, 403, 'auth/insufficient-permissions');
  }
}

export class AuthError extends ApiError {
  constructor(message: string) {
    super(message, 401, 'auth/invalid-token');
  }
}

// Error codes
export const ERROR_CODES = {
  AUTH_ERROR: 'auth/invalid-token',
  PERMISSION_ERROR: 'auth/insufficient-permissions',
  VALIDATION_ERROR: 'validation/invalid-input',
  SERVER_ERROR: 'server/internal-error',
  NOT_FOUND: 'resource/not-found'
} as const;