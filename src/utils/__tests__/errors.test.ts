import { describe, it, expect } from 'vitest';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  PermissionError,
  AuthError,
  ERROR_CODES
} from '../errors';
import { AUTH } from '../../__tests__/constants';

// Import test setup
import '../../__tests__/setup';

describe('Error Classes', () => {
  describe('ApiError', () => {
    it('should create with default values', () => {
      // Create test data
      const message = 'Internal server error';
      
      // Execute
      const error = new ApiError(message);

      // Verify
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.status).toBe(500);
      expect(error.code).toBe(ERROR_CODES.SERVER_ERROR);
      expect(error.name).toBe('ApiError');
    });

    it('should create with custom values', () => {
      // Create test data
      const message = 'Custom error';
      const status = 418;
      const code = 'custom/teapot';

      // Execute
      const error = new ApiError(message, status, code);

      // Verify
      expect(error.message).toBe(message);
      expect(error.status).toBe(status);
      expect(error.code).toBe(code);
    });
  });

  describe('ValidationError', () => {
    it('should create with message only', () => {
      // Create test data
      const message = 'Invalid tenant data';

      // Execute
      const error = new ValidationError(message);

      // Verify
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe(message);
      expect(error.status).toBe(400);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.details).toBeUndefined();
    });

    it('should create with details', () => {
      // Create test data
      const message = 'Invalid tenant data';
      const details = {
        name: 'String must contain at least 2 character(s)',
        settings: {
          maxProjects: 'Number must be greater than or equal to 1'
        }
      };

      // Execute
      const error = new ValidationError(message, details);

      // Verify
      expect(error.message).toBe(message);
      expect(error.details).toEqual(details);
      expect(error.status).toBe(400);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('NotFoundError', () => {
    it('should create with correct properties', () => {
      // Create test data
      const message = 'Tenant not found';

      // Execute
      const error = new NotFoundError(message);

      // Verify
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe(message);
      expect(error.status).toBe(404);
      expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe('PermissionError', () => {
    it('should create with correct properties', () => {
      // Create test data
      const message = 'Not authorized to update tenant';

      // Execute
      const error = new PermissionError(message);

      // Verify
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe(message);
      expect(error.status).toBe(403);
      expect(error.code).toBe(ERROR_CODES.PERMISSION_ERROR);
    });
  });

  describe('AuthError', () => {
    it('should create with correct properties', () => {
      // Create test data
      const message = 'Invalid token';

      // Execute
      const error = new AuthError(message);

      // Verify
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe(message);
      expect(error.status).toBe(401);
      expect(error.code).toBe(ERROR_CODES.AUTH_ERROR);
    });
  });

  describe('Error Inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      // Create test data
      const errors = [
        new ValidationError('Invalid tenant data'),
        new NotFoundError('Tenant not found'),
        new PermissionError('Not authorized to update tenant'),
        new AuthError('Invalid token')
      ];

      // Verify
      errors.forEach(error => {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toBeInstanceOf(Error);
        expect(error.stack).toBeDefined();
      });
    });
  });

  describe('ERROR_CODES', () => {
    it('should have all required error codes', () => {
      // Verify
      expect(ERROR_CODES).toEqual({
        AUTH: {
          INVALID_TOKEN: 'auth/invalid-token',
          NOT_AUTHORIZED: 'auth/not-authorized'
        },
        VALIDATION_ERROR: 'validation/invalid-input',
        SERVER_ERROR: 'server/internal-error',
        TENANT: {
          NOT_FOUND: 'tenant/not-found',
          ALREADY_EXISTS: 'tenant/already-exists',
          NAME_EXISTS: 'tenant/name-exists',
          NOT_AUTHORIZED: 'tenant/not-authorized'
        }
      });
    });
  });
});