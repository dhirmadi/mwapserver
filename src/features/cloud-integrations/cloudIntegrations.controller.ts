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
import { logger } from '../../utils/logger.js';

const cloudIntegrationsService = new CloudIntegrationsService();

/**
 * Get all integrations for a tenant
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function getTenantIntegrations(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId } = req.params;
  
  logger.debug(`Fetching integrations for tenant ${tenantId} by user ${user.sub}`);
  
  const integrations = await cloudIntegrationsService.findByTenantId(tenantId);
  
  logger.debug(`Found ${integrations.length} integrations for tenant ${tenantId}`);
  
  return jsonResponse(res, 200, integrations);
}

/**
 * Get a specific integration by ID
 * Authorization is handled by the requireTenantOwner middleware
 */
export async function getTenantIntegrationById(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId, integrationId } = req.params;
  
  logger.debug(`Fetching integration ${integrationId} for tenant ${tenantId} by user ${user.sub}`);
  
  const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
  
  logger.debug(`Found integration ${integrationId} for tenant ${tenantId}`);
  
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
    
    logger.debug(`Creating new integration for tenant ${tenantId} by user ${user.sub}`);
    
    const data = validateWithSchema(createCloudProviderIntegrationSchema, req.body);
    const integration = await cloudIntegrationsService.create(tenantId, data, user.sub);
    
    logger.info(`Created new integration for tenant ${tenantId} with provider ${data.providerId}`);
    
    // Remove sensitive data from response
    const response = {
      ...integration,
      clientSecret: '[REDACTED]',
      accessToken: integration.accessToken ? '[REDACTED]' : undefined,
      refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
    };
    
    return jsonResponse(res, 201, response);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logger.warn(`Validation error when creating integration: ${error.message}`);
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    logger.error(`Error creating integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    logger.debug(`Updating integration ${integrationId} for tenant ${tenantId} by user ${user.sub}`);
    
    const data = validateWithSchema(updateCloudProviderIntegrationSchema, req.body);
    const integration = await cloudIntegrationsService.update(integrationId, tenantId, data, user.sub);
    
    logger.info(`Updated integration ${integrationId} for tenant ${tenantId}`);
    
    // Remove sensitive data from response
    const response = {
      ...integration,
      clientSecret: '[REDACTED]',
      accessToken: integration.accessToken ? '[REDACTED]' : undefined,
      refreshToken: integration.refreshToken ? '[REDACTED]' : undefined
    };
    
    return jsonResponse(res, 200, response);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logger.warn(`Validation error when updating integration: ${error.message}`);
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    logger.error(`Error updating integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  
  logger.debug(`Deleting integration ${integrationId} for tenant ${tenantId} by user ${user.sub}`);
  
  await cloudIntegrationsService.delete(integrationId, tenantId, user.sub);
  
  logger.info(`Deleted integration ${integrationId} for tenant ${tenantId}`);
  
  return jsonResponse(res, 204);
}