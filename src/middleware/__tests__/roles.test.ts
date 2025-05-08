import { describe, it, expect, vi } from 'vitest';
import { requireTenantRole, requireProjectRole } from '../roles.js';
import { Request, Response } from 'express';
import { User } from '../../utils/auth.js';

describe('roles middleware', () => {
  const mockUser: User = {
    sub: 'auth0|123',
    email: 'test@example.com',
    name: 'Test User'
  };

  describe('requireTenantRole', () => {
    it('should call next() when user is authenticated', async () => {
      const mockReq = {
        auth: mockUser
      } as Request;
      const mockRes = {} as Response;
      const mockNext = vi.fn();

      const middleware = requireTenantRole('OWNER');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle errors and pass to next', async () => {
      const mockReq = {} as Request;
      const mockRes = {} as Response;
      const mockNext = vi.fn();

      const middleware = requireTenantRole('OWNER');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe('requireProjectRole', () => {
    it('should call next() when user is authenticated', async () => {
      const mockReq = {
        auth: mockUser
      } as Request;
      const mockRes = {} as Response;
      const mockNext = vi.fn();

      const middleware = requireProjectRole('MEMBER');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle errors and pass to next', async () => {
      const mockReq = {} as Request;
      const mockRes = {} as Response;
      const mockNext = vi.fn();

      const middleware = requireProjectRole('MEMBER');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });
});