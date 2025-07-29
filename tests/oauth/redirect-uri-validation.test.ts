/**
 * OAuth Redirect URI Validation Tests
 * 
 * Tests the critical redirect URI handling for Dropbox OAuth compliance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OAuthCallbackSecurityService } from '../../src/features/oauth/oauthCallbackSecurity.service.js';

describe('OAuth Redirect URI Validation', () => {
  let securityService: OAuthCallbackSecurityService;

  beforeEach(() => {
    securityService = new OAuthCallbackSecurityService();
  });

  describe('validateRedirectUri', () => {
    it('should accept HTTPS URIs in production', () => {
      const result = securityService.validateRedirectUri(
        'https://mwapsp.shibari.photo/api/v1/oauth/callback',
        'mwapsp.shibari.photo',
        'production'
      );

      expect(result.isValid).toBe(true);
      expect(result.issues).toBeUndefined();
    });

    it('should accept HTTPS URIs for staging server', () => {
      const result = securityService.validateRedirectUri(
        'https://mwapss.shibari.photo/api/v1/oauth/callback',
        'mwapss.shibari.photo',
        'development'
      );

      expect(result.isValid).toBe(true);
      expect(result.issues).toBeUndefined();
    });

    it('should reject HTTP URIs in production', () => {
      const result = securityService.validateRedirectUri(
        'http://mwapsp.shibari.photo/api/v1/oauth/callback',
        'mwapsp.shibari.photo',
        'production'
      );

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Production environment requires HTTPS redirect URI, got: http');
    });

    it('should accept HTTP URIs in development', () => {
      const result = securityService.validateRedirectUri(
        'http://localhost:3001/api/v1/oauth/callback',
        'localhost:3001',
        'development'
      );

      expect(result.isValid).toBe(true);
      expect(result.issues).toBeUndefined();
    });

    it('should reject unauthorized hosts', () => {
      const result = securityService.validateRedirectUri(
        'https://malicious.com/api/v1/oauth/callback',
        'malicious.com',
        'production'
      );

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Redirect URI host not allowed: malicious.com');
    });

    it('should reject invalid paths', () => {
      const result = securityService.validateRedirectUri(
        'https://mwapsp.shibari.photo/api/v1/oauth/malicious',
        'mwapsp.shibari.photo',
        'production'
      );

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('Invalid redirect URI path: /api/v1/oauth/malicious');
    });
  });

  describe('validateProviderRedirectUriMatch', () => {
    it('should validate matching URIs in production', () => {
      const result = securityService.validateProviderRedirectUriMatch(
        'https://mwapsp.shibari.photo/api/v1/oauth/callback',
        'mwapsp.shibari.photo',
        'production'
      );

      expect(result.isValid).toBe(true);
      expect(result.expectedUri).toBe('https://mwapsp.shibari.photo/api/v1/oauth/callback');
    });

    it('should validate matching URIs for staging', () => {
      const result = securityService.validateProviderRedirectUriMatch(
        'https://mwapss.shibari.photo/api/v1/oauth/callback',
        'mwapss.shibari.photo',
        'development'
      );

      expect(result.isValid).toBe(true);
      expect(result.expectedUri).toBe('http://mwapss.shibari.photo/api/v1/oauth/callback');
    });

    it('should detect HTTP/HTTPS mismatch in production', () => {
      const result = securityService.validateProviderRedirectUriMatch(
        'http://mwapsp.shibari.photo/api/v1/oauth/callback',
        'mwapsp.shibari.photo',
        'production'
      );

      expect(result.isValid).toBe(false);
      expect(result.issues).toContain('CRITICAL: Using HTTP in production - this will cause Dropbox OAuth to fail');
    });

    it('should validate matching URIs in development', () => {
      const result = securityService.validateProviderRedirectUriMatch(
        'http://localhost:3001/api/v1/oauth/callback',
        'localhost:3001',
        'development'
      );

      expect(result.isValid).toBe(true);
      expect(result.expectedUri).toBe('http://localhost:3001/api/v1/oauth/callback');
    });
  });
});