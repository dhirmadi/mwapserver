import { Router } from 'express';
import { Request, Response } from 'express';
import { TenantService } from './tenants.service';
import { validateWithSchema } from '../../utils/validate';
import { getUserFromToken } from '../../utils/auth';
import { jsonResponse } from '../../utils/response';
import { ApiError } from '../../utils/errors';
import { ERROR_CODES } from '../../utils/constants';
import { logAudit, logInfo, logError } from '../../utils/logger';
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
    const tenantId = req.params.id;
    
    logInfo(`Updating tenant ${tenantId} by user ${user.sub}`);
    
    const data = validateWithSchema(updateTenantSchema, req.body);
    
    // Authorization is already handled by the requireTenantOwnerOrSuperAdmin middleware
    // We still pass the userId to the service for audit logging purposes
    const tenant = await tenantService.updateTenant(tenantId, user.sub, data);
    
    logInfo(`Updated tenant ${tenantId} by user ${user.sub}`);
    
    return jsonResponse(res, 200, tenant);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      logInfo(`Validation error when updating tenant: ${error.message}`);
      throw new ApiError('Invalid input', 400, ERROR_CODES.VALIDATION.INVALID_INPUT);
    }
    logError(`Error updating tenant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

export async function deleteTenant(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const tenantId = req.params.id;
  
  logInfo(`Deleting tenant ${tenantId} by superadmin ${user.sub}`);
  
  // Authorization is already handled by the requireSuperAdminRole middleware
  await tenantService.deleteTenant(tenantId, user.sub);
  
  logInfo(`Deleted tenant ${tenantId} by superadmin ${user.sub}`);
  
  return jsonResponse(res, 204);
}

export async function getAllTenants(req: Request, res: Response) {
  const user = getUserFromToken(req);
  
  // Parse query parameters
  const includeArchived = req.query.includeArchived === 'true';
  
  logInfo(`Superadmin ${user.sub} is listing all tenants. includeArchived=${includeArchived}`);
  
  const tenants = await tenantService.getAllTenants({ includeArchived });
  
  // Transform each tenant using the response schema
  const formattedTenants = tenants.map(tenant => tenantResponseSchema.parse(tenant));
  
  logInfo(`Returning ${tenants.length} tenants to superadmin ${user.sub}`);
  
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
  // Authorization is already handled by the requireTenantOwnerOrSuperAdmin middleware
  const tenant = await tenantService.getTenantById(tenantId);
  
  // Log the audit event
  logAudit('tenant.get', user.sub, tenantId, {
    tenantId
  });
  
  // Format the response using the tenant response schema
  const formattedTenant = tenantResponseSchema.parse(tenant);
  
  return jsonResponse(res, 200, formattedTenant);
}