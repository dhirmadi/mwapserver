import { describe, it, expect, vi } from 'vitest';
import { jsonResponse, errorResponse, wrapAsyncHandler } from '../response.js';
import { ApiError, ValidationError } from '../errors.js';
import { Request, Response } from 'express';
import { ERROR_CODES } from '../../__tests__/constants';
import { expectSuccess, expectError } from '../../__tests__/helpers';
import { createTenant } from '../../__tests__/factories';

// Import test setup
import '../../__tests__/setup';

describe('response utils', () => {
  describe('jsonResponse', () => {
    it('should send successful response with data', () => {
      // Create test data
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      const tenant = createTenant();

      // Execute
      jsonResponse(mockRes, tenant);

      // Verify
      expectSuccess(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: tenant
      });
    });

    it('should use custom status code when provided', () => {
      // Create test data
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      const tenant = createTenant();

      // Execute
      jsonResponse(mockRes, tenant, 201);

      // Verify
      expectSuccess(mockRes, 201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: tenant
      });
    });
  });

  describe('errorResponse', () => {
    it('should handle ApiError with details', () => {
      // Create test data
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      const details = {
        name: 'String must contain at least 2 character(s)',
        settings: {
          maxProjects: 'Number must be greater than or equal to 1'
        }
      };
      const error = new ValidationError('Invalid input', details);

      // Execute
      errorResponse(mockRes, error);

      // Verify
      expectError(mockRes, 400, ERROR_CODES.VALIDATION.INVALID_INPUT, { details });
    });

    it('should handle generic Error', () => {
      // Create test data
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      const error = new Error('Something went wrong');

      // Execute
      errorResponse(mockRes, error);

      // Verify
      expectError(mockRes, 500, ERROR_CODES.SERVER.INTERNAL_ERROR);
    });
  });

  describe('wrapAsyncHandler', () => {
    it('should handle successful async operation', async () => {
      // Create test data
      const mockReq = {} as Request;
      const mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      } as unknown as Response;
      const mockNext = vi.fn();

      const tenant = createTenant();
      const handler = wrapAsyncHandler(async (req: Request, res: Response) => {
        jsonResponse(res, tenant);
      });

      // Execute
      await handler(mockReq, mockRes, mockNext);

      // Verify
      expectSuccess(mockRes);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: tenant
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next middleware on failure', async () => {
      // Create test data
      const mockReq = {} as Request;
      const mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      } as unknown as Response;
      const mockNext = vi.fn();

      const error = new ValidationError('Invalid input', {
        name: 'Required'
      });

      const handler = wrapAsyncHandler(async () => {
        throw error;
      });

      // Execute
      await handler(mockReq, mockRes, mockNext);

      // Verify
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });
});