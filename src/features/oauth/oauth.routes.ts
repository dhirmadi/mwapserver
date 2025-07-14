import { Router } from 'express';
import { wrapAsyncHandler } from '../../utils/response.js';
import { handleOAuthCallback, refreshIntegrationTokens } from './oauth.controller.js';
import { requireTenantOwner } from '../../middleware/authorization.js';
import { logInfo } from '../../utils/logger.js';

export function getOAuthRouter(): Router {
  const router = Router();
  
  logInfo('OAuth router initialized');
  
  // Public endpoint for OAuth callbacks
  // GET /api/v1/oauth/callback
  router.get('/callback', wrapAsyncHandler(handleOAuthCallback));
  
  // Protected endpoint for manually refreshing tokens
  // POST /api/v1/oauth/tenants/:tenantId/integrations/:integrationId/refresh
  router.post(
    '/tenants/:tenantId/integrations/:integrationId/refresh',
    requireTenantOwner('tenantId'),
    wrapAsyncHandler(refreshIntegrationTokens)
  );
  
  return router;
}