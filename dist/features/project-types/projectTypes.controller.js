import { ProjectTypesService } from './projectTypes.service.js';
import { validateWithSchema } from '../../utils/validate.js';
import { getUserFromToken } from '../../utils/auth.js';
import { jsonResponse } from '../../utils/response.js';
import { ApiError } from '../../utils/errors.js';
import { ProjectTypeErrorCodes } from '../../schemas/projectType.schema.js';
import { createProjectTypeSchema, projectTypeUpdateSchema } from '../../schemas/projectType.schema.js';
const projectTypesService = new ProjectTypesService();
export async function getAllProjectTypes(req, res) {
    const projectTypes = await projectTypesService.findAll();
    return jsonResponse(res, 200, projectTypes);
}
export async function getProjectTypeById(req, res) {
    const projectType = await projectTypesService.findById(req.params.id);
    return jsonResponse(res, 200, projectType);
}
export async function createProjectType(req, res) {
    try {
        const user = getUserFromToken(req);
        const data = validateWithSchema(createProjectTypeSchema, req.body);
        const projectType = await projectTypesService.create(data, user.sub);
        return jsonResponse(res, 201, projectType);
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            throw new ApiError('Invalid input', 400, ProjectTypeErrorCodes.INVALID_CONFIG_SCHEMA);
        }
        throw error;
    }
}
export async function updateProjectType(req, res) {
    try {
        const user = getUserFromToken(req);
        const data = validateWithSchema(projectTypeUpdateSchema, req.body);
        const projectType = await projectTypesService.update(req.params.id, data, user.sub);
        return jsonResponse(res, 200, projectType);
    }
    catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
            throw new ApiError('Invalid input', 400, ProjectTypeErrorCodes.INVALID_CONFIG_SCHEMA);
        }
        throw error;
    }
}
export async function deleteProjectType(req, res) {
    const user = getUserFromToken(req);
    await projectTypesService.delete(req.params.id, user.sub);
    return jsonResponse(res, 204);
}
