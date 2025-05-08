import { Router } from 'express';
import { TenantController } from './tenants.controller';
import { authenticateJWT } from '../../middleware/auth';
import { wrapAsyncHandler } from '../../utils/response';

const router = Router();
const controller = new TenantController();

// Apply JWT authentication to all routes
router.use(authenticateJWT());

// Create tenant
router.post('/', wrapAsyncHandler(controller.createTenant.bind(controller)));

// Get current user's tenant
router.get('/me', wrapAsyncHandler(controller.getCurrentTenant.bind(controller)));

// Update tenant
router.patch('/:id', wrapAsyncHandler(controller.updateTenant.bind(controller)));

// Delete tenant (superadmin only)
router.delete('/:id', wrapAsyncHandler(controller.deleteTenant.bind(controller)));

export default router;