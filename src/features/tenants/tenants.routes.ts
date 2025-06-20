import { Router } from 'express';
import { createTenant, getTenant, updateTenant, deleteTenant, getAllTenants, getTenantById } from './tenants.controller.js';
import { wrapAsyncHandler } from '../../utils/response.js';
import { getCloudIntegrationsRouter } from '../cloud-integrations/cloudIntegrations.routes.js';
import { requireSuperAdminRole, requireTenantOwnerOrSuperAdmin } from '../../middleware/authorization.js';
import { logInfo } from '../../utils/logger.js';

export function getTenantRouter(): Router {
  const router = Router();

  // JWT authentication is already applied globally in app.ts
  // No need to apply it again here
  
  logInfo('Initializing tenant router with improved authorization model');

  // ===== PUBLIC ROUTES (JWT auth only) =====
  
  // Get current user's tenant
  router.get('/me', wrapAsyncHandler(getTenant));
  
  // Create tenant (any authenticated user can create a tenant)
  router.post('/', wrapAsyncHandler(createTenant));

  // ===== SUPERADMIN-ONLY ROUTES =====
  
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
  router.get('/', requireSuperAdminRole(), wrapAsyncHandler(getAllTenants));
  
  // Delete tenant (superadmin only)
  router.delete('/:id', requireSuperAdminRole(), wrapAsyncHandler(deleteTenant));
  
  // ===== TENANT-SPECIFIC ROUTES =====
  
  // Cloud integrations routes - Must be defined BEFORE the /:id routes to avoid route conflicts
  // These routes are protected by the requireTenantOwner middleware in the cloud integrations router
  router.use('/:tenantId/integrations', (req, res, next) => {
    // Ensure tenantId is available in req.params
    // This is a safeguard in case Express doesn't properly pass params to nested routers
    const tenantId = req.params.tenantId;
    
    console.log(`DEBUG ROUTER: Processing request for tenant integrations`);
    console.log(`DEBUG ROUTER: URL: ${req.originalUrl}`);
    console.log(`DEBUG ROUTER: Method: ${req.method}`);
    console.log(`DEBUG ROUTER: TenantId from params: ${tenantId}`);
    
    // Check if this request has already been processed for cloud integrations
    if ((req as any).__processed_cloud_integrations) {
      console.log(`DEBUG ROUTER: Request already processed for cloud integrations, skipping`);
      return next('router');
    }
    
    (req as any).__processed_cloud_integrations = true;
    
    if (!tenantId) {
      // Try to extract from URL if not in params
      const match = req.originalUrl.match(/\/api\/v1\/tenants\/([^\/]+)\/integrations/);
      if (match && match[1]) {
        req.params.tenantId = match[1];
        console.log(`DEBUG ROUTER: Extracted tenantId from URL: ${req.params.tenantId}`);
      }
    }
    
    next();
  }, getCloudIntegrationsRouter());
  
  // ===== TENANT OWNER OR SUPERADMIN ROUTES =====
  
  /**
   * @swagger
   * /api/v1/tenants/{id}:
   *   get:
   *     summary: Get tenant by ID
   *     description: Retrieves a specific tenant by its ID. Only accessible to the tenant owner or superadmins.
   *     tags: [Tenants]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The tenant ID
   *     responses:
   *       200:
   *         description: Tenant details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TenantResponse'
   *       401:
   *         description: Unauthorized - JWT token is missing or invalid
   *       403:
   *         description: Forbidden - User is not the tenant owner or a superadmin
   *       404:
   *         description: Tenant not found
   */
  router.get('/:id', requireTenantOwnerOrSuperAdmin('id'), wrapAsyncHandler(getTenantById));

  // Update tenant (tenant owner or superadmin)
  router.patch('/:id', requireTenantOwnerOrSuperAdmin('id'), wrapAsyncHandler(updateTenant));

  return router;
}