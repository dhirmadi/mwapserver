# 🚀 MWAP Feature Development Guide

## 🎯 Overview

This comprehensive guide covers the complete process of developing new features in MWAP, from planning and architecture to implementation and deployment. It consolidates best practices, patterns, and examples from successful MWAP features.

## 🏗️ Feature Architecture Pattern

### **Directory Structure**
Every MWAP feature follows a consistent structure that promotes maintainability and scalability:

```
src/features/{feature-name}/
├── {feature}.controller.ts    # HTTP request handlers
├── {feature}.service.ts       # Business logic and data operations
├── {feature}.routes.ts        # Express route definitions
├── {feature}.model.ts         # MongoDB/Mongoose model
├── {feature}.validation.ts    # Zod validation schemas
├── {feature}.types.ts         # TypeScript type definitions
└── __tests__/                 # Feature-specific tests
    ├── {feature}.controller.test.ts
    ├── {feature}.service.test.ts
    └── {feature}.integration.test.ts
```

### **Implementation Layers**
```typescript
// Layer 1: Routes (HTTP Interface)
Router → Middleware → Controller

// Layer 2: Business Logic
Controller → Service → Model

// Layer 3: Data Persistence
Service → MongoDB → Response
```

## 📋 Feature Development Process

### **Phase 1: Planning & Design**

#### **1.1 Feature Specification**
```markdown
# Feature: [Feature Name]

## Overview
Brief description of the feature and its purpose.

## Requirements
- Functional requirements
- Non-functional requirements
- Security requirements
- Performance requirements

## User Stories
- As a [user type], I want [functionality] so that [benefit]

## API Endpoints
- GET /api/v1/features
- POST /api/v1/features
- GET /api/v1/features/:id
- PUT /api/v1/features/:id
- DELETE /api/v1/features/:id

## Data Model
- Field definitions
- Relationships
- Constraints
- Indexes
```

#### **1.2 Security Analysis**
```typescript
// Security considerations checklist
interface SecurityAnalysis {
  authentication: 'required' | 'optional' | 'none';
  authorization: {
    superadmin?: boolean;
    tenantOwner?: boolean;
    projectMember?: boolean;
    customRoles?: string[];
  };
  dataValidation: {
    inputSanitization: boolean;
    outputSanitization: boolean;
    sqlInjectionPrevention: boolean;
  };
  rateLimit: {
    enabled: boolean;
    requestsPerMinute: number;
  };
}
```

### **Phase 2: Implementation**

#### **2.1 Data Model Definition**
```typescript
// src/features/projects/project.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description?: string;
  tenantId: mongoose.Types.ObjectId;
  projectTypeId: mongoose.Types.ObjectId;
  status: 'active' | 'archived' | 'draft';
  members: Array<{
    userId: string;
    role: 'OWNER' | 'DEPUTY' | 'MEMBER';
    joinedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  projectTypeId: {
    type: Schema.Types.ObjectId,
    ref: 'ProjectType',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'draft'],
    default: 'active',
    index: true
  },
  members: [{
    userId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['OWNER', 'DEPUTY', 'MEMBER'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ProjectSchema.index({ tenantId: 1, status: 1 });
ProjectSchema.index({ 'members.userId': 1 });
ProjectSchema.index({ name: 'text', description: 'text' });

// Virtual for member count
ProjectSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
```

#### **2.2 Validation Schemas**
```typescript
// src/features/projects/project.validation.ts
import { z } from 'zod';

// Base project schema
export const projectSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  projectTypeId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid project type ID'),
  status: z.enum(['active', 'archived', 'draft']).default('active')
});

// Create project request schema
export const createProjectSchema = projectSchema.omit({
  status: true // Status is set automatically
});

// Update project request schema
export const updateProjectSchema = projectSchema.partial();

// Project member schema
export const projectMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['OWNER', 'DEPUTY', 'MEMBER'])
});

// Add member request schema
export const addMemberSchema = projectMemberSchema;

// Update member role schema
export const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'DEPUTY', 'MEMBER'])
});

// Query parameters schema
export const projectQuerySchema = z.object({
  status: z.enum(['active', 'archived', 'draft']).optional(),
  projectTypeId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

// Error codes
export const ProjectErrorCodes = {
  NOT_FOUND: 'project/not-found',
  NAME_EXISTS: 'project/name-exists',
  INVALID_PROJECT_TYPE: 'project/invalid-project-type',
  MEMBER_NOT_FOUND: 'project/member-not-found',
  MEMBER_EXISTS: 'project/member-exists',
  CANNOT_REMOVE_OWNER: 'project/cannot-remove-owner',
  INSUFFICIENT_PERMISSIONS: 'project/insufficient-permissions'
} as const;

// Types
export type Project = z.infer<typeof projectSchema>;
export type CreateProjectRequest = z.infer<typeof createProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectSchema>;
export type ProjectMember = z.infer<typeof projectMemberSchema>;
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
```

