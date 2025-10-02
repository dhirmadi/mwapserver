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

describe('GET /api/v1/projects/:id/members/me', () => {
  beforeAll(async () => {
    await registerRoutes();
  });

  it('returns current user membership (200)', async () => {
    const db = getDB();
    const projects = db.collection('projects');
    (projects.findOne as any).mockResolvedValue({
      _id: 'proj123',
      tenantId: 'ten123',
      projectTypeId: 'pt1',
      cloudIntegrationId: 'ci1',
      folderpath: '/',
      name: 'Demo',
      members: [{ userId: 'auth0|user1', role: 'OWNER' }],
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false,
      createdBy: 'auth0|user1'
    });

    const res = await request(app)
      .get('/api/v1/projects/proj123/members/me')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe('auth0|user1');
    expect(res.body.data.role).toBe('OWNER');
  });

  it('returns 404 if not a member', async () => {
    const db = getDB();
    const projects = db.collection('projects');
    (projects.findOne as any).mockResolvedValueOnce({
      _id: 'proj123',
      tenantId: 'ten123',
      projectTypeId: 'pt1',
      cloudIntegrationId: 'ci1',
      folderpath: '/',
      name: 'Demo',
      members: [{ userId: 'someoneelse', role: 'MEMBER' }],
      createdAt: new Date(),
      updatedAt: new Date(),
      archived: false,
      createdBy: 'auth0|user1'
    });

    const res = await request(app)
      .get('/api/v1/projects/proj123/members/me')
      .expect(404);

    expect(res.body.success).toBe(false);
  });
});



