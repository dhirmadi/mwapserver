import { Request, Response } from 'express';
import { CloudIntegrationsService } from './cloudIntegrations.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { ApiError, PermissionError } from '../../utils/errors.js';
import { 
  createCloudProviderIntegrationSchema, 
  updateCloudProviderIntegrationSchema, 
  CloudProviderIntegrationErrorCodes 
} from '../../schemas/cloudProviderIntegration.schema.js';
import { getDB } from '../../config/db.js';
import { ObjectId } from 'mongodb';

const cloudIntegrationsService = new CloudIntegrationsService();

// Helper function to check if user is tenant owner
async function isTenantOwner(tenantId: string, userId: string): Promise<boolean> {
  try {
    const tenant = await getDB().collection('tenants').findOne({
      _id: new ObjectId(tenantId),
      ownerId: userId
    });
    return !!tenant;
  } catch (error) {
    return false;
  }
}

export async function getTenantIntegrations(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId } = req.params;
  
  // Check if user is tenant owner
  const isOwner = await isTenantOwner(tenantId, user.sub);
  if (!isOwner) {
    throw new PermissionError('Only tenant owners can access integrations');
  }
  
  const integrations = await cloudIntegrationsService.findByTenantId(tenantId);
  return jsonResponse(res, 200, integrations);
}

export async function getTenantIntegrationById(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId, integrationId } = req.params;
  
  // Check if user is tenant owner
  const isOwner = await isTenantOwner(tenantId, user.sub);
  if (!isOwner) {
    throw new PermissionError('Only tenant owners can access integrations');
  }
  
  const integration = await cloudIntegrationsService.findById(integrationId, tenantId);
  return jsonResponse(res, 200, integration);
}

export async function createTenantIntegration(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId } = req.params;
    
    // Check if user is tenant owner
    const isOwner = await isTenantOwner(tenantId, user.sub);
    if (!isOwner) {
      throw new PermissionError('Only tenant owners can create integrations');
    }
    
    const data = validateWithSchema(createCloudProviderIntegrationSchema, req.body);
    const integration = await cloudIntegrationsService.create(tenantId, data, user.sub);
    
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
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    throw error;
  }
}

export async function updateTenantIntegration(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { tenantId, integrationId } = req.params;
    
    // Check if user is tenant owner
    const isOwner = await isTenantOwner(tenantId, user.sub);
    if (!isOwner) {
      throw new PermissionError('Only tenant owners can update integrations');
    }
    
    const data = validateWithSchema(updateCloudProviderIntegrationSchema, req.body);
    const integration = await cloudIntegrationsService.update(integrationId, tenantId, data, user.sub);
    
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
      throw new ApiError('Invalid input', 400, CloudProviderIntegrationErrorCodes.INVALID_INPUT);
    }
    throw error;
  }
}

export async function deleteTenantIntegration(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { tenantId, integrationId } = req.params;
  
  // Check if user is tenant owner
  const isOwner = await isTenantOwner(tenantId, user.sub);
  if (!isOwner) {
    throw new PermissionError('Only tenant owners can delete integrations');
  }
  
  await cloudIntegrationsService.delete(integrationId, tenantId, user.sub);
  return jsonResponse(res, 204);
}