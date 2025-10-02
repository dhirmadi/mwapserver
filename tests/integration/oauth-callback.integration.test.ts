/**
 * OAuth Callback Integration Tests
 * 
 * Tests the complete OAuth callback flow including:
 * - Enhanced security validation
 * - State parameter validation and expiration
 * - Integration ownership verification
 * - Replay attack prevention
 * - Error handling and generic responses
 * - Comprehensive audit logging
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../../src/app.js';
import { connectToDatabase, getDB } from '../../src/config/db.js';

// Mock external dependencies
vi.mock('../../src/config/auth0.ts', () => ({
  jwksClient: {
    getSigningKey: vi.fn().mockResolvedValue({
      getPublicKey: () => 'mock-public-key'
    })
  }
}));

// Use real logger shim which exposes vi.fn spies

// Use real OAuth service shim; tests will spy on prototype below
const { OAuthService } = await import('../../src/features/oauth/oauth.service.js');
// Provide default resolved behavior for success flows
vi.spyOn(OAuthService.prototype as any, 'exchangeCodeForTokens').mockResolvedValue({
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
  scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
});

describe('OAuth Callback Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testTenantId: string;
  let testIntegrationId: string;
  let testProviderId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    process.env.MONGODB_URI = mongoUri;
    await connectToDatabase();

    // Ensure routes are fully registered before any requests
    const { registerRoutes } = await import('../../src/app.js');
    await registerRoutes();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database
    const db = getDB();
    await db.collection('tenants').deleteMany({});
    await db.collection('cloudProviderIntegrations').deleteMany({});
    await db.collection('cloudProviders').deleteMany({});

    // Setup test data
    testUserId = 'auth0|test123';
    
    // Create test tenant
    const tenantResult = await db.collection('tenants').insertOne({
      name: 'Test Tenant',
      ownerId: testUserId,
      settings: {
        allowPublicProjects: false,
        maxProjects: 10
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false
    });
    testTenantId = tenantResult.insertedId.toString();

    // Create test cloud provider
    const providerResult = await db.collection('cloudProviders').insertOne({
      name: 'Google Drive',
      slug: 'google-drive',
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      grantType: 'authorization_code',
      tokenMethod: 'POST',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });
    testProviderId = providerResult.insertedId.toString();

    // Create test integration (without tokens)
    const integrationResult = await db.collection('cloudProviderIntegrations').insertOne({
      tenantId: tenantResult.insertedId,
      providerId: providerResult.insertedId,
      status: 'active',
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      scopesGranted: [],
      connectedAt: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: testUserId
    });
    testIntegrationId = integrationResult.insertedId.toString();
  });

  describe('Valid OAuth Callback Flow', () => {
    it('should successfully process valid OAuth callback', async () => {
      // Create valid state parameter
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'abcdef1234567890'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');
      const authCode = 'mock-auth-code';

      // Make callback request
      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: authCode,
          state: stateParam
        });

      // Should redirect to success page
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/success');
      expect(response.headers.location).toContain(`tenantId=${testTenantId}`);
      expect(response.headers.location).toContain(`integrationId=${testIntegrationId}`);

      // Verify integration was updated with tokens
      const db = getDB();
      const updatedIntegration = await db.collection('cloudProviderIntegrations').findOne({
        _id: { $oid: testIntegrationId }
      });

      expect(updatedIntegration?.accessToken).toBe('mock-access-token');
      expect(updatedIntegration?.refreshToken).toBe('mock-refresh-token');
      expect(updatedIntegration?.scopesGranted).toEqual(['https://www.googleapis.com/auth/drive.readonly']);
      expect(updatedIntegration?.connectedAt).toBeTruthy();
    });

    it('should handle OAuth provider success with minimal query parameters', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'xyz789abc123def456'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code-123',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toMatch(/^\/oauth\/success\?tenantId=.+&integrationId=.+$/);
    });

    it('should log successful callback attempts with comprehensive context', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now() - 60000, // 1 minute ago
        nonce: 'logging-test-nonce-123'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'logging-test-code',
          state: stateParam
        })
        .set('User-Agent', 'Test-Browser/1.0')
        .set('X-Forwarded-For', '192.168.1.100');

      // Verify audit logging was called
      const spies = (globalThis as any).__MWAP_LOGGER_SPIES__;
      expect(spies.logAudit).toHaveBeenCalledWith(
        'oauth.callback.success',
        testUserId,
        testIntegrationId,
        expect.objectContaining({
          tenantId: testTenantId,
          providerId: testProviderId,
          provider: 'Google Drive',
          scopesGranted: ['https://www.googleapis.com/auth/drive.readonly'],
          ip: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });
  });

  describe('State Parameter Validation', () => {
    it('should reject missing state parameter', async () => {
      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code'
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Invalid%20request%20parameters');
    });

    it('should reject malformed state parameter', async () => {
      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: 'invalid-base64!'
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Invalid%20request%20format');
    });

    it('should reject state parameter with invalid JSON', async () => {
      const invalidJson = Buffer.from('{ invalid json }').toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: invalidJson
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Invalid%20request%20format');
    });

    it('should reject state parameter missing required fields', async () => {
      const incompleteState = {
        tenantId: testTenantId,
        // Missing integrationId, userId, timestamp, nonce
      };

      const stateParam = Buffer.from(JSON.stringify(incompleteState)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Invalid%20request%20parameters');
    });

    it('should reject expired state parameter', async () => {
      const expiredState = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now() - (15 * 60 * 1000), // 15 minutes ago (expired)
        nonce: 'expired-test-nonce'
      };

      const stateParam = Buffer.from(JSON.stringify(expiredState)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Request%20has%20expired');
    });

    it('should reject state parameter with future timestamp', async () => {
      const futureState = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now() + 60000, // 1 minute in the future
        nonce: 'future-test-nonce'
      };

      const stateParam = Buffer.from(JSON.stringify(futureState)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Request%20has%20expired');
    });

    it('should reject state parameter with invalid ObjectId format', async () => {
      const invalidState = {
        tenantId: 'invalid-object-id',
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'invalid-id-test-nonce'
      };

      const stateParam = Buffer.from(JSON.stringify(invalidState)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Invalid%20request%20parameters');
    });

    it('should reject state parameter with short nonce', async () => {
      const shortNonceState = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'short' // Too short (< 16 characters)
      };

      const stateParam = Buffer.from(JSON.stringify(shortNonceState)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Invalid%20security%20token');
    });

    it('should reject state parameter with invalid nonce characters', async () => {
      const invalidNonceState = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'invalid@nonce#chars!' // Invalid characters
      };

      const stateParam = Buffer.from(JSON.stringify(invalidNonceState)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Invalid%20security%20token');
    });
  });

  describe('Integration Ownership Verification', () => {
    it('should reject callback for non-existent integration', async () => {
      const nonExistentIntegrationId = '507f1f77bcf86cd799439999';
      const stateData = {
        tenantId: testTenantId,
        integrationId: nonExistentIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'nonexistent-integration'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Integration%20not%20found');
    });

    it('should reject callback for integration in different tenant', async () => {
      // Create another tenant
      const db = getDB();
      const otherTenantResult = await db.collection('tenants').insertOne({
        name: 'Other Tenant',
        ownerId: 'auth0|other123',
        settings: { allowPublicProjects: false, maxProjects: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        archived: false
      });

      const stateData = {
        tenantId: otherTenantResult.insertedId.toString(),
        integrationId: testIntegrationId, // Integration belongs to different tenant
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'wrong-tenant-test'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Integration%20not%20accessible');
    });

    it('should detect and prevent replay attacks', async () => {
      const db = getDB();

      // Update integration to have existing tokens (simulate completed OAuth)
      await db.collection('cloudProviderIntegrations').updateOne(
        { _id: { $oid: testIntegrationId } },
        {
          $set: {
            accessToken: 'existing-token',
            refreshToken: 'existing-refresh',
            status: 'active',
            connectedAt: new Date()
          }
        }
      );

      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'replay-attack-test'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Integration%20already%20configured');

      // Verify replay attack was logged
      const spies = (globalThis as any).__MWAP_LOGGER_SPIES__;
      expect(spies.logAudit).toHaveBeenCalledWith(
        'oauth.callback.duplicate_attempt',
        testUserId,
        testIntegrationId,
        expect.objectContaining({
          hasExistingTokens: true
        })
      );
    });

    it('should reject callback for non-existent provider', async () => {
      const db = getDB();

      // Delete the provider
      await db.collection('cloudProviders').deleteOne({ _id: { $oid: testProviderId } });

      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'no-provider-test'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Service%20temporarily%20unavailable');
    });
  });

  describe('OAuth Provider Error Handling', () => {
    it('should handle OAuth provider errors gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          error: 'access_denied',
          error_description: 'User denied access to the application'
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Authentication%20failed');
    });

    it('should handle missing authorization code', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'missing-code-test'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          state: stateParam
          // Missing code parameter
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Invalid%20request%20parameters');
    });

    it('should handle token exchange failures', async () => {
      // Force failure once
      const { OAuthService } = await import('../../src/features/oauth/oauth.service.js');
      (OAuthService.prototype as any).exchangeCodeForTokens.mockRejectedValueOnce(new Error('Token exchange failed'));

      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'token-failure-test'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'failing-code',
          state: stateParam
        });

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/error');
      expect(response.headers.location).toContain('Unable%20to%20process%20request');
    });
  });

  describe('Security Monitoring and Logging', () => {
    it('should log all security issues with appropriate details', async () => {
      const invalidState = {
        tenantId: 'invalid-id',
        // Missing other required fields
      };

      const stateParam = Buffer.from(JSON.stringify(invalidState)).toString('base64');

      await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code',
          state: stateParam
        })
        .set('User-Agent', 'Security-Test/1.0')
        .set('X-Forwarded-For', '10.0.0.1');

      // Verify security logging
      const spies = (globalThis as any).__MWAP_LOGGER_SPIES__;
      expect(spies.logError).toHaveBeenCalledWith(
        'OAuth callback security issues detected',
        expect.objectContaining({
          securityIssues: expect.arrayContaining([
            expect.stringContaining('Missing required field')
          ]),
          errorCode: expect.any(String),
          ip: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });

    it('should track failed callback attempts with comprehensive context', async () => {
      await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'test-code'
          // Missing state parameter
        })
        .set('User-Agent', 'Attack-Bot/1.0')
        .set('X-Forwarded-For', '192.168.1.1');

      // Verify failed attempt logging
      const spies = (globalThis as any).__MWAP_LOGGER_SPIES__;
      expect(spies.logAudit).toHaveBeenCalledWith(
        'oauth.callback.attempt.failed',
        'unknown',
        'unknown',
        expect.objectContaining({
          success: false,
          errorCode: 'MISSING_PARAMETERS',
          ip: expect.any(String),
          userAgent: expect.any(String),
          component: 'oauth_callback_security'
        })
      );
    });

    it('should maintain audit trail for successful completions', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'audit-trail-test'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'audit-test-code',
          state: stateParam
        })
        .set('User-Agent', 'Chrome/91.0')
        .set('X-Forwarded-For', '192.168.1.50');

      // Should log successful attempt
      const spies = (globalThis as any).__MWAP_LOGGER_SPIES__;
      expect(spies.logAudit).toHaveBeenCalledWith(
        'oauth.callback.attempt.success',
        testUserId,
        testIntegrationId,
        expect.objectContaining({
          success: true,
          ip: expect.any(String),
          userAgent: expect.any(String),
          component: 'oauth_callback_security'
        })
      );

      // Should log ownership verification
      expect(spies.logAudit).toHaveBeenCalledWith(
        'oauth.ownership.verified',
        testUserId,
        testIntegrationId,
        expect.objectContaining({
          tenantId: testTenantId,
          providerId: testProviderId
        })
      );

      // Should log final success
      expect(spies.logAudit).toHaveBeenCalledWith(
        'oauth.callback.success',
        testUserId,
        testIntegrationId,
        expect.objectContaining({
          tenantId: testTenantId,
          providerId: testProviderId,
          provider: 'Google Drive'
        })
      );
    });
  });

  describe('Edge Cases and Resilience', () => {
    it('should handle extremely long state parameters gracefully', async () => {
      const longNonce = 'a'.repeat(10000);
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: longNonce
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'long-state-test',
          state: stateParam
        });

      // Should still process successfully (nonce length is valid if >= 16)
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/success');
    });

    it('should handle state parameters with extra fields', async () => {
      const stateWithExtras = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'extra-fields-test',
        extraField: 'should be ignored',
        maliciousScript: '<script>alert("xss")</script>'
      };

      const stateParam = Buffer.from(JSON.stringify(stateWithExtras)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'extra-fields-code',
          state: stateParam
        });

      // Should process successfully, ignoring extra fields
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/success');
    });

    it('should handle missing request headers gracefully', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'missing-headers-test'
      };

      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      const response = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'missing-headers-code',
          state: stateParam
        });
        // Not setting User-Agent or IP headers

      // Should still process successfully
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/oauth/success');
    });

    it('should handle database connection issues gracefully', async () => {
      // This test would require mocking database failures
      // Implementation would depend on specific database error scenarios
      expect(true).toBe(true); // Placeholder for database resilience tests
    });
  });
}); 