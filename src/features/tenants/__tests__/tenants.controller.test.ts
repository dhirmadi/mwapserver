import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { TenantController } from '../tenants.controller';
import { TenantService } from '../tenants.service';
import { ApiError } from '../../../utils/errors';

// Import test setup
import '../../../__tests__/setup';

// Mock dependencies
vi.mock('../../../utils/auth', () => ({
  getUserFromToken: vi.fn(() => ({ sub: 'auth0|123', email: 'test@example.com' }))
}));

vi.mock('../../../utils/response', () => ({
  jsonResponse: vi.fn()
}));

// Mock the tenant service
vi.mock('../tenants.service');

describe('TenantController', () => {
  let controller: TenantController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const userId = 'auth0|123';
  const tenantId = new ObjectId();

  beforeEach(() => {
    controller = new TenantController();
    mockReq = {
      params: {},
      body: {}
    };
    mockRes = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis()
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('createTenant', () => {
    beforeEach(() => {
      mockReq.body = {
        name: 'Test Tenant',
        settings: {
          allowPublicProjects: true,
          maxProjects: 20
        }
      };
    });

    it('should create a tenant successfully', async () => {
      const mockTenant = {
        _id: tenantId,
        name: 'Test Tenant',
        ownerId: userId,
        settings: mockReq.body.settings,
        createdAt: new Date(),
        updatedAt: new Date(),
        archived: false
      };

      vi.mocked(TenantService.prototype.createTenant).mockResolvedValue(mockTenant);

      await controller.createTenant(mockReq as Request, mockRes as Response);

      expect(TenantService.prototype.createTenant).toHaveBeenCalledWith(
        userId,
        mockReq.body
      );
    });

    it('should throw if validation fails', async () => {
      mockReq.body = { name: 'a' }; // Too short

      await expect(
        controller.createTenant(mockReq as Request, mockRes as Response)
      ).rejects.toThrow();
    });
  });

  describe('getCurrentTenant', () => {
    it('should return current user tenant', async () => {
      const mockTenant = {
        _id: tenantId,
        name: 'Test Tenant',
        ownerId: userId,
        settings: { allowPublicProjects: false, maxProjects: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        archived: false
      };

      vi.mocked(TenantService.prototype.getTenantByUserId).mockResolvedValue(mockTenant);

      await controller.getCurrentTenant(mockReq as Request, mockRes as Response);

      expect(TenantService.prototype.getTenantByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('updateTenant', () => {
    beforeEach(() => {
      mockReq.params = { id: tenantId.toString() };
      mockReq.body = { name: 'Updated Name' };
    });

    it('should update tenant successfully', async () => {
      const mockTenant = {
        _id: tenantId,
        name: 'Updated Name',
        ownerId: userId,
        settings: { allowPublicProjects: false, maxProjects: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        archived: false
      };

      vi.mocked(TenantService.prototype.updateTenant).mockResolvedValue(mockTenant);

      await controller.updateTenant(mockReq as Request, mockRes as Response);

      expect(TenantService.prototype.updateTenant).toHaveBeenCalledWith(
        tenantId.toString(),
        userId,
        mockReq.body
      );
    });

    it('should throw if validation fails', async () => {
      mockReq.body = { name: 'a' }; // Too short

      await expect(
        controller.updateTenant(mockReq as Request, mockRes as Response)
      ).rejects.toThrow();
    });
  });

  describe('deleteTenant', () => {
    beforeEach(() => {
      mockReq.params = { id: tenantId.toString() };
    });

    it('should delete tenant successfully', async () => {
      vi.mocked(TenantService.prototype.deleteTenant).mockResolvedValue();

      await controller.deleteTenant(mockReq as Request, mockRes as Response);

      expect(TenantService.prototype.deleteTenant).toHaveBeenCalledWith(
        tenantId.toString(),
        userId
      );
    });

    it('should throw if deletion fails', async () => {
      vi.mocked(TenantService.prototype.deleteTenant).mockRejectedValue(
        new ApiError('Not authorized', 403)
      );

      await expect(
        controller.deleteTenant(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(ApiError);
    });
  });
});