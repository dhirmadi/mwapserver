import { Request, Response } from 'express';
import { TenantService } from './tenants.service';
import { validateWithSchema } from '../../utils/validate';
import { getUserFromToken } from '../../utils/auth';
import { jsonResponse } from '../../utils/response';
import { ApiError } from '../../utils/errors';
import { ERROR_CODES } from '../../utils/constants';
import { 
  createTenantSchema, 
  updateTenantSchema, 
  tenantResponseSchema 
} from '../../schemas/tenant.schema';

const tenantService = new TenantService();

export async function createTenant(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const data = validateWithSchema(createTenantSchema, req.body);
    const tenant = await tenantService.createTenant(user.sub, data);
    return jsonResponse(res, 201, tenant);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, ERROR_CODES.VALIDATION.INVALID_INPUT);
    }
    throw error;
  }
}

export async function getTenant(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const tenant = await tenantService.getTenantByUserId(user.sub);
  return jsonResponse(res, 200, tenant);
}

export async function updateTenant(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const data = validateWithSchema(updateTenantSchema, req.body);
    const tenant = await tenantService.updateTenant(req.params.id, user.sub, data);
    return jsonResponse(res, 200, tenant);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, ERROR_CODES.VALIDATION.INVALID_INPUT);
    }
    throw error;
  }
}

export async function deleteTenant(req: Request, res: Response) {
  const user = getUserFromToken(req);
  await tenantService.deleteTenant(req.params.id, user.sub);
  return jsonResponse(res, 204);
}