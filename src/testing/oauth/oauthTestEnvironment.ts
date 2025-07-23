/**
 * OAuth Test Environment Setup
 * 
 * Provides comprehensive testing infrastructure for OAuth integration validation:
 * - Mock OAuth provider configurations
 * - Test state parameter generation
 * - Callback URL simulation
 * - Integration test scenarios
 * - Security validation frameworks
 * 
 * This module enables local testing of OAuth flows without requiring
 * actual external OAuth provider connections.
 */

import { logInfo, logError } from '../../utils/logger.js';

export interface MockOAuthProvider {
  id: string;
  name: string;
  displayName: string;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
  testScenarios: OAuthTestScenario[];
}

export interface OAuthTestScenario {
  name: string;
  description: string;
  expectedOutcome: 'SUCCESS' | 'FAILURE';
  errorType?: string;
  testData: {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
  };
  validationChecks: string[];
}

export interface TestIntegration {
  id: string;
  tenantId: string;
  userId: string;
  providerId: string;
  status: 'PENDING' | 'CONFIGURED' | 'ERROR';
  createdAt: number;
}

export class OAuthTestEnvironment {
  private readonly mockProviders: Map<string, MockOAuthProvider> = new Map();
  private readonly testIntegrations: Map<string, TestIntegration> = new Map();
  private readonly testResults: Map<string, any> = new Map();

  constructor() {
    this.initializeMockProviders();
    this.initializeTestIntegrations();
  }

  /**
   * Initialize mock OAuth providers for testing
   */
  private initializeMockProviders(): void {
    // Dropbox Mock Provider
    const dropboxProvider: MockOAuthProvider = {
      id: 'dropbox_test',
      name: 'dropbox',
      displayName: 'Dropbox (Test)',
      authUrl: 'https://www.dropbox.com/oauth2/authorize',
      tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
      clientId: 'test_dropbox_client_id',
      clientSecret: 'test_dropbox_client_secret',
      scopes: ['files.content.read', 'files.content.write'],
      redirectUri: 'http://localhost:3000/api/v1/oauth/callback',
      testScenarios: [
        {
          name: 'successful_authorization',
          description: 'Valid authorization code exchange',
          expectedOutcome: 'SUCCESS',
          testData: {
            code: 'test_auth_code_dropbox_success',
            state: 'valid_state_parameter'
          },
          validationChecks: [
            'state_parameter_validation',
            'integration_ownership_verification',
            'token_exchange_success',
            'audit_logging'
          ]
        },
        {
          name: 'invalid_state_parameter',
          description: 'Invalid or tampered state parameter',
          expectedOutcome: 'FAILURE',
          errorType: 'INVALID_STATE',
          testData: {
            code: 'test_auth_code_dropbox',
            state: 'invalid_or_tampered_state'
          },
          validationChecks: [
            'state_parameter_rejection',
            'security_logging',
            'generic_error_response'
          ]
        },
        {
          name: 'expired_state_parameter',
          description: 'Expired state parameter (>10 minutes old)',
          expectedOutcome: 'FAILURE',
          errorType: 'STATE_EXPIRED',
          testData: {
            code: 'test_auth_code_dropbox',
            state: 'expired_state_parameter'
          },
          validationChecks: [
            'timestamp_validation',
            'expiration_handling',
            'security_monitoring'
          ]
        },
        {
          name: 'provider_error_response',
          description: 'OAuth provider returns error',
          expectedOutcome: 'FAILURE',
          errorType: 'PROVIDER_ERROR',
          testData: {
            error: 'access_denied',
            error_description: 'User denied access',
            state: 'valid_state_parameter'
          },
          validationChecks: [
            'provider_error_handling',
            'generic_error_response',
            'audit_logging'
          ]
        }
      ]
    };

    // Google Mock Provider
    const googleProvider: MockOAuthProvider = {
      id: 'google_test',
      name: 'google',
      displayName: 'Google Drive (Test)',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      clientId: 'test_google_client_id',
      clientSecret: 'test_google_client_secret',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
      redirectUri: 'http://localhost:3000/api/v1/oauth/callback',
      testScenarios: [
        {
          name: 'successful_authorization',
          description: 'Valid Google OAuth flow',
          expectedOutcome: 'SUCCESS',
          testData: {
            code: 'test_auth_code_google_success',
            state: 'valid_state_parameter'
          },
          validationChecks: [
            'state_parameter_validation',
            'integration_ownership_verification',
            'token_exchange_success',
            'scope_validation'
          ]
        },
        {
          name: 'insufficient_permissions',
          description: 'User grants insufficient permissions',
          expectedOutcome: 'FAILURE',
          errorType: 'PROVIDER_ERROR',
          testData: {
            error: 'access_denied',
            error_description: 'Insufficient permissions granted',
            state: 'valid_state_parameter'
          },
          validationChecks: [
            'permission_error_handling',
            'user_friendly_error_message',
            'retry_mechanism'
          ]
        }
      ]
    };

    this.mockProviders.set('dropbox', dropboxProvider);
    this.mockProviders.set('google', googleProvider);

    logInfo('OAuth test environment initialized', {
      providerCount: this.mockProviders.size,
      providers: Array.from(this.mockProviders.keys())
    });
  }

