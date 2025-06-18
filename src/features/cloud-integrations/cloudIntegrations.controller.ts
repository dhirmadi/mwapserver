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
    
    // DEBUG: Log the full request body and headers
    console.log('DEBUG - Request Body:', JSON.stringify(req.body, null, 2));
    console.log('DEBUG - Request Headers:', JSON.stringify(req.headers, null, 2));
    console.log('DEBUG - Request Params:', JSON.stringify(req.params, null, 2));
    console.log('DEBUG - Request Query:', JSON.stringify(req.query, null, 2));
    
    logInfo(`Creating new integration for tenant ${tenantId} by user ${user.sub}`);
    
    try {
      // DEBUG: Log the schema we're validating against
      console.log('DEBUG - Schema:', JSON.stringify(createCloudProviderIntegrationSchema, null, 2));
      
      const data = validateWithSchema(createCloudProviderIntegrationSchema, req.body);
      
      // DEBUG: Log the validated data
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
      // DEBUG: Log detailed validation error
      console.log('DEBUG - Validation Error:', validationError);
      if (validationError instanceof Error) {
        console.log('DEBUG - Validation Error Message:', validationError.message);
        console.log('DEBUG - Validation Error Stack:', validationError.stack);
      }
      throw validationError;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logInfo(`Validation error when creating integration: ${error.message}`);
      // DEBUG: Log the validation error details
      console.log('DEBUG - Validation Error Details:', error);
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    // DEBUG: Log the full error
    console.log('DEBUG - Error Object:', error);
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
      clientSecret: integration.clientSecret ? '[REDACTED]' : undefined,
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