import { Router } from 'express';
import { createTenant, getTenant, updateTenant, deleteTenant, getAllTenants } from './tenants.controller.js';
import { wrapAsyncHandler } from '../../utils/response.js';
import { getCloudIntegrationsRouter } from '../cloud-integrations/cloudIntegrations.routes.js';
import { requireSuperAdminRole } from '../../middleware/authorization.js';

export function getTenantRouter(): Router {
  const router = Router();

  // JWT authentication is already applied globally in app.ts
  // No need to apply it again here

  /**
   * @swagger
   * /api/v1/tenants:
   *   get:
   *     summary: List all tenants (superadmin only)
   *     description: Retrieves a list of all tenants in the system. Only accessible to superadmins.
   *     tags: [Tenants]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: includeArchived
   *         schema:
   *           type: boolean
   *         description: Whether to include archived tenants in the results
   *     responses:
   *       200:
   *         description: A list of tenants
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/TenantResponse'
   *       401:
   *         description: Unauthorized - JWT token is missing or invalid
   *       403:
   *         description: Forbidden - User is not a superadmin
   */
  router.get('/', requireSuperAdminRole, wrapAsyncHandler(getAllTenants));

  // Create tenant
  router.post('/', wrapAsyncHandler(createTenant));

  // Get current user's tenant
  router.get('/me', wrapAsyncHandler(getTenant));

  // Update tenant
  router.patch('/:id', wrapAsyncHandler(updateTenant));

  // Delete tenant (superadmin only)
  router.delete('/:id', wrapAsyncHandler(deleteTenant));

  // Cloud integrations routes
  router.use('/:tenantId/cloud-integrations', getCloudIntegrationsRouter());

  return router;
}