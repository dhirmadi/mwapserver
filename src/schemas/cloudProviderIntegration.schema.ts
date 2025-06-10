import { z } from 'zod';
import { ObjectId } from 'mongodb';

// Base schema for cloud provider integration validation
export const cloudProviderIntegrationSchema = z.object({
  _id: z.instanceof(ObjectId),
  tenantId: z.instanceof(ObjectId),
  providerId: z.instanceof(ObjectId),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  redirectUri: z.string().url(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string() // Auth0 sub
});

// Schema for creating a new cloud provider integration
export const createCloudProviderIntegrationSchema = cloudProviderIntegrationSchema
  .omit({ 
    _id: true, 
    createdAt: true, 
    updatedAt: true, 
    createdBy: true,
    accessToken: true,
    refreshToken: true,
    expiresAt: true
  });

// Schema for updating cloud provider integration (partial)
export const updateCloudProviderIntegrationSchema = cloudProviderIntegrationSchema
  .partial()
  .omit({ 
    _id: true, 
    tenantId: true, 
    providerId: true, 
    createdAt: true, 
    updatedAt: true, 
    createdBy: true 
  });

// Response schema for cloud provider integration data
export const cloudProviderIntegrationResponseSchema = cloudProviderIntegrationSchema
  .extend({
    _id: z.string(),
    tenantId: z.string(),
    providerId: z.string()
  })
  .omit({ 
    clientSecret: true,
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