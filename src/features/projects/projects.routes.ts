import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import { authenticateJWT, requireProjectRole } from '../../middleware/auth.js';
import { getFilesRouter } from '../files/files.routes.js';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  getMyProjectMembership
} from './projects.controller.js';

export function getProjectsRouter(): Router {
  const router = Router();
  
  // JWT authentication is applied globally in app.ts - no need to reapply
  
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
  // Note: do not gate with requireProjectRole here; controller returns 404 if not a member
  router.get('/:id/members/me', wrapAsyncHandler(getMyProjectMembership));
  
  // Mount files router
  router.use('/:id/files', getFilesRouter());
  
  return router;
}