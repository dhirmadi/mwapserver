import { Collection, ObjectId } from 'mongodb';
import { getDB } from '../../config/db.js';
import { ApiError } from '../../utils/errors.js';
import { logAudit } from '../../utils/logger.js';
import { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectMemberOperation,
  UpdateProjectMemberRequest,
  ProjectErrorCodes 
} from '../../schemas/project.schema.js';

export class ProjectsService {
  private collection: Collection<Project>;

  constructor() {
    this.collection = getDB().collection<Project>('projects');
  }

  async findAll(userId: string): Promise<Project[]> {
    // Find all projects where the user is a member
    return this.collection.find({
      'members.userId': userId
    }).toArray();
  }

  async findById(id: string, userId: string): Promise<Project> {
    try {
      const projectId = new ObjectId(id);
      
      // Find project and verify user is a member
      const project = await this.collection.findOne({
        _id: projectId,
        'members.userId': userId
      });
      
      if (!project) {
        throw new ApiError('Project not found or user not a member', 404, ProjectErrorCodes.NOT_FOUND);
      }
      
      return project;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Invalid project ID', 400, ProjectErrorCodes.INVALID_INPUT);
    }
  }

  async create(data: CreateProjectRequest, userId: string): Promise<Project> {
    try {
      const tenantId = new ObjectId(data.tenantId.toString());
      const projectTypeId = new ObjectId(data.projectTypeId.toString());
      const cloudIntegrationId = new ObjectId(data.cloudIntegrationId.toString());
      
      // Verify tenant exists
      const tenant = await getDB().collection('tenants').findOne({ _id: tenantId });
      if (!tenant) {
        throw new ApiError('Tenant not found', 404, ProjectErrorCodes.TENANT_NOT_FOUND);
      }
      
      // Verify user is tenant owner
      if (tenant.ownerId !== userId) {
        throw new ApiError('Only tenant owners can create projects', 403, ProjectErrorCodes.UNAUTHORIZED);
      }
      
      // Verify project type exists
      const projectType = await getDB().collection('projectTypes').findOne({ _id: projectTypeId });
      if (!projectType) {
        throw new ApiError('Project type not found', 404, ProjectErrorCodes.PROJECT_TYPE_NOT_FOUND);
      }
      
      // Verify cloud integration exists and belongs to the tenant
      const cloudIntegration = await getDB().collection('cloudProviderIntegrations').findOne({
        _id: cloudIntegrationId.toString(),
        tenantId: tenantId.toString()
      });
      
      if (!cloudIntegration) {
        throw new ApiError('Cloud integration not found', 404, ProjectErrorCodes.CLOUD_INTEGRATION_NOT_FOUND);
      }
      
      // Ensure tenant owner is included as project OWNER
      const members = data.members || [];
      const ownerExists = members.some(member => member.userId === userId && member.role === 'OWNER');
      
      if (!ownerExists) {
        members.push({ userId, role: 'OWNER' });
      }
      
      const now = new Date();
      const project: Project = {
        _id: new ObjectId(),
        tenantId: tenantId.toString(),
        projectTypeId: projectTypeId.toString(),
        cloudIntegrationId: cloudIntegrationId.toString(),
        folderpath: data.folderpath,
        name: data.name,
        description: data.description,
        archived: data.archived || false,
        members,
        createdAt: now,
        updatedAt: now,
        createdBy: userId
      };
      
      await this.collection.insertOne(project);
      
      logAudit('project.create', userId, project._id.toString(), {
        tenantId: tenantId.toString(),
        projectTypeId: projectTypeId.toString(),
        cloudIntegrationId: cloudIntegrationId.toString()
      });
      
      return project;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to create project', 500, ProjectErrorCodes.INVALID_INPUT);
    }
  }

