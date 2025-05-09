import { describe, it, expect } from 'vitest';
import { getUserFromToken } from '../../src/utils/auth';
import { AuthError } from '../../src/utils/errors';
import type { Request } from 'express';

describe('getUserFromToken', () => {
  it('should return user data from request auth', () => {
    const mockUser = {
      sub: 'auth0|123',
      email: 'test@example.com',
      name: 'Test User'
    };

    const req = {
      auth: mockUser
    } as Request;

    const result = getUserFromToken(req);
    expect(result).toEqual(mockUser);
  });

  it('should throw AuthError if no token provided', () => {
    const req = {} as Request;

    expect(() => getUserFromToken(req)).toThrow(AuthError);
    expect(() => getUserFromToken(req)).toThrow('No token provided');
  });

  it('should throw AuthError if token is invalid', () => {
    const req = {
      auth: {
        sub: null,
        email: 'test@example.com',
        name: 'Test User'
      }
    } as Request;

    expect(() => getUserFromToken(req)).toThrow(AuthError);
    expect(() => getUserFromToken(req)).toThrow('Invalid token');
  });
});