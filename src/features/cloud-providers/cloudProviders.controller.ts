import { Request, Response } from 'express';
import { CloudProviderService } from './cloudProviders.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { logInfo, logError } from '../../utils/logger.js';
import { 
  createCloudProviderSchema, 
  updateCloudProviderSchema, 
  CloudProviderErrorCodes 
} from '../../schemas/cloudProvider.schema.js';

const cloudProviderService = new CloudProviderService();

export async function getAllCloudProviders(req: Request, res: Response) {
  const user = getUserFromToken(req);
  logInfo(`User ${user.sub} is fetching all cloud providers`);
  
  const cloudProviders = await cloudProviderService.findAll();
  
  logInfo(`Returning ${cloudProviders.length} cloud providers to user ${user.sub}`);
  return jsonResponse(res, 200, cloudProviders);
}

export async function getCloudProviderById(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const providerId = req.params.id;
  
  logInfo(`User ${user.sub} is fetching cloud provider ${providerId}`);
  
  // Get the cloud provider, but don't include the decrypted client secret
  const cloudProvider = await cloudProviderService.findById(providerId);
  
  // Redact the client secret for security
  if (cloudProvider.clientSecret) {
    cloudProvider.clientSecret = '[REDACTED]';
  }
  
  logInfo(`Returning cloud provider ${providerId} to user ${user.sub}`);
  return jsonResponse(res, 200, cloudProvider);
}

export async function createCloudProvider(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const data = validateWithSchema(createCloudProviderSchema, req.body);
    const cloudProvider = await cloudProviderService.create(data, user.sub);
    return jsonResponse(res, 201, cloudProvider);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, CloudProviderErrorCodes.INVALID_INPUT);
    }
    throw error;
  }
}

export async function updateCloudProvider(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const data = validateWithSchema(updateCloudProviderSchema, req.body);
    const cloudProvider = await cloudProviderService.update(req.params.id, data, user.sub);
    return jsonResponse(res, 200, cloudProvider);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, CloudProviderErrorCodes.INVALID_INPUT);
    }
    throw error;
  }
}

export async function deleteCloudProvider(req: Request, res: Response) {
  const user = getUserFromToken(req);
  await cloudProviderService.delete(req.params.id, user.sub);
  return jsonResponse(res, 204);
}