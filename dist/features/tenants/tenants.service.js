import { ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { ERROR_CODES } from '../../utils/constants.js';
import { logAudit } from '../../utils/logger.js';
export class TenantService {
    constructor() {
        this.collection = getDB().collection('tenants');
    }
    async createTenant(userId, data) {
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
        const tenant = {
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
    async getTenantById(id) {
        const tenant = await this.collection.findOne({ _id: new ObjectId(id) });
        if (!tenant) {
            throw new ApiError('Tenant not found', 404, ERROR_CODES.TENANT.NOT_FOUND);
        }
        return tenant;
    }
    async getTenantByUserId(userId) {
        const tenant = await this.collection.findOne({ ownerId: userId });
        if (!tenant) {
            throw new ApiError('Tenant not found', 404, ERROR_CODES.TENANT.NOT_FOUND);
        }
        return tenant;
    }
    async updateTenant(id, userId, data) {
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
        const update = {
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
        const result = await this.collection.findOneAndUpdate({ _id: tenant._id }, { $set: update }, { returnDocument: 'after' });
        if (!result) {
            throw new ApiError('Failed to update tenant', 500, ERROR_CODES.TENANT.UPDATE_FAILED);
        }
        logAudit('tenant.update', userId, tenant._id.toString(), {
            updates: data
        });
        return result;
    }
    async deleteTenant(id, userId) {
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
    async isSuperAdmin(userId) {
        const superadmin = await getDB().collection('superadmins').findOne({ userId });
        return !!superadmin;
    }
}
