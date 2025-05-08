import { describe, it, expect, vi } from 'vitest';
import { requireTenantRole, requireProjectRole } from '../roles.js';
import { Request, Response } from 'express';
import { AUTH, ERROR_CODES } from '../../__tests__/constants';
import { expectError } from '../../__tests__/helpers';

// Import test setup
import '../../__tests__/setup';

describe('roles middleware', () => {

  describe('requireTenantRole', () => {
    it('should allow access with valid user', async () => {
      // Setup request
      const mockReq = {
        auth: AUTH.USER
      } as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const mockNext = vi.fn();

      // Execute
      const middleware = requireTenantRole('OWNER');
      await middleware(mockReq, mockRes, mockNext);

      // Verify
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated request', async () => {
      // Setup request
      const mockReq = {} as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const mockNext = vi.fn();

      // Execute
      const middleware = requireTenantRole('OWNER');
      await middleware(mockReq, mockRes, mockNext);

      // Verify
      expectError(mockRes, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireProjectRole', () => {
    it('should allow access with valid user', async () => {
      // Setup request
      const mockReq = {
        auth: AUTH.USER
      } as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const mockNext = vi.fn();

      // Execute
      const middleware = requireProjectRole('MEMBER');
      await middleware(mockReq, mockRes, mockNext);

      // Verify
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated request', async () => {
      // Setup request
      const mockReq = {} as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const mockNext = vi.fn();

      // Execute
      const middleware = requireProjectRole('MEMBER');
      await middleware(mockReq, mockRes, mockNext);

      // Verify
      expectError(mockRes, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});