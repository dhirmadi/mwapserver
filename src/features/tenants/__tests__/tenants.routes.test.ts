import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import tenantRoutes from '../tenants.routes';
import { mockCollection, mockSuperadminsCollection } from '../../../__tests__/mockDb';
import { errorHandler } from '../../../middleware/errorHandler';
import { createTenant, createSuperadmin } from '../../../__tests__/factories';
import { authRequest, adminRequest, expectSuccess, expectError } from '../../../__tests__/helpers';
import { AUTH, ERROR_CODES } from '../../../__tests__/constants';

// Import test setup
import '../../../__tests__/setup';

describe('Tenant Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/tenants', tenantRoutes);
    app.use(errorHandler);
  });

  describe('POST /api/v1/tenants', () => {
    it('should create a new tenant', async () => {
      // Create test data using factory
      const data = {
        name: 'Test Tenant',
        settings: {
          allowPublicProjects: true,
          maxProjects: 20
        }
      };
      const newTenant = createTenant(data);

      // Setup mocks
      mockCollection.findOne
        .mockResolvedValueOnce(null) // No existing tenant for user
        .mockResolvedValueOnce(null); // No existing tenant with same name
      mockCollection.insertOne.mockResolvedValueOnce({ insertedId: newTenant._id });

      // Make request
      const response = await authRequest(app)
        .post('/api/v1/tenants')
        .send(data);

      // Verify response
      expectSuccess(response, 201);
      expect(response.body).toMatchObject({
        name: data.name,
        settings: data.settings,
        ownerId: AUTH.USER.sub
      });
    });

    it('should reject invalid tenant data', async () => {
      const response = await authRequest(app)
        .post('/api/v1/tenants')
        .send({
          name: 'a', // Too short
          settings: {
            maxProjects: 0 // Invalid value
          }
        });

      expectError(response, 400, ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('GET /api/v1/tenants/me', () => {
    it('should return current user tenant', async () => {
      // Create test data
      const expectedTenant = createTenant({
        name: 'Test Tenant',
        ownerId: AUTH.USER.sub
      });

      // Setup mocks
      mockCollection.findOne.mockResolvedValue(expectedTenant);

      // Make request
      const response = await authRequest(app)
        .get('/api/v1/tenants/me');

      // Verify response
      expectSuccess(response);
      expect(response.body).toMatchObject({
        name: expectedTenant.name,
        ownerId: AUTH.USER.sub
      });
    });
  });

  describe('PATCH /api/v1/tenants/:id', () => {
    it('should update tenant as owner', async () => {
      // Create test data
      const existingTenant = createTenant({
        name: 'Test Tenant',
        ownerId: AUTH.USER.sub
      });

      const updateData = {
        name: 'Updated Name',
        settings: {
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

      // Make request
      const response = await authRequest(app)
        .patch(`/api/v1/tenants/${existingTenant._id}`)
        .send(updateData);

      // Verify response
      expectSuccess(response);
      expect(response.body).toMatchObject({
        name: updateData.name,
        settings: {
          ...existingTenant.settings,
          ...updateData.settings
        }
      });
    });

    it('should reject invalid update data', async () => {
      // Create test data
      const tenant = createTenant();

      // Make request
      const response = await authRequest(app)
        .patch(`/api/v1/tenants/${tenant._id}`)
        .send({
          name: 'a', // Too short
          settings: {
            maxProjects: 101 // Exceeds maximum
          }
        });

      // Verify response
      expectError(response, 400, ERROR_CODES.VALIDATION_ERROR);
    });
  });

  describe('DELETE /api/v1/tenants/:id', () => {
    it('should delete tenant as superadmin', async () => {
      // Create test data
      const tenant = createTenant();
      const admin = createSuperadmin(AUTH.ADMIN.sub);

      // Setup mocks
      mockCollection.findOne.mockResolvedValue(tenant);
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
      mockSuperadminsCollection.findOne.mockResolvedValue(admin);

      // Make request
      const response = await adminRequest(app)
        .delete(`/api/v1/tenants/${tenant._id}`);

      // Verify response
      expectSuccess(response, 204);
    });

    it('should reject deletion by non-superadmin', async () => {
      // Create test data
      const tenant = createTenant();

      // Setup mocks
      mockCollection.findOne.mockResolvedValue(tenant);
      mockSuperadminsCollection.findOne.mockResolvedValue(null);

      // Make request
      const response = await authRequest(app)
        .delete(`/api/v1/tenants/${tenant._id}`);

      // Verify response
      expectError(response, 403, ERROR_CODES.PERMISSION_ERROR);
    });
  });
});