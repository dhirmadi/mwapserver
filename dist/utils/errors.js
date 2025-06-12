import { ERROR_CODES } from './constants.js';
export class ApiError extends Error {
    constructor(message, status = 500, code = ERROR_CODES.SERVER.INTERNAL_ERROR) {
        super(message);
        this.status = status;
        this.code = code;
        this.name = this.constructor.name;
    }
}
export class ValidationError extends ApiError {
    constructor(message, details) {
        super(message, 400, ERROR_CODES.VALIDATION.INVALID_INPUT);
        this.details = details;
    }
}
export class NotFoundError extends ApiError {
    constructor(message) {
        super(message, 404, ERROR_CODES.RESOURCE.NOT_FOUND);
    }
}
export class PermissionError extends ApiError {
    constructor(message) {
        super(message, 403, ERROR_CODES.AUTH.INSUFFICIENT_PERMISSIONS);
    }
}
export class AuthError extends ApiError {
    constructor(message) {
        super(message, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
    }
}