#### **2.3 Service Layer Implementation**
```typescript
// src/features/projects/project.service.ts
import { Project, IProject } from './project.model.js';
import { ProjectType } from '../project-types/project-type.model.js';
import { AppError } from '../../utils/AppError.js';
import { ProjectErrorCodes } from './project.validation.js';
import type { 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectQuery,
  ProjectMember 
} from './project.validation.js';

export class ProjectService {
  /**
   * Create a new project
   */
  async createProject(
    tenantId: string, 
    userId: string, 
    data: CreateProjectRequest
  ): Promise<IProject> {
    // Validate project type exists
    const projectType = await ProjectType.findById(data.projectTypeId);
    if (!projectType) {
      throw new AppError(
        'Invalid project type',
        400,
        ProjectErrorCodes.INVALID_PROJECT_TYPE
      );
    }

    // Check for duplicate name within tenant
    const existingProject = await Project.findOne({
      tenantId,
      name: data.name,
      status: { $ne: 'archived' }
    });

    if (existingProject) {
      throw new AppError(
        'Project name already exists',
        409,
        ProjectErrorCodes.NAME_EXISTS
      );
    }

    // Create project with owner as first member
    const project = new Project({
      ...data,
      tenantId,
      members: [{
        userId,
        role: 'OWNER',
        joinedAt: new Date()
      }]
    });

    await project.save();
    await project.populate(['projectTypeId']);
    
    return project;
  }

  /**
   * Get projects for a tenant with filtering and pagination
   */
  async getProjects(
    tenantId: string, 
    query: ProjectQuery
  ): Promise<{
    projects: IProject[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const filter: any = { tenantId };

    // Apply filters
    if (query.status) {
      filter.status = query.status;
    }

    if (query.projectTypeId) {
      filter.projectTypeId = query.projectTypeId;
    }

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;
    
    // Execute queries in parallel
    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('projectTypeId')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      Project.countDocuments(filter)
    ]);

    return {
      projects: projects as IProject[],
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit)
      }
    };
  }

  /**
   * Get project by ID with access control
   */
  async getProjectById(
    projectId: string, 
    userId: string, 
    tenantId?: string
  ): Promise<IProject> {
    const filter: any = { _id: projectId };
    
    // Add tenant filter if provided (for tenant owners)
    if (tenantId) {
      filter.tenantId = tenantId;
    } else {
      // For project members, check if user has access
      filter['members.userId'] = userId;
    }

    const project = await Project.findOne(filter)
      .populate('projectTypeId')
      .lean();

    if (!project) {
      throw new AppError(
        'Project not found',
        404,
        ProjectErrorCodes.NOT_FOUND
      );
    }

    return project as IProject;
  }

  /**
   * Update project
   */
  async updateProject(
    projectId: string,
    userId: string,
    data: UpdateProjectRequest,
    tenantId?: string
  ): Promise<IProject> {
    const project = await this.getProjectById(projectId, userId, tenantId);

    // Check if user has permission to update
    const member = project.members.find(m => m.userId === userId);
    if (!tenantId && (!member || !['OWNER', 'DEPUTY'].includes(member.role))) {
      throw new AppError(
        'Insufficient permissions',
        403,
        ProjectErrorCodes.INSUFFICIENT_PERMISSIONS
      );
    }

    // Validate project type if being updated
    if (data.projectTypeId) {
      const projectType = await ProjectType.findById(data.projectTypeId);
      if (!projectType) {
        throw new AppError(
          'Invalid project type',
          400,
          ProjectErrorCodes.INVALID_PROJECT_TYPE
        );
      }
    }

    // Check for duplicate name if name is being updated
    if (data.name && data.name !== project.name) {
      const existingProject = await Project.findOne({
        tenantId: project.tenantId,
        name: data.name,
        status: { $ne: 'archived' },
        _id: { $ne: projectId }
      });

      if (existingProject) {
        throw new AppError(
          'Project name already exists',
          409,
          ProjectErrorCodes.NAME_EXISTS
        );
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('projectTypeId');

    if (!updatedProject) {
      throw new AppError(
        'Project not found',
        404,
        ProjectErrorCodes.NOT_FOUND
      );
    }

    return updatedProject;
  }

  /**
   * Archive project (soft delete)
   */
  async archiveProject(
    projectId: string,
    userId: string,
    tenantId?: string
  ): Promise<void> {
    await this.updateProject(
      projectId,
      userId,
      { status: 'archived' },
      tenantId
    );
  }

  /**
   * Add member to project
   */
  async addMember(
    projectId: string,
    userId: string,
    memberData: ProjectMember,
    tenantId?: string
  ): Promise<IProject> {
    const project = await this.getProjectById(projectId, userId, tenantId);

    // Check permissions
    const currentMember = project.members.find(m => m.userId === userId);
    if (!tenantId && (!currentMember || !['OWNER', 'DEPUTY'].includes(currentMember.role))) {
      throw new AppError(
        'Insufficient permissions',
        403,
        ProjectErrorCodes.INSUFFICIENT_PERMISSIONS
      );
    }

    // Check if member already exists
    const existingMember = project.members.find(m => m.userId === memberData.userId);
    if (existingMember) {
      throw new AppError(
        'Member already exists in project',
        409,
        ProjectErrorCodes.MEMBER_EXISTS
      );
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        $push: {
          members: {
            ...memberData,
            joinedAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    ).populate('projectTypeId');

    return updatedProject!;
  }

  /**
   * Remove member from project
   */
  async removeMember(
    projectId: string,
    userId: string,
    memberUserId: string,
    tenantId?: string
  ): Promise<IProject> {
    const project = await this.getProjectById(projectId, userId, tenantId);

    // Find member to remove
    const memberToRemove = project.members.find(m => m.userId === memberUserId);
    if (!memberToRemove) {
      throw new AppError(
        'Member not found',
        404,
        ProjectErrorCodes.MEMBER_NOT_FOUND
      );
    }

    // Cannot remove project owner
    if (memberToRemove.role === 'OWNER') {
      throw new AppError(
        'Cannot remove project owner',
        400,
        ProjectErrorCodes.CANNOT_REMOVE_OWNER
      );
    }

    // Check permissions
    const currentMember = project.members.find(m => m.userId === userId);
    if (!tenantId && (!currentMember || !['OWNER', 'DEPUTY'].includes(currentMember.role))) {
      throw new AppError(
        'Insufficient permissions',
        403,
        ProjectErrorCodes.INSUFFICIENT_PERMISSIONS
      );
    }

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        $pull: {
          members: { userId: memberUserId }
        }
      },
      { new: true, runValidators: true }
    ).populate('projectTypeId');

    return updatedProject!;
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    projectId: string,
    userId: string,
    memberUserId: string,
    newRole: 'OWNER' | 'DEPUTY' | 'MEMBER',
    tenantId?: string
  ): Promise<IProject> {
    const project = await this.getProjectById(projectId, userId, tenantId);

    // Find member to update
    const memberToUpdate = project.members.find(m => m.userId === memberUserId);
    if (!memberToUpdate) {
      throw new AppError(
        'Member not found',
        404,
        ProjectErrorCodes.MEMBER_NOT_FOUND
      );
    }

    // Check permissions
    const currentMember = project.members.find(m => m.userId === userId);
    if (!tenantId && (!currentMember || currentMember.role !== 'OWNER')) {
      throw new AppError(
        'Only project owner can change member roles',
        403,
        ProjectErrorCodes.INSUFFICIENT_PERMISSIONS
      );
    }

    const updatedProject = await Project.findOneAndUpdate(
      { _id: projectId, 'members.userId': memberUserId },
      {
        $set: {
          'members.$.role': newRole
        }
      },
      { new: true, runValidators: true }
    ).populate('projectTypeId');

    return updatedProject!;
  }
}

export const projectService = new ProjectService();
```

