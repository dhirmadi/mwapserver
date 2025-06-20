import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import {
  getTenantIntegrations,
  getTenantIntegrationById,
  createTenantIntegration,
  updateTenantIntegration,
  deleteTenantIntegration
} from './cloudIntegrations.controller.js';
import { requireTenantOwner } from '../../middleware/authorization.js';
import { logInfo } from '../../utils/logger.js';

export function getCloudIntegrationsRouter(): Router {
  const router = Router({ mergeParams: true });
  
  // Apply tenant owner middleware to all routes in this router
  // This ensures only the tenant owner can access these endpoints
  router.use((req, res, next) => {
    console.log(`DEBUG CLOUD ROUTER: Request received in cloud integrations router`);
    console.log(`DEBUG CLOUD ROUTER: URL: ${req.originalUrl}`);
    console.log(`DEBUG CLOUD ROUTER: Method: ${req.method}`);
    console.log(`DEBUG CLOUD ROUTER: TenantId from params: ${req.params.tenantId}`);
    
    // Check if this request has already been processed by this router
    const routerKey = `__processed_cloud_router_${req.method}_${req.path}`;
    if ((req as any)[routerKey]) {
      console.log(`DEBUG CLOUD ROUTER: Request already processed by this router, skipping`);
      return next('router');
    }
    
    (req as any)[routerKey] = true;
    next();
  });
  
  router.use(requireTenantOwner('tenantId'));
  
  logInfo('Cloud integrations router initialized with tenant owner authorization');
  
  // GET /api/v1/tenants/:tenantId/integrations
  router.get('/', (req, res, next) => {
    console.log(`DEBUG CLOUD ROUTER: GET / handler`);
    wrapAsyncHandler(getTenantIntegrations)(req, res, next);
  });
  
  // GET /api/v1/tenants/:tenantId/integrations/:integrationId
  router.get('/:integrationId', (req, res, next) => {
    console.log(`DEBUG CLOUD ROUTER: GET /:integrationId handler`);
    wrapAsyncHandler(getTenantIntegrationById)(req, res, next);
  });
  
  // POST /api/v1/tenants/:tenantId/integrations
  router.post('/', (req, res, next) => {
    console.log(`DEBUG CLOUD ROUTER: POST / handler`);
    wrapAsyncHandler(createTenantIntegration)(req, res, next);
  });
  
  // PATCH /api/v1/tenants/:tenantId/integrations/:integrationId
  router.patch('/:integrationId', (req, res, next) => {
    console.log(`DEBUG CLOUD ROUTER: PATCH /:integrationId handler`);
    wrapAsyncHandler(updateTenantIntegration)(req, res, next);
  });
  
  // DELETE /api/v1/tenants/:tenantId/integrations/:integrationId
  router.delete('/:integrationId', (req, res, next) => {
    console.log(`DEBUG CLOUD ROUTER: DELETE /:integrationId handler`);
    wrapAsyncHandler(deleteTenantIntegration)(req, res, next);
  });
  
  return router;
}