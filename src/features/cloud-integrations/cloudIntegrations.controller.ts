import { Request, Response } from 'express';
import { CloudIntegrationsService } from './cloudIntegrations.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { 
  createCloudProviderIntegrationSchema, 
  updateCloudProviderIntegrationSchema, 
  CloudProviderIntegrationErrorCodes 
} from '../../schemas/cloudProviderIntegration.schema.js';
import type { CreateCloudProviderIntegrationRequest, UpdateCloudProviderIntegrationRequest } from '../../schemas/cloudProviderIntegration.schema.js';
import { logInfo, logError, logAudit } from '../../utils/logger.js';
import { CloudProviderService } from '../cloud-providers/cloudProviders.service.js';
import { OAuthService } from '../oauth/oauth.service.js';
import axios from 'axios';
import { decrypt, encrypt } from '../../utils/encryption.js';

const cloudIntegrationsService = new CloudIntegrationsService();
const cloudProviderService = new CloudProviderService();
const oauthService = new OAuthService();

/**
 * Get all integrations for a tenant
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function getTenantIntegrations(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId } = req.params;
  
  logInfo(`Fetching integrations for tenant ${tenantId} by user ${user.sub}`);
  
  const integrations = await cloudIntegrationsService.findByTenantId(tenantId);
  
  logInfo(`Found ${integrations.length} integrations for tenant ${tenantId}`);
  
  // Redact sensitive tokens in responses
  const sanitized = integrations.map((integration: any) => ({
    ...integration,
    accessToken: integration.accessToken ? '[REDACTED]' : undefined,
    refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
  }));
  
  return jsonResponse(res, 200, sanitized);
}

/**
 * Get a specific integration by ID
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function getTenantIntegrationById(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId, integrationId } = req.params;
  
  logInfo(`Fetching integration ${integrationId} for tenant ${tenantId} by user ${user.sub}`);
  
  const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
  
  logInfo(`Found integration ${integrationId} for tenant ${tenantId}`);
  
  const response = {
    ...integration,
    accessToken: integration.accessToken ? '[REDACTED]' : undefined,
    refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
  };
  
  return jsonResponse(res, 200, response);
}

/**
 * Create a new integration for a tenant
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function createTenantIntegration(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId } = req.params;
    
    logInfo(`Creating new integration for tenant ${tenantId} by user ${user.sub}`);
    
    // Add tenantId from URL parameters to the request body
    const requestWithTenantId = {
      ...req.body,
      tenantId: tenantId
    };
    
    try {
      const dataParsed = validateWithSchema(createCloudProviderIntegrationSchema, requestWithTenantId);
      const data: CreateCloudProviderIntegrationRequest = {
        status: (dataParsed.status ?? 'active') as 'active' | 'expired' | 'revoked' | 'error',
        providerId: dataParsed.providerId,
        tenantId: dataParsed.tenantId,
        scopesGranted: dataParsed.scopesGranted,
        metadata: dataParsed.metadata
      };
      const integration = await cloudIntegrationsService.create(tenantId, data, user.sub);
      
      logInfo(`Created new integration for tenant ${tenantId} with provider ${data.providerId}`);
      
      // Remove sensitive data from response
      const response = {
        ...integration,
        accessToken: integration.accessToken ? '[REDACTED]' : undefined,
        refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
      };
      
      return jsonResponse(res, 201, response);
    } catch (validationError) {
      throw validationError;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logInfo(`Validation error when creating integration: ${error.message}`);
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    logError(`Error creating integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Update an existing integration
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function updateTenantIntegration(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    logInfo(`Updating integration ${integrationId} for tenant ${tenantId} by user ${user.sub}`);
    
    const data: UpdateCloudProviderIntegrationRequest = validateWithSchema(updateCloudProviderIntegrationSchema, req.body);
    const integration = await cloudIntegrationsService.update(integrationId, tenantId, data, user.sub);
    
    logInfo(`Updated integration ${integrationId} for tenant ${tenantId}`);
    
    // Remove sensitive data from response
    const response = {
      ...integration,
      accessToken: integration.accessToken ? '[REDACTED]' : undefined,
      refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
    };
    
    return jsonResponse(res, 200, response);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logInfo(`Validation error when updating integration: ${error.message}`);
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    logError(`Error updating integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Delete an integration
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function deleteTenantIntegration(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId, integrationId } = req.params;
  
  logInfo(`Deleting integration ${integrationId} for tenant ${tenantId} by user ${user.sub}`);
  
  await cloudIntegrationsService.delete(integrationId, tenantId, user.sub);
  
  logInfo(`Deleted integration ${integrationId} for tenant ${tenantId}`);
  
  return jsonResponse(res, 204);
}

/**
 * Refresh OAuth tokens for an integration
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function refreshIntegrationToken(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    logInfo(`Refreshing tokens for integration ${integrationId} in tenant ${tenantId} by user ${user.sub}`);
    
    // 1. Get the integration and provider
    const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
    const provider = await cloudProviderService.findById(integration.providerId.toString(), true);
    
    if (!integration.refreshToken) {
      throw new ApiError('Integration does not have a refresh token', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    
    // 2. Refresh the tokens using OAuth service
    const tokenResponse = await oauthService.refreshTokens(
      integration.refreshToken,
      provider
    );
    
    // 3. Update the integration with the new tokens
    const updatedIntegration = await cloudIntegrationsService.updateTokens(
      integrationId,
      tenantId,
      tokenResponse.accessToken,
      tokenResponse.refreshToken,
      tokenResponse.expiresIn,
      user.sub,
      tokenResponse.scopesGranted
    );
    
    logAudit('integration.tokens.refresh', user.sub, integrationId, {
      tenantId,
      providerId: provider._id.toString()
    });
    
    // 4. Return success response with sanitized data
    return jsonResponse(res, 200, {
      success: true,
      data: {
        ...updatedIntegration,
        accessToken: '[REDACTED]',
        refreshToken: '[REDACTED]'
      }
    });
  } catch (error) {
    logError('Token refresh error', error);
    throw error;
  }
}

/**
 * Check the health status of an integration
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function checkIntegrationHealth(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    logInfo(`Checking health for integration ${integrationId} in tenant ${tenantId} by user ${user.sub}`);
    
    // Get the integration health status
    const healthStatus = await cloudIntegrationsService.checkIntegrationHealth(integrationId, tenantId);
    
    logInfo(`Health check completed for integration ${integrationId}: ${healthStatus.status}`);
    
    return jsonResponse(res, 200, healthStatus);
  } catch (error) {
    logError('Integration health check error', error);
    throw error;
  }
}

/**
 * Test integration connectivity and token validity (with optional one-time refresh retry)
 */
