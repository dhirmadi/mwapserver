/**
 * Unit Tests for OAuth Callback Security Service
 * 
 * Tests the security-critical OAuth callback validation logic:
 * - State parameter structure and timestamp validation
 * - Integration ownership verification
 * - Replay attack prevention
 * - Generic error message generation
 * - Comprehensive audit logging
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { 
  OAuthCallbackSecurityService,
  StateParameter,
  CallbackAuditData
} from '../../src/features/oauth/oauthCallbackSecurity.service.ts';

// Mock dependencies
vi.mock('../../src/utils/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logAudit: vi.fn()
}));

vi.mock('../../src/features/cloud-integrations/cloudIntegrations.service', () => ({
  CloudIntegrationsService: vi.fn().mockImplementation(() => ({
    findById: vi.fn()
  }))
}));

vi.mock('../../src/features/cloud-providers/cloudProviders.service', () => ({
  CloudProviderService: vi.fn().mockImplementation(() => ({
    findById: vi.fn()
  }))
}));

describe('OAuth Callback Security Service', () => {
  let securityService: OAuthCallbackSecurityService;
  let mockIntegrationsService: any;
  let mockProviderService: any;
  let mockRequestContext: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    securityService = new OAuthCallbackSecurityService();
    
    // Use the instances inside the service to ensure mocks affect real calls
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockIntegrationsService = (securityService as any).cloudIntegrationsService;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockProviderService = (securityService as any).cloudProviderService;
    
    // Mock request context
    mockRequestContext = {
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 Test Browser',
      timestamp: Date.now()
    };
  });

  describe('State Parameter Validation', () => {
    it('should validate correctly formatted state parameter', async () => {
      const validState: StateParameter = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now() - 60000, // 1 minute ago
        nonce: 'abcdef1234567890'
      };

      const stateParam = Buffer.from(JSON.stringify(validState)).toString('base64');
      
      const result = await securityService.validateStateParameter(stateParam, mockRequestContext);
      
      expect(result.isValid).toBe(true);
      expect(result.stateData).toEqual(validState);
      expect(result.errorCode).toBeUndefined();
    });

    it('should reject missing state parameter', async () => {
      const result = await securityService.validateStateParameter('', mockRequestContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATE');
      expect(result.securityIssues).toContain('Missing or invalid state parameter');
    });

    it('should reject malformed base64 state parameter', async () => {
      const result = await securityService.validateStateParameter('invalid-base64!', mockRequestContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('STATE_DECODE_ERROR');
      expect(result.securityIssues).toContain('State parameter decode failed');
    });

    it('should reject state parameter with invalid JSON', async () => {
      const invalidJson = Buffer.from('invalid json content').toString('base64');
      
      const result = await securityService.validateStateParameter(invalidJson, mockRequestContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('STATE_DECODE_ERROR');
    });

    it('should reject state parameter missing required fields', async () => {
      const invalidState = {
        tenantId: '507f1f77bcf86cd799439011',
        // Missing integrationId, userId, timestamp, nonce
      };

      const stateParam = Buffer.from(JSON.stringify(invalidState)).toString('base64');
      
      const result = await securityService.validateStateParameter(stateParam, mockRequestContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATE_STRUCTURE');
      expect(result.securityIssues).toEqual(
        expect.arrayContaining([
          'Missing required field: integrationId',
          'Missing required field: userId',
          'Missing required field: timestamp',
          'Missing required field: nonce'
        ])
      );
    });

    it('should reject expired state parameter', async () => {
      const expiredState: StateParameter = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now() - (15 * 60 * 1000), // 15 minutes ago (expired)
        nonce: 'abcdef1234567890'
      };

      const stateParam = Buffer.from(JSON.stringify(expiredState)).toString('base64');
      
      const result = await securityService.validateStateParameter(stateParam, mockRequestContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('STATE_EXPIRED');
      expect(result.securityIssues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('State parameter expired')
        ])
      );
    });

    it('should reject state parameter with future timestamp', async () => {
      const futureState: StateParameter = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now() + 60000, // 1 minute in the future
        nonce: 'abcdef1234567890'
      };

      const stateParam = Buffer.from(JSON.stringify(futureState)).toString('base64');
      
      const result = await securityService.validateStateParameter(stateParam, mockRequestContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('STATE_EXPIRED');
      expect(result.securityIssues).toContain('State timestamp is in the future');
    });

    it('should reject state parameter with invalid ObjectId format', async () => {
      const invalidState = {
        tenantId: 'invalid-object-id',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now(),
        nonce: 'abcdef1234567890'
      };

      const stateParam = Buffer.from(JSON.stringify(invalidState)).toString('base64');
      
      const result = await securityService.validateStateParameter(stateParam, mockRequestContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATE_STRUCTURE');
      expect(result.securityIssues).toContain('Invalid tenantId format');
    });

    it('should reject state parameter with short nonce', async () => {
      const invalidState: StateParameter = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now(),
        nonce: 'short' // Too short
      };

      const stateParam = Buffer.from(JSON.stringify(invalidState)).toString('base64');
      
      const result = await securityService.validateStateParameter(stateParam, mockRequestContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_NONCE');
      expect(result.securityIssues).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Nonce too short')
        ])
      );
    });

    it('should reject state parameter with invalid nonce characters', async () => {
      const invalidState: StateParameter = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now(),
        nonce: 'invalid@nonce#chars!' // Invalid characters
      };

      const stateParam = Buffer.from(JSON.stringify(invalidState)).toString('base64');
      
      const result = await securityService.validateStateParameter(stateParam, mockRequestContext);
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_NONCE');
      expect(result.securityIssues).toContain('Nonce contains invalid characters');
    });
  });

  describe('Integration Ownership Verification', () => {
    it('should verify valid integration ownership', async () => {
      const validState: StateParameter = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now(),
        nonce: 'abcdef1234567890'
      };

      // Mock successful integration lookup
      mockIntegrationsService.findById.mockResolvedValue({
        _id: validState.integrationId,
        tenantId: validState.tenantId,
        providerId: '507f1f77bcf86cd799439013',
        status: 'active',
        accessToken: null // No existing token
      });

      // Mock successful provider lookup
      mockProviderService.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439013',
        name: 'Google Drive',
        slug: 'google-drive'
      });

      const result = await securityService.verifyIntegrationOwnership(
        validState,
        { ip: mockRequestContext.ip, userAgent: mockRequestContext.userAgent }
      );
      
      expect(result.isValid).toBe(true);
      expect(result.errorCode).toBeUndefined();
      expect(mockIntegrationsService.findById).toHaveBeenCalledWith(
        validState.integrationId,
        validState.tenantId
      );
    });

    it('should reject when integration not found', async () => {
      const validState: StateParameter = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now(),
        nonce: 'abcdef1234567890'
      };

      // Mock integration not found
      mockIntegrationsService.findById.mockRejectedValue(new Error('Integration not found'));

      const result = await securityService.verifyIntegrationOwnership(
        validState,
        { ip: mockRequestContext.ip, userAgent: mockRequestContext.userAgent }
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INTEGRATION_NOT_FOUND');
      expect(result.securityIssues).toContain('Integration not found');
    });

    it('should reject when integration already has tokens (potential replay attack)', async () => {
      const validState: StateParameter = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now(),
        nonce: 'abcdef1234567890'
      };

      // Mock integration with existing tokens
      mockIntegrationsService.findById.mockResolvedValue({
        _id: validState.integrationId,
        tenantId: validState.tenantId,
        providerId: '507f1f77bcf86cd799439013',
        status: 'active',
        accessToken: 'existing-token' // Already has token
      });

      const result = await securityService.verifyIntegrationOwnership(
        validState,
        { ip: mockRequestContext.ip, userAgent: mockRequestContext.userAgent }
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('ALREADY_CONFIGURED');
      expect(result.securityIssues).toContain('Integration already configured');
      
      // Should log potential replay attack
      const { logAudit } = await import('../../src/utils/logger');
      expect(logAudit).toHaveBeenCalledWith(
        'oauth.callback.duplicate_attempt',
        validState.userId,
        validState.integrationId,
        expect.objectContaining({
          hasExistingTokens: true
        })
      );
    });

    it('should reject when provider not found', async () => {
      const validState: StateParameter = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now(),
        nonce: 'abcdef1234567890'
      };

      // Mock successful integration lookup
      mockIntegrationsService.findById.mockResolvedValue({
        _id: validState.integrationId,
        tenantId: validState.tenantId,
        providerId: '507f1f77bcf86cd799439013',
        status: 'active',
        accessToken: null
      });

      // Mock provider not found
      mockProviderService.findById.mockRejectedValue(new Error('Provider not found'));

      const result = await securityService.verifyIntegrationOwnership(
        validState,
        { ip: mockRequestContext.ip, userAgent: mockRequestContext.userAgent }
      );
      
      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('PROVIDER_UNAVAILABLE');
      expect(result.securityIssues).toContain('Provider not available');
    });
  });

  describe('Audit Logging', () => {
    it('should log successful callback attempts', async () => {
      const auditData: CallbackAuditData = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test',
        timestamp: Date.now(),
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        success: true
      };

      await securityService.logCallbackAttempt(auditData);

      const { logAudit } = await import('../../src/utils/logger');
      expect(logAudit).toHaveBeenCalledWith(
        'oauth.callback.attempt.success',
        auditData.userId,
        auditData.integrationId,
        expect.objectContaining({
          ip: auditData.ip,
          userAgent: auditData.userAgent,
          success: true,
          component: 'oauth_callback_security'
        })
      );
    });

    it('should log failed callback attempts', async () => {
      const auditData: CallbackAuditData = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test',
        timestamp: Date.now(),
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        success: false,
        errorCode: 'STATE_EXPIRED',
        securityIssues: ['State parameter expired']
      };

      await securityService.logCallbackAttempt(auditData);

      const { logAudit, logError } = await import('../../src/utils/logger');
      expect(logAudit).toHaveBeenCalledWith(
        'oauth.callback.attempt.failed',
        auditData.userId,
        auditData.integrationId,
        expect.objectContaining({
          success: false,
          errorCode: 'STATE_EXPIRED'
        })
      );

      // Should also log security issues separately
      expect(logError).toHaveBeenCalledWith(
        'OAuth callback security issues detected',
        expect.objectContaining({
          securityIssues: ['State parameter expired'],
          errorCode: 'STATE_EXPIRED'
        })
      );
    });

    it('should handle logging errors gracefully', async () => {
      const { logError } = await import('../../src/utils/logger');
      
      // Mock logAudit to throw an error
      const { logAudit } = await import('../../src/utils/logger');
      logAudit.mockImplementation(() => {
        throw new Error('Logging failed');
      });

      const auditData: CallbackAuditData = {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Test',
        timestamp: Date.now(),
        success: true
      };

      // Should not throw error
      await expect(securityService.logCallbackAttempt(auditData)).resolves.toBeUndefined();
      
      // Should log the logging error
      expect(logError).toHaveBeenCalledWith(
        'Failed to log callback attempt',
        expect.objectContaining({
          error: 'Logging failed'
        })
      );
    });
  });

  describe('Error Message Generation', () => {
    it('should generate generic error messages for security codes', () => {
      const testCases = [
        { code: 'INVALID_STATE', expectedMessage: 'Invalid request parameters' },
        { code: 'STATE_EXPIRED', expectedMessage: 'Request has expired, please try again' },
        { code: 'INTEGRATION_NOT_FOUND', expectedMessage: 'Integration not found' },
        { code: 'ALREADY_CONFIGURED', expectedMessage: 'Integration already configured' },
        { code: 'UNKNOWN_ERROR', expectedMessage: 'An error occurred during authentication' }
      ];

      testCases.forEach(({ code, expectedMessage }) => {
        const result = securityService.generateErrorResponse(code);
        
        expect(result.message).toBe(expectedMessage);
        expect(result.redirectUrl).toBe(`/oauth/error?message=${encodeURIComponent(expectedMessage)}`);
      });
    });

    it('should provide default message for unknown error codes', () => {
      const result = securityService.generateErrorResponse('UNKNOWN_CODE');
      
      expect(result.message).toBe('An error occurred during authentication');
      expect(result.redirectUrl).toContain('An%20error%20occurred%20during%20authentication');
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle extremely long state parameters', async () => {
      const longNonce = 'a'.repeat(10000);
      const invalidState = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now(),
        nonce: longNonce
      };

      const stateParam = Buffer.from(JSON.stringify(invalidState)).toString('base64');
      
      const result = await securityService.validateStateParameter(stateParam, mockRequestContext);
      
      // Should still validate the structure (nonce length is acceptable if it meets minimum)
      expect(result.isValid).toBe(true);
    });

    it('should handle state parameters with extra fields', async () => {
      const stateWithExtraFields = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now(),
        nonce: 'abcdef1234567890',
        extraField: 'should be ignored',
        maliciousScript: '<script>alert("xss")</script>'
      };

      const stateParam = Buffer.from(JSON.stringify(stateWithExtraFields)).toString('base64');
      
      const result = await securityService.validateStateParameter(stateParam, mockRequestContext);
      
      expect(result.isValid).toBe(true);
      // Extra fields should be preserved in the state data
      expect(result.stateData).toEqual(expect.objectContaining(stateWithExtraFields));
    });

    it('should handle request context with missing fields', async () => {
      const validState: StateParameter = {
        tenantId: '507f1f77bcf86cd799439011',
        integrationId: '507f1f77bcf86cd799439012',
        userId: 'auth0|user123',
        timestamp: Date.now(),
        nonce: 'abcdef1234567890'
      };

      const stateParam = Buffer.from(JSON.stringify(validState)).toString('base64');
      
      const emptyContext = {
        ip: '',
        userAgent: '',
        timestamp: Date.now()
      };
      
      const result = await securityService.validateStateParameter(stateParam, emptyContext);
      
      expect(result.isValid).toBe(true);
      // Should handle empty IP and user agent gracefully
    });
  });
}); 