import { describe, it, expect, vi } from 'vitest';
import { jsonResponse, errorResponse, wrapAsyncHandler } from '../response.js';
import { ApiError, ValidationError } from '../errors.js';
import { Response } from 'express';

describe('response utils', () => {
  describe('jsonResponse', () => {
    it('should send successful response with data', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      const testData = { id: 1, name: 'test' };
      jsonResponse(mockRes, testData);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: testData
      });
    });

    it('should use custom status code when provided', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      jsonResponse(mockRes, { id: 1 }, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('errorResponse', () => {
    it('should handle ApiError with details', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      const error = new ValidationError('Invalid input', {
        field: 'email',
        message: 'Invalid format'
      });

      errorResponse(mockRes, error);

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

    it('should handle generic Error', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;

      const error = new Error('Something went wrong');
      errorResponse(mockRes, error);

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

  describe('wrapAsyncHandler', () => {
    it('should handle successful async operation', async () => {
      const mockReq = {};
      const mockRes = {
        json: vi.fn()
      };
      const mockNext = vi.fn();

      const handler = wrapAsyncHandler(async (req, res) => {
        res.json({ success: true });
      });

      await handler(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next middleware on failure', async () => {
      const mockReq = {};
      const mockRes = {};
      const mockNext = vi.fn();
      const testError = new Error('Test error');

      const handler = wrapAsyncHandler(async () => {
        throw testError;
      });

      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(testError);
    });
  });
});