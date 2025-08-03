import { z } from 'zod';
import { ObjectId } from 'mongodb';

const objectIdSchema = z
  .string()
  .refine((val) => ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
  });

// PKCE metadata interface for OAuth 2.0 with PKCE support
export interface PKCEMetadata {
  oauth_code?: string;
  redirect_uri?: string;
  code_verifier?: string;
  code_challenge?: string;
  code_challenge_method?: 'S256' | 'plain';
  pkce_flow?: boolean;
}

// Extended metadata interface that includes PKCE fields
export interface IntegrationMetadata extends PKCEMetadata {
  [key: string]: unknown;
}

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
export const createCloudProviderIntegrationSchema = cloudProviderIntegrationSchema
  .omit({ 
    _id: true, 
    createdAt: true, 
    updatedAt: true, 
    createdBy: true,
    accessToken: true,
    refreshToken: true,
    tokenExpiresAt: true,
    connectedAt: true
  })
  .extend({
    // Make tenantId optional in the request schema since we add it from URL params
    tenantId: objectIdSchema.optional()
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