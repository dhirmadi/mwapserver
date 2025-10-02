import { Request, Response } from 'express';
import { ProjectsService } from './projects.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { 
  createProjectSchema, 
  updateProjectSchema, 
  projectMemberOperationSchema,
  updateProjectMemberSchema,
  ProjectErrorCodes 
} from '../../schemas/project.schema.js';
import { getDB } from '../../config/db.js';

const projectsService = new ProjectsService();

// Helper function to check if user is a superadmin
async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const superadmin = await getDB().collection('superadmins').findOne({ userId });
    return !!superadmin;
  } catch (error) {
    return false;
  }
}

export async function getProjects(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const projects = await projectsService.findAll(user.sub);
  return jsonResponse(res, 200, projects);
}

export async function getProjectById(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { id } = req.params;
  const project = await projectsService.findById(id, user.sub);
  return jsonResponse(res, 200, project);
}

export async function createProject(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const data = validateWithSchema(createProjectSchema, req.body);
    const project = await projectsService.create({ ...data, archived: data.archived ?? false }, user.sub);
    return jsonResponse(res, 201, project);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, ProjectErrorCodes.INVALID_INPUT);
    }
    throw error;
  }
}

export async function updateProject(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { id } = req.params;
    const data = validateWithSchema(updateProjectSchema, req.body);
    const project = await projectsService.update(id, data, user.sub);
    return jsonResponse(res, 200, project);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, ProjectErrorCodes.INVALID_INPUT);
    }
    throw error;
  }
}

export async function deleteProject(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { id } = req.params;
  
  // Check if user is a superadmin
  const superAdmin = await isSuperAdmin(user.sub);
  
  await projectsService.delete(id, user.sub, superAdmin);
  return jsonResponse(res, 204);
}

// Project members endpoints
export async function getProjectMembers(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { id } = req.params;
  const members = await projectsService.getMembers(id, user.sub);
  return jsonResponse(res, 200, members);
}

export async function addProjectMember(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { id } = req.params;
    const data = validateWithSchema(projectMemberOperationSchema, req.body);
    await projectsService.addMember(id, data, user.sub);
    return jsonResponse(res, 204);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, ProjectErrorCodes.INVALID_INPUT);
    }
    throw error;
  }
}

export async function updateProjectMember(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const { id, userId } = req.params;
    const data = validateWithSchema(updateProjectMemberSchema, req.body);
    await projectsService.updateMember(id, userId, data, user.sub);
    return jsonResponse(res, 204);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, ProjectErrorCodes.INVALID_INPUT);
    }
    throw error;
  }
}

export async function removeProjectMember(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { id, userId } = req.params;
  await projectsService.removeMember(id, userId, user.sub);
  return jsonResponse(res, 204);
}

// Convenience endpoint: get current user's membership in a project
export async function getMyProjectMembership(req: Request, res: Response) {
  const user = getUserFromToken(req);
  const { id } = req.params;
  const project = await projectsService.findById(id, user.sub);
  const member = project.members.find(m => m.userId === user.sub);
  if (!member) {
    throw new ApiError('Member not found in project', 404, ProjectErrorCodes.MEMBER_NOT_FOUND);
  }
  return jsonResponse(res, 200, member);
}