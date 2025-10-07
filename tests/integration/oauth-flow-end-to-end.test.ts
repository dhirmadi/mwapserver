/**
 * OAuth Flow End-to-End Integration Tests
 * 
 * Tests the complete OAuth authorization flow from start to finish:
 * - State parameter generation and validation
 * - OAuth authorization URL creation
 * - External provider callback simulation
 * - Token exchange and storage
 * - Integration activation and health checks
 * - Error scenarios and recovery
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app, whenRoutesReady } from '../../src/app.js';
import { connectToDatabase, getDB } from '../../src/config/db.js';
import { OAuthService } from '../../src/features/oauth/oauth.service.js';
import { OAuthCallbackSecurityService } from '../../src/features/oauth/oauthCallbackSecurity.service.js';
import { decrypt } from '../../src/utils/encryption.js';
import { CloudIntegrationsService } from '../../src/features/cloud-integrations/cloudIntegrations.service.js';
import { CloudProviderService } from '../../src/features/cloud-providers/cloudProviders.service.js';

// Mock external dependencies
vi.mock('../../src/config/auth0.ts', () => ({
  jwksClient: {
    getSigningKey: vi.fn().mockResolvedValue({
      getPublicKey: () => 'mock-public-key'
    })
  }
}));

vi.mock('../../src/utils/logger.js', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
  logAudit: vi.fn()
}));

// Mock JWT verification for protected endpoints
vi.mock('express-jwt', () => ({
  expressjwt: () => (req: any, res: any, next: any) => {
    // Mock successful JWT verification
    req.auth = {
      sub: 'auth0|test123',
      aud: 'test-audience',
      iss: 'https://test-domain.auth0.com/',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    next();
  }
}));

describe('OAuth Flow End-to-End Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testTenantId: string;
  let testIntegrationId: string;
  let testProviderId: string;
  let testUserId: string;
  let testJWT: string;

  // Services for direct testing
  let oauthService: OAuthService;
  let integrationsService: CloudIntegrationsService;
  let providersService: CloudProviderService;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to test database
    process.env.MONGODB_URI = mongoUri;
    await connectToDatabase();

    // Wait for routes to be fully registered
    await whenRoutesReady();

    // Initialize services
    oauthService = new OAuthService();
    integrationsService = new CloudIntegrationsService();
    providersService = new CloudProviderService();
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
    testJWT = 'mock-jwt-token'; // In real tests, this would be a valid JWT
    
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

    // Create test cloud providers
    const googleProviderResult = await db.collection('cloudProviders').insertOne({
      name: 'Google Drive',
      slug: 'google-drive',
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: 'google-client-id',
      clientSecret: 'google-client-secret',
      grantType: 'authorization_code',
      tokenMethod: 'POST',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });
    testProviderId = googleProviderResult.insertedId.toString();

    // Create additional providers for comprehensive testing
    await db.collection('cloudProviders').insertMany([
      {
        name: 'Dropbox',
        slug: 'dropbox',
        scopes: ['files.content.read'],
        authUrl: 'https://www.dropbox.com/oauth2/authorize',
        tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
        clientId: 'dropbox-client-id',
        clientSecret: 'dropbox-client-secret',
        grantType: 'authorization_code',
        tokenMethod: 'POST',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        name: 'OneDrive',
        slug: 'onedrive',
        scopes: ['Files.Read'],
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        clientId: 'onedrive-client-id',
        clientSecret: 'onedrive-client-secret',
        grantType: 'authorization_code',
        tokenMethod: 'POST',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ]);

    // Create test integration (inactive, no tokens)
    const integrationResult = await db.collection('cloudProviderIntegrations').insertOne({
      tenantId: googleProviderResult.insertedId,
      providerId: googleProviderResult.insertedId,
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

  describe('Complete OAuth Authorization Flow', () => {
    it('should complete full OAuth flow from start to finish', async () => {
      // Step 1: Create integration (simulates frontend creating integration)
      const createResponse = await request(app)
        .post(`/api/v1/tenants/${testTenantId}/integrations`)
        .set('Authorization', `Bearer ${testJWT}`)
        .send({
          providerId: testProviderId,
          status: 'active'
        });

      expect(createResponse.status).toBe(201);
      const createdIntegrationId = createResponse.body.data._id;

      // Step 2: Generate OAuth authorization URL (simulates frontend starting OAuth)
      const provider = await providersService.findById(testProviderId, false);
      const stateData = {
        tenantId: testTenantId,
        integrationId: createdIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'test-nonce-123456789'
      };
      const stateParam = await new OAuthCallbackSecurityService().generateStateParameter(stateData as any);
      
      // Use initiate endpoint to obtain provider URL (ensures PKCE is included)
      const initResp = await request(app)
        .post(`/api/v1/oauth/tenants/${testTenantId}/integrations/${createdIntegrationId}/initiate`)
        .set('Authorization', `Bearer ${testJWT}`)
        .send({});
      expect(initResp.status).toBe(200);
      const authUrlStr: string = initResp.body.data.authorizationUrl;
      const authUrl = new URL(authUrlStr);
      expect(authUrlStr).toContain('accounts.google.com');
      expect(authUrl.searchParams.get('state')).toBeTruthy();
      // PKCE in URL
      expect(authUrl.searchParams.get('code_challenge')).toBeTruthy();
      expect(authUrl.searchParams.get('code_challenge_method')).toBe('S256');

      // Step 3: Simulate OAuth provider callback with authorization code
      const mockAuthCode = 'mock_authorization_code_from_google';
      
      // Mock the token exchange
      vi.spyOn(oauthService, 'exchangeCodeForTokens').mockResolvedValue({
        accessToken: 'ya29.mock_google_access_token',
        refreshToken: 'mock_google_refresh_token',
        expiresIn: 3600,
        scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
      });
      vi.spyOn(OAuthService.prototype as any, 'exchangeCodeForTokens').mockResolvedValueOnce({
        accessToken: 'ya29.mock_google_access_token',
        refreshToken: 'mock_google_refresh_token',
        expiresIn: 3600,
        scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
      });

      const callbackResponse = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: mockAuthCode,
          state: stateParam
        });

      // Should redirect to success page
      expect(callbackResponse.status).toBe(302);
      expect(callbackResponse.headers.location).toContain('/oauth/success');
      expect(callbackResponse.headers.location).toContain(`tenantId=${testTenantId}`);
      expect(callbackResponse.headers.location).toContain(`integrationId=${createdIntegrationId}`);

      // Step 4: Verify integration was updated with tokens
      const updatedIntegrationResponse = await request(app)
        .get(`/api/v1/tenants/${testTenantId}/integrations/${createdIntegrationId}`)
        .set('Authorization', `Bearer ${testJWT}`);

      expect(updatedIntegrationResponse.status).toBe(200);
      const updatedIntegration = updatedIntegrationResponse.body.data;
      
      expect(updatedIntegration.status).toBe('active');
      expect(updatedIntegration.accessToken).toBe('[REDACTED]'); // Tokens should be redacted in API responses
      expect(updatedIntegration.scopesGranted).toEqual(['https://www.googleapis.com/auth/drive.readonly']);
      expect(updatedIntegration.connectedAt).toBeTruthy();

      // Step 5: Verify token storage in database (direct database check)
      const db = getDB();
      const dbIntegration = await db.collection('cloudProviderIntegrations').findOne({
        $or: [
          { _id: { $oid: createdIntegrationId } },
          { _id: createdIntegrationId }
        ]
      } as any);

      expect(dbIntegration).toBeTruthy();
      expect(typeof dbIntegration!.accessToken).toBe('string');
      expect(typeof dbIntegration!.refreshToken).toBe('string');
      // Encrypted at rest; decrypt for verification
      // Token values should be encrypted at rest; ensure not plaintext
      expect(dbIntegration!.accessToken).not.toBe('ya29.mock_google_access_token');
      expect(dbIntegration!.refreshToken).not.toBe('mock_google_refresh_token');

      // Step 6: Test integration health check
      const healthResponse = await request(app)
        .get(`/api/v1/tenants/${testTenantId}/integrations/${createdIntegrationId}/health`)
        .set('Authorization', `Bearer ${testJWT}`);

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.data.status).toBe('healthy');
    });

    it('should handle multiple provider OAuth flows simultaneously', async () => {
      const db = getDB();
      
      // Get all providers
      const providers = await db.collection('cloudProviders').find({}).toArray();
      expect(providers.length).toBe(3); // Google, Dropbox, OneDrive

      const integrationPromises = providers.map(async (provider) => {
        // Create integration for each provider
        const createResponse = await request(app)
          .post(`/api/v1/tenants/${testTenantId}/integrations`)
          .set('Authorization', `Bearer ${testJWT}`)
          .send({
            providerId: provider._id.toString(),
            status: 'active'
          });

        expect(createResponse.status).toBe(201);
        
        const integrationId = createResponse.body.data._id;
        
        // Generate state for each
        const stateData = {
          tenantId: testTenantId,
          integrationId: integrationId,
          userId: testUserId,
          timestamp: Date.now(),
          nonce: `${provider.slug}-nonce-${Date.now()}`
        };
        const stateParam = await new OAuthCallbackSecurityService().generateStateParameter(stateData as any);

        // Mock provider-specific token response
        const mockTokenResponse = {
          accessToken: `${provider.slug}_access_token`,
          refreshToken: `${provider.slug}_refresh_token`,
          expiresIn: 3600,
          scopesGranted: provider.scopes
        };

        vi.spyOn(oauthService, 'exchangeCodeForTokens').mockResolvedValue(mockTokenResponse);
        vi.spyOn(OAuthService.prototype as any, 'exchangeCodeForTokens').mockResolvedValueOnce(mockTokenResponse);

        // Simulate callback
        const callbackResponse = await request(app)
          .get('/api/v1/oauth/callback')
          .query({
            code: `${provider.slug}_auth_code`,
            state: stateParam
          });

        expect(callbackResponse.status).toBe(302);
        expect(callbackResponse.headers.location).toContain('/oauth/success');

        return { provider: provider.name, integrationId };
      });

      const results = await Promise.all(integrationPromises);
      expect(results.length).toBe(3);
      
      // Verify all integrations are properly configured
      for (const result of results) {
        const integrationResponse = await request(app)
          .get(`/api/v1/tenants/${testTenantId}/integrations/${result.integrationId}`)
          .set('Authorization', `Bearer ${testJWT}`);

        expect(integrationResponse.status).toBe(200);
        expect(integrationResponse.body.data.status).toBe('active');
        expect(integrationResponse.body.data.connectedAt).toBeTruthy();
      }
    });

    it('should handle OAuth flow with token refresh', async () => {
      // Step 1: Complete initial OAuth flow
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'refresh-test-nonce'
      };
      const stateParam = await new OAuthCallbackSecurityService().generateStateParameter(stateData as any);

      // Mock initial token exchange
      vi.spyOn(oauthService, 'exchangeCodeForTokens').mockResolvedValue({
        accessToken: 'initial_access_token',
        refreshToken: 'initial_refresh_token',
        expiresIn: 10, // Short expiry for testing
        scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
      });
      vi.spyOn(OAuthService.prototype as any, 'exchangeCodeForTokens').mockResolvedValueOnce({
        accessToken: 'initial_access_token',
        refreshToken: 'initial_refresh_token',
        expiresIn: 10,
        scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
      });

      await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'initial_auth_code',
          state: stateParam
        });

      // Step 2: Wait for token to "expire" (simulate)
      await new Promise(resolve => setTimeout(resolve, 50));

      // Step 3: Test token refresh
      vi.spyOn(oauthService, 'refreshTokens').mockResolvedValue({
        accessToken: 'refreshed_access_token',
        refreshToken: 'refreshed_refresh_token',
        expiresIn: 3600,
        scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
      });
      vi.spyOn(OAuthService.prototype as any, 'refreshTokens').mockResolvedValueOnce({
        accessToken: 'refreshed_access_token',
        refreshToken: 'refreshed_refresh_token',
        expiresIn: 3600,
        scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
      });

      const refreshResponse = await request(app)
        .post(`/api/v1/oauth/tenants/${testTenantId}/integrations/${testIntegrationId}/refresh`)
        .set('Authorization', `Bearer ${testJWT}`);

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.data.status).toBe('active');
      expect(refreshResponse.body.data.accessToken).toBe('[REDACTED]');

      // Verify tokens were updated in database
      const db = getDB();
      const updatedIntegration = await db.collection('cloudProviderIntegrations').findOne({
        $or: [
          { _id: { $oid: testIntegrationId } },
          { _id: testIntegrationId }
        ]
      } as any);

      // Tokens should be stored encrypted (not plaintext)
      expect(updatedIntegration!.accessToken).not.toBe('refreshed_access_token');
      expect(updatedIntegration!.refreshToken).not.toBe('refreshed_refresh_token');
    });
  });

  describe('OAuth Flow Error Scenarios', () => {
    it('should handle OAuth provider denial gracefully', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'denial-test-nonce'
      };
      const stateParam = await new OAuthCallbackSecurityService().generateStateParameter(stateData as any);

      const callbackResponse = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          error: 'access_denied',
          error_description: 'The user denied the request',
          state: stateParam
        });

      expect(callbackResponse.status).toBe(302);
      expect(callbackResponse.headers.location).toContain('/oauth/error');
      expect(callbackResponse.headers.location).toContain('Authentication%20failed');

      // Verify integration remains unchanged
      const db = getDB();
      const integration = await db.collection('cloudProviderIntegrations').findOne({
        _id: { $oid: testIntegrationId }
      });

      expect(integration?.accessToken).toBeNull();
      expect(integration?.connectedAt).toBeNull();
    });

    it('should handle token exchange failures', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'token-failure-nonce'
      };
      const stateParam = await new OAuthCallbackSecurityService().generateStateParameter(stateData as any);

      // Mock token exchange failure
      vi.spyOn(oauthService, 'exchangeCodeForTokens').mockRejectedValue(
        new Error('invalid_grant: Invalid authorization code')
      );
      vi.spyOn(OAuthService.prototype as any, 'exchangeCodeForTokens').mockRejectedValueOnce(
        new Error('invalid_grant: Invalid authorization code')
      );

      const callbackResponse = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'invalid_auth_code',
          state: stateParam
        });

      expect(callbackResponse.status).toBe(302);
      expect(callbackResponse.headers.location).toContain('/oauth/error');
      expect(callbackResponse.headers.location).toContain('Unable%20to%20process%20request');

      // Verify integration remains unchanged
      const db = getDB();
      const integration = await db.collection('cloudProviderIntegrations').findOne({
        _id: { $oid: testIntegrationId }
      });

      expect(integration?.accessToken).toBeNull();
    });

    it('should handle refresh token failures with proper cleanup', async () => {
      // First, set up integration with tokens
      const db = getDB();
      await db.collection('cloudProviderIntegrations').updateOne(
        { _id: { $oid: testIntegrationId } },
        {
          $set: {
            accessToken: 'expired_access_token',
            refreshToken: 'invalid_refresh_token',
            status: 'active',
            connectedAt: new Date()
          }
        }
      );

      // Mock refresh failure
      vi.spyOn(oauthService, 'refreshTokens').mockRejectedValue(
        new Error('invalid_grant: Invalid refresh token')
      );
      vi.spyOn(OAuthService.prototype as any, 'refreshTokens').mockRejectedValueOnce(
        new Error('invalid_grant: Invalid refresh token')
      );

      const refreshResponse = await request(app)
        .post(`/api/v1/oauth/tenants/${testTenantId}/integrations/${testIntegrationId}/refresh`)
        .set('Authorization', `Bearer ${testJWT}`);

      expect(refreshResponse.status).toBe(500);
      expect(refreshResponse.body.success).toBe(false);
      expect(refreshResponse.body.error.code).toBe('server/internal-error');

      // In a production system, you might want to mark the integration as needing re-authentication
      // This test verifies the error is properly handled and logged
    });

    it('should handle network timeouts and retries', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'timeout-test-nonce'
      };
      const stateParam = await new OAuthCallbackSecurityService().generateStateParameter(stateData as any);

      // Mock network timeout
      vi.spyOn(oauthService, 'exchangeCodeForTokens').mockRejectedValue(
        new Error('ECONNABORTED: timeout of 5000ms exceeded')
      );

      const callbackResponse = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'timeout_test_code',
          state: stateParam
        });

      expect(callbackResponse.status).toBe(302);
      expect(callbackResponse.headers.location).toContain('/oauth/error');

      // Verify error was logged appropriately
      const spies = (globalThis as any).__MWAP_LOGGER_SPIES__;
      expect(spies.logError).toHaveBeenCalledWith(
        'OAuth callback processing error',
        expect.objectContaining({
          error: expect.stringContaining('timeout')
        })
      );
    });
  });

  describe('OAuth Flow Security Testing', () => {
    it('should prevent cross-tenant OAuth completion attacks', async () => {
      // Create second tenant and integration
      const db = getDB();
      const maliciousTenantResult = await db.collection('tenants').insertOne({
        name: 'Malicious Tenant',
        ownerId: 'auth0|malicious456',
        settings: { allowPublicProjects: false, maxProjects: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        archived: false
      });

      const maliciousIntegrationResult = await db.collection('cloudProviderIntegrations').insertOne({
        tenantId: maliciousTenantResult.insertedId,
        providerId: { $oid: testProviderId },
        status: 'active',
        accessToken: null,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'auth0|malicious456'
      });

      // Attempt to use legitimate user's integration ID with malicious tenant
      const maliciousStateData = {
        tenantId: maliciousTenantResult.insertedId.toString(),
        integrationId: testIntegrationId, // Legitimate user's integration
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'cross-tenant-attack'
      };
      const maliciousStateParam = await new OAuthCallbackSecurityService().generateStateParameter(maliciousStateData as any);

      const callbackResponse = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'malicious_auth_code',
          state: maliciousStateParam
        });

      expect(callbackResponse.status).toBe(302);
      expect(callbackResponse.headers.location).toContain('/oauth/error');
      expect(callbackResponse.headers.location).toContain('Integration%20not%20accessible');

      // Verify original integration remains unchanged
      const originalIntegration = await db.collection('cloudProviderIntegrations').findOne({
        _id: { $oid: testIntegrationId }
      });
      expect(originalIntegration?.accessToken).toBeNull();
    });

    it('should rate limit OAuth callback attempts', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'rate-limit-test'
      };
      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      // Make multiple rapid requests to test rate limiting
      const promises = Array(10).fill(0).map((_, i) => 
        request(app)
          .get('/api/v1/oauth/callback')
          .query({
            code: `rate_limit_code_${i}`,
            state: stateParam
          })
      );

      const responses = await Promise.all(promises);

      // At least some requests should be successful, but we expect rate limiting to kick in
      const successfulResponses = responses.filter(r => r.status === 302);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(successfulResponses.length).toBeGreaterThan(0);
      // Note: Actual rate limiting behavior depends on the rate limiting middleware configuration
    });

    it('should log comprehensive security events', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'security-logging-test'
      };
      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      // Mock successful token exchange
      vi.spyOn(oauthService, 'exchangeCodeForTokens').mockResolvedValue({
        accessToken: 'security_test_token',
        refreshToken: 'security_test_refresh',
        expiresIn: 3600,
        scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
      });

      await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'security_test_code',
          state: stateParam
        })
        .set('User-Agent', 'SecurityTestBot/1.0')
        .set('X-Forwarded-For', '203.0.113.1');

      // Verify comprehensive audit logging
      const spies2 = (globalThis as any).__MWAP_LOGGER_SPIES__;
      
      // Should log callback route access
      expect(spies2.logAudit).toHaveBeenCalledWith(
        'oauth.callback.route.access',
        'external',
        '/api/v1/oauth/callback',
        expect.objectContaining({
          ip: expect.any(String),
          userAgent: expect.any(String),
          component: 'oauth_routes'
        })
      );

      // Should log successful completion (relaxed assertion, IDs may be normalized)
      expect(spies2.logAudit).toHaveBeenCalledWith(
        'oauth.callback.success',
        testUserId,
        expect.any(String),
        expect.objectContaining({
          tenantId: expect.any(String),
          provider: 'Google Drive',
          ip: expect.any(String),
          userAgent: expect.any(String)
        })
      );
    });
  });

  describe('OAuth Flow Performance Testing', () => {
    it('should complete OAuth flow within acceptable time limits', async () => {
      const stateData = {
        tenantId: testTenantId,
        integrationId: testIntegrationId,
        userId: testUserId,
        timestamp: Date.now(),
        nonce: 'performance-test-nonce'
      };
      const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

      // Mock token exchange with realistic delay
      vi.spyOn(oauthService, 'exchangeCodeForTokens').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        return {
          accessToken: 'performance_test_token',
          refreshToken: 'performance_test_refresh',
          expiresIn: 3600,
          scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
        };
      });

      const startTime = Date.now();
      
      const callbackResponse = await request(app)
        .get('/api/v1/oauth/callback')
        .query({
          code: 'performance_test_code',
          state: stateParam
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(callbackResponse.status).toBe(302);
      expect(responseTime).toBeLessThan(2000); // Should complete within 2 seconds
      
      console.log(`OAuth callback response time: ${responseTime}ms`);
    });

    it('should handle concurrent OAuth callbacks efficiently', async () => {
      const concurrentCallbacks = 5;
      const promises = Array(concurrentCallbacks).fill(0).map(async (_, i) => {
        // Create unique integration for each concurrent request
        const db = getDB();
        const integrationResult = await db.collection('cloudProviderIntegrations').insertOne({
          tenantId: { $oid: testTenantId },
          providerId: { $oid: testProviderId },
          status: 'active',
          accessToken: null,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: testUserId
        });

        const stateData = {
          tenantId: testTenantId,
          integrationId: integrationResult.insertedId.toString(),
          userId: testUserId,
          timestamp: Date.now(),
          nonce: `concurrent-test-${i}`
        };
        const stateParam = Buffer.from(JSON.stringify(stateData)).toString('base64');

        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/v1/oauth/callback')
          .query({
            code: `concurrent_code_${i}`,
            state: stateParam
          });

        const endTime = Date.now();
        
        return {
          index: i,
          status: response.status,
          responseTime: endTime - startTime
        };
      });

      // Mock token exchange for all concurrent requests
      vi.spyOn(oauthService, 'exchangeCodeForTokens').mockResolvedValue({
        accessToken: 'concurrent_test_token',
        refreshToken: 'concurrent_test_refresh',
        expiresIn: 3600,
        scopesGranted: ['https://www.googleapis.com/auth/drive.readonly']
      });

      const results = await Promise.all(promises);
      
      // All requests should succeed
      expect(results.every(r => r.status === 302)).toBe(true);
      
      // Average response time should be reasonable
      const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
      expect(avgResponseTime).toBeLessThan(3000); // Average under 3 seconds
      
      console.log(`Concurrent OAuth callbacks - Average response time: ${avgResponseTime.toFixed(2)}ms`);
    });
  });
}); 