#### **2.4 Controller Implementation**
```typescript
// src/features/projects/project.controller.ts
import { Request, Response, NextFunction } from 'express';
import { projectService } from './project.service.js';
import { 
  createProjectSchema, 
  updateProjectSchema, 
  projectQuerySchema,
  addMemberSchema,
  updateMemberRoleSchema 
} from './project.validation.js';
import { validateRequest } from '../../middleware/validation.js';
import { SuccessResponse } from '../../utils/SuccessResponse.js';

export class ProjectController {
  /**
   * Create new project
   */
  createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = validateRequest(createProjectSchema, req.body);
      const { tenantId, userId } = req.user!;

      const project = await projectService.createProject(
        tenantId,
        userId,
        validatedData
      );

      res.status(201).json(
        new SuccessResponse(project, 'Project created successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get projects for current tenant
   */
  getProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = validateRequest(projectQuerySchema, req.query);
      const { tenantId } = req.user!;

      const result = await projectService.getProjects(tenantId, query);

      res.json(
        new SuccessResponse(
          result.projects,
          'Projects retrieved successfully',
          { pagination: result.pagination }
        )
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get project by ID
   */
  getProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { userId, tenantId, isTenantOwner } = req.user!;

      const project = await projectService.getProjectById(
        id,
        userId,
        isTenantOwner ? tenantId : undefined
      );

      res.json(
        new SuccessResponse(project, 'Project retrieved successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update project
   */
  updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const validatedData = validateRequest(updateProjectSchema, req.body);
      const { userId, tenantId, isTenantOwner } = req.user!;

      const project = await projectService.updateProject(
        id,
        userId,
        validatedData,
        isTenantOwner ? tenantId : undefined
      );

      res.json(
        new SuccessResponse(project, 'Project updated successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Archive project
   */
  archiveProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { userId, tenantId, isTenantOwner } = req.user!;

      await projectService.archiveProject(
        id,
        userId,
        isTenantOwner ? tenantId : undefined
      );

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add member to project
   */
  addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const memberData = validateRequest(addMemberSchema, req.body);
      const { userId, tenantId, isTenantOwner } = req.user!;

      const project = await projectService.addMember(
        id,
        userId,
        memberData,
        isTenantOwner ? tenantId : undefined
      );

      res.json(
        new SuccessResponse(project, 'Member added successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove member from project
   */
  removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, memberId } = req.params;
      const { userId, tenantId, isTenantOwner } = req.user!;

      const project = await projectService.removeMember(
        id,
        userId,
        memberId,
        isTenantOwner ? tenantId : undefined
      );

      res.json(
        new SuccessResponse(project, 'Member removed successfully')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update member role
   */
  updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, memberId } = req.params;
      const { role } = validateRequest(updateMemberRoleSchema, req.body);
      const { userId, tenantId, isTenantOwner } = req.user!;

      const project = await projectService.updateMemberRole(
        id,
        userId,
        memberId,
        role,
        isTenantOwner ? tenantId : undefined
      );

      res.json(
        new SuccessResponse(project, 'Member role updated successfully')
      );
    } catch (error) {
      next(error);
    }
  };
}

export const projectController = new ProjectController();
```

