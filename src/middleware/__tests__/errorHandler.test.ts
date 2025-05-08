import { describe, it, expect, vi } from 'vitest';
import { errorHandler } from '../errorHandler.js';
import { ValidationError, AuthError } from '../../utils/errors.js';
import { Request, Response } from 'express';

describe('error handler middleware', () => {
  it('should handle ValidationError', () => {
    const error = new ValidationError('Invalid input', {
      field: 'email',
      message: 'Invalid format'
    });

    const mockReq = {} as Request;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const mockNext = vi.fn();

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'validation/invalid-input',
        message: 'Invalid input',
        details: {
          field: 'email',
          message: 'Invalid format'
        }
      }
    });
  });

  it('should handle AuthError', () => {
    const error = new AuthError('Invalid token');

    const mockReq = {} as Request;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const mockNext = vi.fn();

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'auth/invalid-token',
        message: 'Invalid token'
      }
    });
  });

  it('should handle generic Error', () => {
    const error = new Error('Something went wrong');

    const mockReq = {} as Request;
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const mockNext = vi.fn();

    errorHandler(error, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'server/internal-error',
        message: 'Something went wrong'
      }
    });
  });
});