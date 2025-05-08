import { ObjectId } from 'mongodb';
import { Tenant } from '../schemas/tenant.schema';
import { AUTH } from './constants';

/**
 * Create a test tenant with default or custom values
 */
export function createTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    _id: new ObjectId(),
    name: 'Test Tenant',
    ownerId: AUTH.USER.sub,
    settings: {
      allowPublicProjects: false,
      maxProjects: 10
    },
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

/**
 * Create multiple test tenants
 */
export function createTenants(count: number, overrides: Partial<Tenant> = {}): Tenant[] {
  return Array.from({ length: count }, (_, i) => createTenant({
    name: `Test Tenant ${i + 1}`,
    ...overrides
  }));
}

/**
 * Create a test superadmin
 */
export function createSuperadmin(userId = AUTH.ADMIN.sub) {
  return {
    _id: new ObjectId(),
    userId,
    createdAt: new Date()
  };
}