#### **2.5 Routes Definition**
```typescript
// src/features/projects/project.routes.ts
import { Router } from 'express';
import { projectController } from './project.controller.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { requireTenantOwnerOrProjectMember } from '../../middleware/authorization.js';
import { rateLimit } from '../../middleware/rateLimit.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT());

// Apply rate limiting
router.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Project CRUD operations
router.post('/', 
  requireTenantOwnerOrProjectMember(),
  projectController.createProject
);

router.get('/', 
  requireTenantOwnerOrProjectMember(),
  projectController.getProjects
);

router.get('/:id', 
  requireTenantOwnerOrProjectMember(),
  projectController.getProject
);

router.put('/:id', 
  requireTenantOwnerOrProjectMember(),
  projectController.updateProject
);

router.delete('/:id', 
  requireTenantOwnerOrProjectMember(),
  projectController.archiveProject
);

// Member management
router.post('/:id/members', 
  requireTenantOwnerOrProjectMember(),
  projectController.addMember
);

router.delete('/:id/members/:memberId', 
  requireTenantOwnerOrProjectMember(),
  projectController.removeMember
);

router.patch('/:id/members/:memberId/role', 
  requireTenantOwnerOrProjectMember(),
  projectController.updateMemberRole
);

export default router;
```

### **Phase 3: Testing**

