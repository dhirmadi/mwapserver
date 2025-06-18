import { Request, Response } from 'express';
import { CloudIntegrationsService } from './cloudIntegrations.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { logInfo, logError } from '../../utils/logger.js';
import { 
  createCloudProviderIntegrationSchema, 
  updateCloudProviderIntegrationSchema, 
  CloudProviderIntegrationErrorCodes 
} from '../../schemas/cloudProviderIntegration.schema.js';

const cloudIntegrationsService = new CloudIntegrationsService();

// Note: We no longer need the isTenantOwner helper function here
// as we're using the requireTenantOwner middleware for authorization

export async function getTenantIntegrations(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId } = req.params;
    
    // Authorization is handled by middleware
    logInfo('Getting tenant integrations', { userId: user.sub, tenantId });
    const integrations = await cloudIntegrationsService.findByTenantId(tenantId);
    return jsonResponse(res, 200, integrations);
  } catch (error) {
    logError('Error getting tenant integrations', error);
    throw error;
  }
}

export async function getTenantIntegrationById(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    // Authorization is handled by middleware
    logInfo('Getting tenant integration by ID', { userId: user.sub, tenantId, integrationId });
    const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
    return jsonResponse(res, 200, integration);
  } catch (error) {
    logError('Error getting tenant integration by ID', error);
    throw error;
  }
}

export async function createTenantIntegration(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId } = req.params;
    
    // Authorization is handled by middleware
    logInfo('Creating tenant integration', { userId: user.sub, tenantId });
    const data = validateWithSchema(createCloudProviderIntegrationSchema, req.body);
    const integration = await cloudIntegrationsService.create(tenantId, data, user.sub);
    
    return jsonResponse(res, 201, integration);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logError('Validation error creating tenant integration', error);
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    logError('Error creating tenant integration', error);
    throw error;
  }
}

export async function updateTenantIntegration(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    // Authorization is handled by middleware
    logInfo('Updating tenant integration', { userId: user.sub, tenantId, integrationId });
    const data = validateWithSchema(updateCloudProviderIntegrationSchema, req.body);
    const integration = await cloudIntegrationsService.update(integrationId, tenantId, data, user.sub);
    
    return jsonResponse(res, 200, integration);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logError('Validation error updating tenant integration', error);
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    logError('Error updating tenant integration', error);
    throw error;
  }
}

export async function deleteTenantIntegration(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    // Authorization is handled by middleware
    logInfo('Deleting tenant integration', { userId: user.sub, tenantId, integrationId });
    await cloudIntegrationsService.delete(integrationId, tenantId, user.sub);
    return jsonResponse(res, 204);
  } catch (error) {
    logError('Error deleting tenant integration', error);
    throw error;
  }
}

export async function handleOAuthCallback(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    const { code, state } = req.query as { code: string; state: string };
    
    if (!code || !state) {
      throw new ApiError('Missing required OAuth parameters', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    
    // Authorization is handled by middleware
    logInfo('Processing OAuth callback', { userId: user.sub, tenantId, integrationId });
    
    // Get the integration and provider details
    const integration = await cloudIntegrationsService.findById(integrationId, tenantId, true);
    
    // Get the provider details to complete OAuth flow
    const provider = await getProviderDetails(integration.providerId.toString());
    
    // Exchange the authorization code for tokens
    const tokenResponse = await exchangeCodeForTokens(
      code,
      provider.tokenUrl,
      provider.clientId,
      provider.clientSecret,
      provider.tokenMethod,
      provider.grantType,
      req.headers.origin || 'http://localhost:3000'
    );
    
    // Update the integration with the new tokens
    const updatedIntegration = await cloudIntegrationsService.updateTokens(
      integrationId,
      tenantId,
      tokenResponse.access_token,
      tokenResponse.refresh_token || null,
      tokenResponse.expires_in || 3600,
      tokenResponse.scope ? tokenResponse.scope.split(' ') : [],
      user.sub
    );
    
    return jsonResponse(res, 200, {
      status: updatedIntegration.status,
      message: 'OAuth flow completed successfully'
    });
  } catch (error) {
    logError('Error handling OAuth callback', error);
    throw error;
  }
}

// Helper function to get provider details
async function getProviderDetails(providerId: string) {
  // This would typically be imported from the cloud providers service
  const cloudProviderService = new (await import('../../features/cloud-providers/cloudProviders.service.js')).CloudProviderService();
  return cloudProviderService.findById(providerId, true);
}

// Helper function to exchange authorization code for tokens
async function exchangeCodeForTokens(
  code: string,
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  tokenMethod: string = 'POST',
  grantType: string = 'authorization_code',
  redirectUri: string
) {
  const params = new URLSearchParams();
  params.append('grant_type', grantType);
  params.append('code', code);
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('redirect_uri', redirectUri);
  
  const response = await fetch(tokenUrl, {
    method: tokenMethod,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    logError('OAuth token exchange failed', errorData);
    throw new ApiError(
      `Failed to exchange authorization code: ${errorData.error || response.statusText}`,
      400,
      CloudProviderIntegrationErrorCodes.INVALID_INPUT
    );
  }
  
  return response.json();
}