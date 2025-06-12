import { Router } from 'express';
import { requireSuperAdminRole } from '../../middleware/roles.js';
import { wrapAsyncHandler } from '../../utils/response.js';
import { getAllCloudProviders, getCloudProviderById, createCloudProvider, updateCloudProvider, deleteCloudProvider } from './cloudProviders.controller.js';
export function getCloudProviderRouter() {
    const router = Router();
    // All routes require SUPERADMIN role
    router.use(requireSuperAdminRole());
    // GET /api/v1/cloud-providers
    router.get('/', wrapAsyncHandler(getAllCloudProviders));
    // GET /api/v1/cloud-providers/:id
    router.get('/:id', wrapAsyncHandler(getCloudProviderById));
    // POST /api/v1/cloud-providers
    router.post('/', wrapAsyncHandler(createCloudProvider));
    // PATCH /api/v1/cloud-providers/:id
    router.patch('/:id', wrapAsyncHandler(updateCloudProvider));
    // DELETE /api/v1/cloud-providers/:id
    router.delete('/:id', wrapAsyncHandler(deleteCloudProvider));
    return router;
}
