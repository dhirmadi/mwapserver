import { describe, it, expect } from 'vitest';
import { getUserFromToken } from '../auth.js';
import { AuthError } from '../errors.js';
import { Request } from 'express';
import { AUTH, ERROR_CODES } from '../../__tests__/constants';

// Import test setup
import '../../__tests__/setup';

describe('auth utils', () => {
  describe('getUserFromToken', () => {
    it('should return user info when valid token is present', () => {
      // Create test data
      const mockReq = {
        auth: AUTH.USER
      } as Request;

      // Execute
      const user = getUserFromToken(mockReq);

      // Verify
      expect(user).toEqual(AUTH.USER);
    });

    it('should throw AuthError when no token is present', () => {
      // Create test data
      const mockReq = {} as Request;

      // Execute and verify
      expect(() => getUserFromToken(mockReq))
        .toThrow(new AuthError('No token provided', 401, ERROR_CODES.AUTH.INVALID_TOKEN));
    });

    it('should throw AuthError when token is invalid', () => {
      // Create test data
      const mockReq = {
        auth: {
          // Missing required fields
          foo: 'bar'
        }
      } as unknown as Request;

      // Execute and verify
      expect(() => getUserFromToken(mockReq))
        .toThrow(new AuthError('Invalid user token', 401, ERROR_CODES.AUTH.INVALID_TOKEN));
    });

    it('should throw AuthError when token has missing fields', () => {
      // Create test data
      const mockReq = {
        auth: {
          sub: AUTH.USER.sub,
          // Missing email and name
        }
      } as unknown as Request;

      // Execute and verify
      expect(() => getUserFromToken(mockReq))
        .toThrow(new AuthError('Invalid user token', 401, ERROR_CODES.AUTH.INVALID_TOKEN));
    });
  });
});