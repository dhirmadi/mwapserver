import { Request, Response } from 'express';
import { TenantService } from './tenants.service';
import { validateWithSchema } from '../../utils/validate';
import { getUserFromToken } from '../../utils/auth';
import { jsonResponse } from '../../utils/response';
import { ApiError } from '../../utils/errors';
import { ERROR_CODES } from '../../__tests__/constants';
import { 
  createTenantSchema, 
  updateTenantSchema, 
  tenantResponseSchema 
} from '../../schemas/tenant.schema';

export class TenantController {
  private service: TenantService;

  constructor() {
    this.service = new TenantService();
  }

  async createTenant(req: Request, res: Response): Promise<void> {
    const { sub: userId } = getUserFromToken(req);
    try {
      const validatedData = validateWithSchema(createTenantSchema, req.body);
      
      // Ensure settings are complete with defaults
      const data = {
        name: validatedData.name,
        settings: {
          allowPublicProjects: validatedData.settings?.allowPublicProjects ?? false,
          maxProjects: validatedData.settings?.maxProjects ?? 10
        }
      };

      const tenant = await this.service.createTenant(userId, data);
      const response = tenantResponseSchema.parse(tenant);

      jsonResponse(res, response, 201);
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new ApiError('Invalid input', 400, ERROR_CODES.VALIDATION_ERROR);
      }
      throw error;
    }
  }

  async getCurrentTenant(req: Request, res: Response): Promise<void> {
    const { sub: userId } = getUserFromToken(req);

    const tenant = await this.service.getTenantByUserId(userId);
    const response = tenantResponseSchema.parse(tenant);

    jsonResponse(res, response);
  }

  async updateTenant(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { sub: userId } = getUserFromToken(req);
    try {
      const data = validateWithSchema(updateTenantSchema, req.body);

      const tenant = await this.service.updateTenant(id, userId, data);
      const response = tenantResponseSchema.parse(tenant);

      jsonResponse(res, response);
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new ApiError('Invalid input', 400, ERROR_CODES.VALIDATION_ERROR);
      }
      throw error;
    }
  }

  async deleteTenant(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { sub: userId } = getUserFromToken(req);

    await this.service.deleteTenant(id, userId);
    jsonResponse(res, { success: true }, 204);
  }
}