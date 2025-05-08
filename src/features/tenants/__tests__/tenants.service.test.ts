import { describe, it, expect, beforeEach } from 'vitest';
import { TenantService } from '../tenants.service';
import { mockCollection, mockSuperadminsCollection } from '../../../__tests__/mockDb';
import { ApiError } from '../../../utils/errors';
import { createTenant, createSuperadmin } from '../../../__tests__/factories';
import { expectSuccess, expectError } from '../../../__tests__/helpers';
import { AUTH } from '../../../__tests__/constants';
import { ERROR_CODES } from '../../../utils/errors';

// Import test setup
import '../../../__tests__/setup';

// Mock the logger to avoid actual logging during tests
vi.mock('../../../utils/logger', () => ({
  logAudit: vi.fn()
}));

describe('TenantService', () => {
  let service: TenantService;

  beforeEach(() => {
    service = new TenantService();
  });

  describe('createTenant', () => {
    it('should create a new tenant', async () => {
      // Create test data
      const data = { 
        name: 'Test Tenant',
        settings: {
          allowPublicProjects: false,
          maxProjects: 10
        }
      };

      const expectedTenant = createTenant({
        name: data.name,
        ownerId: AUTH.USER.sub,
        settings: data.settings
      });

      // Setup mocks
      mockCollection.findOne
        .mockResolvedValueOnce(null) // No existing tenant for user
        .mockResolvedValueOnce(null); // No existing tenant with same name
      mockCollection.insertOne.mockResolvedValueOnce({ insertedId: expectedTenant._id });

      // Execute
      const tenant = await service.createTenant(AUTH.USER.sub, data);

      // Verify
      expect(tenant).toMatchObject({
        name: data.name,
        ownerId: AUTH.USER.sub,
        settings: data.settings
      });
      expect(mockCollection.findOne).toHaveBeenCalledWith({ ownerId: AUTH.USER.sub });
      expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
        name: data.name,
        ownerId: AUTH.USER.sub,
        settings: data.settings
      }));
    });

    it('should throw if user already has a tenant', async () => {
      // Create test data
      const existingTenant = createTenant({
        name: 'First Tenant',
        ownerId: AUTH.USER.sub
      });

      // Setup mocks
      mockCollection.findOne.mockResolvedValue(existingTenant);
      
      // Execute and verify
      await expect(
        service.createTenant(AUTH.USER.sub, { 
          name: 'Second Tenant',
          settings: {
            allowPublicProjects: false,
            maxProjects: 10
          }
        })
      ).rejects.toThrow(new ApiError('User already has a tenant', 409, ERROR_CODES.TENANT.ALREADY_EXISTS));

      expect(mockCollection.findOne).toHaveBeenCalledWith({ ownerId: AUTH.USER.sub });
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should throw if tenant name exists', async () => {
      // Create test data
      const existingTenant = createTenant({
        name: 'Test Tenant',
        ownerId: 'other-user'
      });

      // Setup mocks
      mockCollection.findOne
        .mockResolvedValueOnce(null) // No existing tenant for user
        .mockResolvedValueOnce(existingTenant); // Existing tenant with same name
      
      // Execute and verify
      await expect(
        service.createTenant(AUTH.USER.sub, { 
          name: 'Test Tenant',
          settings: {
            allowPublicProjects: false,
            maxProjects: 10
          }
        })
      ).rejects.toThrow(new ApiError('Tenant name already exists', 409, ERROR_CODES.TENANT.NAME_EXISTS));

      expect(mockCollection.findOne).toHaveBeenCalledWith({ ownerId: AUTH.USER.sub });
      expect(mockCollection.findOne).toHaveBeenCalledWith({ name: 'Test Tenant' });
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });
  });

  describe('getTenantById', () => {
    it('should return tenant by id', async () => {
      // Create test data
      const expectedTenant = createTenant();

      // Setup mocks
      mockCollection.findOne.mockResolvedValue(expectedTenant);
      
      // Execute
      const tenant = await service.getTenantById(expectedTenant._id.toString());
      
      // Verify
      expect(tenant).toEqual(expectedTenant);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: expectedTenant._id });
    });

    it('should throw if tenant not found', async () => {
      // Setup mocks
      mockCollection.findOne.mockResolvedValue(null);

      // Execute and verify
      await expect(
        service.getTenantById('non-existent-id')
      ).rejects.toThrow(new ApiError('Tenant not found', 404, ERROR_CODES.TENANT.NOT_FOUND));
    });
  });

  describe('getTenantByUserId', () => {
    it('should return tenant by user id', async () => {
      // Create test data
      const expectedTenant = createTenant({
        ownerId: AUTH.USER.sub
      });

      // Setup mocks
      mockCollection.findOne.mockResolvedValue(expectedTenant);
      
      // Execute
      const tenant = await service.getTenantByUserId(AUTH.USER.sub);
      
      // Verify
      expect(tenant).toEqual(expectedTenant);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ ownerId: AUTH.USER.sub });
    });

    it('should throw if tenant not found', async () => {
      // Setup mocks
      mockCollection.findOne.mockResolvedValue(null);

      // Execute and verify
      await expect(
        service.getTenantByUserId('non-existent')
      ).rejects.toThrow(new ApiError('Tenant not found', 404, ERROR_CODES.TENANT.NOT_FOUND));

      expect(mockCollection.findOne).toHaveBeenCalledWith({ ownerId: 'non-existent' });
    });
  });

  describe('updateTenant', () => {
    it('should update tenant as owner', async () => {
      // Create test data
      const existingTenant = createTenant({
        ownerId: AUTH.USER.sub
      });

      const updateData = { 
        name: 'Updated Name',
        settings: {
          allowPublicProjects: true,
          maxProjects: 20
        }
      };

      const updatedTenant = createTenant({
        ...existingTenant,
        ...updateData
      });

      // Setup mocks
      mockCollection.findOne
        .mockResolvedValueOnce(existingTenant) // Get tenant by ID
        .mockResolvedValueOnce(null); // Name uniqueness check
      mockCollection.findOneAndUpdate.mockResolvedValue({ value: updatedTenant });

      // Execute
      const updated = await service.updateTenant(
        existingTenant._id.toString(),
        AUTH.USER.sub,
        updateData
      );

      // Verify
      expect(updated).toEqual(updatedTenant);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: existingTenant._id },
        expect.objectContaining({
          $set: expect.objectContaining({
            name: updateData.name,
            settings: updateData.settings,
            updatedAt: expect.any(Date)
          })
        }),
        { returnDocument: 'after' }
      );
    });

    it('should update tenant as superadmin', async () => {
      // Create test data
      const existingTenant = createTenant();
      const admin = createSuperadmin(AUTH.ADMIN.sub);
      const updateData = { 
        name: 'Admin Update',
        settings: {
          allowPublicProjects: true,
          maxProjects: 50
        }
      };
      const updatedTenant = createTenant({
        ...existingTenant,
        ...updateData
      });

      // Setup mocks
      mockCollection.findOne
        .mockResolvedValueOnce(existingTenant) // Get tenant by ID
        .mockResolvedValueOnce(null); // Name uniqueness check
      mockCollection.findOneAndUpdate.mockResolvedValue({ value: updatedTenant });
      mockSuperadminsCollection.findOne.mockResolvedValue(admin);

      // Execute
      const updated = await service.updateTenant(
        existingTenant._id.toString(),
        AUTH.ADMIN.sub,
        updateData
      );

      // Verify
      expect(updated).toEqual(updatedTenant);
    });

    it('should throw if unauthorized', async () => {
      // Create test data
      const existingTenant = createTenant();

      // Setup mocks
      mockCollection.findOne.mockResolvedValue(existingTenant);
      mockSuperadminsCollection.findOne.mockResolvedValue(null);
      
      // Execute and verify
      await expect(
        service.updateTenant(existingTenant._id.toString(), 'other-user', { 
          name: 'Hack',
          settings: {
            allowPublicProjects: true,
            maxProjects: 100
          }
        })
      ).rejects.toThrow(new ApiError('Not authorized to update tenant', 403, ERROR_CODES.TENANT.NOT_AUTHORIZED));
    });

    it('should throw if name exists', async () => {
      // Create test data
      const existingTenant = createTenant();
      const otherTenant = createTenant({
        name: 'Other Tenant',
        ownerId: 'other-user'
      });

      // Setup mocks
      mockCollection.findOne
        .mockResolvedValueOnce(existingTenant) // Get tenant by ID
        .mockResolvedValueOnce(otherTenant); // Name uniqueness check
      
      // Execute and verify
      await expect(
        service.updateTenant(existingTenant._id.toString(), AUTH.USER.sub, { 
          name: 'Other Tenant',
          settings: {
            allowPublicProjects: true,
            maxProjects: 50
          }
        })
      ).rejects.toThrow(new ApiError('Tenant name already exists', 409, ERROR_CODES.TENANT.NAME_EXISTS));

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: existingTenant._id });
      expect(mockCollection.findOne).toHaveBeenCalledWith({ 
        _id: { $ne: existingTenant._id }, 
        name: 'Other Tenant' 
      });
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant as superadmin', async () => {
      // Create test data
      const tenant = createTenant();
      const admin = createSuperadmin(AUTH.ADMIN.sub);

      // Setup mocks
      mockCollection.findOne.mockResolvedValue(tenant);
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      mockSuperadminsCollection.findOne.mockResolvedValue(admin);

      // Execute
      await service.deleteTenant(tenant._id.toString(), AUTH.ADMIN.sub);

      // Verify
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: tenant._id });
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: tenant._id });
    });

    it('should throw if not superadmin', async () => {
      // Create test data
      const tenant = createTenant();

      // Setup mocks
      mockCollection.findOne.mockResolvedValue(tenant);
      mockSuperadminsCollection.findOne.mockResolvedValue(null);
      
      // Execute and verify
      await expect(
        service.deleteTenant(tenant._id.toString(), AUTH.USER.sub)
      ).rejects.toThrow(new ApiError('Not authorized to delete tenant', 403, ERROR_CODES.TENANT.NOT_AUTHORIZED));

      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
    });
  });
});