#### **3.1 Unit Tests**
```typescript
// src/features/projects/__tests__/project.service.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProjectService } from '../project.service.js';
import { Project } from '../project.model.js';
import { ProjectType } from '../../project-types/project-type.model.js';
import { AppError } from '../../../utils/AppError.js';

// Mock dependencies
vi.mock('../project.model.js');
vi.mock('../../project-types/project-type.model.js');

describe('ProjectService', () => {
  let projectService: ProjectService;
  
  beforeEach(() => {
    projectService = new ProjectService();
    vi.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      // Arrange
      const tenantId = '64a7b8c9d1e2f3a4b5c6d7e8';
      const userId = 'auth0|user123';
      const projectData = {
        name: 'Test Project',
        description: 'Test description',
        projectTypeId: '64a7b8c9d1e2f3a4b5c6d7e9'
      };

      const mockProjectType = { _id: projectData.projectTypeId, name: 'Web App' };
      const mockProject = {
        ...projectData,
        tenantId,
        members: [{ userId, role: 'OWNER', joinedAt: expect.any(Date) }],
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockReturnThis()
      };

      vi.mocked(ProjectType.findById).mockResolvedValue(mockProjectType);
      vi.mocked(Project.findOne).mockResolvedValue(null);
      vi.mocked(Project).mockImplementation(() => mockProject as any);

      // Act
      const result = await projectService.createProject(tenantId, userId, projectData);

      // Assert
      expect(ProjectType.findById).toHaveBeenCalledWith(projectData.projectTypeId);
      expect(Project.findOne).toHaveBeenCalledWith({
        tenantId,
        name: projectData.name,
        status: { $ne: 'archived' }
      });
      expect(mockProject.save).toHaveBeenCalled();
      expect(mockProject.populate).toHaveBeenCalledWith(['projectTypeId']);
      expect(result).toBe(mockProject);
    });

    it('should throw error if project type does not exist', async () => {
      // Arrange
      const tenantId = '64a7b8c9d1e2f3a4b5c6d7e8';
      const userId = 'auth0|user123';
      const projectData = {
        name: 'Test Project',
        projectTypeId: '64a7b8c9d1e2f3a4b5c6d7e9'
      };

      vi.mocked(ProjectType.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        projectService.createProject(tenantId, userId, projectData)
      ).rejects.toThrow(AppError);
    });

    it('should throw error if project name already exists', async () => {
      // Arrange
      const tenantId = '64a7b8c9d1e2f3a4b5c6d7e8';
      const userId = 'auth0|user123';
      const projectData = {
        name: 'Test Project',
        projectTypeId: '64a7b8c9d1e2f3a4b5c6d7e9'
      };

      const mockProjectType = { _id: projectData.projectTypeId, name: 'Web App' };
      const mockExistingProject = { _id: 'existing-id', name: projectData.name };

      vi.mocked(ProjectType.findById).mockResolvedValue(mockProjectType);
      vi.mocked(Project.findOne).mockResolvedValue(mockExistingProject as any);

      // Act & Assert
      await expect(
        projectService.createProject(tenantId, userId, projectData)
      ).rejects.toThrow(AppError);
    });
  });

  describe('getProjects', () => {
    it('should return paginated projects', async () => {
      // Arrange
      const tenantId = '64a7b8c9d1e2f3a4b5c6d7e8';
      const query = { page: 1, limit: 10 };
      
      const mockProjects = [
        { _id: '1', name: 'Project 1' },
        { _id: '2', name: 'Project 2' }
      ];

      const mockFind = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProjects)
      };

      vi.mocked(Project.find).mockReturnValue(mockFind as any);
      vi.mocked(Project.countDocuments).mockResolvedValue(2);

      // Act
      const result = await projectService.getProjects(tenantId, query);

      // Assert
      expect(result.projects).toEqual(mockProjects);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1
      });
    });
  });
});
```

