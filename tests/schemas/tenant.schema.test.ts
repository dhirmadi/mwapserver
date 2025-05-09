import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  createTenantSchema,
  updateTenantSchema
} from '../../src/schemas/tenant.schema';

describe('Tenant Schemas', () => {
  describe('createTenantSchema', () => {
    it('should validate valid creation data', () => {
      const validData = {
        name: 'New Tenant',
        settings: {
          allowPublicProjects: true,
          maxProjects: 50
        }
      };

      const result = createTenantSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should allow omitting settings', () => {
      const minimalData = {
        name: 'New Tenant'
      };

      const result = createTenantSchema.parse(minimalData);
      expect(result).toEqual(minimalData);
    });

    it('should reject invalid data', () => {
      const invalidData = {
        name: 'Te', // Too short
        settings: {
          maxProjects: 101 // Exceeds max
        }
      };

      expect(() => createTenantSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateTenantSchema', () => {
    it('should validate partial updates', () => {
      const updates = {
        name: 'Updated Name',
        settings: {
          maxProjects: 20
        },
        archived: true
      };

      const result = updateTenantSchema.parse(updates);
      expect(result).toEqual(updates);
    });

    it('should allow empty updates', () => {
      const emptyUpdate = {};
      const result = updateTenantSchema.parse(emptyUpdate);
      expect(result).toEqual(emptyUpdate);
    });

    it('should reject invalid updates', () => {
      const invalidUpdates = {
        name: 'Te', // Too short
        settings: {
          maxProjects: 0 // Below min
        }
      };

      expect(() => updateTenantSchema.parse(invalidUpdates)).toThrow();
    });
  });
});