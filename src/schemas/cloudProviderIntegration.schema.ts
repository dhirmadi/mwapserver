import { z } from 'zod';
import { ObjectId } from 'mongodb';

const objectIdSchema = z
  .string()
  .refine((val) => ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
  });

// Base schema for cloud provider integration validation
export const cloudProviderIntegrationSchema = z.object({
  _id: objectIdSchema,
  tenantId: objectIdSchema,
  providerId: objectIdSchema,
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
  scopesGranted: z.array(z.string()).optional(),
  status: z.enum(['active', 'expired', 'revoked', 'error']).default('active'),
  connectedAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string() // Auth0 sub
});

// Schema for creating a new cloud provider integration
export const createCloudProviderIntegrationSchema = z.object({
  providerId: z.string().min(1),
  metadata: z.record(z.unknown()).optional()
});

// Schema for updating cloud provider integration (partial)
export const updateCloudProviderIntegrationSchema = cloudProviderIntegrationSchema
  .partial()
  .omit({ 
    _id: true, 
    tenantId: true, 
    providerId: true, 
    accessToken: true,
    refreshToken: true,
    tokenExpiresAt: true,
    createdAt: true, 
    updatedAt: true, 
    createdBy: true 
  });

// Response schema for cloud provider integration data
export const cloudProviderIntegrationResponseSchema = cloudProviderIntegrationSchema
  .extend({
    _id: z.string(),
    tenantId: z.string(),
    providerId: z.string(),
    provider: z.object({
      name: z.string(),
      slug: z.string(),
      metadata: z.object({
        icon: z.string().optional(),
        color: z.string().optional(),
        description: z.string().optional()
      }).optional()
    }).optional()
  })
  .omit({ 
    accessToken: true,
    refreshToken: true
  });

// Error codes for cloud provider integration operations
export const CloudProviderIntegrationErrorCodes = {
  NOT_FOUND: 'cloud-integration/not-found',
  PROVIDER_NOT_FOUND: 'cloud-integration/provider-not-found',
  TENANT_NOT_FOUND: 'cloud-integration/tenant-not-found',
  ALREADY_EXISTS: 'cloud-integration/already-exists',
  IN_USE: 'cloud-integration/in-use',
  INVALID_INPUT: 'cloud-integration/invalid-input',
  UNAUTHORIZED: 'cloud-integration/unauthorized'
} as const;

// Types based on schemas
export type CloudProviderIntegration = z.infer<typeof cloudProviderIntegrationSchema>;
export type CloudProviderIntegrationResponse = z.infer<typeof cloudProviderIntegrationResponseSchema>;
export type CreateCloudProviderIntegrationRequest = z.infer<typeof createCloudProviderIntegrationSchema>;
export type UpdateCloudProviderIntegrationRequest = z.infer<typeof updateCloudProviderIntegrationSchema>;