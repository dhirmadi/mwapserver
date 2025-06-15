import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../../config/db';
import { ApiError } from '../../utils/errors';
import { ERROR_CODES } from '../../utils/constants';
import { logAudit } from '../../utils/logger';
import { Tenant, CreateTenantRequest, UpdateTenantRequest } from '../../schemas/tenant.schema';

export class TenantService {
  private collection: Collection<Tenant>;

  constructor() {
    this.collection = getDB().collection<Tenant>('tenants');
  }

  async createTenant(userId: string, data: CreateTenantRequest): Promise<Tenant> {
    // Check if user already has a tenant
    const existingTenant = await this.collection.findOne({ ownerId: userId });
    if (existingTenant) {
      throw new ApiError('User already has a tenant', 409, ERROR_CODES.TENANT.ALREADY_EXISTS);
    }

    // Check if tenant name is unique
    const nameExists = await this.collection.findOne({ name: data.name });
    if (nameExists) {
      throw new ApiError('Tenant name already exists', 409, ERROR_CODES.TENANT.NAME_EXISTS);
    }

    const now = new Date();
    const tenant: Tenant = {
      _id: new ObjectId(),
      name: data.name,
      ownerId: userId,
      settings: {
        allowPublicProjects: data.settings?.allowPublicProjects ?? false,
        maxProjects: data.settings?.maxProjects ?? 10
      },
      createdAt: now,
      updatedAt: now,
      archived: false
    };

    await this.collection.insertOne(tenant);
    
    logAudit('tenant.create', userId, tenant._id.toString(), {
      name: tenant.name,
      settings: tenant.settings
    });

    return tenant;
  }

  async getTenantById(id: string): Promise<Tenant> {
    const tenant = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!tenant) {
      throw new ApiError('Tenant not found', 404, ERROR_CODES.TENANT.NOT_FOUND);
    }
    return tenant;
  }

  async getTenantByUserId(userId: string): Promise<Tenant> {
    const tenant = await this.collection.findOne({ ownerId: userId });
    if (!tenant) {
      throw new ApiError('Tenant not found', 404, ERROR_CODES.TENANT.NOT_FOUND);
    }
    return tenant;
  }

  async updateTenant(id: string, userId: string, data: UpdateTenantRequest): Promise<Tenant> {
    const tenant = await this.getTenantById(id);

    // Only owner or superadmin can update tenant
    if (tenant.ownerId !== userId && !await this.isSuperAdmin(userId)) {
      throw new ApiError('Not authorized to update tenant', 403, ERROR_CODES.TENANT.NOT_AUTHORIZED);
    }

    // If name is being updated, check uniqueness
    if (data.name && data.name !== tenant.name) {
      const nameExists = await this.collection.findOne({ 
        _id: { $ne: tenant._id }, 
        name: data.name 
      });
      if (nameExists) {
        throw new ApiError('Tenant name already exists', 409, ERROR_CODES.TENANT.NAME_EXISTS);
      }
    }

    const update: Partial<Tenant> = {
      updatedAt: new Date()
    };

    if (data.name) {
      update.name = data.name;
    }

    if (data.settings) {
      update.settings = {
        allowPublicProjects: data.settings.allowPublicProjects ?? tenant.settings.allowPublicProjects,
        maxProjects: data.settings.maxProjects ?? tenant.settings.maxProjects
      };
    }

    if (data.archived !== undefined) {
      update.archived = data.archived;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: tenant._id },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new ApiError('Failed to update tenant', 500, ERROR_CODES.TENANT.UPDATE_FAILED);
    }

    logAudit('tenant.update', userId, tenant._id.toString(), {
      updates: data
    });

    return result;
  }

  async deleteTenant(id: string, userId: string): Promise<void> {
    const tenant = await this.getTenantById(id);

    // Only superadmin can delete tenants
    if (!await this.isSuperAdmin(userId)) {
      throw new ApiError('Not authorized to delete tenant', 403, ERROR_CODES.TENANT.NOT_AUTHORIZED);
    }

    await this.collection.deleteOne({ _id: tenant._id });

    logAudit('tenant.delete', userId, tenant._id.toString(), {
      name: tenant.name
    });
  }

  private async isSuperAdmin(userId: string): Promise<boolean> {
    const superadmin = await getDB().collection('superadmins').findOne({ userId });
    return !!superadmin;
  }

  async getAllTenants(options?: { includeArchived?: boolean }): Promise<Tenant[]> {
    const filter: any = {};
    
    // By default, exclude archived tenants unless explicitly requested
    if (!options?.includeArchived) {
      filter.archived = { $ne: true };
    }
    
    const tenants = await this.collection.find(filter).sort({ name: 1 }).toArray();
    return tenants;
  }
}