import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../errorHandler.js';
import { ValidationError, AuthError } from '../../utils/errors.js';
import { Request, Response } from 'express';
import { ERROR_CODES } from '../../__tests__/constants';
import { expectError } from '../../__tests__/helpers';

// Import test setup
import '../../__tests__/setup';

describe('error handler middleware', () => {
  it('should handle ValidationError', () => {
    // Create test data
    const details = {
      field: 'email',
      message: 'Invalid format'
    };
    const error = new ValidationError('Invalid input', details);

    // Setup request
    const mockReq = {} as Request;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const mockNext = vi.fn();

    // Execute
    errorHandler(error, mockReq, mockRes, mockNext);

    // Verify
    expectError(mockRes, 400, ERROR_CODES.VALIDATION_ERROR, {
      details
    });
  });

  it('should handle AuthError', () => {
    // Create test data
    const error = new AuthError('Invalid token');

    // Setup request
    const mockReq = {} as Request;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const mockNext = vi.fn();

    // Execute
    errorHandler(error, mockReq, mockRes, mockNext);

    // Verify
    expectError(mockRes, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
  });

  it('should handle generic Error', () => {
    // Create test data
    const error = new Error('Something went wrong');

    // Setup request
    const mockReq = {} as Request;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const mockNext = vi.fn();

    // Execute
    errorHandler(error, mockReq, mockRes, mockNext);

    // Verify
    expectError(mockRes, 500, ERROR_CODES.SERVER_ERROR);
  });
});