  async update(id: string, data: UpdateProjectRequest, userId: string): Promise<Project> {
    const project = await this.findById(id, userId);
    
    // Check if user has permission to update (OWNER or DEPUTY)
    const member = project.members.find(m => m.userId === userId);
    if (!member || (member.role !== 'OWNER' && member.role !== 'DEPUTY')) {
      throw new ApiError('Only project owners and deputies can update projects', 403, ProjectErrorCodes.UNAUTHORIZED);
    }
    
    const updates = {
      ...data,
      updatedAt: new Date()
    };
    
    const result = await this.collection.findOneAndUpdate(
      { _id: project._id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      throw new ApiError('Failed to update project', 500, ProjectErrorCodes.NOT_FOUND);
    }
    
    logAudit('project.update', userId, id, {
      updates: Object.keys(data)
    });
    
    return result;
  }

  async delete(id: string, userId: string, isSuperAdmin: boolean = false): Promise<void> {
    const project = await this.findById(id, userId);
    
    // Check if user has permission to delete (OWNER or SUPERADMIN)
    if (!isSuperAdmin) {
      const member = project.members.find(m => m.userId === userId);
      if (!member || member.role !== 'OWNER') {
        throw new ApiError('Only project owners can delete projects', 403, ProjectErrorCodes.UNAUTHORIZED);
      }
    }
    
    await this.collection.deleteOne({ _id: project._id });
    
    logAudit('project.delete', userId, id, {
      tenantId: project.tenantId.toString(),
      isSuperAdmin
    });
  }

  // Project members management
  async getMembers(projectId: string, userId: string): Promise<Project['members']> {
    const project = await this.findById(projectId, userId);
    return project.members;
  }

  async addMember(projectId: string, memberData: ProjectMemberOperation, userId: string): Promise<void> {
    const project = await this.findById(projectId, userId);
    
    // Check if user has permission to add members (OWNER or DEPUTY)
    const member = project.members.find(m => m.userId === userId);
    if (!member || (member.role !== 'OWNER' && member.role !== 'DEPUTY')) {
      throw new ApiError('Only project owners and deputies can add members', 403, ProjectErrorCodes.UNAUTHORIZED);
    }
    
    // Check if member already exists
    const memberExists = project.members.some(m => m.userId === memberData.userId);
    if (memberExists) {
      throw new ApiError('Member already exists in project', 409, ProjectErrorCodes.MEMBER_ALREADY_EXISTS);
    }
    
    // Check if max members limit reached
    if (project.members.length >= 10) {
      throw new ApiError('Maximum number of members reached (10)', 400, ProjectErrorCodes.MAX_MEMBERS_REACHED);
    }
    
    // Add new member
    await this.collection.updateOne(
      { _id: project._id },
      { 
        $push: { members: memberData },
        $set: { updatedAt: new Date() }
      }
    );
    
    logAudit('project.member.add', userId, projectId, {
      memberId: memberData.userId,
      role: memberData.role
    });
  }

  async updateMember(projectId: string, memberId: string, data: UpdateProjectMemberRequest, userId: string): Promise<void> {
    const project = await this.findById(projectId, userId);
    
    // Check if user has permission to update members (OWNER only)
    const currentUser = project.members.find(m => m.userId === userId);
    if (!currentUser || currentUser.role !== 'OWNER') {
      throw new ApiError('Only project owners can update member roles', 403, ProjectErrorCodes.UNAUTHORIZED);
    }
    
    // Find the member to update
    const memberIndex = project.members.findIndex(m => m.userId === memberId);
    if (memberIndex === -1) {
      throw new ApiError('Member not found in project', 404, ProjectErrorCodes.MEMBER_NOT_FOUND);
    }
    
    // Ensure at least one OWNER remains
    const isLastOwner = 
      project.members[memberIndex].role === 'OWNER' && 
      data.role !== 'OWNER' && 
      project.members.filter(m => m.role === 'OWNER').length === 1;
    
    if (isLastOwner) {
      throw new ApiError('Cannot remove the last owner from the project', 400, ProjectErrorCodes.OWNER_REQUIRED);
    }
    
    // Update member role
    const updatedMembers = [...project.members];
    updatedMembers[memberIndex] = {
      ...updatedMembers[memberIndex],
      role: data.role
    };
    
    await this.collection.updateOne(
      { _id: project._id },
      { 
        $set: { 
          members: updatedMembers,
          updatedAt: new Date()
        }
      }
    );
    
    logAudit('project.member.update', userId, projectId, {
      memberId,
      role: data.role
    });
  }

  async removeMember(projectId: string, memberId: string, userId: string): Promise<void> {
    const project = await this.findById(projectId, userId);
    
    // Check if user has permission to remove members (OWNER only)
    const currentUser = project.members.find(m => m.userId === userId);
    if (!currentUser || currentUser.role !== 'OWNER') {
      throw new ApiError('Only project owners can remove members', 403, ProjectErrorCodes.UNAUTHORIZED);
    }
    
    // Find the member to remove
    const member = project.members.find(m => m.userId === memberId);
    if (!member) {
      throw new ApiError('Member not found in project', 404, ProjectErrorCodes.MEMBER_NOT_FOUND);
    }
    
    // Prevent removing the last owner
    const isLastOwner = 
      member.role === 'OWNER' && 
      project.members.filter(m => m.role === 'OWNER').length === 1;
    
    if (isLastOwner) {
      throw new ApiError('Cannot remove the last owner from the project', 400, ProjectErrorCodes.OWNER_REQUIRED);
    }
    
    // Remove member
    await this.collection.updateOne(
      { _id: project._id },
      { 
        $pull: { members: { userId: memberId } },
        $set: { updatedAt: new Date() }
      }
    );
    
    logAudit('project.member.remove', userId, projectId, {
      memberId
    });
  }
}