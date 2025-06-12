import { Router } from 'express';
import { requireSuperAdminRole } from '../../middleware/roles.js';
import { wrapAsyncHandler } from '../../utils/response.js';
import { getAllProjectTypes, getProjectTypeById, createProjectType, updateProjectType, deleteProjectType } from './projectTypes.controller.js';
export function getProjectTypesRouter() {
    const router = Router();
    // All routes require SUPERADMIN role
    router.use(requireSuperAdminRole());
    // GET /api/v1/project-types
    router.get('/', wrapAsyncHandler(getAllProjectTypes));
    // GET /api/v1/project-types/:id
    router.get('/:id', wrapAsyncHandler(getProjectTypeById));
    // POST /api/v1/project-types
    router.post('/', wrapAsyncHandler(createProjectType));
    // PATCH /api/v1/project-types/:id
    router.patch('/:id', wrapAsyncHandler(updateProjectType));
    // DELETE /api/v1/project-types/:id
    router.delete('/:id', wrapAsyncHandler(deleteProjectType));
    return router;
}
