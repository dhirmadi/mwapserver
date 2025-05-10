import { Request, Response } from 'express';
import { ProjectTypesService } from './projectTypes.service';
import { validateWithSchema } from '../../utils/validate';
import { getUserFromToken } from '../../utils/auth';
import { jsonResponse } from '../../utils/response';
import { ApiError } from '../../utils/errors';
import { ProjectTypeErrorCodes } from '../../schemas/projectType.schema';
import { createProjectTypeSchema, projectTypeUpdateSchema } from '../../schemas/projectType.schema';

const projectTypesService = new ProjectTypesService();

export async function getAllProjectTypes(req: Request, res: Response) {
  const projectTypes = await projectTypesService.findAll();
  return jsonResponse(res, 200, projectTypes);
}

export async function getProjectTypeById(req: Request, res: Response) {
  const projectType = await projectTypesService.findById(req.params.id);
  return jsonResponse(res, 200, projectType);
}

export async function createProjectType(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const data = validateWithSchema(createProjectTypeSchema, req.body);
    const projectType = await projectTypesService.create(data, user.sub);
    return jsonResponse(res, 201, projectType);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, ProjectTypeErrorCodes.INVALID_CONFIG_SCHEMA);
    }
    throw error;
  }
}

export async function updateProjectType(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const data = validateWithSchema(projectTypeUpdateSchema, req.body);
    const projectType = await projectTypesService.update(req.params.id, data, user.sub);
    return jsonResponse(res, 200, projectType);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid input', 400, ProjectTypeErrorCodes.INVALID_CONFIG_SCHEMA);
    }
    throw error;
  }
}

export async function deleteProjectType(req: Request, res: Response) {
  const user = getUserFromToken(req);
  await projectTypesService.delete(req.params.id, user.sub);
  return jsonResponse(res, 204);
}