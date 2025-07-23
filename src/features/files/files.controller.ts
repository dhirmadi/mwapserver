import { Request, Response } from 'express';
import { FilesService } from './files.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { fileQuerySchema, FileErrorCodes } from '../../schemas/file.schema.js';

const filesService = new FilesService();

/**
 * List files for a project
 * GET /api/v1/projects/:id/files
 */
export async function listProjectFiles(req: Request, res: Response) {
  try {
    const user = getUserFromToken(req);
    const projectId = req.params.id;
    
    // Validate query parameters
    const query = validateWithSchema(fileQuerySchema, req.query);
    // Add default values for optional parameters  
    if (!query.format) query.format = 'json';
    if (query.includeExamples === undefined) query.includeExamples = true;
    if (query.minify === undefined) query.minify = false;
    if (query.recursive === undefined) query.recursive = false;
    
    // Get files from the cloud provider
    const files = await filesService.listFiles(projectId, query, user.sub);
    
    return jsonResponse(res, 200, files);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      throw new ApiError('Invalid query parameters', 400, FileErrorCodes.INVALID_QUERY);
    }
    throw error;
  }
}