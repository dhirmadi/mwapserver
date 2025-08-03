/**
 * PKCE Implementation Tests
 * 
 * Tests for OAuth 2.0 with PKCE support including parameter validation,
 * flow detection, and token exchange functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OAuthService } from '../../src/features/oauth/oauth.service.js';
import { OAuthCallbackSecurityService } from '../../src/features/oauth/oauthCallbackSecurity.service.js';

// Mock dependencies
vi.mock('../../src/utils/logger.js', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logAudit: vi.fn()
}));

vi.mock('axios');

describe('PKCE Implementation', () => {
  let oauthService: OAuthService;
  let securityService: OAuthCallbackSecurityService;

  beforeEach(() => {
    oauthService = new OAuthService();
    securityService = new OAuthCallbackSecurityService();
    vi.clearAllMocks();
  });

  describe('PKCE Parameter Validation', () => {
    it('should validate valid PKCE parameters', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
          code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
          code_challenge_method: 'S256',
          pkce_flow: true
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(true);
      expect(result.isPKCEFlow).toBe(true);
      expect(result.issues).toBeUndefined();
    });

    it('should reject code_verifier that is too short', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          code_verifier: 'too_short', // Less than 43 characters
          pkce_flow: true
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(false);
      expect(result.isPKCEFlow).toBe(true);
      expect(result.issues).toContain('code_verifier length must be 43-128 characters (actual: 9)');
    });

    it('should reject code_verifier that is too long', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          code_verifier: 'a'.repeat(129), // More than 128 characters
          pkce_flow: true
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(false);
      expect(result.isPKCEFlow).toBe(true);
      expect(result.issues).toContain('code_verifier length must be 43-128 characters (actual: 129)');
    });

    it('should reject code_verifier with invalid characters', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk@#$', // Invalid characters
          pkce_flow: true
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(false);
      expect(result.isPKCEFlow).toBe(true);
      expect(result.issues).toContain('code_verifier contains invalid characters (must be A-Z, a-z, 0-9, -, ., _, ~)');
    });

    it('should reject invalid code_challenge_method', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
          code_challenge_method: 'MD5', // Invalid method
          pkce_flow: true
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(false);
      expect(result.isPKCEFlow).toBe(true);
      expect(result.issues).toContain('Invalid code_challenge_method: MD5 (must be S256 or plain)');
    });

    it('should accept valid code_challenge_method S256', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
          code_challenge_method: 'S256',
          pkce_flow: true
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(true);
      expect(result.isPKCEFlow).toBe(true);
    });

    it('should accept valid code_challenge_method plain', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
          code_challenge_method: 'plain',
          pkce_flow: true
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(true);
      expect(result.isPKCEFlow).toBe(true);
    });

    it('should handle missing code_verifier for PKCE flow', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          pkce_flow: true
          // Missing code_verifier
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(false);
      expect(result.isPKCEFlow).toBe(true);
      expect(result.issues).toContain('Missing code_verifier for PKCE flow');
    });

    it('should pass validation for non-PKCE flows', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          // No PKCE parameters
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(true);
      expect(result.isPKCEFlow).toBe(false);
      expect(result.issues).toBeUndefined();
    });
  });

  describe('Flow Detection', () => {
    it('should detect PKCE flow when code_verifier is present', () => {
      const integration = {
        metadata: {
          code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isPKCEFlow).toBe(true);
    });

    it('should detect PKCE flow when pkce_flow flag is set', () => {
      const integration = {
        metadata: {
          pkce_flow: true,
          code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isPKCEFlow).toBe(true);
    });

    it('should detect traditional flow when no PKCE parameters', () => {
      const integration = {
        metadata: {}
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isPKCEFlow).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle integration without metadata', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011'
        // No metadata property
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(true);
      expect(result.isPKCEFlow).toBe(false);
    });

    it('should handle null metadata', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: null
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(true);
      expect(result.isPKCEFlow).toBe(false);
    });

    it('should validate minimum valid code_verifier length (43 chars)', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          code_verifier: 'a'.repeat(43), // Exactly 43 characters
          pkce_flow: true
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(true);
      expect(result.isPKCEFlow).toBe(true);
    });

    it('should validate maximum valid code_verifier length (128 chars)', () => {
      const integration = {
        _id: '507f1f77bcf86cd799439011',
        metadata: {
          code_verifier: 'a'.repeat(128), // Exactly 128 characters
          pkce_flow: true
        }
      };

      const result = securityService.validatePKCEParameters(integration);

      expect(result.isValid).toBe(true);
      expect(result.isPKCEFlow).toBe(true);
    });
  });
});

describe('OAuth Service PKCE Integration', () => {
  let oauthService: OAuthService;

  beforeEach(() => {
    oauthService = new OAuthService();
    vi.clearAllMocks();
  });

  describe('Token Exchange Method Signature', () => {
    it('should accept optional codeVerifier parameter', () => {
      // This test verifies the method signature supports PKCE
      const mockProvider = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Google Drive',
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        tokenMethod: 'POST',
        grantType: 'authorization_code'
      };

      // Should not throw when called with codeVerifier
      expect(() => {
        oauthService.exchangeCodeForTokens(
          'test_code',
          mockProvider as any,
          'https://app.com/callback',
          'test_code_verifier' // PKCE parameter
        );
      }).not.toThrow();

      // Should not throw when called without codeVerifier (traditional flow)
      expect(() => {
        oauthService.exchangeCodeForTokens(
          'test_code',
          mockProvider as any,
          'https://app.com/callback'
          // No codeVerifier - traditional flow
        );
      }).not.toThrow();
    });
  });
});