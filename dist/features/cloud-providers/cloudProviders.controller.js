import { CloudProviderService } from './cloudProviders.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { createCloudProviderSchema, updateCloudProviderSchema, CloudProviderErrorCodes } from '../../schemas/cloudProvider.schema.js';
const cloudProviderService = new CloudProviderService();
export async function getAllCloudProviders(req, res) {
    const cloudProviders = await cloudProviderService.findAll();
    return jsonResponse(res, 200, cloudProviders);
}
export async function getCloudProviderById(req, res) {
    const cloudProvider = await cloudProviderService.findById(req.params.id);
    return jsonResponse(res, 200, cloudProvider);
}
export async function createCloudProvider(req, res) {
    try {
        const user = getUserFromToken(req);
        const data = validateWithSchema(createCloudProviderSchema, req.body);
        const cloudProvider = await cloudProviderService.create(data, user.sub);
        return jsonResponse(res, 201, cloudProvider);
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            throw new ApiError('Invalid input', 400, CloudProviderErrorCodes.INVALID_INPUT);
        }
        throw error;
    }
}
export async function updateCloudProvider(req, res) {
    try {
        const user = getUserFromToken(req);
        const data = validateWithSchema(updateCloudProviderSchema, req.body);
        const cloudProvider = await cloudProviderService.update(req.params.id, data, user.sub);
        return jsonResponse(res, 200, cloudProvider);
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            throw new ApiError('Invalid input', 400, CloudProviderErrorCodes.INVALID_INPUT);
        }
        throw error;
    }
}
export async function deleteCloudProvider(req, res) {
    const user = getUserFromToken(req);
    await cloudProviderService.delete(req.params.id, user.sub);
    return jsonResponse(res, 204);
}
