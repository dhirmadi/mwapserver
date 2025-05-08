import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { TenantController } from '../tenants.controller';
import { TenantService } from '../tenants.service';
import { ApiError } from '../../../utils/errors';
import { createTenant } from '../../../__tests__/factories';
import { AUTH, ERROR_CODES } from '../../../__tests__/constants';

// Import test setup
import '../../../__tests__/setup';

// Mock dependencies
vi.mock('../../../utils/auth', () => ({
  getUserFromToken: vi.fn(() => AUTH.USER)
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
      // Create test data
      const mockTenant = createTenant({
        name: mockReq.body.name,
        settings: mockReq.body.settings,
        ownerId: AUTH.USER.sub
      });

      // Setup mocks
      vi.mocked(TenantService.prototype.createTenant).mockResolvedValue(mockTenant);

      // Execute
      await controller.createTenant(mockReq as Request, mockRes as Response);

      // Verify
      expect(TenantService.prototype.createTenant).toHaveBeenCalledWith(
        AUTH.USER.sub,
        mockReq.body
      );
    });

    it('should throw if validation fails', async () => {
      // Setup invalid data
      mockReq.body = { name: 'a' }; // Too short

      // Execute and verify
      await expect(
        controller.createTenant(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(new ApiError('Invalid input', 400, ERROR_CODES.VALIDATION_ERROR));
    });
  });

  describe('getCurrentTenant', () => {
    it('should return current user tenant', async () => {
      // Create test data
      const mockTenant = createTenant({
        ownerId: AUTH.USER.sub
      });

      // Setup mocks
      vi.mocked(TenantService.prototype.getTenantByUserId).mockResolvedValue(mockTenant);

      // Execute
      await controller.getCurrentTenant(mockReq as Request, mockRes as Response);

      // Verify
      expect(TenantService.prototype.getTenantByUserId).toHaveBeenCalledWith(AUTH.USER.sub);
    });
  });

  describe('updateTenant', () => {
    it('should update tenant successfully', async () => {
      // Create test data
      const tenant = createTenant();
      const updateData = { name: 'Updated Name' };
      const updatedTenant = createTenant({
        ...tenant,
        ...updateData
      });

      // Setup request
      mockReq.params = { id: tenant._id.toString() };
      mockReq.body = updateData;

      // Setup mocks
      vi.mocked(TenantService.prototype.updateTenant).mockResolvedValue(updatedTenant);

      // Execute
      await controller.updateTenant(mockReq as Request, mockRes as Response);

      // Verify
      expect(TenantService.prototype.updateTenant).toHaveBeenCalledWith(
        tenant._id.toString(),
        AUTH.USER.sub,
        updateData
      );
    });

    it('should throw if validation fails', async () => {
      // Setup invalid data
      const tenant = createTenant();
      mockReq.params = { id: tenant._id.toString() };
      mockReq.body = { name: 'a' }; // Too short

      // Execute and verify
      await expect(
        controller.updateTenant(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(new ApiError('Invalid input', 400, ERROR_CODES.VALIDATION_ERROR));
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant successfully', async () => {
      // Create test data
      const tenant = createTenant();

      // Setup request
      mockReq.params = { id: tenant._id.toString() };

      // Setup mocks
      vi.mocked(TenantService.prototype.deleteTenant).mockResolvedValue();

      // Execute
      await controller.deleteTenant(mockReq as Request, mockRes as Response);

      // Verify
      expect(TenantService.prototype.deleteTenant).toHaveBeenCalledWith(
        tenant._id.toString(),
        AUTH.USER.sub
      );
    });

    it('should throw if deletion fails', async () => {
      // Create test data
      const tenant = createTenant();

      // Setup request
      mockReq.params = { id: tenant._id.toString() };

      // Setup mocks
      vi.mocked(TenantService.prototype.deleteTenant).mockRejectedValue(
        new ApiError('Not authorized', 403, ERROR_CODES.PERMISSION_ERROR)
      );

      // Execute and verify
      await expect(
        controller.deleteTenant(mockReq as Request, mockRes as Response)
      ).rejects.toThrow(new ApiError('Not authorized', 403, ERROR_CODES.PERMISSION_ERROR));
    });
  });
});