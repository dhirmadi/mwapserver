import { describe, it, expect } from 'vitest';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  PermissionError,
  AuthError,
  ERROR_CODES
} from '../errors';

describe('Error Classes', () => {
  describe('ApiError', () => {
    it('should create with default values', () => {
      const error = new ApiError('test message');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('test message');
      expect(error.status).toBe(500);
      expect(error.code).toBe(ERROR_CODES.SERVER_ERROR);
      expect(error.name).toBe('ApiError');
    });

    it('should create with custom values', () => {
      const error = new ApiError('custom error', 418, 'custom/code');
      expect(error.message).toBe('custom error');
      expect(error.status).toBe(418);
      expect(error.code).toBe('custom/code');
    });
  });

  describe('ValidationError', () => {
    it('should create with message only', () => {
      const error = new ValidationError('invalid input');
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('invalid input');
      expect(error.status).toBe(400);
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.details).toBeUndefined();
    });

    it('should create with details', () => {
      const details = { field: 'name', error: 'required' };
      const error = new ValidationError('invalid input', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('NotFoundError', () => {
    it('should create with correct properties', () => {
      const error = new NotFoundError('resource not found');
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('resource not found');
      expect(error.status).toBe(404);
      expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
    });
  });

  describe('PermissionError', () => {
    it('should create with correct properties', () => {
      const error = new PermissionError('insufficient permissions');
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('insufficient permissions');
      expect(error.status).toBe(403);
      expect(error.code).toBe(ERROR_CODES.PERMISSION_ERROR);
    });
  });

  describe('AuthError', () => {
    it('should create with correct properties', () => {
      const error = new AuthError('invalid token');
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('invalid token');
      expect(error.status).toBe(401);
      expect(error.code).toBe(ERROR_CODES.AUTH_ERROR);
    });
  });

  describe('Error Inheritance', () => {
    it('should maintain proper inheritance chain', () => {
      const errors = [
        new ValidationError('test'),
        new NotFoundError('test'),
        new PermissionError('test'),
        new AuthError('test')
      ];

      errors.forEach(error => {
        expect(error).toBeInstanceOf(ApiError);
        expect(error).toBeInstanceOf(Error);
        expect(error.stack).toBeDefined();
      });
    });
  });

  describe('ERROR_CODES', () => {
    it('should have all required error codes', () => {
      expect(ERROR_CODES).toEqual({
        AUTH_ERROR: 'auth/invalid-token',
        PERMISSION_ERROR: 'auth/insufficient-permissions',
        VALIDATION_ERROR: 'validation/invalid-input',
        SERVER_ERROR: 'server/internal-error',
        NOT_FOUND: 'resource/not-found'
      });
    });
  });
});