  /**
   * Initialize test integrations
   */
  private initializeTestIntegrations(): void {
    const testIntegrations: TestIntegration[] = [
      {
        id: 'test_integration_dropbox_1',
        tenantId: 'test_tenant_1',
        userId: 'test_user_1',
        providerId: 'dropbox',
        status: 'PENDING',
        createdAt: Date.now()
      },
      {
        id: 'test_integration_google_1',
        tenantId: 'test_tenant_1',
        userId: 'test_user_1',
        providerId: 'google',
        status: 'PENDING',
        createdAt: Date.now()
      },
      {
        id: 'test_integration_dropbox_2',
        tenantId: 'test_tenant_2',
        userId: 'test_user_2',
        providerId: 'dropbox',
        status: 'CONFIGURED',
        createdAt: Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
      }
    ];

    testIntegrations.forEach(integration => {
      this.testIntegrations.set(integration.id, integration);
    });
  }

  /**
   * Generate test state parameter for OAuth flow
   */
  generateTestStateParameter(integrationId: string, scenario: string = 'valid'): string {
    const integration = this.testIntegrations.get(integrationId);
    if (!integration) {
      throw new Error(`Test integration not found: ${integrationId}`);
    }

    const baseState = {
      integrationId: integration.id,
      tenantId: integration.tenantId,
      userId: integration.userId,
      nonce: `test_nonce_${Date.now()}`,
      timestamp: Date.now()
    };

    switch (scenario) {
      case 'valid':
        return Buffer.from(JSON.stringify(baseState)).toString('base64');
      
      case 'expired':
        const expiredState = {
          ...baseState,
          timestamp: Date.now() - (15 * 60 * 1000) // 15 minutes ago (expired)
        };
        return Buffer.from(JSON.stringify(expiredState)).toString('base64');
      
      case 'invalid':
        return 'invalid_base64_state_parameter';
      
      case 'tampered':
        const tamperedState = {
          ...baseState,
          tenantId: 'different_tenant_id' // Tampered tenant ID
        };
        return Buffer.from(JSON.stringify(tamperedState)).toString('base64');
      
      default:
        return Buffer.from(JSON.stringify(baseState)).toString('base64');
    }
  }

  /**
   * Get mock provider configuration
   */
  getMockProvider(providerId: string): MockOAuthProvider | undefined {
    return this.mockProviders.get(providerId);
  }

  /**
   * Get all mock providers
   */
  getAllMockProviders(): MockOAuthProvider[] {
    return Array.from(this.mockProviders.values());
  }

  /**
   * Get test integration
   */
  getTestIntegration(integrationId: string): TestIntegration | undefined {
    return this.testIntegrations.get(integrationId);
  }

