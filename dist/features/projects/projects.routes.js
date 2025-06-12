import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import { authenticateJWT } from '../../middleware/auth.js';
import { requireProjectRole } from '../../middleware/roles.js';
import { getFilesRouter } from '../files/files.routes.js';
import { getProjects, getProjectById, createProject, updateProject, deleteProject, getProjectMembers, addProjectMember, updateProjectMember, removeProjectMember } from './projects.controller.js';
export function getProjectsRouter() {
    const router = Router();
    // Apply JWT authentication to all routes
    router.use(authenticateJWT());
    // Project routes
    router.get('/', wrapAsyncHandler(getProjects));
    router.get('/:id', wrapAsyncHandler(getProjectById));
    router.post('/', wrapAsyncHandler(createProject)); // Tenant owner check in controller
    router.patch('/:id', requireProjectRole('DEPUTY'), wrapAsyncHandler(updateProject));
    router.delete('/:id', requireProjectRole('OWNER'), wrapAsyncHandler(deleteProject));
    // Project members routes
    router.get('/:id/members', requireProjectRole('MEMBER'), wrapAsyncHandler(getProjectMembers));
    router.post('/:id/members', requireProjectRole('DEPUTY'), wrapAsyncHandler(addProjectMember));
    router.patch('/:id/members/:userId', requireProjectRole('OWNER'), wrapAsyncHandler(updateProjectMember));
    router.delete('/:id/members/:userId', requireProjectRole('OWNER'), wrapAsyncHandler(removeProjectMember));
    // Mount files router
    router.use('/:id/files', getFilesRouter());
    return router;
}
