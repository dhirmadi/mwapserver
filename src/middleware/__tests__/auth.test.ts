import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { jwksClient } from '../../config/auth0.js';
import { env } from '../../config/env.js';

// Mock the jwks-rsa client
vi.mock('../../config/auth0.js', () => ({
  jwksClient: {
    getSigningKey: vi.fn()
  }
}));

describe('auth middleware', () => {
  it('should validate JWT token using JWKS', async () => {
    // Mock the JWKS client response
    const mockPublicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...';
    (jwksClient.getSigningKey as any).mockResolvedValue({
      getPublicKey: () => mockPublicKey
    });

    // Create a valid JWT token structure
    const header = { kid: 'test-key-id', alg: 'RS256' };
    const payload = {
      sub: 'auth0|123',
      iss: `https://${env.AUTH0_DOMAIN}/`,
      aud: env.AUTH0_AUDIENCE
    };

    // Create Base64 encoded parts
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const mockSignature = 'mock-signature';
    const mockToken = `${encodedHeader}.${encodedPayload}.${mockSignature}`;

    // Import the middleware dynamically to get fresh instance
    const { authenticateJWT } = await import('../auth.js');

    // Create mock request and response
    const mockReq = {
      headers: {
        authorization: `Bearer ${mockToken}`
      }
    } as Partial<Request>;

    const mockRes = {} as Response;
    const mockNext = vi.fn();

    // Execute middleware
    await authenticateJWT(mockReq as Request, mockRes, mockNext);

    // Verify JWKS client was called with correct key ID
    expect(jwksClient.getSigningKey).toHaveBeenCalledWith('test-key-id');
  });
});