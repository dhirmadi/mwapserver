import { Collection, ObjectId } from 'mongodb';
import { ApiError } from '../../utils/errors';
import { logAudit } from '../../utils/logger';
import { ProjectTypeErrorCodes, CreateProjectTypeRequest, UpdateProjectTypeRequest, ProjectType } from '../../schemas/projectType.schema';

export class ProjectTypesService {
  constructor(private projectTypesCollection: Collection) {}

  async findAll(): Promise<ProjectType[]> {
    return this.projectTypesCollection.find().toArray();
  }

  async findById(id: string): Promise<ProjectType> {
    const projectType = await this.projectTypesCollection.findOne({ _id: new ObjectId(id) });
    if (!projectType) {
      throw new ApiError('Project type not found', 404, ProjectTypeErrorCodes.NOT_FOUND);
    }
    return projectType;
  }

  async create(data: CreateProjectTypeRequest, userId: string): Promise<ProjectType> {
    // Check for existing name
    const existing = await this.projectTypesCollection.findOne({ name: data.name });
    if (existing) {
      throw new ApiError('Project type name already exists', 409, ProjectTypeErrorCodes.NAME_EXISTS);
    }

    // Validate config schema structure
    try {
      // Basic validation that it's a valid JSON object
      if (typeof data.configSchema !== 'object' || Array.isArray(data.configSchema)) {
        throw new Error('Invalid schema format');
      }
    } catch (error) {
      throw new ApiError('Invalid configuration schema', 400, ProjectTypeErrorCodes.INVALID_CONFIG_SCHEMA);
    }

    const now = new Date();
    const projectType = {
      ...data,
      createdAt: now,
      updatedAt: now,
      createdBy: userId
    };

    const result = await this.projectTypesCollection.insertOne(projectType);
    
    logAudit('project-type.create', userId, result.insertedId.toString(), {
      name: data.name
    });

    return { ...projectType, _id: result.insertedId };
  }

  async update(id: string, data: UpdateProjectTypeRequest, userId: string): Promise<ProjectType> {
    const projectType = await this.findById(id);

    // Check name uniqueness if name is being updated
    if (data.name && data.name !== projectType.name) {
      const existing = await this.projectTypesCollection.findOne({ name: data.name });
      if (existing) {
        throw new ApiError('Project type name already exists', 409, ProjectTypeErrorCodes.NAME_EXISTS);
      }
    }

    const updates = {
      ...data,
      updatedAt: new Date()
    };

    const result = await this.projectTypesCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new ApiError('Project type not found', 404, ProjectTypeErrorCodes.NOT_FOUND);
    }

    logAudit('project-type.update', userId, id, {
      updates: data
    });

    return result;
  }

  async delete(id: string, userId: string): Promise<void> {
    // Check if type exists
    await this.findById(id);

    // TODO: Check if type is in use by any projects
    // This will be implemented when project collection is available
    // const projectsUsingType = await projectsCollection.countDocuments({ projectTypeId: id });
    // if (projectsUsingType > 0) {
    //   throw new ApiError('Project type is in use by existing projects', 409, ProjectTypeErrorCodes.IN_USE);
    // }

    const result = await this.projectTypesCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      throw new ApiError('Project type not found', 404, ProjectTypeErrorCodes.NOT_FOUND);
    }

    logAudit('project-type.delete', userId, id);
  }
}