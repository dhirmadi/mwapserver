import { Request, Response } from 'express';
import { ProjectTypesService } from './projectTypes.service';
import { validateWithSchema } from '../../utils/validate';
import { jsonResponse } from '../../utils/response';
import { createProjectTypeSchema, projectTypeUpdateSchema } from '../../schemas/projectType.schema';

export class ProjectTypesController {
  constructor(private projectTypesService: ProjectTypesService) {}

  getAll = async (req: Request, res: Response): Promise<void> => {
    const projectTypes = await this.projectTypesService.findAll();
    jsonResponse(res, { data: projectTypes });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const projectType = await this.projectTypesService.findById(id);
    jsonResponse(res, { data: projectType });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const data = validateWithSchema(createProjectTypeSchema, req.body);
    const userId = req.user.sub;
    const projectType = await this.projectTypesService.create(data, userId);
    jsonResponse(res, { data: projectType }, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const data = validateWithSchema(projectTypeUpdateSchema, req.body);
    const userId = req.user.sub;
    const projectType = await this.projectTypesService.update(id, data, userId);
    jsonResponse(res, { data: projectType });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user.sub;
    await this.projectTypesService.delete(id, userId);
    jsonResponse(res, { success: true }, 204);
  };
}