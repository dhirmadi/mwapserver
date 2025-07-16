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
import { logInfo, logError, logAudit } from '../../utils/logger.js';
import { CloudProviderService } from '../cloud-providers/cloudProviders.service.js';
import { OAuthService } from '../oauth/oauth.service.js';

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
  
  return jsonResponse(res, 200, integrations);
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
  
  return jsonResponse(res, 200, integration);
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
      const data = validateWithSchema(createCloudProviderIntegrationSchema, requestWithTenantId);
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
    
    const data = validateWithSchema(updateCloudProviderIntegrationSchema, req.body);
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
    
    return jsonResponse(res, 200, {
      success: true,
      data: healthStatus
    });
  } catch (error) {
    logError('Integration health check error', error);
    throw error;
  }
}