import { describe, it, expect } from 'vitest';
import { getUserFromToken } from '../auth.js';
import { AuthError } from '../errors.js';
import { Request } from 'express';

describe('auth utils', () => {
  describe('getUserFromToken', () => {
    it('should return user info when valid token is present', () => {
      const mockReq = {
        auth: {
          sub: 'auth0|123',
          email: 'test@example.com',
          name: 'Test User'
        }
      } as Request;

      const user = getUserFromToken(mockReq);
      expect(user).toEqual({
        sub: 'auth0|123',
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('should throw AuthError when no token is present', () => {
      const mockReq = {} as Request;
      expect(() => getUserFromToken(mockReq)).toThrow(AuthError);
    });

    it('should throw AuthError when token is invalid', () => {
      const mockReq = {
        auth: {
          // Missing required fields
          foo: 'bar'
        }
      } as unknown as Request;
      expect(() => getUserFromToken(mockReq)).toThrow(AuthError);
    });
  });
});