import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectsService } from '../../src/features/projects/projects.service.js';
import { getDB } from '../../src/config/db.js';

describe('ProjectsService', () => {
  let service: ProjectsService;
  const db = getDB() as any;

  beforeEach(() => {
    service = new ProjectsService();
    vi.clearAllMocks();
  });

  it('findAll returns projects for user membership', async () => {
    const toArray = vi.fn().mockResolvedValue([{ _id: 'p1', members: [{ userId: 'u1', role: 'OWNER' }] }]);
    const projectsCol = { find: vi.fn().mockReturnValue({ toArray }) } as any;
    db.collection.mockImplementation((name: string) => {
      if (name === 'projects') return projectsCol;
      return { findOne: vi.fn(), find: vi.fn(() => ({ toArray: vi.fn() })), insertOne: vi.fn(), updateOne: vi.fn(), deleteOne: vi.fn(), findOneAndUpdate: vi.fn() } as any;
    });

    // Recreate service after setting mocks so it captures the latest collection
    service = new ProjectsService();
    const projects = await service.findAll('u1');
    expect(projects.length).toBe(1);
  });
});


