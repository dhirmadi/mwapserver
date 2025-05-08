import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JwksClient } from 'jwks-rsa';
import { AUTH } from '../../__tests__/constants';

// Import test setup
import '../../__tests__/setup';

// Mock external dependencies
vi.mock('jwks-rsa');
vi.mock('../env.js', () => ({
  env: {
    AUTH0_DOMAIN: AUTH.DOMAIN,
    AUTH0_AUDIENCE: AUTH.AUDIENCE
  }
}));

describe('Auth0 Configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should initialize JWKS client with correct configuration', async () => {
    // Execute
    const { jwksClient } = await import('../auth0.js');
    
    // Verify
    expect(JwksClient).toHaveBeenCalledWith({
      jwksUri: `https://${AUTH.DOMAIN}/.well-known/jwks.json`,
      rateLimit: true,
      cache: true,
      cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
      timeout: 10 * 1000 // 10 seconds
    });
    
    expect(jwksClient).toBeDefined();
  });

  it('should create singleton instance of JWKS client', async () => {
    // Execute
    const { jwksClient: client1 } = await import('../auth0.js');
    const { jwksClient: client2 } = await import('../auth0.js');
    
    // Verify
    expect(client1).toBe(client2);
    expect(JwksClient).toHaveBeenCalledTimes(1);
  });

  it('should construct correct JWKS URI from domain', async () => {
    // Execute
    await import('../auth0.js');
    
    // Verify
    const config = (JwksClient as vi.Mock).mock.calls[0][0];
    expect(config.jwksUri).toBe(`https://${AUTH.DOMAIN}/.well-known/jwks.json`);
  });

  it('should set correct cache and timeout values', async () => {
    // Execute
    await import('../auth0.js');
    
    // Verify
    const config = (JwksClient as vi.Mock).mock.calls[0][0];
    expect(config).toMatchObject({
      cache: true,
      rateLimit: true,
      cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
      timeout: 10 * 1000 // 10 seconds
    });
  });
});