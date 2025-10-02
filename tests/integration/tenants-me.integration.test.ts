import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { app, registerRoutes } from '../../src/app.js';
import { getDB } from '../../src/config/db.js';

// Mock JWT verification for protected endpoints
vi.mock('express-jwt', () => ({
  expressjwt: () => (req: any, _res: any, next: any) => {
    req.auth = {
      sub: 'auth0|user1',
      aud: 'test-aud',
      iss: 'https://test/',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    next();
  }
}));

describe('GET /api/v1/tenants/me', () => {
  beforeAll(async () => {
    await registerRoutes();
  });

  it('returns current user tenant (200)', async () => {
    const db = getDB();
    const tenants = db.collection('tenants');
    // Arrange mock
    (tenants.findOne as any).mockResolvedValue({
      _id: 'ten123',
      name: 'Acme Inc',
      ownerId: 'auth0|user1',
      settings: { allowPublicProjects: false, maxProjects: 10 },
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false
    });

    const res = await request(app)
      .get('/api/v1/tenants/me')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Acme Inc');
    expect(res.body.data.ownerId).toBe('auth0|user1');
  });

  it('returns 404 when user has no tenant', async () => {
    const db = getDB();
    const tenants = db.collection('tenants');
    (tenants.findOne as any).mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/v1/tenants/me')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toContain('tenant/not-found');
  });
});