  /**
   * Get all test integrations
   */
  getAllTestIntegrations(): TestIntegration[] {
    return Array.from(this.testIntegrations.values());
  }

  /**
   * Generate OAuth authorization URL for testing
   */
  generateAuthorizationUrl(providerId: string, integrationId: string): string {
    const provider = this.getMockProvider(providerId);
    if (!provider) {
      throw new Error(`Mock provider not found: ${providerId}`);
    }

    const state = this.generateTestStateParameter(integrationId);
    const params = new URLSearchParams({
      client_id: provider.clientId,
      response_type: 'code',
      redirect_uri: provider.redirectUri,
      scope: provider.scopes.join(' '),
      state: state
    });

    return `${provider.authUrl}?${params.toString()}`;
  }

  /**
   * Simulate OAuth callback for testing
   */
  simulateOAuthCallback(providerId: string, scenario: string, integrationId: string): {
    url: string;
    expectedOutcome: 'SUCCESS' | 'FAILURE';
    validationChecks: string[];
  } {
    const provider = this.getMockProvider(providerId);
    if (!provider) {
      throw new Error(`Mock provider not found: ${providerId}`);
    }

    const testScenario = provider.testScenarios.find(s => s.name === scenario);
    if (!testScenario) {
      throw new Error(`Test scenario not found: ${scenario} for provider ${providerId}`);
    }

    const params = new URLSearchParams();
    
    // Add test data to callback URL
    if (testScenario.testData.code) {
      params.append('code', testScenario.testData.code);
    }
    
    if (testScenario.testData.error) {
      params.append('error', testScenario.testData.error);
    }
    
    if (testScenario.testData.error_description) {
      params.append('error_description', testScenario.testData.error_description);
    }

    // Generate appropriate state parameter
    let state: string;
    if (testScenario.testData.state === 'valid_state_parameter') {
      state = this.generateTestStateParameter(integrationId, 'valid');
    } else if (testScenario.testData.state === 'expired_state_parameter') {
      state = this.generateTestStateParameter(integrationId, 'expired');
    } else if (testScenario.testData.state === 'invalid_or_tampered_state') {
      state = this.generateTestStateParameter(integrationId, 'tampered');
    } else {
      state = testScenario.testData.state || '';
    }
    
    params.append('state', state);

    const callbackUrl = `http://localhost:3000/api/v1/oauth/callback?${params.toString()}`;

    return {
      url: callbackUrl,
      expectedOutcome: testScenario.expectedOutcome,
      validationChecks: testScenario.validationChecks
    };
  }

  /**
   * Record test result
   */
  recordTestResult(testId: string, result: any): void {
    this.testResults.set(testId, {
      ...result,
      timestamp: Date.now()
    });
  }

  /**
   * Get test result
   */
  getTestResult(testId: string): any {
    return this.testResults.get(testId);
  }

  /**
   * Get all test results
   */
  getAllTestResults(): Map<string, any> {
    return new Map(this.testResults);
  }

  /**
   * Clear test results
   */
  clearTestResults(): void {
    this.testResults.clear();
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(): {
    summary: {
      totalProviders: number;
      totalIntegrations: number;
      totalScenarios: number;
      testResults: number;
    };
    providers: MockOAuthProvider[];
    integrations: TestIntegration[];
    testResults: any[];
  } {
    const totalScenarios = Array.from(this.mockProviders.values())
      .reduce((total, provider) => total + provider.testScenarios.length, 0);

    return {
      summary: {
        totalProviders: this.mockProviders.size,
        totalIntegrations: this.testIntegrations.size,
        totalScenarios,
        testResults: this.testResults.size
      },
      providers: this.getAllMockProviders(),
      integrations: this.getAllTestIntegrations(),
      testResults: Array.from(this.testResults.values())
    };
  }
}

// Export singleton instance
export const oauthTestEnvironment = new OAuthTestEnvironment();