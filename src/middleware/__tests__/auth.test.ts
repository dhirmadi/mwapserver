import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { jwksClient } from '../../config/auth0.js';
import { env } from '../../config/env.js';
import { AUTH, ERROR_CODES } from '../../__tests__/constants';
import { expectError } from '../../__tests__/helpers';

// Import test setup
import '../../__tests__/setup';

// Mock the jwks-rsa client
vi.mock('../../config/auth0.js', () => ({
  jwksClient: {
    getSigningKey: vi.fn().mockResolvedValue({
      getPublicKey: () => '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...'
    })
  }
}));

describe('auth middleware', () => {
  describe('token validation', () => {
    it('should validate valid JWT token', async () => {
      // Create test data
      const header = { kid: 'test-key-id', alg: 'RS256' };
      const payload = {
        sub: AUTH.USER.sub,
        iss: `https://${env.AUTH0_DOMAIN}/`,
        aud: env.AUTH0_AUDIENCE
      };

      // Create token parts
      const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const mockToken = `${encodedHeader}.${encodedPayload}.mock-signature`;

      // Setup request
      const mockReq = {
        headers: {
          authorization: `Bearer ${mockToken}`
        }
      } as Partial<Request>;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const mockNext = vi.fn();

      // Execute
      const { authenticateJWT } = await import('../auth.js');
      const middleware = authenticateJWT();
      await middleware(mockReq as Request, mockRes, mockNext);

      // Verify
      expect(jwksClient.getSigningKey).toHaveBeenCalledWith('test-key-id');
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject missing token', async () => {
      // Setup request
      const mockReq = {
        headers: {}
      } as Partial<Request>;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const mockNext = vi.fn();

      // Execute
      const { authenticateJWT } = await import('../auth.js');
      const middleware = authenticateJWT();
      await middleware(mockReq as Request, mockRes, mockNext);

      // Verify
      expectError(mockRes, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token format', async () => {
      // Setup request
      const mockReq = {
        headers: {
          authorization: 'invalid-token'
        }
      } as Partial<Request>;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as Response;
      const mockNext = vi.fn();

      // Execute
      const { authenticateJWT } = await import('../auth.js');
      const middleware = authenticateJWT();
      await middleware(mockReq as Request, mockRes, mockNext);

      // Verify
      expectError(mockRes, 401, ERROR_CODES.AUTH.INVALID_TOKEN);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});