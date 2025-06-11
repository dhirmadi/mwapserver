// Example of how to integrate the API documentation into app.ts

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authenticateJWT } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { db } from './config/db.js';
import { getDocsRouter } from './docs/docs.js'; // Import the docs router

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production' ? 'https://app.mwap.dev' : true,
  credentials: true
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Health check (open endpoint)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Documentation (only available in non-production environments)
app.use('/docs', getDocsRouter()); // Mount the docs router at /docs

// JWT Middleware
app.use(authenticateJWT());

// ❗ Do not import tenant routes at the top level
// Instead expose a function that can register them later
export async function registerRoutes(): Promise<void> {
  console.log('[MWAP] 🔁 Registering routes...');
  
  const { getTenantRouter } = await import('./features/tenants/tenants.routes');
  console.log('[MWAP] ✅ /api/v1/tenants route loaded');

  const { getProjectTypesRouter } = await import('./features/project-types/projectTypes.routes');
  console.log('[MWAP] ✅ /api/v1/project-types route loaded');

  const { getCloudProviderRouter } = await import('./features/cloud-providers/cloudProviders.routes');
  console.log('[MWAP] ✅ /api/v1/cloud-providers route loaded');

  const { getProjectsRouter } = await import('./features/projects/projects.routes');
  console.log('[MWAP] ✅ /api/v1/projects route loaded');

  app.use('/api/v1/tenants', getTenantRouter());
  app.use('/api/v1/project-types', getProjectTypesRouter());
  app.use('/api/v1/cloud-providers', getCloudProviderRouter());
  app.use('/api/v1/projects', getProjectsRouter());
}

app.use(errorHandler);

export { app };