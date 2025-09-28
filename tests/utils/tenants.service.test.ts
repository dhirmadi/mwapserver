import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantService } from '../../src/features/tenants/tenants.service.js';
import { getDB } from '../../src/config/db';

describe('TenantService', () => {
  let service: TenantService;
  const db = getDB() as any;

  beforeEach(() => {
    service = new TenantService();
    vi.clearAllMocks();
  });

  it('creates tenant when valid and unique', async () => {
    db.collection.mockReturnValueOnce({ findOne: vi.fn().mockResolvedValue(null) }) // owner check
      .mockReturnValueOnce({ findOne: vi.fn().mockResolvedValue(null), insertOne: vi.fn().mockResolvedValue({ acknowledged: true }) }); // name check + insert

    const result = await service.createTenant('user-1', { name: 'Acme', settings: { allowPublicProjects: false, maxProjects: 5 } } as any);
    expect(result.name).toBe('Acme');
    expect(result.ownerId).toBe('user-1');
  });

  it('throws when user already has a tenant', async () => {
    const tenantsCol = {
      // owner check: returns existing; name check: also returns existing if reached
      findOne: vi.fn().mockImplementation((query: any) => {
        if (query && 'ownerId' in query) return Promise.resolve({ _id: 't1' });
        if (query && 'name' in query) return Promise.resolve({ _id: 't2' });
        return Promise.resolve(null);
      }),
      insertOne: vi.fn(),
      find: vi.fn(() => ({ toArray: vi.fn() })),
      updateOne: vi.fn(),
      deleteOne: vi.fn(),
      findOneAndUpdate: vi.fn()
    } as any;

    db.collection.mockImplementation((name: string) => {
      if (name === 'tenants') return tenantsCol;
      return { findOne: vi.fn(), find: vi.fn(() => ({ toArray: vi.fn() })), insertOne: vi.fn(), updateOne: vi.fn(), deleteOne: vi.fn(), findOneAndUpdate: vi.fn() } as any;
    });

    // Recreate service and inject mocked collection explicitly
    service = new TenantService();
    (service as any).collection = tenantsCol;

    await expect(service.createTenant('user-1', { name: 'Acme' } as any)).rejects.toThrow('User already has a tenant');
  });
});


