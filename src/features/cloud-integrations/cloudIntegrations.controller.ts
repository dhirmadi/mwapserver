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
import { logInfo, logError } from '../../utils/logger.js';

const cloudIntegrationsService = new CloudIntegrationsService();

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
    
    // Debug: Log the request body
    console.log('DEBUG - Request Body:', JSON.stringify(req.body, null, 2));
    
    // Debug: Log the expected schema
    console.log('DEBUG - Expected Schema:', JSON.stringify(createCloudProviderIntegrationSchema.shape, null, 2));
    
    try {
      const data = validateWithSchema(createCloudProviderIntegrationSchema, req.body);
      console.log('DEBUG - Validated Data:', JSON.stringify(data, null, 2));
      
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
      console.log('DEBUG - Validation Error:', validationError);
      if (validationError instanceof Error) {
        console.log('DEBUG - Error Name:', validationError.name);
        console.log('DEBUG - Error Message:', validationError.message);
        console.log('DEBUG - Error Stack:', validationError.stack);
        
        if (validationError.name === 'ValidationError' && 'details' in validationError) {
          console.log('DEBUG - Validation Details:', JSON.stringify((validationError as any).details, null, 2));
        }
      }
      throw validationError;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logInfo(`Validation error when creating integration: ${error.message}`);
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    console.log('DEBUG - Error in createTenantIntegration:', error);
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