import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../../config/db';
import { ApiError } from '../../utils/errors';
import { logAudit } from '../../utils/logger';
import { z } from 'zod';
import { ProjectTypeErrorCodes, CreateProjectTypeRequest, UpdateProjectTypeRequest, ProjectType } from '../../schemas/projectType.schema';

export class ProjectTypesService {
  private collection: Collection<ProjectType>;

  constructor() {
    this.collection = getDB().collection<ProjectType>('projectTypes');
  }

  async findAll(): Promise<ProjectType[]> {
    return this.collection.find().toArray();
  }

  async findById(id: string): Promise<ProjectType> {
    const projectType = await this.collection.findOne({ _id: new ObjectId(id) });
    if (!projectType) {
      throw new ApiError('Project type not found', 404, ProjectTypeErrorCodes.NOT_FOUND);
    }
    return projectType;
  }

  async create(data: Omit<ProjectType, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>, userId: string): Promise<ProjectType> {
    // Check for existing name
    const existing = await this.collection.findOne({ name: data.name });
    if (existing) {
      throw new ApiError('Project type name already exists', 409, ProjectTypeErrorCodes.NAME_EXISTS);
    }

    // Validate config schema structure
   /* commented out for now
    if (!this.validateZodSchema(data.configSchema)) {
      throw new ApiError('Invalid Zod schema configuration', 400, ProjectTypeErrorCodes.INVALID_CONFIG_SCHEMA);
    }*/

    const now = new Date();
    const projectType: ProjectType = {
      _id: new ObjectId(),
      ...data,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      createdBy: userId
    };

    await this.collection.insertOne(projectType);
    
    logAudit('project-type.create', userId, projectType._id.toString(), {
      name: data.name
    });

    return projectType;
  }

  async update(id: string, data: UpdateProjectTypeRequest, userId: string): Promise<ProjectType> {
    const projectType = await this.findById(id);

    // Check name uniqueness if name is being updated
    if (data.name && data.name !== projectType.name) {
      const existing = await this.collection.findOne({ 
        _id: { $ne: projectType._id }, 
        name: data.name 
      });
      if (existing) {
        throw new ApiError('Project type name already exists', 409, ProjectTypeErrorCodes.NAME_EXISTS);
      }
    }

    const updates = {
      ...data,
      updatedAt: new Date()
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: projectType._id },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new ApiError('Failed to update project type', 500, ProjectTypeErrorCodes.NOT_FOUND);
    }

    logAudit('project-type.update', userId, id, {
      updates: data
    });

    return result;
  }

  async delete(id: string, userId: string): Promise<void> {
    const projectType = await this.findById(id);

    // Check if type is in use by any projects
    const projectsUsingType = await getDB().collection('projects').countDocuments({ projectTypeId: id });
    if (projectsUsingType > 0) {
      throw new ApiError('Project type is in use by existing projects', 409, ProjectTypeErrorCodes.IN_USE);
    }

    await this.collection.deleteOne({ _id: projectType._id });

    logAudit('project-type.delete', userId, id);
  }

  private validateZodSchema(schema: unknown): boolean {
    try {
      // 1. Basic structure check
      if (typeof schema !== 'object' || schema === null) {
        throw new Error('Schema must be an object');
      }

      // 2. Try to create a Zod schema from the definition
      const zodSchema = z.object(schema as any);
      
      // 3. Basic validation test
      zodSchema.safeParse({});  // If it can parse, it's a valid schema

      return true;
    } catch (error) {
      return false;
    }
  }

  private async isSuperAdmin(userId: string): Promise<boolean> {
    const superadmin = await getDB().collection('superadmins').findOne({ userId });
    return !!superadmin;
  }
}