import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ObjectId } from 'mongodb';
import tenantRoutes from '../tenants.routes';
import { mockCollection, mockSuperadminsCollection } from '../../../__tests__/mockDb';
import { errorHandler } from '../../../middleware/errorHandler';

// Import test setup
import '../../../__tests__/setup';

describe('Tenant Routes', () => {
  let app: express.Application;
  const userId = 'auth0|123';
  const authToken = 'Bearer test-token';

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/tenants', tenantRoutes);
    app.use(errorHandler);
  });

  describe('POST /api/v1/tenants', () => {
    it('should create a new tenant', async () => {
      const data = {
        name: 'Test Tenant',
        settings: {
          allowPublicProjects: true,
          maxProjects: 20
        }
      };

      const expectedTenant = {
        _id: expect.any(String),
        name: data.name,
        ownerId: userId,
        settings: data.settings,
        archived: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      };

      mockCollection.findOne
        .mockResolvedValueOnce(null) // First findOne for user check
        .mockResolvedValueOnce(null); // Second findOne for name check

      const response = await request(app)
        .post('/api/v1/tenants')
        .set('Authorization', authToken)
        .send(data);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(expectedTenant);
    });

    it('should reject invalid tenant data', async () => {
      const response = await request(app)
        .post('/api/v1/tenants')
        .set('Authorization', authToken)
        .send({
          name: 'a', // Too short
          settings: {
            maxProjects: 0 // Invalid value
          }
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/tenants/me', () => {
    it('should return current user tenant', async () => {
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

      const response = await request(app)
        .get('/api/v1/tenants/me')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: expectedTenant.name,
        ownerId: userId
      });
    });
  });

  describe('PATCH /api/v1/tenants/:id', () => {
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
          maxProjects: 50
        }
      };

      const updatedTenant = {
        ...existingTenant,
        ...updateData,
        updatedAt: new Date()
      };

      mockCollection.findOne
        .mockResolvedValueOnce(existingTenant) // First findOne for getTenantById
        .mockResolvedValueOnce(null); // Second findOne for name check

      mockCollection.findOneAndUpdate.mockResolvedValue({ value: updatedTenant });

      const response = await request(app)
        .patch(`/api/v1/tenants/${existingTenant._id}`)
        .set('Authorization', authToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: updateData.name,
        settings: {
          ...existingTenant.settings,
          ...updateData.settings
        }
      });
    });

    it('should reject invalid update data', async () => {
      const response = await request(app)
        .patch(`/api/v1/tenants/${existingTenant._id}`)
        .set('Authorization', authToken)
        .send({
          name: 'a', // Too short
          settings: {
            maxProjects: 101 // Exceeds maximum
          }
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/tenants/:id', () => {
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

      const response = await request(app)
        .delete(`/api/v1/tenants/${existingTenant._id}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(204);
    });

    it('should reject deletion by non-superadmin', async () => {
      mockCollection.findOne.mockResolvedValue(existingTenant);
      mockSuperadminsCollection.findOne.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/v1/tenants/${existingTenant._id}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(403);
    });
  });
});