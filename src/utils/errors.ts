import { ERROR_CODES } from './constants';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code: string = ERROR_CODES.SERVER.INTERNAL_ERROR) {
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
  constructor(message: string, code: string = ERROR_CODES.AUTH.INSUFFICIENT_PERMISSIONS) {
    super(message, 403, code);
  }
}

export class AuthError extends ApiError {
  constructor(message: string) {
    super(message, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
  }
}