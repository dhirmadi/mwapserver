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
  try {
    const user = getUserFromToken(req);
    logInfo('Getting all cloud providers', { userId: user.sub });
    const cloudProviders = await cloudProviderService.findAll();
    return jsonResponse(res, 200, cloudProviders);
  } catch (error) {
    logError('Error getting all cloud providers', error);
    throw error;
  }
}

export async function getCloudProviderById(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const providerId = req.params.id;
    logInfo('Getting cloud provider by ID', { userId: user.sub, providerId });
    const cloudProvider = await cloudProviderService.findById(providerId);
    return jsonResponse(res, 200, cloudProvider);
  } catch (error) {
    logError('Error getting cloud provider by ID', error);
    throw error;
  }
}

export async function createCloudProvider(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    logInfo('Creating cloud provider', { userId: user.sub });
    const data = validateWithSchema(createCloudProviderSchema, req.body);
    const cloudProvider = await cloudProviderService.create(data, user.sub);
    return jsonResponse(res, 201, cloudProvider);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logError('Validation error creating cloud provider', error);
      throw new ApiError('Invalid input', 400, CloudProviderErrorCodes.INVALID_INPUT);
    }
    logError('Error creating cloud provider', error);
    throw error;
  }
}

export async function updateCloudProvider(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const providerId = req.params.id;
    logInfo('Updating cloud provider', { userId: user.sub, providerId });
    const data = validateWithSchema(updateCloudProviderSchema, req.body);
    const cloudProvider = await cloudProviderService.update(providerId, data, user.sub);
    return jsonResponse(res, 200, cloudProvider);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logError('Validation error updating cloud provider', error);
      throw new ApiError('Invalid input', 400, CloudProviderErrorCodes.INVALID_INPUT);
    }
    logError('Error updating cloud provider', error);
    throw error;
  }
}

export async function deleteCloudProvider(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const providerId = req.params.id;
    logInfo('Deleting cloud provider', { userId: user.sub, providerId });
    await cloudProviderService.delete(providerId, user.sub);
    return jsonResponse(res, 204);
  } catch (error) {
    logError('Error deleting cloud provider', error);
    throw error;
  }
}