import { Router } from 'express';
import { Request, Response } from 'express';
import { TenantService } from './tenants.service';
import { validateWithSchema } from '../../utils/validate';
import { getUserFromToken } from '../../utils/auth';
import { jsonResponse } from '../../utils/response';
import { ApiError } from '../../utils/errors';
import { ERROR_CODES } from '../../utils/constants';
import { logAudit } from '../../utils/logger';
import { 
  createTenantSchema, 
  updateTenantSchema, 
  tenantResponseSchema 
} from '../../schemas/tenant.schema';

const tenantService = new TenantService();


export async function createTenant(req: Request, res: Response) {
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

export async function getAllTenants(req: Request, res: Response) {
  const user = getUserFromToken(req);
  
  // Parse query parameters
  const includeArchived = req.query.includeArchived === 'true';
  
  console.log(`[MWAP] Superadmin ${user.sub} is listing all tenants. includeArchived=${includeArchived}`);
  
  const tenants = await tenantService.getAllTenants({ includeArchived });
  
  // Transform each tenant using the response schema
  const formattedTenants = tenants.map(tenant => tenantResponseSchema.parse(tenant));
  
  console.log(`[MWAP] Returning ${tenants.length} tenants to superadmin ${user.sub}`);
  
  // Log the audit event
  logAudit('tenant.list', user.sub, 'all', {
    includeArchived,
    count: tenants.length
  });
  
  return jsonResponse(res, 200, formattedTenants);
}

export async function getTenantById(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const tenantId = req.params.id;
  
  // Get the tenant by ID
  const tenant = await tenantService.getTenantById(tenantId);
  
  // Check if user is authorized to view this tenant
  // User must be either the tenant owner or a superadmin
  const isSuperAdmin = await tenantService.isSuperAdmin(user.sub);
  const isOwner = tenant.ownerId === user.sub;
  
  if (!isOwner && !isSuperAdmin) {
    throw new ApiError('Not authorized to view tenant', 403, ERROR_CODES.TENANT.NOT_AUTHORIZED);
  }
  
  // Log the audit event
  logAudit('tenant.get', user.sub, tenantId, {
    tenantId
  });
  
  // Format the response using the tenant response schema
  const formattedTenant = tenantResponseSchema.parse(tenant);
  
  return jsonResponse(res, 200, formattedTenant);
}