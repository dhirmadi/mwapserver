import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { TenantService } from '../tenants.service';
import { mockCollection, mockSuperadminsCollection } from '../../../__tests__/mockDb';
import { ApiError } from '../../../utils/errors';

// Import test setup
import '../../../__tests__/setup';

// Mock the logger to avoid actual logging during tests
vi.mock('../../../utils/logger', () => ({
  logAudit: vi.fn()
}));

describe('TenantService', () => {
  let service: TenantService;
  const userId = 'auth0|123';

  beforeEach(() => {
    service = new TenantService();
  });

  describe('createTenant', () => {
    it('should create a new tenant', async () => {
      const data = { 
        name: 'Test Tenant',
        settings: {
          allowPublicProjects: false,
          maxProjects: 10
        }
      };

      const expectedTenant = {
        _id: expect.any(ObjectId),
        name: data.name,
        ownerId: userId,
        settings: data.settings,
        archived: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      };

      mockCollection.findOne
        .mockResolvedValueOnce(null) // First findOne for user check
        .mockResolvedValueOnce(null); // Second findOne for name check

      const tenant = await service.createTenant(userId, data);

      expect(tenant).toMatchObject(expectedTenant);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ ownerId: userId });
      expect(mockCollection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
        name: data.name,
        ownerId: userId,
        settings: data.settings
      }));
    });

    it('should throw if user already has a tenant', async () => {
      const existingTenant = {
        _id: new ObjectId(),
        name: 'First Tenant',
        ownerId: userId,
        settings: {
          allowPublicProjects: false,
          maxProjects: 10
        },
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne.mockResolvedValue(existingTenant);
      
      await expect(
        service.createTenant(userId, { 
          name: 'Second Tenant',
          settings: {
            allowPublicProjects: false,
            maxProjects: 10
          }
        })
      ).rejects.toThrow(ApiError);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ ownerId: userId });
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should throw if tenant name exists', async () => {
      mockCollection.findOne
        .mockResolvedValueOnce(null) // First findOne for user check
        .mockResolvedValueOnce({ // Second findOne for name check
          _id: new ObjectId(),
          name: 'Test Tenant',
          ownerId: 'other-user'
        });
      
      await expect(
        service.createTenant(userId, { 
          name: 'Test Tenant',
          settings: {
            allowPublicProjects: false,
            maxProjects: 10
          }
        })
      ).rejects.toThrow(ApiError);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ ownerId: userId });
      expect(mockCollection.findOne).toHaveBeenCalledWith({ name: 'Test Tenant' });
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });
  });

  describe('getTenantById', () => {
    it('should return tenant by id', async () => {
      const expectedTenant = {
        _id: new ObjectId(),
        name: 'Test Tenant',
        ownerId: userId,
        settings: {
          allowPublicProjects: false,
          maxProjects: 10
        },
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne.mockResolvedValue(expectedTenant);
      
      const tenant = await service.getTenantById(expectedTenant._id.toString());
      
      expect(tenant).toEqual(expectedTenant);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: expectedTenant._id });
    });

    it('should throw if tenant not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      await expect(
        service.getTenantById(new ObjectId().toString())
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getTenantByUserId', () => {
    it('should return tenant by user id', async () => {
      const expectedTenant = {
        _id: new ObjectId(),
        name: 'Test Tenant',
        ownerId: userId,
        settings: {
          allowPublicProjects: false,
          maxProjects: 10
        },
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCollection.findOne.mockResolvedValue(expectedTenant);
      
      const tenant = await service.getTenantByUserId(userId);
      
      expect(tenant).toEqual(expectedTenant);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ ownerId: userId });
    });

    it('should throw if tenant not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      await expect(
        service.getTenantByUserId('non-existent')
      ).rejects.toThrow(ApiError);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ ownerId: 'non-existent' });
    });
  });

  describe('updateTenant', () => {
    const existingTenant = {
      _id: new ObjectId(),
      name: 'Test Tenant',
      ownerId: userId,
      settings: {
        allowPublicProjects: false,
        maxProjects: 10
      },
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update tenant as owner', async () => {
      const updateData = { 
        name: 'Updated Name',
        settings: {
          allowPublicProjects: true,
          maxProjects: 20
        }
      };

      const updatedTenant = {
        ...existingTenant,
        ...updateData,
        updatedAt: expect.any(Date)
      };

      mockCollection.findOne
        .mockResolvedValueOnce(existingTenant) // First findOne for getTenantById
        .mockResolvedValueOnce(null); // Second findOne for name check

      mockCollection.findOneAndUpdate.mockResolvedValue({ value: updatedTenant });

      const updated = await service.updateTenant(
        existingTenant._id.toString(),
        userId,
        updateData
      );

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
      const adminId = 'auth0|admin';
      const updateData = { 
        name: 'Admin Update',
        settings: {
          allowPublicProjects: true,
          maxProjects: 50
        }
      };

      const updatedTenant = {
        ...existingTenant,
        ...updateData,
        updatedAt: expect.any(Date)
      };

      mockCollection.findOne
        .mockResolvedValueOnce(existingTenant) // First findOne for getTenantById
        .mockResolvedValueOnce(null); // Second findOne for name check

      mockCollection.findOneAndUpdate.mockResolvedValue({ value: updatedTenant });
      mockSuperadminsCollection.findOne.mockResolvedValue({ userId: adminId });

      const updated = await service.updateTenant(
        existingTenant._id.toString(),
        adminId,
        updateData
      );

      expect(updated).toEqual(updatedTenant);
    });

    it('should throw if unauthorized', async () => {
      mockCollection.findOne.mockResolvedValue(existingTenant);
      mockSuperadminsCollection.findOne.mockResolvedValue(null);
      
      await expect(
        service.updateTenant(existingTenant._id.toString(), 'other-user', { 
          name: 'Hack',
          settings: {
            allowPublicProjects: true,
            maxProjects: 100
          }
        })
      ).rejects.toThrow(ApiError);
    });

    it('should throw if name exists', async () => {
      const otherTenant = {
        _id: new ObjectId(),
        name: 'Other Tenant',
        ownerId: 'other-user'
      };

      mockCollection.findOne
        .mockResolvedValueOnce(existingTenant) // First findOne for getTenantById
        .mockResolvedValueOnce(otherTenant); // Second findOne for name check
      
      await expect(
        service.updateTenant(existingTenant._id.toString(), userId, { 
          name: 'Other Tenant',
          settings: {
            allowPublicProjects: true,
            maxProjects: 50
          }
        })
      ).rejects.toThrow(ApiError);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: existingTenant._id });
      expect(mockCollection.findOne).toHaveBeenCalledWith({ 
        _id: { $ne: existingTenant._id }, 
        name: 'Other Tenant' 
      });
    });
  });

  describe('deleteTenant', () => {
    const existingTenant = {
      _id: new ObjectId(),
      name: 'Test Tenant',
      ownerId: userId,
      settings: {
        allowPublicProjects: false,
        maxProjects: 10
      },
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should delete tenant as superadmin', async () => {
      const adminId = 'auth0|admin';
      mockCollection.findOne.mockResolvedValue(existingTenant);
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      mockSuperadminsCollection.findOne.mockResolvedValue({ userId: adminId });

      await service.deleteTenant(existingTenant._id.toString(), adminId);

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: existingTenant._id });
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: existingTenant._id });
    });

    it('should throw if not superadmin', async () => {
      mockCollection.findOne.mockResolvedValue(existingTenant);
      mockSuperadminsCollection.findOne.mockResolvedValue(null);
      
      await expect(
        service.deleteTenant(existingTenant._id.toString(), userId)
      ).rejects.toThrow(ApiError);

      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
    });
  });
});