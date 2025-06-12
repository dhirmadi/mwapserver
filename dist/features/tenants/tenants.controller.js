import { TenantService } from './tenants.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { ERROR_CODES } from '../../utils/constants.js';
import { createTenantSchema, updateTenantSchema } from '../../schemas/tenant.schema.js';
const tenantService = new TenantService();
export async function createTenant(req, res) {
    console.log('Creating tenant');
    console.log('Request body:', req.body);
    console.log('Request params:', req.params);
    console.log('Request query:', req.query);
    console.log('Request headers:', req.headers);
    try {
        const user = getUserFromToken(req);
        const data = validateWithSchema(createTenantSchema, req.body);
        const tenant = await tenantService.createTenant(user.sub, data);
        return jsonResponse(res, 201, tenant);
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            throw new ApiError('Invalid input', 400, ERROR_CODES.VALIDATION.INVALID_INPUT);
        }
        throw error;
    }
}
export async function getTenant(req, res) {
    const user = getUserFromToken(req);
    const tenant = await tenantService.getTenantByUserId(user.sub);
    return jsonResponse(res, 200, tenant);
}
export async function updateTenant(req, res) {
    try {
        const user = getUserFromToken(req);
        const data = validateWithSchema(updateTenantSchema, req.body);
        const tenant = await tenantService.updateTenant(req.params.id, user.sub, data);
        return jsonResponse(res, 200, tenant);
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            throw new ApiError('Invalid input', 400, ERROR_CODES.VALIDATION.INVALID_INPUT);
        }
        throw error;
    }
}
export async function deleteTenant(req, res) {
    const user = getUserFromToken(req);
    await tenantService.deleteTenant(req.params.id, user.sub);
    return jsonResponse(res, 204);
}