export async function testIntegrationConnectivity(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId, integrationId } = req.params;

  logInfo(`Testing integration connectivity ${integrationId} for tenant ${tenantId} by user ${user.sub}`);

  const startedAt = Date.now();
  try {
    // 1) Load integration and verify tenant ownership
    const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
    const provider = await cloudProviderService.findById(integration.providerId.toString(), true);

    // 2) Decrypt tokens
    const accessToken = integration.accessToken ? decrypt(integration.accessToken) : '';
    const refreshToken = integration.refreshToken ? decrypt(integration.refreshToken) : '';

    if (!accessToken) {
      return res.status(200).json({
        success: false,
        details: {
          tokenValid: false,
          apiReachable: false,
          scopesValid: false
        },
        error: 'Missing access token'
      });
    }

    const doDropboxTest = async (token: string) => {
      const t0 = Date.now();
      try {
        const resp = await axios.post(
          'https://api.dropboxapi.com/2/users/get_current_account',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000,
            validateStatus: () => true
          }
        );
        const ms = Date.now() - t0;
        if (resp.status === 200) {
          return { tokenValid: true, apiReachable: true, scopesValid: true, responseTime: ms };
        }
        if (resp.status === 401 || resp.status === 403) {
          return { tokenValid: false, apiReachable: true, scopesValid: false, responseTime: ms, authError: true } as any;
        }
        if (resp.status === 409 || resp.status === 429) {
          return { tokenValid: false, apiReachable: true, scopesValid: false, responseTime: ms, rateLimited: true } as any;
        }
        return { tokenValid: false, apiReachable: true, scopesValid: false, responseTime: ms };
      } catch (err: any) {
        const ms = Date.now() - t0;
        const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
        return { tokenValid: false, apiReachable: false, scopesValid: false, responseTime: ms, networkError: true, timeout: isTimeout } as any;
      }
    };

    const providerName = (provider.name || provider.slug || '').toLowerCase();
    if (providerName !== 'dropbox' && provider.slug?.toLowerCase() !== 'dropbox') {
      throw new ApiError('Unsupported provider for test endpoint', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }

    let details: any = await doDropboxTest(accessToken);

    // 4) One-time refresh retry on 401/403
    if (details.authError && refreshToken) {
      try {
        const params = new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        });
        const basic = Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString('base64');
        const refreshResp = await axios.post(
          'https://api.dropboxapi.com/oauth2/token',
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${basic}`
            },
            timeout: 10000,
            validateStatus: () => true
          }
        );
        if (refreshResp.status === 200 && refreshResp.data?.access_token) {
          const newAccess = refreshResp.data.access_token as string;
          const newRefresh = refreshResp.data.refresh_token as string | undefined;
          const expiresIn = Number(refreshResp.data.expires_in || 0);
          await cloudIntegrationsService.updateTokens(
            integrationId,
            tenantId,
            newAccess,
            newRefresh || '',
            expiresIn,
            user.sub,
            undefined
          );
          details = await doDropboxTest(newAccess);
          await cloudIntegrationsService.update(integrationId, tenantId, { status: details.tokenValid ? 'active' : 'error' } as any, user.sub);
        } else {
          await cloudIntegrationsService.update(integrationId, tenantId, { status: 'error' } as any, user.sub);
          return res.status(200).json({
            success: false,
            details: {
              tokenValid: Boolean(details.tokenValid),
              apiReachable: Boolean(details.apiReachable),
              scopesValid: Boolean(details.scopesValid),
              ...(details.responseTime != null ? { responseTime: details.responseTime } : {})
            },
            error: 'Refresh token invalid or expired; reconnect required'
          });
        }
      } catch {
        await cloudIntegrationsService.update(integrationId, tenantId, { status: 'error' } as any, user.sub);
        return res.status(200).json({
          success: false,
          details: {
            tokenValid: Boolean(details.tokenValid),
            apiReachable: Boolean(details.apiReachable),
            scopesValid: Boolean(details.scopesValid),
            ...(details.responseTime != null ? { responseTime: details.responseTime } : {})
          },
          error: 'Refresh token invalid or expired; reconnect required'
        });
      }
    }

    // 5) Persist minor state based on final details
    await cloudIntegrationsService.update(integrationId, tenantId, { status: details.tokenValid ? 'active' : 'error' } as any, user.sub);

    // 6) Return result
    const totalMs = Date.now() - startedAt;
    const successEval = Boolean(details.tokenValid && details.apiReachable && details.scopesValid);
    const base: any = {
      success: successEval,
      details: {
        tokenValid: Boolean(details.tokenValid),
        apiReachable: Boolean(details.apiReachable),
        scopesValid: Boolean(details.scopesValid),
        responseTime: details.responseTime ?? totalMs
      }
    };
    if (details.rateLimited) base.error = 'Provider rate limit exceeded; retry later';
    if (details.networkError) base.error = 'Provider unreachable (timeout)';
    return res.status(200).json(base);
  } catch (error) {
    logError('Integration test error', error as any);
    throw error;
  }
}