#### **3.2 Integration Tests**
```typescript
// src/features/projects/__tests__/project.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../app.js';
import { connectDB, disconnectDB } from '../../../config/database.js';
import { Project } from '../project.model.js';
import { ProjectType } from '../../project-types/project-type.model.js';
import { Tenant } from '../../tenants/tenant.model.js';
import { generateTestJWT } from '../../../utils/testHelpers.js';

describe('Projects API Integration', () => {
  let authToken: string;
  let tenantId: string;
  let projectTypeId: string;
  let userId: string;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    // Clean up database
    await Project.deleteMany({});
    await ProjectType.deleteMany({});
    await Tenant.deleteMany({});

    // Create test data
    userId = 'auth0|test-user';
    authToken = generateTestJWT({ sub: userId });

    const tenant = await Tenant.create({
      name: 'Test Tenant',
      ownerId: userId
    });
    tenantId = tenant._id.toString();

    const projectType = await ProjectType.create({
      name: 'Web Application',
      description: 'Web app project type'
    });
    projectTypeId = projectType._id.toString();
  });

  describe('POST /api/v1/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test project description',
        projectTypeId
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(projectData.name);
      expect(response.body.data.members).toHaveLength(1);
      expect(response.body.data.members[0].userId).toBe(userId);
      expect(response.body.data.members[0].role).toBe('OWNER');
    });

    it('should return 400 for invalid project data', async () => {
      const invalidData = {
        name: '', // Empty name
        projectTypeId: 'invalid-id'
      };

      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without authentication', async () => {
      const projectData = {
        name: 'Test Project',
        projectTypeId
      };

      await request(app)
        .post('/api/v1/projects')
        .send(projectData)
        .expect(401);
    });
  });

  describe('GET /api/v1/projects', () => {
    beforeEach(async () => {
      // Create test projects
      await Project.create([
        {
          name: 'Project 1',
          tenantId,
          projectTypeId,
          members: [{ userId, role: 'OWNER' }]
        },
        {
          name: 'Project 2',
          tenantId,
          projectTypeId,
          members: [{ userId, role: 'OWNER' }]
        }
      ]);
    });

    it('should return paginated projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        pages: 1
      });
    });

    it('should filter projects by status', async () => {
      // Archive one project
      await Project.findOneAndUpdate(
        { name: 'Project 1' },
        { status: 'archived' }
      );

      const response = await request(app)
        .get('/api/v1/projects?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Project 2');
    });
  });
});
```

## 🔧 Development Tools & Utilities

### **Code Generation Templates**
```bash
# Feature generator script
#!/bin/bash
FEATURE_NAME=$1

if [ -z "$FEATURE_NAME" ]; then
  echo "Usage: ./generate-feature.sh <feature-name>"
  exit 1
fi

# Create feature directory
mkdir -p "src/features/$FEATURE_NAME"
mkdir -p "src/features/$FEATURE_NAME/__tests__"

# Generate files from templates
cp templates/feature.model.template.ts "src/features/$FEATURE_NAME/$FEATURE_NAME.model.ts"
cp templates/feature.validation.template.ts "src/features/$FEATURE_NAME/$FEATURE_NAME.validation.ts"
cp templates/feature.service.template.ts "src/features/$FEATURE_NAME/$FEATURE_NAME.service.ts"
cp templates/feature.controller.template.ts "src/features/$FEATURE_NAME/$FEATURE_NAME.controller.ts"
cp templates/feature.routes.template.ts "src/features/$FEATURE_NAME/$FEATURE_NAME.routes.ts"

# Replace placeholders
sed -i "s/{{FEATURE_NAME}}/$FEATURE_NAME/g" "src/features/$FEATURE_NAME"/*

echo "Feature $FEATURE_NAME generated successfully!"
```

### **Development Checklist**
```markdown
## Feature Development Checklist

### Planning
- [ ] Feature specification documented
- [ ] Security analysis completed
- [ ] API endpoints defined
- [ ] Data model designed
- [ ] Dependencies identified

### Implementation
- [ ] MongoDB model created with proper indexes
- [ ] Zod validation schemas defined
- [ ] Service layer implemented with error handling
- [ ] Controller layer with proper HTTP responses
- [ ] Routes configured with authentication/authorization
- [ ] TypeScript types exported

### Testing
- [ ] Unit tests for service layer (>80% coverage)
- [ ] Integration tests for API endpoints
- [ ] Error scenarios tested
- [ ] Authentication/authorization tested
- [ ] Performance tested with realistic data

### Documentation
- [ ] API endpoints documented
- [ ] Code comments added
- [ ] README updated
- [ ] Migration guide created (if needed)

### Security
- [ ] Input validation implemented
- [ ] Authorization checks in place
- [ ] Rate limiting configured
- [ ] Sensitive data handling reviewed
- [ ] Security testing completed

### Deployment
- [ ] Environment variables documented
- [ ] Database migrations created
- [ ] Monitoring/logging configured
- [ ] Performance benchmarks established
```

## 📚 Related Documentation

- [🔌 API Documentation](../04-Backend/API-v3.md) - Complete API reference
- [🏗️ Architecture Reference](../02-Architecture/system-design.md) - System architecture
- [🔒 Security Guidelines](../07-Standards/coding-standards.md) - Security best practices
- [🧪 Testing Guide](./how-to-test.md) - Testing strategies and examples

---

*This guide provides a comprehensive framework for developing high-quality, secure, and maintainable features in the MWAP platform. Follow these patterns to ensure consistency and reliability across all features.*